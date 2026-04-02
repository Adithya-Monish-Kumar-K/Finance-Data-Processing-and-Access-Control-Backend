import app from './app';
import config from './config';

/**
 * Server entry point.
 * 
 * Starts the Express server and handles graceful shutdown.
 */

const server = app.listen(config.port, () => {
  console.log(`
╔════════════════════════════════════════════════════╗
║        Finance Dashboard API                       ║
╠════════════════════════════════════════════════════╣
║  Server:    http://localhost:${config.port}                ║
║  API Docs:  http://localhost:${config.port}/api-docs       ║
║  Health:    http://localhost:${config.port}/api/v1/health   ║
║  Mode:      ${config.nodeEnv.padEnd(38)}║
╚════════════════════════════════════════════════════╝
  `);
});

// ── Graceful Shutdown ───────────────────────────────────────
function shutdown(signal: string) {
  console.log(`\n${signal} received. Shutting down gracefully...`);
  server.close(() => {
    console.log('Server closed.');
    process.exit(0);
  });

  // Force exit after 10 seconds
  setTimeout(() => {
    console.error('Forced shutdown after 10s timeout.');
    process.exit(1);
  }, 10000);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

export default server;
