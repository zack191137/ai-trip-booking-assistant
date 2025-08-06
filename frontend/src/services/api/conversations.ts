import axios from 'axios';
import type { Conversation, Message } from '@/types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

export interface CreateConversationResponse {
  success: boolean;
  data: {
    message: string;
    conversation: Conversation;
  };
}

export interface GetConversationsResponse {
  success: boolean;
  data: Conversation[];
}

export interface GetConversationResponse {
  success: boolean;
  data: {
    conversation: Conversation;
  };
}

export interface SendMessageRequest {
  content: string;
}

export interface SendMessageResponse {
  success: boolean;
  data: {
    message: Message;
    conversation: Conversation;
  };
}

class ConversationsService {
  private getAuthHeaders() {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  /**
   * Get all conversations for the current user
   */
  async getConversations(): Promise<Conversation[]> {
    const response = await axios.get<GetConversationsResponse>(
      `${API_BASE_URL}/conversations`,
      { headers: this.getAuthHeaders() }
    );

    if (!response.data.success) {
      throw new Error('Failed to fetch conversations');
    }

    // Convert date strings to Date objects
    return response.data.data.map(conversation => ({
      ...conversation,
      createdAt: new Date(conversation.createdAt),
      updatedAt: new Date(conversation.updatedAt),
      extractedPreferences: {
        ...conversation.extractedPreferences,
        startDate: conversation.extractedPreferences.startDate 
          ? new Date(conversation.extractedPreferences.startDate) 
          : undefined,
        endDate: conversation.extractedPreferences.endDate 
          ? new Date(conversation.extractedPreferences.endDate) 
          : undefined,
      },
      messages: conversation.messages.map(message => ({
        ...message,
        timestamp: new Date(message.timestamp),
      })),
    }));
  }

  /**
   * Create a new conversation
   */
  async createConversation(): Promise<Conversation> {
    const response = await axios.post<CreateConversationResponse>(
      `${API_BASE_URL}/conversations`,
      {},
      { headers: this.getAuthHeaders() }
    );

    if (!response.data.success) {
      throw new Error('Failed to create conversation');
    }

    const conversation = response.data.data.conversation;
    return {
      ...conversation,
      createdAt: new Date(conversation.createdAt),
      updatedAt: new Date(conversation.updatedAt),
      extractedPreferences: {
        ...conversation.extractedPreferences,
        startDate: conversation.extractedPreferences.startDate 
          ? new Date(conversation.extractedPreferences.startDate) 
          : undefined,
        endDate: conversation.extractedPreferences.endDate 
          ? new Date(conversation.extractedPreferences.endDate) 
          : undefined,
      },
      messages: conversation.messages.map(message => ({
        ...message,
        timestamp: new Date(message.timestamp),
      })),
    };
  }

  /**
   * Get a specific conversation by ID
   */
  async getConversation(conversationId: string): Promise<Conversation> {
    const response = await axios.get<GetConversationResponse>(
      `${API_BASE_URL}/conversations/${conversationId}`,
      { headers: this.getAuthHeaders() }
    );

    if (!response.data.success) {
      throw new Error('Failed to fetch conversation');
    }

    const conversation = response.data.data.conversation;
    return {
      ...conversation,
      createdAt: new Date(conversation.createdAt),
      updatedAt: new Date(conversation.updatedAt),
      extractedPreferences: {
        ...conversation.extractedPreferences,
        startDate: conversation.extractedPreferences.startDate 
          ? new Date(conversation.extractedPreferences.startDate) 
          : undefined,
        endDate: conversation.extractedPreferences.endDate 
          ? new Date(conversation.extractedPreferences.endDate) 
          : undefined,
      },
      messages: conversation.messages.map(message => ({
        ...message,
        timestamp: new Date(message.timestamp),
      })),
    };
  }

  /**
   * Send a message in a conversation
   */
  async sendMessage(conversationId: string, content: string): Promise<{ message: Message; conversation: Conversation }> {
    const response = await axios.post<SendMessageResponse>(
      `${API_BASE_URL}/conversations/${conversationId}/messages`,
      { content },
      { headers: this.getAuthHeaders() }
    );

    if (!response.data.success) {
      throw new Error('Failed to send message');
    }

    const { message, conversation } = response.data.data;
    
    return {
      message: {
        ...message,
        timestamp: new Date(message.timestamp),
      },
      conversation: {
        ...conversation,
        createdAt: new Date(conversation.createdAt),
        updatedAt: new Date(conversation.updatedAt),
        extractedPreferences: {
          ...conversation.extractedPreferences,
          startDate: conversation.extractedPreferences.startDate 
            ? new Date(conversation.extractedPreferences.startDate) 
            : undefined,
          endDate: conversation.extractedPreferences.endDate 
            ? new Date(conversation.extractedPreferences.endDate) 
            : undefined,
        },
        messages: conversation.messages.map(msg => ({
          ...msg,
          timestamp: new Date(msg.timestamp),
        })),
      },
    };
  }

  /**
   * Delete a conversation
   */
  async deleteConversation(conversationId: string): Promise<void> {
    const response = await axios.delete(
      `${API_BASE_URL}/conversations/${conversationId}`,
      { headers: this.getAuthHeaders() }
    );

    if (response.status !== 200 && response.status !== 204) {
      throw new Error('Failed to delete conversation');
    }
  }
}

export const conversationsService = new ConversationsService();
export default conversationsService;