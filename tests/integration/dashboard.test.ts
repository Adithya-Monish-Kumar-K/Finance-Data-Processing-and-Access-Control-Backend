import request from 'supertest';
import app from '../../src/app';
import prisma from '../../src/config/database';

/**
 * Integration tests for Dashboard Summary APIs.
 * 
 * Tests analytics endpoints and graduated role-based access.
 */

describe('Dashboard API', () => {
  let adminToken: string;
  let analystToken: string;
  let viewerToken: string;

  beforeAll(async () => {
    // Clean DB
    await prisma.refreshToken.deleteMany();
    await prisma.financialRecord.deleteMany();
    await prisma.user.deleteMany();

    // Register users
    const adminRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'dash-admin@test.com',
        password: 'TestPass123',
        firstName: 'Admin',
        lastName: 'Test',
        role: 'ADMIN',
      });
    adminToken = adminRes.body.data.accessToken;

    const analystRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'dash-analyst@test.com',
        password: 'TestPass123',
        firstName: 'Analyst',
        lastName: 'Test',
        role: 'ANALYST',
      });
    analystToken = analystRes.body.data.accessToken;

    const viewerRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'dash-viewer@test.com',
        password: 'TestPass123',
        firstName: 'Viewer',
        lastName: 'Test',
        role: 'VIEWER',
      });
    viewerToken = viewerRes.body.data.accessToken;

    // Create some test records
    await request(app)
      .post('/api/v1/records')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ amount: 5000, type: 'INCOME', category: 'Salary', date: '2024-06-01' });

    await request(app)
      .post('/api/v1/records')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ amount: 200, type: 'EXPENSE', category: 'Food', date: '2024-06-15' });

    await request(app)
      .post('/api/v1/records')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ amount: 150, type: 'EXPENSE', category: 'Transportation', date: '2024-06-20' });
  });

  afterAll(async () => {
    await prisma.refreshToken.deleteMany();
    await prisma.financialRecord.deleteMany();
    await prisma.user.deleteMany();
    await prisma.$disconnect();
  });

  describe('GET /api/v1/dashboard/overview', () => {
    it('should return overview for all roles', async () => {
      // Admin
      let res = await request(app)
        .get('/api/v1/dashboard/overview')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.totalIncome).toBeDefined();
      expect(res.body.data.totalExpenses).toBeDefined();
      expect(res.body.data.netBalance).toBeDefined();

      // Analyst
      res = await request(app)
        .get('/api/v1/dashboard/overview')
        .set('Authorization', `Bearer ${analystToken}`);
      expect(res.status).toBe(200);

      // Viewer
      res = await request(app)
        .get('/api/v1/dashboard/overview')
        .set('Authorization', `Bearer ${viewerToken}`);
      expect(res.status).toBe(200);
    });

    it('should return correct totals', async () => {
      const res = await request(app)
        .get('/api/v1/dashboard/overview')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.body.data.totalIncome).toBe(5000);
      expect(res.body.data.totalExpenses).toBe(350);
      expect(res.body.data.netBalance).toBe(4650);
      expect(res.body.data.totalRecords).toBe(3);
    });
  });

  describe('GET /api/v1/dashboard/category-breakdown', () => {
    it('should allow Admin and Analyst access', async () => {
      const res = await request(app)
        .get('/api/v1/dashboard/category-breakdown')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data).toBeInstanceOf(Array);

      const analystRes = await request(app)
        .get('/api/v1/dashboard/category-breakdown')
        .set('Authorization', `Bearer ${analystToken}`);
      expect(analystRes.status).toBe(200);
    });

    it('should reject Viewer', async () => {
      const res = await request(app)
        .get('/api/v1/dashboard/category-breakdown')
        .set('Authorization', `Bearer ${viewerToken}`);
      expect(res.status).toBe(403);
    });
  });

  describe('GET /api/v1/dashboard/monthly-trends', () => {
    it('should return trend data for Analyst', async () => {
      const res = await request(app)
        .get('/api/v1/dashboard/monthly-trends?months=6')
        .set('Authorization', `Bearer ${analystToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data).toBeInstanceOf(Array);
    });

    it('should reject Viewer', async () => {
      const res = await request(app)
        .get('/api/v1/dashboard/monthly-trends')
        .set('Authorization', `Bearer ${viewerToken}`);
      expect(res.status).toBe(403);
    });
  });

  describe('GET /api/v1/dashboard/recent-activity', () => {
    it('should allow all roles', async () => {
      const res = await request(app)
        .get('/api/v1/dashboard/recent-activity')
        .set('Authorization', `Bearer ${viewerToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data).toBeInstanceOf(Array);
    });
  });

  describe('GET /api/v1/dashboard/top-categories', () => {
    it('should allow Analyst access', async () => {
      const res = await request(app)
        .get('/api/v1/dashboard/top-categories')
        .set('Authorization', `Bearer ${analystToken}`);
      expect(res.status).toBe(200);
    });

    it('should reject Viewer', async () => {
      const res = await request(app)
        .get('/api/v1/dashboard/top-categories')
        .set('Authorization', `Bearer ${viewerToken}`);
      expect(res.status).toBe(403);
    });
  });

  describe('Health check', () => {
    it('should return healthy status', async () => {
      const res = await request(app).get('/api/v1/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
      expect(res.body.database).toBe('connected');
    });
  });
});
