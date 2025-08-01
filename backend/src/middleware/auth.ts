import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth/AuthService';
import { ApiResponse } from '../types';
import { AppError } from './errorHandler';

export const authenticateToken = async (
  req: Request,
  res: Response<ApiResponse>,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      throw new AppError('Access token required', 401, 'TOKEN_REQUIRED');
    }

    // Verify token
    const payload = authService.verifyAccessToken(token);
    
    // Get user from storage
    const user = await authService.getUserById(payload.userId);
    if (!user) {
      throw new AppError('User not found', 401, 'USER_NOT_FOUND');
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

export const optionalAuth = async (
  req: Request,
  res: Response<ApiResponse>,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      try {
        const payload = authService.verifyAccessToken(token);
        const user = await authService.getUserById(payload.userId);
        if (user) {
          req.user = user;
        }
      } catch (error) {
        // For optional auth, we don't throw errors for invalid tokens
        // We just continue without setting req.user
      }
    }

    next();
  } catch (error) {
    next(error);
  }
};

// Cookie-based authentication (alternative to Bearer token)
export const authenticateCookie = async (
  req: Request,
  res: Response<ApiResponse>,
  next: NextFunction
) => {
  try {
    const token = req.cookies.accessToken;

    if (!token) {
      throw new AppError('Access token required', 401, 'TOKEN_REQUIRED');
    }

    const payload = authService.verifyAccessToken(token);
    const user = await authService.getUserById(payload.userId);
    
    if (!user) {
      throw new AppError('User not found', 401, 'USER_NOT_FOUND');
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

// Role-based access control middleware (for future use)
export const requireRole = (roles: string[]) => {
  return (req: Request, res: Response<ApiResponse>, next: NextFunction) => {
    if (!req.user) {
      throw new AppError('Authentication required', 401, 'AUTH_REQUIRED');
    }

    // For P0, we don't have roles implemented yet
    // This is a placeholder for P1 implementation
    // const userRoles = (req.user as any).roles || [];
    // const hasRole = roles.some(role => userRoles.includes(role));
    
    // if (!hasRole) {
    //   throw new AppError('Insufficient permissions', 403, 'INSUFFICIENT_PERMISSIONS');
    // }

    next();
  };
};