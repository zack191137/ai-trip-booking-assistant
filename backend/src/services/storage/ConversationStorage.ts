import { InMemoryStorage } from './InMemoryStorage';
import { Conversation, Message } from '../../types';

export class ConversationStorage extends InMemoryStorage<Conversation> {
  async findByUserId(userId: string): Promise<Conversation[]> {
    return this.findAll({ userId });
  }

  async findActiveByUserId(userId: string): Promise<Conversation[]> {
    const conversations = await this.findByUserId(userId);
    return conversations.filter(conv => conv.status === 'active');
  }

  async addMessage(conversationId: string, message: Omit<Message, 'id'>): Promise<Conversation | null> {
    const conversation = await this.findById(conversationId);
    if (!conversation) {
      return null;
    }

    const newMessage: Message = {
      ...message,
      id: require('uuid').v4(),
    };

    const updatedMessages = [...conversation.messages, newMessage];
    return this.update(conversationId, { 
      messages: updatedMessages,
      updatedAt: new Date()
    });
  }

  async updateStatus(conversationId: string, status: Conversation['status']): Promise<Conversation | null> {
    return this.update(conversationId, { status });
  }

  async updatePreferences(conversationId: string, preferences: Conversation['extractedPreferences']): Promise<Conversation | null> {
    return this.update(conversationId, { extractedPreferences: preferences });
  }
}

export const conversationStorage = new ConversationStorage();