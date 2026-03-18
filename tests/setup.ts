import { beforeAll, afterAll, beforeEach } from '@jest/globals';

jest.mock('../src/config/database.js', () => ({
  query: jest.fn(),
  queryOne: jest.fn(),
  getClient: jest.fn(),
  closePool: jest.fn(),
}));

process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
process.env.JWT_SECRET = 'test-secret-key-minimum-32-characters';
process.env.JWT_EXPIRES_IN = '7d';
process.env.REFRESH_TOKEN_EXPIRES_IN = '30d';
process.env.PORT = '3000';
process.env.NODE_ENV = 'test';
