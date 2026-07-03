# TODO - Fix FB reconnect + Auto-reply

## Step 1: Implement long-lived Facebook token exchange on OAuth callback
- File: `server/routes/auth.routes.ts`
- Exchange short-lived token for long-lived using `fb_exchange_token`
- Store token metadata (e.g., expiry / connectedAt)
- Add logs to verify token exchange + granted permissions check

## Step 2: Persist token metadata in Firestore
- File: `server/services/userService.ts`
- Extend `saveInstagramConnection()` to save expiry metadata

## Step 3: Harden auto-reply rule matching + daily reset handling
- File: `server/services/webhookService.ts`
- Normalize keyword and comment text safely
- Handle `lastResetAt` / `dailyUsage` types robustly (Timestamp|string|undefined)
- Add diagnostics logs for matched rule + rate limiting values
- Ensure replyHistory dedupe uses consistent `instagramCommentId`

## Step 4: Add extra webhook diagnostics (optional but recommended)
- File: `server/routes/webhook.routes.ts`
- Log raw `change.value` shape for comments so we confirm Graph API commentId used

## Step 5: Testing checklist
- Reconnect flow in UI (OAuth popup)
- Confirm Firestore user doc has long-lived token metadata
- Trigger a test comment and confirm:
  - matching rule logs
  - status transitions in `replyHistory` to `sent`
  - no duplicates
