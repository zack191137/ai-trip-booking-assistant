import { authService } from '../../../src/services/auth/AuthService';
import { storage } from '../../../src/services/storage';
import { AppError } from '../../../src/middleware/errorHandler';

describe('AuthService', () => {
  beforeEach(async () => {
    await storage.clearAll();
  });

  afterEach(async () => {
    await storage.clearAll();
  });

  describe('register', () => {
    it('should successfully register a new user', async () => {
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'testpassword123'
      };

      const result = await authService.register(userData);

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('accessToken');
      expect(result.user.email).toBe(userData.email);
      expect(result.user.name).toBe(userData.name);
      expect(result.user).not.toHaveProperty('password');
    });

    it('should throw error for duplicate email', async () => {
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'testpassword123'
      };

      await authService.register(userData);

      await expect(authService.register(userData))
        .rejects
        .toThrow(AppError);
    });

    it('should hash password before storing', async () => {
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'testpassword123'
      };

      const result = await authService.register(userData);
      const storedUser = await storage.users.findById(result.user.id);

      expect(storedUser?.password).not.toBe(userData.password);
      expect(storedUser?.password).toBeDefined();
    });
  });

  describe('login', () => {
    beforeEach(async () => {
      await authService.register({
        name: 'Test User',
        email: 'test@example.com',
        password: 'testpassword123'
      });
    });

    it('should successfully login with correct credentials', async () => {
      const credentials = {
        email: 'test@example.com',
        password: 'testpassword123'
      };

      const result = await authService.login(credentials);

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('accessToken');
      expect(result.user.email).toBe(credentials.email);
    });

    it('should throw error for incorrect email', async () => {
      const credentials = {
        email: 'wrong@example.com',
        password: 'testpassword123'
      };

      await expect(authService.login(credentials))
        .rejects
        .toThrow(AppError);
    });

    it('should throw error for incorrect password', async () => {
      const credentials = {
        email: 'test@example.com',
        password: 'wrongpassword'
      };

      await expect(authService.login(credentials))
        .rejects
        .toThrow(AppError);
    });
  });

  describe('verifyToken', () => {
    it('should verify valid token', async () => {
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'testpassword123'
      };

      const { accessToken } = await authService.register(userData);
      const payload = authService.verifyToken(accessToken);

      expect(payload).toHaveProperty('id');
      expect(payload).toHaveProperty('email');
      expect(payload.email).toBe(userData.email);
    });

    it('should throw error for invalid token', () => {
      const invalidToken = 'invalid.jwt.token';

      expect(() => authService.verifyToken(invalidToken))
        .toThrow(AppError);
    });
  });

  describe('changePassword', () => {
    let userId: string;

    beforeEach(async () => {
      const result = await authService.register({
        name: 'Test User',
        email: 'test@example.com',
        password: 'oldpassword123'
      });
      userId = result.user.id;
    });

    it('should successfully change password with correct current password', async () => {
      await expect(authService.changePassword(userId, 'oldpassword123', 'newpassword123'))
        .resolves
        .not.toThrow();

      // Verify new password works
      const result = await authService.login({
        email: 'test@example.com',
        password: 'newpassword123'
      });
      expect(result.user.id).toBe(userId);
    });

    it('should throw error for incorrect current password', async () => {
      await expect(authService.changePassword(userId, 'wrongpassword', 'newpassword123'))
        .rejects
        .toThrow(AppError);
    });

    it('should throw error for non-existent user', async () => {
      await expect(authService.changePassword('nonexistent-id', 'oldpassword123', 'newpassword123'))
        .rejects
        .toThrow(AppError);
    });
  });
});