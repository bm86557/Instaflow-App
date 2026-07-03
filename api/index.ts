import express from 'express';
import cookieSession from 'cookie-session';
import dotenv from 'dotenv';

// Load env from root and backend local files when available.
dotenv.config({ path: './.env.local' });
dotenv.config({ path: './backend/.env.local' });
dotenv.config();

// Initialize Firebase Admin SDK and other shared backend configuration.
import './config/firebase';

import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import analyticsRoutes from './routes/analytics.routes';
import automationRoutes from './routes/automation.routes';
import webhookRoutes from './routes/webhook.routes';
import aiRoutes from './routes/ai.routes';

const app = express();
app.set('trust proxy', true);

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

// Mount all routes under /api prefix
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/instagram', analyticsRoutes);
app.use('/api/automation', automationRoutes);
app.use('/api/webhooks', webhookRoutes);
app.use('/api/ai', aiRoutes);

// Also mount auth routes at /auth for callback compatibility
app.use('/auth', authRoutes);

// Export the Express app as the Vercel serverless handler.
// This handles ALL routes through a single serverless function
export default app;
