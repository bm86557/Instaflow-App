# 🚀 Deployment Checklist - Security Fix Applied

## ✅ What Was Done

### 1. Security Fix Implemented
- ✅ Removed `GEMINI_API_KEY` from frontend bundle
- ✅ Created secure backend API routes (`/api/ai/*`)
- ✅ Updated frontend to call backend APIs
- ✅ Removed API key exposure from `vite.config.ts`

### 2. Files Changed
- ✅ `api/index.ts` - Added AI routes
- ✅ `src/services/aiService.ts` - Updated to use backend API
- ✅ `vite.config.ts` - Removed API key exposure
- ✅ `backend/server/routes/ai.routes.ts` - New secure backend routes

### 3. Pushed to GitHub
- ✅ Committed all changes
- ✅ Pushed to main branch
- ✅ Vercel will auto-deploy

---

## ⚠️ REQUIRED: Vercel Environment Variable

You MUST add this environment variable in Vercel for the AI features to work:

### Add to Vercel Dashboard:

1. Go to: https://vercel.com → Your Project → Settings → Environment Variables

2. Add the following:
   - **Name:** `GEMINI_API_KEY`
   - **Value:** Your Gemini API key from Google AI Studio
   - **Sensitivity:** Mark as "Sensitive" ✅
   - **Environments:** Production, Preview, Development

3. Click "Save"

4. **Redeploy** (deployment should happen automatically, but you can trigger manually if needed)

---

## 🔑 Get a New GEMINI_API_KEY (Recommended)

Since your old API key was exposed in the frontend, it's recommended to rotate it:

### Step 1: Get New Key
1. Go to https://aistudio.google.com/
2. Sign in with your Google account
3. Click "Get API Key"
4. Create a new API key
5. Copy the key

### Step 2: Update in Vercel
1. Go to Vercel → Environment Variables
2. Find `GEMINI_API_KEY`
3. Click Edit → Update value with new key
4. Save
5. Redeploy

### Step 3: Delete Old Key (Optional)
1. Go back to Google AI Studio
2. Find your old API key
3. Delete it to prevent unauthorized use

---

## 🧪 Test After Deployment

Once deployed, test the AI functionality:

### Test 1: Health Check
```bash
curl https://your-app.vercel.app/api/ai/health
```

Expected response:
```json
{
  "success": true,
  "configured": true,
  "model": "gemini-2.0-flash-exp"
}
```

### Test 2: Generate Content
```bash
curl -X POST https://your-app.vercel.app/api/ai/generate \
  -H "Content-Type: application/json" \
  -d '{"prompt":"Say hello in a friendly way"}'
```

Expected response:
```json
{
  "success": true,
  "text": "Hello! 👋 How can I help you today?"
}
```

### Test 3: In Your App
1. Navigate to a feature that uses AI (comment replies, etc.)
2. Try generating a smart reply
3. Check browser console for any errors

---

## 🔍 Verify Security

### Check 1: API Key Not in Frontend
1. Open your deployed app in browser
2. Open DevTools → Sources tab
3. Search for "GEMINI" or your API key
4. ✅ Should NOT find the API key anywhere

### Check 2: Backend Routes Working
1. Check Vercel deployment logs
2. Look for "Firebase Admin initialized"
3. Test `/api/ai/health` endpoint
4. ✅ Should return configured: true

### Check 3: Environment Variable Set
1. Go to Vercel → Settings → Environment Variables
2. Verify `GEMINI_API_KEY` exists
3. ✅ Should be marked as "Sensitive"

---

## 📊 Current Environment Variables in Vercel

Make sure ALL of these are set:

### Frontend (Public):
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
- `VITE_FIREBASE_MEASUREMENT_ID`

### Backend (Sensitive):
- `GEMINI_API_KEY` ⚠️ **ADD THIS NOW**
- `FACEBOOK_APP_ID`
- `FACEBOOK_APP_SECRET`
- `SESSION_SECRET`
- `WEBHOOK_VERIFY_TOKEN`
- `NODE_ENV`
- `SERVICE_ACCOUNT_JSON`

---

## 🐛 Troubleshooting

### AI Features Not Working?

**Problem:** "AI not configured" error
**Solution:** 
1. Check `GEMINI_API_KEY` is set in Vercel
2. Redeploy the app
3. Check deployment logs for errors

**Problem:** API returns 500 error
**Solution:**
1. Check Vercel function logs
2. Verify API key is valid
3. Test locally first

**Problem:** "Failed to generate AI content"
**Solution:**
1. Check Google AI Studio quota
2. Verify API key has proper permissions
3. Check network connectivity

### Still Showing Blank Screen?

The blank screen issue is separate from the AI fix. That's caused by:
1. Missing Firebase environment variables
2. Firebase not initializing
3. API routes not responding

Check the earlier fixes we made for `vercel.json` and environment variables.

---

## 📝 Summary

### What Changed:
- 🔒 GEMINI_API_KEY is now secure on backend
- ✅ AI features work through `/api/ai/*` endpoints
- ✅ Frontend never sees the API key
- ✅ Code is committed and pushed

### What You Need To Do:
1. ⚠️ **IMPORTANT:** Add `GEMINI_API_KEY` to Vercel environment variables
2. 🔄 (Optional) Rotate your API key for extra security
3. ✅ Monitor deployment and test AI features

### Next Deployment:
Vercel should automatically deploy when you pushed to GitHub. Monitor the deployment at:
https://vercel.com/your-username/instaflow-app/deployments

---

## 🎉 Success Criteria

Your deployment is successful when:
- ✅ Build completes without errors
- ✅ `/api/ai/health` returns configured: true
- ✅ AI features work in the app
- ✅ No API key visible in browser DevTools
- ✅ No 500 errors in function logs

---

**Need help?** Check `SECURITY_FIX_GEMINI.md` for detailed documentation on the new AI implementation.
