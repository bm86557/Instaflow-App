# Instagram Webhook Testing Guide

## Quick Test Steps

### Step 1: Verify Webhook Subscription in Meta

1. Go to: https://developers.facebook.com/apps/1759156038575585/webhooks/
2. Select **Instagram** from the dropdown (if you see Page, User, etc.)
3. Find the **comments** field
4. Click the **"Test"** button next to it
5. You should see a success message

### Step 2: Check if Test Sends to Vercel

After clicking Test button:
1. Open Vercel logs: https://vercel.com/bilal-maliks-projects-10/instaflow-app/logs
2. You should immediately see:
   ```
   [Webhook] Notification received
   ```

If you DON'T see this, the webhook URL is wrong or not verified!

### Step 3: Verify Callback URL

In Meta Webhooks page, check:
- Callback URL should be: `https://instaflow-app-cyan.vercel.app/api/webhooks/instagram`
- Verify Token should be: `instaflow_webhook_token_123`

### Step 4: Re-verify if Needed

If the callback URL or verify token is wrong:
1. Click "Edit Subscription"
2. Update the URL: `https://instaflow-app-cyan.vercel.app/api/webhooks/instagram`
3. Update Verify Token: `instaflow_webhook_token_123`
4. Save
5. The subscription will re-verify automatically

---

## Common Issues

### Issue 1: Webhook Not Subscribed
**Symptom**: Test button doesn't exist or comments field shows "Unsubscribed"
**Fix**: 
- Click the toggle next to "comments" field to Subscribe
- Click "Verify and save"

### Issue 2: Wrong Callback URL
**Symptom**: Test fails, or verification fails
**Fix**:
- Ensure URL is exactly: `https://instaflow-app-cyan.vercel.app/api/webhooks/instagram`
- No trailing slash!
- Must be HTTPS

### Issue 3: Wrong Verify Token
**Symptom**: Verification fails
**Fix**:
- Check Vercel environment variable: `WEBHOOK_VERIFY_TOKEN`
- Should match Meta: `instaflow_webhook_token_123`
- Redeploy after changing env var

### Issue 4: Instagram Account Not Linked
**Symptom**: Webhooks arrive but no user found
**Check**: 
- In your app, is the Instagram Business account connected?
- Does the automation rule exist in Firestore?

---

## Testing Checklist

- [ ] Webhook subscribed to "comments" field in Meta
- [ ] Callback URL is correct: `https://instaflow-app-cyan.vercel.app/api/webhooks/instagram`
- [ ] Verify token matches in both Meta and Vercel env vars
- [ ] Test button in Meta sends notification (check Vercel logs)
- [ ] Instagram Business account connected in your app
- [ ] Test user (`bilal___malik___`) accepted invitation
- [ ] Automation rule exists and is enabled (trigger: "price")
- [ ] Comment from test user triggers webhook (check Vercel logs)

---

## Debug Commands

### Check if webhook endpoint responds:
```bash
curl "https://instaflow-app-cyan.vercel.app/api/webhooks/instagram?hub.mode=subscribe&hub.verify_token=instaflow_webhook_token_123&hub.challenge=test123"
```

Should return: `test123`

### Send test webhook:
```bash
curl -X POST https://instaflow-app-cyan.vercel.app/api/webhooks/instagram \
  -H "Content-Type: application/json" \
  -d '{
    "object": "instagram",
    "entry": [{
      "id": "TEST_ID",
      "changes": [{
        "field": "comments",
        "value": {
          "id": "test_comment_123",
          "text": "price",
          "from": {
            "id": "test_user",
            "username": "test"
          },
          "media": {
            "id": "test_media"
          }
        }
      }]
    }]
  }'
```

Check Vercel logs - should see webhook processing logs.
