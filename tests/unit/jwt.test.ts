import jwt from 'jsonwebtoken';

// We'll test the JWT functionality directly since auth.ts exports these
describe('JWT Token Utilities', () => {
  const testSecret = 'test-secret-key-for-testing';
  const userId = 'test-user-id-123';

  describe('JWT Sign and Verify', () => {
    it('should create and verify a token', () => {
      const token = jwt.sign({ userId }, testSecret, { expiresIn: '1h' });

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');

      const decoded = jwt.verify(token, testSecret) as jwt.JwtPayload;
      expect(decoded.userId).toBe(userId);
    });

    it('should reject expired token', () => {
      const token = jwt.sign({ userId }, testSecret, { expiresIn: '0s' });

      expect(() => {
        jwt.verify(token, testSecret);
      }).toThrow();
    });

    it('should reject token with wrong secret', () => {
      const token = jwt.sign({ userId }, testSecret, { expiresIn: '1h' });

      expect(() => {
        jwt.verify(token, 'wrong-secret');
      }).toThrow();
    });
  });

  describe('Token Payload', () => {
    it('should contain userId in payload', () => {
      const token = jwt.sign({ userId }, testSecret, { expiresIn: '1h' });
      const decoded = jwt.verify(token, testSecret) as jwt.JwtPayload;

      expect(decoded.userId).toBe(userId);
    });

    it('should have iat and exp claims', () => {
      const token = jwt.sign({ userId }, testSecret, { expiresIn: '1h' });
      const decoded = jwt.verify(token, testSecret) as jwt.JwtPayload;

      expect(decoded.iat).toBeDefined();
      expect(decoded.exp).toBeDefined();
      expect(decoded.exp).toBeGreaterThan(decoded.iat);
    });
  });
});
