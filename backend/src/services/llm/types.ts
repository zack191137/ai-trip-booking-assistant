import { TripPreferences, TripPlan } from '../../types';

export interface LLMProvider {
  generateResponse(prompt: string, context?: any): Promise<string>;
  generateTripPlan(preferences: TripPreferences): Promise<Partial<TripPlan>>;
  generateStructuredData(prompt: string, schema: object): Promise<object>;
  estimateTokens(text: string): number;
  getUsageStats(): Promise<UsageStats>;
}

export interface ProviderConfig {
  apiKey: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  timeout?: number;
}

export interface UsageStats {
  totalRequests: number;
  totalTokens: number;
  totalCost: number;
  averageResponseTime: number;
  errorRate: number;
}

export interface LLMResponse {
  content: string;
  tokensUsed: number;
  model: string;
  responseTime: number;
  metadata?: any;
}

export interface ConversationContext {
  conversationId: string;
  userId: string;
  previousMessages: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
  }>;
  extractedPreferences?: TripPreferences;
}

export interface PromptTemplate {
  category: string;
  template: string;
  variables: string[];
  description: string;
}

export class LLMError extends Error {
  constructor(
    message: string,
    public provider: string,
    public code?: string,
    public originalError?: Error
  ) {
    super(message);
    this.name = 'LLMError';
  }
}