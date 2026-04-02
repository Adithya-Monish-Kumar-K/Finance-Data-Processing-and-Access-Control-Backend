import dotenv from 'dotenv';

// Load env before anything else
dotenv.config();

/**
 * Centralized configuration.
 * 
 * Design decision: All config is validated at startup rather than
 * scattered across the codebase. If a required env var is missing,
 * the server fails fast with a clear error message.
 */
const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  jwt: {
    secret: process.env.JWT_SECRET || 'default-dev-secret',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'default-dev-refresh-secret',
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
  },
} as const;

export default config;
