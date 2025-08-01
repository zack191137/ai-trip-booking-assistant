import * as jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { User } from '../../types';
import { storage } from '../storage';
import config from '../../config/environment';
import { AppError } from '../../middleware/errorHandler';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
}

export interface AuthTokens {
  accessToken: string;
  user: Omit<User, 'password'>;
}

export interface JWTPayload {
  userId: string;
  email: string;
  iat?: number;
  exp?: number;
}

class AuthService {
  private readonly saltRounds = 12;

  async register(userData: RegisterData): Promise<AuthTokens> {
    const { email, password, name } = userData;

    // Check if user already exists
    const existingUser = await storage.users.findByEmail(email);
    if (existingUser) {
      throw new AppError('User already exists with this email', 409, 'USER_EXISTS');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, this.saltRounds);

    // Create user (need to extend User type to include password for storage)
    const user = await storage.users.create({
      email,
      password: hashedPassword,
      name,
      preferences: {
        currency: 'USD',
        language: 'en',
        notifications: true,
      },
    } as any); // Type assertion needed due to password field

    // Generate access token
    const accessToken = this.generateAccessToken({
      userId: user.id,
      email: user.email,
    });

    // Return user without password
    const { password: _, ...userWithoutPassword } = user as any;
    
    return {
      accessToken,
      user: userWithoutPassword,
    };
  }

  async login(credentials: LoginCredentials): Promise<AuthTokens> {
    const { email, password } = credentials;

    // Find user by email
    const user = await storage.users.findByEmail(email);
    if (!user) {
      throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
    }

    // Verify password
    const storedUser = user as any; // Type assertion for password field
    const isPasswordValid = await bcrypt.compare(password, storedUser.password);
    if (!isPasswordValid) {
      throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
    }

    // Generate access token
    const accessToken = this.generateAccessToken({
      userId: user.id,
      email: user.email,
    });

    // Return user without password
    const { password: _, ...userWithoutPassword } = storedUser;

    return {
      accessToken,
      user: userWithoutPassword,
    };
  }

  async getUserById(userId: string): Promise<Omit<User, 'password'> | null> {
    const user = await storage.users.findById(userId);
    if (!user) {
      return null;
    }

    // Return user without password
    const { password: _, ...userWithoutPassword } = user as any;
    return userWithoutPassword;
  }

  generateAccessToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
    return jwt.sign(payload, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn
    } as jwt.SignOptions);
  }

  verifyAccessToken(token: string): JWTPayload {
    try {
      return jwt.verify(token, config.jwt.secret) as JWTPayload;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new AppError('Token expired', 401, 'TOKEN_EXPIRED');
      } else if (error instanceof jwt.JsonWebTokenError) {
        throw new AppError('Invalid token', 401, 'INVALID_TOKEN');
      }
      throw new AppError('Token verification failed', 401, 'TOKEN_VERIFICATION_FAILED');
    }
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    const user = await storage.users.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    const storedUser = user as any;
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, storedUser.password);
    if (!isCurrentPasswordValid) {
      throw new AppError('Current password is incorrect', 401, 'INVALID_PASSWORD');
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, this.saltRounds);
    await storage.users.update(userId, { password: hashedNewPassword } as any);
  }

  async updateProfile(userId: string, updates: Partial<Pick<User, 'name' | 'preferences'>>): Promise<Omit<User, 'password'> | null> {
    const updatedUser = await storage.users.update(userId, updates);
    if (!updatedUser) {
      return null;
    }

    const { password: _, ...userWithoutPassword } = updatedUser as any;
    return userWithoutPassword;
  }
}

export const authService = new AuthService();

/*
 * NOTE: For P0, we're storing passwords in the User storage.
 * In P1, consider creating a separate UserCredentials table/storage
 * to better separate authentication data from user profile data.
 */