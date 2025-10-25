import { Hono } from 'hono';
import { cors } from 'hono/cors';
import type { Bindings } from './types';
import students from './routes/students';
import grades from './routes/grades';

const app = new Hono<{ Bindings: Bindings }>();

// Enable CORS for frontend
app.use('/*', cors({
  origin: '*', // In production, restrict to your frontend domain
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type'],
}));

// Health check
app.get('/', (c) => {
  return c.json({
    status: 'ok',
    service: 'EduGuard API v2',
    timestamp: new Date().toISOString()
  });
});

// Routes
app.route('/api/students', students);
app.route('/api/grades', grades);

export default app;
