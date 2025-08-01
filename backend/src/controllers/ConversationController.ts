import { Request, Response, NextFunction } from 'express';
import { chatService } from '../services/chat/ChatService';
import { ApiResponse, PaginatedResponse } from '../types';
import { AppError } from '../middleware/errorHandler';

class ConversationController {
  async createConversation(req: Request, res: Response<ApiResponse>, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError('User not authenticated', 401, 'NOT_AUTHENTICATED');
      }

      const conversation = await chatService.createConversation(req.user.id);

      res.status(201).json({
        success: true,
        data: {
          message: 'Conversation created successfully',
          conversation,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async getConversations(req: Request, res: Response<PaginatedResponse<any>>, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError('User not authenticated', 401, 'NOT_AUTHENTICATED');
      }

      const conversations = await chatService.getUserConversations(req.user.id);

      // Sort by most recent activity
      conversations.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());

      res.json({
        success: true,
        data: conversations,
        pagination: {
          page: 1,
          limit: conversations.length,
          total: conversations.length,
          totalPages: 1,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async getConversation(req: Request, res: Response<ApiResponse>, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError('User not authenticated', 401, 'NOT_AUTHENTICATED');
      }

      const { id } = req.params;
      const conversation = await chatService.getConversation(id, req.user.id);

      if (!conversation) {
        throw new AppError('Conversation not found', 404, 'CONVERSATION_NOT_FOUND');
      }

      res.json({
        success: true,
        data: {
          conversation,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async endConversation(req: Request, res: Response<ApiResponse>, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError('User not authenticated', 401, 'NOT_AUTHENTICATED');
      }

      const { id } = req.params;
      const success = await chatService.endConversation(id, req.user.id);

      if (!success) {
        throw new AppError('Conversation not found or access denied', 404, 'CONVERSATION_NOT_FOUND');
      }

      res.json({
        success: true,
        data: {
          message: 'Conversation ended successfully',
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async sendMessage(req: Request, res: Response<ApiResponse>, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError('User not authenticated', 401, 'NOT_AUTHENTICATED');
      }

      const { id } = req.params;
      const { content } = req.body;

      // Verify conversation exists and belongs to user
      const conversation = await chatService.getConversation(id, req.user.id);
      if (!conversation) {
        throw new AppError('Conversation not found', 404, 'CONVERSATION_NOT_FOUND');
      }

      res.json({
        success: true,
        data: {
          message: 'Message sent successfully. Response will be delivered via WebSocket.',
          conversationId: id,
        },
      });

      // Note: The actual message processing happens via WebSocket
      // This endpoint is mainly for REST API compatibility
    } catch (error) {
      next(error);
    }
  }

  async getConversationStats(req: Request, res: Response<ApiResponse>, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError('User not authenticated', 401, 'NOT_AUTHENTICATED');
      }

      const conversations = await chatService.getUserConversations(req.user.id);
      
      const stats = {
        totalConversations: conversations.length,
        activeConversations: conversations.filter(c => c.status === 'active').length,
        completedConversations: conversations.filter(c => c.status === 'completed').length,
        totalMessages: conversations.reduce((sum, c) => sum + c.messages.length, 0),
        hasExtractedPreferences: conversations.some(c => Object.keys(c.extractedPreferences).length > 0),
        isOnline: chatService.isUserOnline(req.user.id),
      };

      res.json({
        success: true,
        data: { stats },
      });
    } catch (error) {
      next(error);
    }
  }

  // Admin/system endpoints (for future use)
  async getSystemStats(req: Request, res: Response<ApiResponse>, next: NextFunction) {
    try {
      // Note: Add proper admin authentication in P1
      const onlineUsers = chatService.getOnlineUsersCount();
      
      res.json({
        success: true,
        data: {
          stats: {
            onlineUsers,
            serverUptime: process.uptime(),
            memoryUsage: process.memoryUsage(),
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

export const conversationController = new ConversationController();