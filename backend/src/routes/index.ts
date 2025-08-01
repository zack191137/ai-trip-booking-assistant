import { Router } from 'express';
import { ApiResponse } from '../types';
import authRoutes from './auth';
import conversationRoutes from './conversations';
import tripRoutes from './trips';

const router = Router();

// Health check endpoint
router.get('/health', (_req, res: any) => {
  const response: ApiResponse = {
    success: true,
    data: {
      status: 'OK',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      version: '1.0.0',
    },
  };
  res.json(response);
});

// API info endpoint
router.get('/info', (_req, res: any) => {
  const response: ApiResponse = {
    success: true,
    data: {
      name: 'Trip Booking Assistant API',
      version: '1.0.0',
      description: 'AI-powered trip booking assistant backend',
      endpoints: {
        health: '/api/health',
        auth: '/api/auth/*',
        conversations: '/api/conversations/*',
        trips: '/api/trips/*',
        users: '/api/users/*',
      },
    },
  };
  res.json(response);
});

// Mount route modules
router.use('/auth', authRoutes);
router.use('/conversations', conversationRoutes);
router.use('/trips', tripRoutes);

export default router;