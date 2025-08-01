import { Router } from 'express';
import { ApiResponse } from '../types';

const router = Router();

// Health check endpoint
router.get('/health', (req, res: any) => {
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
router.get('/info', (req, res: any) => {
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

export default router;