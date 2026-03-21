import { hashPassword, verifyPassword } from '../../src/utils/password.js';

describe('Password Utilities', () => {
  describe('hashPassword', () => {
    it('should hash a password', async () => {
      const password = 'testpassword123';
      const hash = await hashPassword(password);

      expect(hash).toBeDefined();
      expect(hash).not.toBe(password);
      expect(hash.length).toBeGreaterThan(0);
    });

    it('should produce different hashes for same password (salt)', async () => {
      const password = 'testpassword123';
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);

      expect(hash1).not.toBe(hash2);
    });
  });

  describe('verifyPassword', () => {
    it('should return true for correct password', async () => {
      const password = 'testpassword123';
      const hash = await hashPassword(password);
      const result = await verifyPassword(password, hash);

      expect(result).toBe(true);
    });

    it('should return false for incorrect password', async () => {
      const password = 'testpassword123';
      const hash = await hashPassword(password);
      const result = await verifyPassword('wrongpassword', hash);

      expect(result).toBe(false);
    });

    it('should return false for empty password', async () => {
      const password = 'testpassword123';
      const hash = await hashPassword(password);
      const result = await verifyPassword('', hash);

      expect(result).toBe(false);
    });
  });
});
