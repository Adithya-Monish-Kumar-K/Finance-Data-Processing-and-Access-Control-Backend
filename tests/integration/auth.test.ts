import request from 'supertest';
import app from '../../src/app';
import prisma from '../../src/config/database';
import bcrypt from 'bcryptjs';

/**
 * Integration tests for the authentication flow.
 * 
 * Tests the complete auth lifecycle: register → login → refresh → logout.
 * Uses the real Express app and database (test DB).
 */

describe('Auth API', () => {
  beforeAll(async () => {
    // Clean the database before tests
    await prisma.refreshToken.deleteMany();
    await prisma.financialRecord.deleteMany();
    await prisma.user.deleteMany();
  });

  afterAll(async () => {
    await prisma.refreshToken.deleteMany();
    await prisma.financialRecord.deleteMany();
    await prisma.user.deleteMany();
    await prisma.$disconnect();
  });

  describe('POST /api/v1/auth/register', () => {
    it('should register a new user and return tokens', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'test@example.com',
          password: 'TestPass123',
          firstName: 'Test',
          lastName: 'User',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe('test@example.com');
      expect(res.body.data.user.role).toBe('VIEWER');
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.refreshToken).toBeDefined();
      // Password should never be in the response
      expect(res.body.data.user.password).toBeUndefined();
    });

    it('should reject duplicate emails', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'test@example.com',
          password: 'TestPass123',
          firstName: 'Test',
          lastName: 'User',
        });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
    });

    it('should validate required fields', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({ email: 'invalid' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.errors).toBeDefined();
    });

    it('should enforce minimum password length', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'short@example.com',
          password: '123',
          firstName: 'Test',
          lastName: 'User',
        });

      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/v1/auth/login', () => {
    it('should login with valid credentials', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'test@example.com',
          password: 'TestPass123',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.refreshToken).toBeDefined();
    });

    it('should reject invalid password', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'test@example.com',
          password: 'WrongPassword',
        });

      expect(res.status).toBe(401);
      expect(res.body.message).toBe('Invalid email or password');
    });

    it('should reject non-existent email', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'TestPass123',
        });

      expect(res.status).toBe(401);
      // Same error message to prevent user enumeration
      expect(res.body.message).toBe('Invalid email or password');
    });
  });

  describe('POST /api/v1/auth/refresh', () => {
    it('should refresh tokens with valid refresh token', async () => {
      // First, login to get a refresh token
      const loginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'test@example.com', password: 'TestPass123' });

      const res = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: loginRes.body.data.refreshToken });

      expect(res.status).toBe(200);
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.refreshToken).toBeDefined();
      // New refresh token should be different (rotation)
      expect(res.body.data.refreshToken).not.toBe(loginRes.body.data.refreshToken);
    });

    it('should reject invalid refresh token', async () => {
      const res = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: 'invalid-token' });

      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/v1/auth/logout', () => {
    it('should logout successfully', async () => {
      const loginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'test@example.com', password: 'TestPass123' });

      const res = await request(app)
        .post('/api/v1/auth/logout')
        .send({ refreshToken: loginRes.body.data.refreshToken });

      expect(res.status).toBe(200);

      // The refresh token should no longer work
      const refreshRes = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: loginRes.body.data.refreshToken });

      expect(refreshRes.status).toBe(401);
    });
  });
});
