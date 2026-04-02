import { PrismaClient } from '@prisma/client';

/**
 * Singleton Prisma client instance.
 * 
 * Design decision: A single shared instance avoids connection pool
 * exhaustion. In testing, we use a separate test database.
 */
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
});

export default prisma;
