import { LLMProvider, ProviderConfig, UsageStats, LLMError, ConversationContext } from './types';
import { GeminiProvider } from './providers/GeminiProvider';
import { TripPreferences, TripPlan } from '../../types';
import config from '../../config/environment';
import { promptManager } from '../prompts';

export class LLMService {
  private providers: Map<string, LLMProvider> = new Map();
  private activeProvider: string = 'gemini';
  private fallbackProviders: string[] = [];

  constructor() {
    this.initializeProviders();
  }

  private initializeProviders(): void {
    // Initialize Gemini provider
    if (config.llm.geminiApiKey) {
      const geminiProvider = new GeminiProvider({
        apiKey: config.llm.geminiApiKey,
        model: 'gemini-1.5-flash',
        temperature: 0.7,
        maxTokens: 2048,
      });
      this.providers.set('gemini', geminiProvider);
    }

    // Add other providers in P1
    // this.providers.set('openai', new OpenAIProvider(config));
    // this.providers.set('anthropic', new AnthropicProvider(config));

    if (this.providers.size === 0) {
      throw new LLMError('No LLM providers configured', 'system', 'NO_PROVIDERS');
    }

    // Set fallback providers
    this.fallbackProviders = Array.from(this.providers.keys()).filter(
      provider => provider !== this.activeProvider
    );
  }

  async generateResponse(prompt: string, context?: ConversationContext): Promise<string> {
    return this.executeWithFallback(async (provider) => {
      return provider.generateResponse(prompt, context);
    });
  }

  async generateConversationResponse(
    userMessage: string, 
    context: ConversationContext
  ): Promise<string> {
    const prompt = promptManager.getPrompt('conversation', {
      userMessage,
      previousMessages: context.previousMessages,
      extractedPreferences: context.extractedPreferences,
      userId: context.userId,
      conversationId: context.conversationId,
    });
    return this.generateResponse(prompt, context);
  }

  async generateTripPlan(preferences: TripPreferences): Promise<Partial<TripPlan>> {
    return this.executeWithFallback(async (provider) => {
      return provider.generateTripPlan(preferences);
    });
  }

  async extractTripPreferences(
    conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>
  ): Promise<Partial<TripPreferences>> {
    const prompt = promptManager.getPrompt('preference_extraction', {
      conversationHistory: promptManager.formatConversationHistory(conversationHistory),
    });
    
    const schema = {
      destination: 'string',
      startDate: 'string (ISO date)',
      endDate: 'string (ISO date)',
      travelers: 'number',
      budget: {
        min: 'number',
        max: 'number',
        currency: 'string'
      },
      flightPreferences: {
        class: 'string (economy|business|first)',
        directOnly: 'boolean',
        airlines: 'array of strings'
      },
      hotelPreferences: {
        stars: 'number (1-5)',
        amenities: 'array of strings',
        location: 'string'
      },
      restaurantPreferences: {
        cuisines: 'array of strings',
        dietary: 'array of strings',
        priceRange: 'string'
      }
    };

    const result = await this.executeWithFallback(async (provider) => {
      return provider.generateStructuredData(prompt, schema);
    }) as Partial<TripPreferences>;

    // Convert date strings to Date objects
    if (result.startDate && typeof result.startDate === 'string') {
      result.startDate = new Date(result.startDate);
    }
    if (result.endDate && typeof result.endDate === 'string') {
      result.endDate = new Date(result.endDate);
    }

    return result;
  }

  async generateItinerary(tripPlan: TripPlan): Promise<string> {
    const duration = Math.ceil((tripPlan.endDate.getTime() - tripPlan.startDate.getTime()) / (1000 * 60 * 60 * 24));
    
    const prompt = promptManager.getPrompt('itinerary_generation', {
      destination: tripPlan.destination,
      startDate: tripPlan.startDate.toDateString(),
      endDate: tripPlan.endDate.toDateString(),
      duration,
      travelers: tripPlan.travelers,
      budget: tripPlan.totalEstimatedCost,
      flights: JSON.stringify(tripPlan.flights, null, 2),
      hotels: JSON.stringify(tripPlan.hotels, null, 2),
      restaurants: JSON.stringify(tripPlan.restaurants, null, 2),
    });

    return this.generateResponse(prompt);
  }

  async getUsageStats(): Promise<Record<string, UsageStats>> {
    const stats: Record<string, UsageStats> = {};
    
    for (const [name, provider] of this.providers) {
      stats[name] = await provider.getUsageStats();
    }
    
    return stats;
  }

  setActiveProvider(providerName: string): void {
    if (!this.providers.has(providerName)) {
      throw new LLMError(`Provider ${providerName} not found`, 'system', 'PROVIDER_NOT_FOUND');
    }
    this.activeProvider = providerName;
  }

  getActiveProvider(): string {
    return this.activeProvider;
  }

  getAvailableProviders(): string[] {
    return Array.from(this.providers.keys());
  }

  private async executeWithFallback<T>(
    operation: (provider: LLMProvider) => Promise<T>
  ): Promise<T> {
    const provider = this.providers.get(this.activeProvider);
    if (!provider) {
      throw new LLMError(`Active provider ${this.activeProvider} not available`, 'system', 'PROVIDER_UNAVAILABLE');
    }

    try {
      return await operation(provider);
    } catch (error) {
      console.warn(`Primary provider ${this.activeProvider} failed:`, error);

      // Try fallback providers
      for (const fallbackName of this.fallbackProviders) {
        const fallbackProvider = this.providers.get(fallbackName);
        if (!fallbackProvider) continue;

        try {
          console.log(`Trying fallback provider: ${fallbackName}`);
          return await operation(fallbackProvider);
        } catch (fallbackError) {
          console.warn(`Fallback provider ${fallbackName} failed:`, fallbackError);
        }
      }

      // All providers failed
      throw new LLMError('All LLM providers failed', 'system', 'ALL_PROVIDERS_FAILED', error instanceof Error ? error : undefined);
    }
  }

}

// Singleton instance
export const llmService = new LLMService();

/*
 * TODO for P1:
 * - Add OpenAI provider implementation
 * - Add Anthropic provider implementation
 * - Implement request queuing and rate limiting
 * - Add caching for common responses
 * - Enhance error handling and retry logic
 * - Add monitoring and alerting for provider health
 * - Implement cost tracking and budgeting
 */