import path from 'path';
import fs from 'fs';

export interface PromptVariables {
  [key: string]: any;
}

export class PromptManager {
  private prompts: Map<string, string> = new Map();
  private promptsDir: string;

  constructor() {
    this.promptsDir = path.join(__dirname, '../../..', 'prompts');
    this.loadPrompts();
  }

  private loadPrompts(): void {
    try {
      const promptFiles = [
        'conversation.js',
        'preference_extraction.js',
        'flight_search.js',
        'hotel_search.js',
        'restaurant_search.js',
        'itinerary_generation.js'
      ];

      for (const file of promptFiles) {
        const filePath = path.join(this.promptsDir, file);
        if (fs.existsSync(filePath)) {
          // Clear require cache to allow hot reloading in development
          delete require.cache[require.resolve(filePath)];
          const promptTemplate = require(filePath);
          const category = file.replace('.js', '');
          this.prompts.set(category, promptTemplate);
        } else {
          console.warn(`Prompt file not found: ${filePath}`);
        }
      }

      console.log(`Loaded ${this.prompts.size} prompt templates`);
    } catch (error) {
      console.error('Error loading prompts:', error);
      throw new Error('Failed to load prompt templates');
    }
  }

  getPrompt(category: string, variables: PromptVariables = {}): string {
    const template = this.prompts.get(category);
    if (!template) {
      throw new Error(`Prompt template not found: ${category}`);
    }

    return this.injectVariables(template, variables);
  }

  private injectVariables(template: string, variables: PromptVariables): string {
    let result = template;

    // Handle simple variable substitution {{variableName}}
    result = result.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return variables[key] !== undefined ? String(variables[key]) : match;
    });

    // Handle conditional blocks {{#if condition}}...{{/if}}
    result = result.replace(/\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g, (match, key, content) => {
      return variables[key] ? content : '';
    });

    // Handle each loops {{#each array}}...{{/each}}
    result = result.replace(/\{\{#each\s+(\w+)\}\}([\s\S]*?)\{\{\/each\}\}/g, (match, key, content) => {
      const array = variables[key];
      if (Array.isArray(array)) {
        return array.map(item => {
          let itemContent = content;
          // Replace item properties
          if (typeof item === 'object') {
            for (const [prop, value] of Object.entries(item)) {
              itemContent = itemContent.replace(new RegExp(`\\{\\{${prop}\\}\\}`, 'g'), String(value));
            }
          } else {
            itemContent = itemContent.replace(/\{\{this\}\}/g, String(item));
          }
          return itemContent;
        }).join('');
      }
      return '';
    });

    // Handle nested object properties {{object.property}}
    result = result.replace(/\{\{(\w+)\.(\w+)\}\}/g, (match, objectKey, propertyKey) => {
      const obj = variables[objectKey];
      if (obj && typeof obj === 'object' && propertyKey in obj) {
        return String(obj[propertyKey]);
      }
      return match;
    });

    return result;
  }

  getAvailablePrompts(): string[] {
    return Array.from(this.prompts.keys());
  }

  reloadPrompts(): void {
    this.prompts.clear();
    this.loadPrompts();
  }

  // Helper method to format conversation history for prompts
  formatConversationHistory(messages: Array<{ role: string; content: string }>): string {
    return messages
      .map(msg => `${msg.role}: ${msg.content}`)
      .join('\n');
  }

  // Helper method to format preferences for prompts
  formatPreferences(preferences: any): string {
    if (!preferences) return 'No preferences specified yet.';
    
    const formatted: string[] = [];
    
    if (preferences.destination) formatted.push(`Destination: ${preferences.destination}`);
    if (preferences.startDate) formatted.push(`Start Date: ${preferences.startDate}`);
    if (preferences.endDate) formatted.push(`End Date: ${preferences.endDate}`);
    if (preferences.travelers) formatted.push(`Travelers: ${preferences.travelers}`);
    if (preferences.budget) {
      formatted.push(`Budget: $${preferences.budget.min}-$${preferences.budget.max} ${preferences.budget.currency}`);
    }
    
    if (formatted.length === 0) return 'No preferences specified yet.';
    
    return formatted.join('\n');
  }
}

// Singleton instance
export const promptManager = new PromptManager();

/*
 * NOTE: This is a simple file-based prompt management system for P0.
 * In P1, consider:
 * - Database storage for dynamic prompt management
 * - Version control and A/B testing for prompts
 * - Performance metrics tracking per prompt
 * - Role-based prompt access control
 * - Prompt caching for better performance
 */