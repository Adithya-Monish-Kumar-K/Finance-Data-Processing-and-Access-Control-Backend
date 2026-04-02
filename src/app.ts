import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';

import config from './config';
import { swaggerSpec } from './config/swagger';
import { errorHandler } from './middleware/errorHandler';

// Route imports
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import recordRoutes from './routes/record.routes';
import dashboardRoutes from './routes/dashboard.routes';
import healthRoutes from './routes/health.routes';

/**
 * Express application setup.
 * 
 * Middleware stack (order matters):
 * 1. Security headers (Helmet)
 * 2. CORS
 * 3. Request logging (Morgan)
 * 4. Rate limiting
 * 5. Body parsing
 * 6. API routes
 * 7. API documentation (Swagger UI)
 * 8. 404 handler
 * 9. Global error handler
 */

const app = express();

// ── Security ────────────────────────────────────────────────
app.use(helmet());
app.use(cors());

// ── Logging ─────────────────────────────────────────────────
if (config.nodeEnv !== 'test') {
  app.use(morgan('dev'));
}

// ── Rate Limiting ───────────────────────────────────────────
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  message: {
    success: false,
    message: 'Too many requests. Please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// ── Body Parsing ────────────────────────────────────────────
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));

// ── API Routes ──────────────────────────────────────────────
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/records', recordRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);
app.use('/api/v1/health', healthRoutes);

// ── API Documentation ───────────────────────────────────────
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Finance Dashboard API Docs',
}));

// Redirect root to API docs
app.get('/', (_req, res) => {
  res.redirect('/api-docs');
});

// ── 404 Handler ─────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found. Visit /api-docs for available endpoints.',
  });
});

// ── Global Error Handler ────────────────────────────────────
app.use(errorHandler);

export default app;
