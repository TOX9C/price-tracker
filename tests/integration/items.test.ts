import request from 'supertest';
import { Express } from 'express';

// Mock database
jest.mock('../../src/config/database.js', () => ({
  query: jest.fn(() => Promise.resolve([])),
  queryOne: jest.fn((sql, params) => {
    if (sql.includes('SELECT * FROM items WHERE id')) {
      return Promise.resolve({
        id: params[0],
        user_id: 'test-user-id',
        name: 'Test Item',
        image_url: null,
        category: null,
        created_at: new Date(),
      });
    }
    return Promise.resolve(null);
  }),
  getClient: jest.fn(() => ({
    query: jest.fn(() => ({ rows: [] })),
    release: jest.fn(),
  })),
  closePool: jest.fn(),
}));

// Mock auth middleware
jest.mock('../../src/middleware/auth.js', () => ({
  requireAuth: (req: any, res: any, next: any) => {
    req.user = { id: 'test-user-id', email: 'test@example.com' };
    next();
  },
}));

describe('Items API Integration Tests', () => {
  let app: Express;

  beforeAll(async () => {
    const { createApp } = await import('../../src/app.js');
    app = createApp();
  });

  describe('GET /api/v1/items', () => {
    it('should return items list', async () => {
      const response = await request(app)
        .get('/api/v1/items')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(200);
    });
  });

  describe('POST /api/v1/items', () => {
    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/v1/items')
        .set('Authorization', 'Bearer test-token')
        .send({});

      expect(response.status).toBe(400);
    });

    it('should require name', async () => {
      const response = await request(app)
        .post('/api/v1/items')
        .set('Authorization', 'Bearer test-token')
        .send({
          urls: ['https://amazon.com/dp/test'],
        });

      expect(response.status).toBe(400);
    });

    it('should require at least one URL', async () => {
      const response = await request(app)
        .post('/api/v1/items')
        .set('Authorization', 'Bearer test-token')
        .send({
          name: 'Test Item',
          urls: [],
        });

      expect(response.status).toBe(400);
    });

    it('should validate URL format', async () => {
      const response = await request(app)
        .post('/api/v1/items')
        .set('Authorization', 'Bearer test-token')
        .send({
          name: 'Test Item',
          urls: ['not-a-url'],
        });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/v1/items/:id', () => {
    it('should return item details', async () => {
      const response = await request(app)
        .get('/api/v1/items/test-item-id')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(200);
    });
  });

  describe('PUT /api/v1/items/:id', () => {
    it('should update item name', async () => {
      const response = await request(app)
        .put('/api/v1/items/test-item-id')
        .set('Authorization', 'Bearer test-token')
        .send({ name: 'Updated Name' });

      expect([200, 404]).toContain(response.status);
    });
  });

  describe('DELETE /api/v1/items/:id', () => {
    it('should soft delete item', async () => {
      const response = await request(app)
        .delete('/api/v1/items/test-item-id')
        .set('Authorization', 'Bearer test-token');

      expect([200, 204, 404]).toContain(response.status);
    });
  });

  describe('POST /api/v1/items/:id/urls', () => {
    it('should validate URL', async () => {
      const response = await request(app)
        .post('/api/v1/items/test-item-id/urls')
        .set('Authorization', 'Bearer test-token')
        .send({ url: 'not-a-url' });

      expect(response.status).toBe(400);
    });
  });
});
