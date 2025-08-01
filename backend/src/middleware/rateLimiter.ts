import rateLimit from 'express-rate-limit';
import config from '../config/environment';

export const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: config.rateLimiting.apiPerMinute,
  message: {
    success: false,
    error: {
      message: 'Too many requests, please try again later.',
      code: 'RATE_LIMIT_EXCEEDED',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const llmLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: config.rateLimiting.llmPerMinute,
  message: {
    success: false,
    error: {
      message: 'Too many LLM requests, please try again later.',
      code: 'LLM_RATE_LIMIT_EXCEEDED',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});