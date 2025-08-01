import { Server as SocketIOServer, Socket } from 'socket.io';
import { authService } from '../auth/AuthService';
import { storage } from '../storage';
import { llmService } from '../llm';
import { Conversation, Message, TripPreferences } from '../../types';
import { AppError } from '../../middleware/errorHandler';

export interface ChatMessage {
  conversationId: string;
  content: string;
  timestamp: Date;
}

export interface TypingStatus {
  conversationId: string;
  isTyping: boolean;
}

export interface ProcessingStatus {
  status: 'thinking' | 'searching' | 'generating';
  message?: string;
}

export class ChatService {
  private io: SocketIOServer;
  private connectedUsers: Map<string, Socket> = new Map();

  constructor(io: SocketIOServer) {
    this.io = io;
    this.setupSocketHandlers();
  }

  private setupSocketHandlers(): void {
    this.io.on('connection', (socket: Socket) => {
      console.log(`Client connected: ${socket.id}`);
      
      // Handle authentication
      socket.on('authenticate', async (data: { token: string }) => {
        try {
          await this.authenticateSocket(socket, data.token);
        } catch (error) {
          socket.emit('error', {
            message: 'Authentication failed',
            code: 'AUTH_FAILED'
          });
          socket.disconnect();
        }
      });

      // Handle joining conversations
      socket.on('join_conversation', async (data: { conversationId: string }) => {
        try {
          await this.handleJoinConversation(socket, data.conversationId);
        } catch (error) {
          socket.emit('error', {
            message: error instanceof Error ? error.message : 'Failed to join conversation',
            code: 'JOIN_CONVERSATION_FAILED'
          });
        }
      });

      // Handle new messages
      socket.on('message', async (data: ChatMessage) => {
        try {
          await this.handleMessage(socket, data);
        } catch (error) {
          socket.emit('error', {
            message: error instanceof Error ? error.message : 'Failed to process message',
            code: 'MESSAGE_PROCESSING_FAILED'
          });
        }
      });

      // Handle typing indicators
      socket.on('typing', (data: TypingStatus) => {
        this.handleTyping(socket, data);
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        this.handleDisconnect(socket);
      });
    });
  }

  private async authenticateSocket(socket: Socket, token: string): Promise<void> {
    try {
      const payload = authService.verifyAccessToken(token);
      const user = await authService.getUserById(payload.userId);
      
      if (!user) {
        throw new AppError('User not found', 401, 'USER_NOT_FOUND');
      }

      // Store user info in socket
      (socket as any).userId = user.id;
      (socket as any).user = user;
      
      // Track connected user
      this.connectedUsers.set(user.id, socket);

      socket.emit('authenticated', { user });
      console.log(`User authenticated: ${user.email} (${socket.id})`);
    } catch (error) {
      throw new AppError('Invalid authentication token', 401, 'INVALID_TOKEN');
    }
  }

  private async handleJoinConversation(socket: Socket, conversationId: string): Promise<void> {
    const userId = (socket as any).userId;
    if (!userId) {
      throw new AppError('Socket not authenticated', 401, 'NOT_AUTHENTICATED');
    }

    // Verify conversation belongs to user
    const conversation = await storage.conversations.findById(conversationId);
    if (!conversation) {
      throw new AppError('Conversation not found', 404, 'CONVERSATION_NOT_FOUND');
    }

    if (conversation.userId !== userId) {
      throw new AppError('Access denied to conversation', 403, 'ACCESS_DENIED');
    }

    // Join socket room
    socket.join(`conversation:${conversationId}`);
    (socket as any).currentConversationId = conversationId;

    // Send conversation history
    socket.emit('conversation_joined', {
      conversationId,
      messages: conversation.messages,
      extractedPreferences: conversation.extractedPreferences,
    });

    console.log(`User ${userId} joined conversation: ${conversationId}`);
  }

  private async handleMessage(socket: Socket, data: ChatMessage): Promise<void> {
    const userId = (socket as any).userId;
    if (!userId) {
      throw new AppError('Socket not authenticated', 401, 'NOT_AUTHENTICATED');
    }

    const { conversationId, content, timestamp } = data;

    // Validate conversation access
    const conversation = await storage.conversations.findById(conversationId);
    if (!conversation || conversation.userId !== userId) {
      throw new AppError('Invalid conversation', 403, 'INVALID_CONVERSATION');
    }

    // Add user message to conversation
    const userMessage: Omit<Message, 'id'> = {
      role: 'user',
      content: content.trim(),
      timestamp: new Date(timestamp),
    };

    await storage.conversations.addMessage(conversationId, userMessage);

    // Broadcast user message to conversation room
    this.io.to(`conversation:${conversationId}`).emit('message', {
      message: userMessage,
      sender: 'user'
    });

    // Show processing status
    socket.emit('processing', { status: 'thinking', message: 'Thinking about your request...' });

    try {
      // Generate AI response
      const aiResponse = await this.generateAIResponse(conversation, content);

      // Add AI message to conversation
      const assistantMessage: Omit<Message, 'id'> = {
        role: 'assistant',
        content: aiResponse,
        timestamp: new Date(),
      };

      await storage.conversations.addMessage(conversationId, assistantMessage);

      // Extract and update preferences if needed
      await this.updatePreferencesIfNeeded(conversationId);

      // Send AI response
      this.io.to(`conversation:${conversationId}`).emit('message', {
        message: assistantMessage,
        sender: 'bot'
      });

    } catch (error) {
      console.error('Error generating AI response:', error);
      
      // Send error message
      const errorMessage: Omit<Message, 'id'> = {
        role: 'assistant',
        content: "I'm sorry, I'm having trouble processing your request right now. Please try again in a moment.",
        timestamp: new Date(),
      };

      await storage.conversations.addMessage(conversationId, errorMessage);
      
      this.io.to(`conversation:${conversationId}`).emit('message', {
        message: errorMessage,
        sender: 'bot'
      });
    }
  }

  private async generateAIResponse(conversation: Conversation, userMessage: string): Promise<string> {
    const context = {
      conversationId: conversation.id,
      userId: conversation.userId,
      previousMessages: conversation.messages.slice(-10), // Last 10 messages for context
      extractedPreferences: conversation.extractedPreferences,
    };

    return await llmService.generateConversationResponse(userMessage, context);
  }

  private async updatePreferencesIfNeeded(conversationId: string): Promise<void> {
    try {
      const conversation = await storage.conversations.findById(conversationId);
      if (!conversation) return;

      // Extract preferences from conversation history
      const preferences = await llmService.extractTripPreferences(conversation.messages);
      
      // Update if we have new preferences
      if (Object.keys(preferences).length > 0) {
        const updatedPreferences = {
          ...conversation.extractedPreferences,
          ...preferences,
        };

        await storage.conversations.updatePreferences(conversationId, updatedPreferences);

        // Notify client of updated preferences
        this.io.to(`conversation:${conversationId}`).emit('preferences_updated', {
          preferences: updatedPreferences,
        });
      }
    } catch (error) {
      console.error('Error updating preferences:', error);
      // Don't throw - this is a non-critical operation
    }
  }

  private handleTyping(socket: Socket, data: TypingStatus): void {
    const userId = (socket as any).userId;
    if (!userId) return;

    const { conversationId, isTyping } = data;
    
    // Broadcast typing status to others in the conversation
    socket.to(`conversation:${conversationId}`).emit('user_typing', {
      userId,
      isTyping,
      conversationId,
    });
  }

  private handleDisconnect(socket: Socket): void {
    const userId = (socket as any).userId;
    if (userId) {
      this.connectedUsers.delete(userId);
      console.log(`User ${userId} disconnected (${socket.id})`);
    } else {
      console.log(`Client disconnected: ${socket.id}`);
    }
  }

  // Public methods for external use

  async createConversation(userId: string): Promise<Conversation> {
    const conversation = await storage.conversations.create({
      userId,
      messages: [],
      extractedPreferences: {},
      status: 'active',
    });

    return conversation;
  }

  async getConversation(conversationId: string, userId: string): Promise<Conversation | null> {
    const conversation = await storage.conversations.findById(conversationId);
    
    if (!conversation || conversation.userId !== userId) {
      return null;
    }

    return conversation;
  }

  async getUserConversations(userId: string): Promise<Conversation[]> {
    return await storage.conversations.findByUserId(userId);
  }

  async endConversation(conversationId: string, userId: string): Promise<boolean> {
    const conversation = await storage.conversations.findById(conversationId);
    
    if (!conversation || conversation.userId !== userId) {
      return false;
    }

    await storage.conversations.updateStatus(conversationId, 'completed');
    
    // Notify connected clients
    this.io.to(`conversation:${conversationId}`).emit('conversation_ended', {
      conversationId,
    });

    return true;
  }

  // Send system message to a conversation
  async sendSystemMessage(conversationId: string, message: string): Promise<void> {
    const systemMessage: Omit<Message, 'id'> = {
      role: 'assistant',
      content: message,
      timestamp: new Date(),
      metadata: { type: 'system' },
    };

    await storage.conversations.addMessage(conversationId, systemMessage);
    
    this.io.to(`conversation:${conversationId}`).emit('message', {
      message: systemMessage,
      sender: 'system'
    });
  }

  // Get online users count
  getOnlineUsersCount(): number {
    return this.connectedUsers.size;
  }

  // Check if user is online
  isUserOnline(userId: string): boolean {
    return this.connectedUsers.has(userId);
  }
}

export let chatService: ChatService;

export const initializeChatService = (io: SocketIOServer): void => {
  chatService = new ChatService(io);
};

/*
 * NOTE: This chat service provides real-time communication for P0.
 * For P1 enhancements:
 * - Add message persistence and offline message delivery
 * - Implement message encryption for privacy
 * - Add file upload support for images/documents
 * - Implement conversation archiving
 * - Add admin/moderator capabilities
 * - Implement rate limiting per user
 * - Add conversation analytics and insights
 */