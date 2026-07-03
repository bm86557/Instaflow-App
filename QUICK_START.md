# 🚀 Quick Start Guide

## ⚡ 3 Steps to Get Running

### Step 1: Switch to New Server (30 seconds)

```bash
# Backup old server
mv server.ts server.old.ts

# Use new modular server
mv server.new.ts server.ts

# Start server
npm run dev
```

**✅ Success looks like:**
```
✅ Firebase Admin initialized
🚀 Server running on http://localhost:3000
📡 Webhook endpoint: http://localhost:3000/api/webhooks/instagram
✅ All routes loaded successfully
```

---

### Step 2: Test Locally (2 minutes)

1. **Open your app:** http://localhost:3000
2. **Login** with your account
3. **Go to Auto-Reply** page
4. **Create a test rule:**
   - Keyword: `test`
   - Reply: `Thanks for testing!`
   - Type: Comments Only
   - **Save it**

5. **Check Firestore:**
   - Open Firebase Console
   - Go to Firestore
   - See `automationRules` collection
   - Your rule should be there ✅

---

### Step 3: Enable Auto-Replies (5 minutes)

#### A. Deploy to HTTPS

**Option 1: ngrok (for testing)**
```bash
# Install ngrok (if not installed)
# Download from: https://ngrok.com/download

# Start ngrok
ngrok http 3000

# Copy the HTTPS URL shown
# Example: https://abc123.ngrok-free.app
```

**Option 2: Production Deploy**
- Deploy to Vercel, Heroku, or your hosting
- Get your HTTPS URL

#### B. Configure Facebook Webhook

1. Go to: https://developers.facebook.com/apps
2. Select your app: **InstaFlow AAuToMaTion**
3. Left sidebar → **Webhooks**
4. Under **Instagram**, click **Add Subscription**
5. Fill in:
   - **Callback URL:** `https://your-url.com/api/webhooks/instagram`
   - **Verify Token:** `instaflow_webhook_token_123`
6. Click **Verify and Save**
7. ✅ Check the box: **comments**
8. Click **Subscribe**

---

## 🧪 Test Auto-Reply

1. **Go to your Instagram** (on phone or web)
2. **Find one of your posts**
3. **Comment:** `This is a test`
4. **Wait 5-10 seconds**
5. **Check:** Your automated reply should appear! 🎉

---

## 📊 Monitor Activity

### Check Server Logs
```bash
# You'll see:
[Webhook] Notification received
[AutoReply] Processing comment: 12345
[AutoReply] Matched rule: test
[Instagram API] Sending reply
[AutoReply] ✅ Reply sent successfully
```

### Check Firestore
- `automationRules` → triggerCount increased
- `replyHistory` → New document created
- `users/{uid}/stats/autoReplies` → totalCount increased

---

## 🔧 Troubleshooting

### Server won't start?
```bash
# Check if you have all dependencies
npm install

# Check Node version (should be 18+)
node --version
```

### Webhook verification fails?
- ✅ URL must be **HTTPS** (not HTTP)
- ✅ URL must be **publicly accessible**
- ✅ Token must match: `instaflow_webhook_token_123`

### No auto-replies?
1. Check rule is **enabled** (toggle switch on)
2. Verify webhook is **subscribed** to comments
3. Check **server logs** for errors
4. Test with exact keyword (e.g., "test" not "testing")

### Still not working?
```bash
# Check environment variables
cat .env

# Should have:
# FACEBOOK_APP_ID=...
# FACEBOOK_APP_SECRET=...
# WEBHOOK_VERIFY_TOKEN=instaflow_webhook_token_123
```

---

## 📱 File Structure Reference

```
instaflow-automation/
├── server/
│   ├── config/
│   │   └── firebase.ts          # Firebase setup
│   ├── middleware/
│   │   └── auth.ts              # JWT verification
│   ├── services/
│   │   ├── userService.ts       # User operations
│   │   ├── instagramService.ts  # Instagram API
│   │   ├── automationService.ts # Rule validation
│   │   └── webhookService.ts    # ⭐ AUTO-REPLY ENGINE
│   └── routes/
│       ├── auth.routes.ts       # Login/OAuth
│       ├── user.routes.ts       # Profile
│       ├── analytics.routes.ts  # Stats
│       ├── automation.routes.ts # Rules CRUD
│       └── webhook.routes.ts    # ⭐ Webhook receiver
├── server.ts                    # ✅ NEW modular server
├── server.old.ts                # 📦 Your old server (backup)
└── .env                         # Config
```

---

## 🎯 What Each Service Does

| Service | Purpose |
|---------|---------|
| `userService.ts` | Get/save user data from Firestore |
| `instagramService.ts` | Send replies to Instagram |
| `automationService.ts` | Validate rules, check ownership |
| `webhookService.ts` | **Process comments & send auto-replies** |

---

## 🔥 Important URLs

| What | URL |
|------|-----|
| **Your app** | http://localhost:3000 |
| **Webhook endpoint** | /api/webhooks/instagram |
| **Test webhook** | /api/webhooks/instagram?hub.mode=subscribe&hub.verify_token=instaflow_webhook_token_123&hub.challenge=test |
| **Meta Developer** | https://developers.facebook.com/apps |
| **Firebase Console** | https://console.firebase.google.com |

---

## ✅ Quick Verification Checklist

- [ ] Old server backed up
- [ ] New server running
- [ ] Can login to app
- [ ] Can create automation rule
- [ ] Rule appears in Firestore
- [ ] Deployed to HTTPS
- [ ] Webhook configured in Facebook
- [ ] Subscribed to "comments"
- [ ] Tested with real Instagram comment
- [ ] Reply appeared on Instagram

---

## 🎉 You're Done!

Once you see your first auto-reply on Instagram, **you're fully operational!**

### What happens now:
1. Someone comments with your keyword → Instagram sends webhook
2. Your server receives notification → Checks for matching rules
3. Finds match → Sends reply via Instagram API
4. Logs everything → Updates statistics

**All automatically, 24/7!** 🚀

---

## 📚 Full Documentation

- `MIGRATION_GUIDE.md` - Detailed migration steps
- `IMPLEMENTATION_COMPLETE.md` - Full feature list & technical details

---

**Need help? Check the troubleshooting section above or review the detailed guides!**
