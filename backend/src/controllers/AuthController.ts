import { Request, Response, NextFunction } from 'express';
import { authService, LoginCredentials, RegisterData, GoogleAuthData } from '../services/auth/AuthService';
import { AppLogger } from '../services/logging';
import { ApiResponse } from '../types';
import { AppError } from '../middleware/errorHandler';

class AuthController {
  async register(req: Request, res: Response<ApiResponse>, next: NextFunction) {
    try {
      const userData: RegisterData = req.body;
      const result = await authService.register(userData);

      // Log successful registration
      AppLogger.logAuthEvent('register', result.user.id, true, { email: userData.email });

      // Set httpOnly cookie for additional security
      res.cookie('accessToken', result.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
      });

      res.status(201).json({
        success: true,
        data: {
          message: 'User registered successfully',
          user: result.user,
          accessToken: result.accessToken,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async login(req: Request, res: Response<ApiResponse>, next: NextFunction) {
    try {
      const credentials: LoginCredentials = req.body;
      const result = await authService.login(credentials);

      // Set httpOnly cookie
      res.cookie('accessToken', result.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
      });

      res.json({
        success: true,
        data: {
          message: 'Login successful',
          user: result.user,
          accessToken: result.accessToken,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async googleLogin(req: Request, res: Response<ApiResponse>, next: NextFunction) {
    try {
      const googleData: GoogleAuthData = req.body;
      
      if (!googleData.token) {
        throw new AppError('Access token required', 400, 'TOKEN_REQUIRED');
      }

      const result = await authService.loginWithGoogle(googleData);

      // Log successful Google login
      AppLogger.logAuthEvent('google_login', result.user.id, true, { email: result.user.email });

      // Set httpOnly cookie
      res.cookie('accessToken', result.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
      });

      res.json({
        success: true,
        data: {
          message: 'Google login successful',
          user: result.user,
          token: result.accessToken, // Frontend expects 'token' field
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async logout(req: Request, res: Response<ApiResponse>, next: NextFunction) {
    try {
      // Clear the cookie
      res.clearCookie('accessToken');

      res.json({
        success: true,
        data: {
          message: 'Logout successful',
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async getProfile(req: Request, res: Response<ApiResponse>, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError('User not authenticated', 401, 'NOT_AUTHENTICATED');
      }

      res.json({
        success: true,
        data: {
          user: req.user,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async updateProfile(req: Request, res: Response<ApiResponse>, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError('User not authenticated', 401, 'NOT_AUTHENTICATED');
      }

      const updates = req.body;
      const updatedUser = await authService.updateProfile(req.user.id, updates);

      if (!updatedUser) {
        throw new AppError('Failed to update profile', 500, 'UPDATE_FAILED');
      }

      res.json({
        success: true,
        data: {
          message: 'Profile updated successfully',
          user: updatedUser,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async changePassword(req: Request, res: Response<ApiResponse>, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError('User not authenticated', 401, 'NOT_AUTHENTICATED');
      }

      const { currentPassword, newPassword } = req.body;
      await authService.changePassword(req.user.id, currentPassword, newPassword);

      res.json({
        success: true,
        data: {
          message: 'Password changed successfully',
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async refreshToken(req: Request, res: Response<ApiResponse>, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError('User not authenticated', 401, 'NOT_AUTHENTICATED');
      }

      // Generate new token
      const accessToken = authService.generateAccessToken({
        userId: req.user.id,
        email: req.user.email,
      });

      // Update cookie
      res.cookie('accessToken', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
      });

      res.json({
        success: true,
        data: {
          message: 'Token refreshed successfully',
          accessToken,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async verifyToken(req: Request, res: Response<ApiResponse>, next: NextFunction) {
    try {
      const authHeader = req.headers.authorization;
      const token = authHeader && authHeader.split(' ')[1];

      if (!token) {
        throw new AppError('Token required', 400, 'TOKEN_REQUIRED');
      }

      const payload = authService.verifyAccessToken(token);
      const user = await authService.getUserById(payload.userId);

      if (!user) {
        throw new AppError('User not found', 404, 'USER_NOT_FOUND');
      }

      res.json({
        success: true,
        data: {
          valid: true,
          user,
          expiresAt: payload.exp ? new Date(payload.exp * 1000) : null,
        },
      });
    } catch (error) {
      res.json({
        success: false,
        data: {
          valid: false,
        },
        error: {
          message: error instanceof Error ? error.message : 'Token verification failed',
          code: 'TOKEN_INVALID',
        },
      });
    }
  }
}

export const authController = new AuthController();