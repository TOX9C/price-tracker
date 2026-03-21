import request from 'supertest';
import { Express } from 'express';

// Mock the database module
jest.mock('../../src/config/database.js', () => ({
  query: jest.fn(),
  queryOne: jest.fn(),
  getClient: jest.fn(() => ({
    query: jest.fn(),
    release: jest.fn(),
  })),
  closePool: jest.fn(),
}));

// Mock the password module
jest.mock('../../src/utils/password.js', () => ({
  hashPassword: jest.fn(() => Promise.resolve('$2b$12$hashedpassword')),
  verifyPassword: jest.fn(() => Promise.resolve(true)),
}));

// Mock the auth middleware
jest.mock('../../src/middleware/auth.js', () => {
  const original = jest.requireActual('../../src/middleware/auth.js');
  return {
    ...original,
    generateToken: jest.fn(() => 'mock-jwt-token'),
    generateRefreshToken: jest.fn(() => 'mock-refresh-token'),
  };
});

describe('Auth API Integration Tests', () => {
  let app: Express;

  beforeAll(async () => {
    const { createApp } = await import('../../src/app.js');
    app = createApp();
  });

  describe('POST /api/v1/auth/register', () => {
    it('should validate email format', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'invalid-email',
          password: 'password123',
        });

      expect(response.status).toBe(400);
    });

    it('should reject short password', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'test@example.com',
          password: 'short',
        });

      expect(response.status).toBe(400);
    });

    it('should require email and password', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
    });
  });

  describe('POST /api/v1/auth/login', () => {
    it('should require email and password', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({});

      expect(response.status).toBe(400);
    });

    it('should validate email format', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'not-an-email',
          password: 'password123',
        });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/v1/auth/logout', () => {
    it('should return success', async () => {
      const response = await request(app)
        .post('/api/v1/auth/logout');

      expect(response.status).toBe(200);
    });
  });
});
