import express from 'express';
import dotenv from 'dotenv';
import path from 'node:path';
import http from 'node:http';
import { fileURLToPath } from 'node:url';
import rateLimit from 'express-rate-limit';
import { initializeDatabase } from './src/db/index.ts';
import { authRouter } from './src/server/auth/auth.controller.ts';
import { usersRouter } from './src/server/users/users.controller.ts';
import { eventsRouter } from './src/server/events/events.controller.ts';
import { alertsRouter } from './src/server/alerts/alerts.controller.ts';
import { incidentsRouter } from './src/server/incidents/incidents.controller.ts';
import { analyticsRouter } from './src/server/analytics/analytics.controller.ts';
import { RealtimeGateway } from './src/server/realtime/gateway.ts';
import { docsRouter } from './src/server/docs/swagger.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function createServer() {
  const app = express();
  const isProduction = process.env.NODE_ENV === 'production';
  const port = Number(process.env.PORT || 3000);

  // Trust proxy if sitting behind Render/Railway load balancers so rate-limiting tracks correct IPs
  app.set('trust proxy', 1);

  // Initialize DB schemas & tables
  try {
    await initializeDatabase();
    console.log('[NetGuard Backend] Database schema initialized successfully.');
  } catch (err) {
    console.error('[NetGuard Backend] Database initialization error:', err);
  }

  // Middleware with size limit protection
  app.use(express.json({ limit: '10kb' }));
  app.use(express.urlencoded({ extended: true, limit: '10kb' }));

  // General API Rate Limiter (100 requests per 15 minutes per IP)
  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests from this IP, please try again later.' },
  });
  app.use('/api/', apiLimiter);

  // Strict Auth Rate Limiter (10 attempts per 15 minutes per IP to prevent brute forcing)
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many login attempts, please try again later.' },
  });
  app.use('/api/auth', authLimiter);

  // API Health Check
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      service: 'NetGuard Security Platform V0',
      timestamp: new Date().toISOString(),
    });
  });

  // Authentication API routes
  app.use('/api/auth', authRouter);

  // User Administration API routes (ADMIN only)
  app.use('/api/users', usersRouter);

  // Security Events & Snort Telemetry API routes
  app.use('/api/events', eventsRouter);

  // Operational Alerts API routes (V1)
  app.use('/api/alerts', alertsRouter);

  // Security Incidents API routes (V1)
  app.use('/api/incidents', incidentsRouter);

  // SOC Analytics & MTTD API routes (V2.1)
  app.use('/api/analytics', analyticsRouter);

  // OpenAPI / Swagger Documentation
  app.use('/api/docs', docsRouter);

  // Vite middleware in development / static serve in production
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  const httpServer = http.createServer(app);
  RealtimeGateway.getInstance().attach(httpServer);

  return { app, httpServer, port };
}

// Start standalone server when executed directly
if (process.env.NODE_ENV !== 'test') {
  createServer().then(({ httpServer, port }) => {
    httpServer.listen(port, '0.0.0.0', () => {
      console.log(`[NetGuard Backend] Listening on http://0.0.0.0:${port} (WebSocket gateway on /ws)`);
    });
  }).catch((err) => {
    console.error('[NetGuard Backend] Startup error:', err);
    process.exit(1);
  });
}