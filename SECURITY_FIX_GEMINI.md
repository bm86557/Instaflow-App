# 🔒 Security Fix: GEMINI_API_KEY Protection

## What Was Fixed

### ❌ BEFORE (Insecure):
- `GEMINI_API_KEY` was exposed in frontend JavaScript bundle
- Anyone could extract the API key from browser DevTools
- Potential for API key theft and unauthorized usage

### ✅ AFTER (Secure):
- `GEMINI_API_KEY` now stays on the backend server only
- Frontend calls secure backend API endpoints
- API key is never exposed to the browser

---

## Changes Made

### 1. Created Backend AI Route
**File:** `backend/server/routes/ai.routes.ts`
- `/api/ai/generate` - Generate AI content
- `/api/ai/chat` - Chat conversations
- `/api/ai/health` - Check AI service status

### 2. Updated API Handler
**File:** `api/index.ts`
- Registered new AI routes
- Routes are protected by backend-only environment variables

### 3. Updated Frontend AI Service
**File:** `src/services/aiService.ts`
- Removed direct API key access
- Updated `generateSmartReply()` to call backend API
- Added `checkAIHealth()` function

### 4. Removed API Key from Vite Config
**File:** `vite.config.ts`
- Removed `define` block that exposed `GEMINI_API_KEY`
- API key no longer bundled into frontend code

---

## How to Use the New AI Service

### In Your Frontend Components:

```typescript
import { generateSmartReply, checkAIHealth } from '@/src/services/aiService';

// Generate a smart reply
const reply = await generateSmartReply(
  "Love this post! 😍",
  "Fashion brand posting about summer collection"
);

// Check if AI is configured
const health = await checkAIHealth();
console.log('AI configured:', health.configured);
```

### Direct API Calls (if needed):

```typescript
// Generate AI content
const response = await fetch('/api/ai/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    prompt: "Write a caption for a sunset photo",
    systemInstruction: "You are an Instagram caption writer",
    temperature: 0.8,
    maxTokens: 150
  })
});

const data = await response.json();
console.log(data.text); // Generated content
```

---

## Vercel Environment Variable

Make sure `GEMINI_API_KEY` is set in Vercel:

1. Go to Vercel Dashboard → Project Settings → Environment Variables
2. Add `GEMINI_API_KEY` (without `VITE_` prefix)
3. Mark it as "Sensitive"
4. Apply to: Production, Preview, Development
5. Redeploy

**Important:** Do NOT add `VITE_GEMINI_API_KEY` - that would expose it again!

---

## API Endpoints

### POST /api/ai/generate
Generate AI content

**Request:**
```json
{
  "prompt": "Your prompt here",
  "systemInstruction": "Optional system instruction",
  "temperature": 0.7,
  "maxTokens": 500
}
```

**Response:**
```json
{
  "success": true,
  "text": "Generated content...",
  "response": { /* Full Gemini response */ }
}
```

### POST /api/ai/chat
Chat conversation

**Request:**
```json
{
  "message": "User message",
  "history": [ /* Previous messages */ ],
  "systemInstruction": "Optional system instruction"
}
```

**Response:**
```json
{
  "success": true,
  "text": "AI response...",
  "response": { /* Full Gemini response */ }
}
```

### GET /api/ai/health
Check AI service status

**Response:**
```json
{
  "success": true,
  "configured": true,
  "model": "gemini-2.0-flash-exp"
}
```

---

## Security Benefits

✅ **API Key Protected**
- Never exposed to browser
- Cannot be extracted from JavaScript bundle
- Only accessible on server

✅ **Rate Limiting Possible**
- Can add rate limiting on backend routes
- Prevent abuse from malicious users
- Monitor and control API usage

✅ **Usage Tracking**
- Can log all AI requests
- Monitor costs and usage patterns
- Add authentication requirements

✅ **Flexible Control**
- Can change models without frontend changes
- Add caching layer if needed
- Implement custom logic before AI calls

---

## Next Steps (Optional)

### Add Authentication
Require users to be logged in:

```typescript
// backend/server/routes/ai.routes.ts
import { requireAuth } from '../middleware/auth';

router.post('/generate', requireAuth, async (req, res) => {
  // Only authenticated users can use AI
});
```

### Add Rate Limiting
Prevent abuse:

```typescript
import rateLimit from 'express-rate-limit';

const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per 15 minutes
});

router.use(aiLimiter);
```

### Add Caching
Save costs by caching responses:

```typescript
const cache = new Map();

router.post('/generate', async (req, res) => {
  const cacheKey = JSON.stringify(req.body);
  
  if (cache.has(cacheKey)) {
    return res.json(cache.get(cacheKey));
  }
  
  const result = await generateAI(...);
  cache.set(cacheKey, result);
  
  res.json(result);
});
```

---

## Testing

### Test Locally:
```bash
# Make sure GEMINI_API_KEY is in your .env
npm run dev

# Test the endpoint
curl -X POST http://localhost:3000/api/ai/generate \
  -H "Content-Type: application/json" \
  -d '{"prompt":"Say hello"}'
```

### Test in Production:
After deploying to Vercel, test the endpoints:
```bash
curl -X POST https://your-app.vercel.app/api/ai/generate \
  -H "Content-Type: application/json" \
  -d '{"prompt":"Say hello"}'
```

---

## Summary

🔒 **Your GEMINI_API_KEY is now secure!**

- ✅ Moved from frontend to backend
- ✅ No longer visible in browser
- ✅ Protected from unauthorized access
- ✅ Ready for production deployment

**After deploying, you should rotate your GEMINI_API_KEY** since the old one was exposed. Get a new key from Google AI Studio and update it in Vercel.
