# Environment Variables Guide

## Adding New Environment Variables

### Step 1: Identify Variable Type

**Frontend Variables** (accessible in React components):
- Must start with `VITE_` prefix
- Example: `VITE_API_URL`, `VITE_FEATURE_FLAG`
- Bundled into client-side code

**Backend Variables** (Node.js/Express server only):
- No prefix needed
- Example: `DATABASE_URL`, `API_SECRET_KEY`
- Never exposed to client

### Step 2: Add to Local Environment Files

#### For Frontend Variables:
Add to `.env`:
```bash
VITE_YOUR_NEW_VARIABLE=your_value_here
```

#### For Backend Variables:
Add to both:
1. `.env`:
```bash
YOUR_BACKEND_VARIABLE=your_value_here
```

2. `backend/.env.local`:
```bash
YOUR_BACKEND_VARIABLE=your_value_here
```

#### For Shared Example:
Update `.env.example`:
```bash
# Description of what this variable does
YOUR_NEW_VARIABLE=example_value
```

### Step 3: Add to Vercel (Production)

1. Go to [Vercel Dashboard](https://vercel.com)
2. Select your project: `instaflow-app`
3. Navigate to: **Settings** → **Environment Variables**
4. Click **Add New**
5. Fill in:
   - **Name**: `VITE_YOUR_NEW_VARIABLE` (or without VITE_ for backend)
   - **Value**: Your actual production value
   - **Environment**: Select Production, Preview, and/or Development
6. Click **Save**
7. **Redeploy** your application for changes to take effect

### Step 4: Use in Your Code

#### Frontend (React/TypeScript):
```typescript
// Access with import.meta.env
const apiUrl = import.meta.env.VITE_YOUR_NEW_VARIABLE;
```

#### Backend (Node.js):
```typescript
// Access with process.env
const dbUrl = process.env.YOUR_BACKEND_VARIABLE;
```

#### Add TypeScript Types (Optional):
Update `src/vite-env.d.ts` or create it:
```typescript
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_YOUR_NEW_VARIABLE: string;
  // ... other VITE_ variables
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
```

### Step 5: Special Case - Define in Vite Config

If you need a non-VITE_ variable in frontend, add to `vite.config.ts`:
```typescript
export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    define: {
      'process.env.YOUR_VARIABLE': JSON.stringify(env.YOUR_VARIABLE),
    },
    // ... rest of config
  };
});
```

## Example: Adding a New API Key

Let's say you want to add `OPENAI_API_KEY`:

### 1. Local Files:
```bash
# .env
OPENAI_API_KEY=sk-your-key-here

# .env.example
OPENAI_API_KEY=your_openai_api_key_here

# backend/.env.local
OPENAI_API_KEY=sk-your-key-here
```

### 2. Vercel:
- Name: `OPENAI_API_KEY`
- Value: `sk-prod-your-real-key`
- Environment: Production, Preview

### 3. Use in Backend:
```typescript
// backend/server/services/aiService.ts
import { Configuration, OpenAIApi } from 'openai';

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
```

## Current Environment Variables

### Frontend (VITE_*)
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
- `VITE_FIREBASE_MEASUREMENT_ID`

### Backend
- `FACEBOOK_APP_ID`
- `FACEBOOK_APP_SECRET`
- `APP_URL`
- `SESSION_SECRET`
- `WEBHOOK_VERIFY_TOKEN`
- `NODE_ENV`

### Special (Exposed via vite.config)
- `GEMINI_API_KEY` (defined in vite config)

## Security Best Practices

1. ✅ **Never commit `.env` files** - Already in `.gitignore`
2. ✅ **Use `.env.example`** - Template without real values
3. ✅ **Rotate secrets regularly** - Especially API keys
4. ✅ **Use different values** - Development vs Production
5. ❌ **Don't expose backend secrets** - Keep without VITE_ prefix
6. ✅ **Verify in Vercel** - Check deployment logs for missing variables

## Troubleshooting

### Variable not updating?
1. Restart Vite dev server (`npm run dev`)
2. Clear Vite cache: `rm -rf node_modules/.vite`
3. Rebuild: `npm run build`

### Variable undefined in Vercel?
1. Check variable name spelling
2. Redeploy after adding variables
3. Check deployment logs for errors

### Frontend can't access variable?
- Ensure it starts with `VITE_`
- Or add to `vite.config.ts` define block
