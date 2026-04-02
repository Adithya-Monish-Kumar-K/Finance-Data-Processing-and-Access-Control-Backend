import { Router, Request, Response } from 'express';
import prisma from '../config/database';

/**
 * Health check endpoint.
 * 
 * Used by Docker HEALTHCHECK and deployment platforms to verify
 * the server and database are operational.
 */

const router = Router();

/**
 * @swagger
 * /api/v1/health:
 *   get:
 *     tags: [System]
 *     summary: Health check
 *     description: Returns server status, uptime, and database connectivity.
 *     responses:
 *       200:
 *         description: Server is healthy
 *       503:
 *         description: Server is unhealthy
 */
router.get('/', async (_req: Request, res: Response) => {
  const healthCheck = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    database: 'disconnected',
  };

  try {
    // Verify database connectivity
    await prisma.$queryRaw`SELECT 1`;
    healthCheck.database = 'connected';
    res.status(200).json(healthCheck);
  } catch {
    healthCheck.status = 'degraded';
    healthCheck.database = 'disconnected';
    res.status(503).json(healthCheck);
  }
});

export default router;
