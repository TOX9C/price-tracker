import { userRepository } from '../repositories/user.repository.js';
import { hashPassword, verifyPassword } from '../utils/password.js';
import { generateToken, generateRefreshToken } from '../middleware/auth.js';
import { UnauthorizedError, ValidationError } from '../utils/errors.js';
import { sendWelcomeEmail, isEmailConfigured } from './email.service.js';

export interface RegisterInput {
  email: string;
  password: string;
  name?: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthResult {
  user: {
    id: string;
    email: string;
    name?: string;
    createdAt: Date;
  };
  token: string;
  refreshToken: string;
}

export const authService = {
  async register(input: RegisterInput): Promise<AuthResult> {
    const existingUser = await userRepository.findByEmail(input.email);
    if (existingUser) {
      throw new ValidationError('Email already registered');
    }

    const passwordHash = await hashPassword(input.password);
    const user = await userRepository.create(input.email, passwordHash);

    const token = generateToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    // Send welcome email (async, don't wait)
    if (isEmailConfigured()) {
      sendWelcomeEmail({
        userEmail: user.email,
        userName: input.name,
      }).catch(err => {
        console.error('[Auth] Failed to send welcome email:', err);
      });
    }

    return {
      user: {
        id: user.id,
        email: user.email,
        name: input.name,
        createdAt: user.created_at,
      },
      token,
      refreshToken,
    };
  },

  async login(input: LoginInput): Promise<AuthResult> {
    const user = await userRepository.findByEmail(input.email);
    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const isValid = await verifyPassword(input.password, user.password_hash);
    if (!isValid) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const token = generateToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    return {
      user: {
        id: user.id,
        email: user.email,
        createdAt: user.created_at,
      },
      token,
      refreshToken,
    };
  },

  async refresh(userId: string): Promise<{ token: string; refreshToken: string }> {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new UnauthorizedError('User not found');
    }

    return {
      token: generateToken(user.id),
      refreshToken: generateRefreshToken(user.id),
    };
  },

  async getUserById(userId: string): Promise<{ id: string; email: string; createdAt: Date } | null> {
    const user = await userRepository.findById(userId);
    if (!user) {
      return null;
    }
    return {
      id: user.id,
      email: user.email,
      createdAt: user.created_at,
    };
  },
};
