import type { VercelRequest, VercelResponse } from '@vercel/node';
import express from 'express';
import cookieSession from 'cookie-session';
import dotenv from 'dotenv';

// Load env variables
dotenv.config({ path: './.env.local' });
dotenv.config({ path: './backend/.env.local' });
dotenv.config();

// Initialize Firebase
import './config/firebase';

// Import routes
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import analyticsRoutes from './routes/analytics.routes';
import automationRoutes from './routes/automation.routes';
import webhookRoutes from './routes/webhook.routes';
import aiRoutes from './routes/ai.routes';

// Create Express app
const app = express();
app.set('trust proxy', true);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  cookieSession({
    name: 'instaflow.sid',
    keys: [process.env.SESSION_SECRET || 'instaflow-secret-123'],
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  })
);

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/instagram', analyticsRoutes);
app.use('/api/automation', automationRoutes);
app.use('/api/webhooks', webhookRoutes);
app.use('/api/ai', aiRoutes);

// Also support /auth prefix for OAuth callbacks
app.use('/auth', authRoutes);

// Health check
app.get('/api', (req, res) => {
  res.json({ status: 'ok', message: 'InstaFlow API is running' });
});

// Export as Vercel serverless function handler
export default (req: VercelRequest, res: VercelResponse) => {
  return app(req as any, res as any);
};
