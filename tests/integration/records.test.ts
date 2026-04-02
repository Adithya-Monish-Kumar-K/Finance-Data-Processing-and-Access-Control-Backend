import request from 'supertest';
import app from '../../src/app';
import prisma from '../../src/config/database';

/**
 * Integration tests for Financial Records API.
 * 
 * Tests CRUD operations and role-based access control.
 */

describe('Records API', () => {
  let adminToken: string;
  let analystToken: string;
  let viewerToken: string;
  let testRecordId: string;

  beforeAll(async () => {
    // Clean DB
    await prisma.refreshToken.deleteMany();
    await prisma.financialRecord.deleteMany();
    await prisma.user.deleteMany();

    // Register users with different roles
    const adminRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'records-admin@test.com',
        password: 'TestPass123',
        firstName: 'Admin',
        lastName: 'Test',
        role: 'ADMIN',
      });
    adminToken = adminRes.body.data.accessToken;

    const analystRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'records-analyst@test.com',
        password: 'TestPass123',
        firstName: 'Analyst',
        lastName: 'Test',
        role: 'ANALYST',
      });
    analystToken = analystRes.body.data.accessToken;

    const viewerRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'records-viewer@test.com',
        password: 'TestPass123',
        firstName: 'Viewer',
        lastName: 'Test',
        role: 'VIEWER',
      });
    viewerToken = viewerRes.body.data.accessToken;
  });

  afterAll(async () => {
    await prisma.refreshToken.deleteMany();
    await prisma.financialRecord.deleteMany();
    await prisma.user.deleteMany();
    await prisma.$disconnect();
  });

  describe('POST /api/v1/records (Create)', () => {
    it('should allow Admin to create a record', async () => {
      const res = await request(app)
        .post('/api/v1/records')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          amount: 5000,
          type: 'INCOME',
          category: 'Salary',
          description: 'Monthly salary',
          date: '2024-01-15',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.amount).toBe(5000);
      expect(res.body.data.type).toBe('INCOME');
      testRecordId = res.body.data.id;
    });

    it('should reject Viewer from creating a record', async () => {
      const res = await request(app)
        .post('/api/v1/records')
        .set('Authorization', `Bearer ${viewerToken}`)
        .send({
          amount: 100,
          type: 'EXPENSE',
          category: 'Food',
          date: '2024-01-15',
        });

      expect(res.status).toBe(403);
    });

    it('should reject Analyst from creating a record', async () => {
      const res = await request(app)
        .post('/api/v1/records')
        .set('Authorization', `Bearer ${analystToken}`)
        .send({
          amount: 100,
          type: 'EXPENSE',
          category: 'Food',
          date: '2024-01-15',
        });

      expect(res.status).toBe(403);
    });

    it('should validate required fields', async () => {
      const res = await request(app)
        .post('/api/v1/records')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ amount: -100 }); // Negative amount + missing fields

      expect(res.status).toBe(400);
      expect(res.body.errors).toBeDefined();
    });
  });

  describe('GET /api/v1/records (List)', () => {
    it('should allow Admin to list records', async () => {
      const res = await request(app)
        .get('/api/v1/records')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toBeInstanceOf(Array);
      expect(res.body.pagination).toBeDefined();
    });

    it('should allow Analyst to list records', async () => {
      const res = await request(app)
        .get('/api/v1/records')
        .set('Authorization', `Bearer ${analystToken}`);

      expect(res.status).toBe(200);
    });

    it('should reject Viewer from listing records', async () => {
      const res = await request(app)
        .get('/api/v1/records')
        .set('Authorization', `Bearer ${viewerToken}`);

      expect(res.status).toBe(403);
    });

    it('should support filtering by type', async () => {
      const res = await request(app)
        .get('/api/v1/records?type=INCOME')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      for (const record of res.body.data) {
        expect(record.type).toBe('INCOME');
      }
    });
  });

  describe('PATCH /api/v1/records/:id (Update)', () => {
    it('should allow Admin to update a record', async () => {
      const res = await request(app)
        .patch(`/api/v1/records/${testRecordId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ amount: 6000 });

      expect(res.status).toBe(200);
      expect(res.body.data.amount).toBe(6000);
    });

    it('should reject Analyst from updating', async () => {
      const res = await request(app)
        .patch(`/api/v1/records/${testRecordId}`)
        .set('Authorization', `Bearer ${analystToken}`)
        .send({ amount: 9999 });

      expect(res.status).toBe(403);
    });
  });

  describe('DELETE /api/v1/records/:id (Soft Delete)', () => {
    it('should allow Admin to delete a record', async () => {
      const res = await request(app)
        .delete(`/api/v1/records/${testRecordId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);

      // Record should no longer appear in list
      const listRes = await request(app)
        .get('/api/v1/records')
        .set('Authorization', `Bearer ${adminToken}`);

      const found = listRes.body.data.find(
        (r: { id: string }) => r.id === testRecordId
      );
      expect(found).toBeUndefined();
    });
  });

  describe('Authentication required', () => {
    it('should reject requests without token', async () => {
      const res = await request(app).get('/api/v1/records');
      expect(res.status).toBe(401);
    });
  });
});
