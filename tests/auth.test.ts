import { authService } from '../src/services/auth.service.js';
import * as db from '../src/config/database.js';

jest.mock('../src/config/database.js');

describe('Auth Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should throw ValidationError for existing email', async () => {
      const existingUser = {
        id: 'existing-uuid',
        email: 'existing@example.com',
        password_hash: 'hashed',
        created_at: new Date(),
        notification_preferences: {},
        deleted_at: null,
      };

      (db.queryOne as jest.Mock).mockResolvedValueOnce(existingUser);

      await expect(authService.register({
        email: 'existing@example.com',
        password: 'password123',
      })).rejects.toThrow('Email already registered');
    });

    it('should register a new user successfully', async () => {
      const mockUser = {
        id: 'test-uuid',
        email: 'test@example.com',
        password_hash: 'hashed',
        created_at: new Date(),
        notification_preferences: {},
        deleted_at: null,
      };

      (db.queryOne as jest.Mock).mockResolvedValueOnce(null);
      (db.queryOne as jest.Mock).mockResolvedValueOnce(mockUser);

      const result = await authService.register({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(result.user.email).toBe('test@example.com');
      expect(result.token).toBeDefined();
      expect(result.refreshToken).toBeDefined();
    });
  });

  describe('login', () => {
    it('should throw UnauthorizedError for invalid credentials', async () => {
      (db.queryOne as jest.Mock).mockResolvedValueOnce(null);

      await expect(authService.login({
        email: 'nonexistent@example.com',
        password: 'password123',
      })).rejects.toThrow('Invalid email or password');
    });
  });
});
