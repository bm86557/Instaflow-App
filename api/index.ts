import express from 'express';
import cookieSession from 'cookie-session';
import dotenv from 'dotenv';

// Load env from root and backend local files when available.
dotenv.config({ path: './.env.local' });
dotenv.config({ path: './backend/.env.local' });
dotenv.config();

// Initialize Firebase Admin SDK and other shared backend configuration.
import '../backend/server/config/firebase.ts';

import authRoutes from '../backend/server/routes/auth.routes.ts';
import userRoutes from '../backend/server/routes/user.routes.ts';
import analyticsRoutes from '../backend/server/routes/analytics.routes.ts';
import automationRoutes from '../backend/server/routes/automation.routes.ts';
import webhookRoutes from '../backend/server/routes/webhook.routes.ts';

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

const apiBase = process.env.API_BASE_PATH || '/api';
app.use(`${apiBase}/auth`, authRoutes);
app.use(`${apiBase}/user`, userRoutes);
app.use(`${apiBase}/instagram`, analyticsRoutes);
app.use(`${apiBase}/automation`, automationRoutes);
app.use(`${apiBase}/webhooks`, webhookRoutes);

// Export the Express app as the Vercel serverless handler.
export default function handler(req: any, res: any) {
  return app(req, res);
}
