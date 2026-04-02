import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../config/database';
import config from '../config';
import { ConflictError, UnauthorizedError, NotFoundError } from '../errors/AppError';
import { RegisterInput, LoginInput } from '../validators/auth.validator';

/**
 * Authentication service.
 * 
 * Handles user registration, login, token refresh, and logout.
 * 
 * Design decisions:
 * - Passwords hashed with bcrypt (12 salt rounds — good balance of security vs. speed)
 * - JWT access tokens (short-lived: 15min) + refresh tokens (long-lived: 7d)
 * - Refresh tokens stored in DB to enable revocation on logout
 * - On login failure, we use a generic message to prevent user enumeration
 */

const SALT_ROUNDS = 12;

export class AuthService {
  /**
   * Register a new user.
   */
  async register(data: RegisterInput) {
    // Check if email already exists
    const existing = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existing) {
      throw new ConflictError('A user with this email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, SALT_ROUNDS);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        firstName: data.firstName,
        lastName: data.lastName,
        role: data.role || 'VIEWER',
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
        createdAt: true,
      },
    });

    // Generate tokens
    const tokens = await this.generateTokens(user.id, user.email, user.role);

    return { user, ...tokens };
  }

  /**
   * Login with email and password.
   */
  async login(data: LoginInput) {
    // Find user — generic error on failure to prevent user enumeration
    const user = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user || user.deletedAt) {
      throw new UnauthorizedError('Invalid email or password');
    }

    if (user.status !== 'ACTIVE') {
      throw new UnauthorizedError('Account is deactivated. Contact an administrator.');
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(data.password, user.password);
    if (!isValidPassword) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // Generate tokens
    const tokens = await this.generateTokens(user.id, user.email, user.role);

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        status: user.status,
      },
      ...tokens,
    };
  }

  /**
   * Refresh access token using a valid refresh token.
   */
  async refreshToken(refreshToken: string) {
    // Find the refresh token in DB
    const storedToken = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    });

    if (!storedToken) {
      throw new UnauthorizedError('Invalid refresh token');
    }

    // Check expiry
    if (new Date() > storedToken.expiresAt) {
      // Clean up expired token
      await prisma.refreshToken.delete({ where: { id: storedToken.id } });
      throw new UnauthorizedError('Refresh token has expired');
    }

    // Check user is still active
    if (storedToken.user.status !== 'ACTIVE' || storedToken.user.deletedAt) {
      throw new UnauthorizedError('User account is no longer active');
    }

    // Delete old refresh token (rotation)
    await prisma.refreshToken.delete({ where: { id: storedToken.id } });

    // Generate new token pair
    const tokens = await this.generateTokens(
      storedToken.user.id,
      storedToken.user.email,
      storedToken.user.role
    );

    return {
      user: {
        id: storedToken.user.id,
        email: storedToken.user.email,
        firstName: storedToken.user.firstName,
        lastName: storedToken.user.lastName,
        role: storedToken.user.role,
      },
      ...tokens,
    };
  }

  /**
   * Logout — revoke the refresh token.
   */
  async logout(refreshToken: string) {
    await prisma.refreshToken.deleteMany({
      where: { token: refreshToken },
    });
  }

  /**
   * Generate JWT access token + refresh token.
   */
  private async generateTokens(userId: string, email: string, role: string) {
    const accessExpiresInSec = this.parseExpiryToSeconds(config.jwt.expiresIn);
    const refreshExpiresInSec = this.parseExpiryToSeconds(config.jwt.refreshExpiresIn);

    const accessToken = jwt.sign(
      { id: userId, email, role, jti: crypto.randomUUID() },
      config.jwt.secret,
      { expiresIn: accessExpiresInSec }
    );

    // Generate a random refresh token and store in DB
    const refreshToken = jwt.sign(
      { id: userId, type: 'refresh', jti: crypto.randomUUID() },
      config.jwt.refreshSecret,
      { expiresIn: refreshExpiresInSec }
    );

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId,
        expiresAt: new Date(Date.now() + refreshExpiresInSec * 1000),
      },
    });

    return { accessToken, refreshToken };
  }

  /**
   * Parse expiry string like "7d", "15m", "1h" to seconds.
   */
  private parseExpiryToSeconds(expiry: string): number {
    const match = expiry.match(/^(\d+)([smhd])$/);
    if (!match) return 7 * 24 * 60 * 60; // Default: 7 days

    const value = parseInt(match[1], 10);
    const unit = match[2];

    switch (unit) {
      case 's': return value;
      case 'm': return value * 60;
      case 'h': return value * 60 * 60;
      case 'd': return value * 24 * 60 * 60;
      default: return 7 * 24 * 60 * 60;
    }
  }
}

export const authService = new AuthService();
