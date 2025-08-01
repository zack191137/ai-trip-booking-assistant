import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import { LLMProvider, ProviderConfig, UsageStats, LLMError } from '../types';
import { TripPreferences, TripPlan } from '../../../types';

export class GeminiProvider implements LLMProvider {
  private genAI: GoogleGenerativeAI;
  private model: GenerativeModel;
  private stats: UsageStats = {
    totalRequests: 0,
    totalTokens: 0,
    totalCost: 0,
    averageResponseTime: 0,
    errorRate: 0,
  };
  private config: ProviderConfig;

  constructor(config: ProviderConfig) {
    this.config = {
      model: 'gemini-1.5-flash',
      temperature: 0.7,
      maxTokens: 2048,
      timeout: 30000,
      ...config,
    };

    if (!config.apiKey) {
      throw new LLMError('Gemini API key is required', 'gemini', 'MISSING_API_KEY');
    }

    this.genAI = new GoogleGenerativeAI(config.apiKey);
    this.model = this.genAI.getGenerativeModel({ 
      model: this.config.model || 'gemini-1.5-flash',
      generationConfig: {
        temperature: this.config.temperature,
        maxOutputTokens: this.config.maxTokens,
      },
    });
  }

  async generateResponse(prompt: string, context?: any): Promise<string> {
    const startTime = Date.now();
    
    try {
      this.stats.totalRequests++;

      // Add context to prompt if provided
      let enhancedPrompt = prompt;
      if (context) {
        enhancedPrompt = `Context: ${JSON.stringify(context, null, 2)}\n\n${prompt}`;
      }

      const result = await this.model.generateContent(enhancedPrompt);
      const response = await result.response;
      const text = response.text();

      if (!text) {
        throw new LLMError('Empty response from Gemini', 'gemini', 'EMPTY_RESPONSE');
      }

      // Update stats
      const responseTime = Date.now() - startTime;
      this.updateStats(responseTime, this.estimateTokens(text));

      return text;
    } catch (error) {
      this.stats.errorRate = (this.stats.errorRate * (this.stats.totalRequests - 1) + 1) / this.stats.totalRequests;
      
      if (error instanceof Error) {
        throw new LLMError(
          `Gemini API error: ${error.message}`,
          'gemini',
          'API_ERROR',
          error
        );
      }
      throw new LLMError('Unknown error occurred', 'gemini', 'UNKNOWN_ERROR');
    }
  }

  async generateTripPlan(preferences: TripPreferences): Promise<Partial<TripPlan>> {
    const prompt = this.buildTripPlanPrompt(preferences);
    
    try {
      const response = await this.generateResponse(prompt);
      return this.parseTripPlanResponse(response, preferences);
    } catch (error) {
      throw new LLMError(
        'Failed to generate trip plan',
        'gemini',
        'TRIP_PLAN_GENERATION_FAILED',
        error instanceof Error ? error : undefined
      );
    }
  }

  async generateStructuredData(prompt: string, schema: object): Promise<object> {
    const structuredPrompt = `
${prompt}

Please respond with valid JSON that matches this schema:
${JSON.stringify(schema, null, 2)}

Response (JSON only):`;

    try {
      const response = await this.generateResponse(structuredPrompt);
      
      // Extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new LLMError('No valid JSON found in response', 'gemini', 'INVALID_JSON_RESPONSE');
      }

      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new LLMError('Invalid JSON in response', 'gemini', 'JSON_PARSE_ERROR', error);
      }
      throw error;
    }
  }

  estimateTokens(text: string): number {
    // Rough estimation: ~4 characters per token for English text
    return Math.ceil(text.length / 4);
  }

  async getUsageStats(): Promise<UsageStats> {
    return { ...this.stats };
  }

  private buildTripPlanPrompt(preferences: TripPreferences): string {
    return `
Create a detailed trip plan based on these preferences:

Destination: ${preferences.destination || 'Not specified'}
Travel Dates: ${preferences.startDate ? preferences.startDate.toISOString().split('T')[0] : 'Not specified'} to ${preferences.endDate ? preferences.endDate.toISOString().split('T')[0] : 'Not specified'}
Number of Travelers: ${preferences.travelers || 'Not specified'}
Budget: ${preferences.budget ? `$${preferences.budget.min}-$${preferences.budget.max} ${preferences.budget.currency}` : 'Not specified'}
Flight Preferences: ${JSON.stringify(preferences.flightPreferences || {})}
Hotel Preferences: ${JSON.stringify(preferences.hotelPreferences || {})}
Restaurant Preferences: ${JSON.stringify(preferences.restaurantPreferences || {})}

Please provide a comprehensive trip plan including:
1. Recommended flights with specific airlines, flight numbers, and estimated prices
2. Hotel recommendations with specific names, addresses, and nightly rates
3. Restaurant suggestions with cuisine types, price ranges, and recommended dishes
4. A day-by-day itinerary with activities and timing
5. Total estimated cost breakdown

Format the response as a detailed travel itinerary.`;
  }

  private parseTripPlanResponse(response: string, preferences: TripPreferences): Partial<TripPlan> {
    // For P0, we'll do basic parsing. In P1, we can enhance this with more sophisticated parsing
    try {
      return {
        destination: preferences.destination || 'Unknown',
        startDate: preferences.startDate || new Date(),
        endDate: preferences.endDate || new Date(),
        travelers: preferences.travelers || 1,
        flights: [], // Will be populated by external API integration
        hotels: [], // Will be populated by external API integration
        restaurants: [], // Will be populated by external API integration
        totalEstimatedCost: { amount: 0, currency: 'USD' },
        itinerary: [], // Will be generated from the response
        status: 'draft' as const,
      };
    } catch (error) {
      throw new LLMError(
        'Failed to parse trip plan response',
        'gemini',
        'PARSE_ERROR',
        error instanceof Error ? error : undefined
      );
    }
  }

  private updateStats(responseTime: number, tokensUsed: number): void {
    const previousTotal = this.stats.averageResponseTime * (this.stats.totalRequests - 1);
    this.stats.averageResponseTime = (previousTotal + responseTime) / this.stats.totalRequests;
    this.stats.totalTokens += tokensUsed;
    
    // Rough cost estimation: $0.00025 per 1K characters (Gemini pricing)
    const estimatedCost = (tokensUsed * 4 / 1000) * 0.00025;
    this.stats.totalCost += estimatedCost;
  }
}

/*
 * NOTE: For P0, the trip plan parsing is basic.
 * In P1, we should enhance this with:
 * - More sophisticated parsing using structured output
 * - Integration with external APIs for real data
 * - Better error handling and retry mechanisms
 * - Cost tracking and rate limiting
 */