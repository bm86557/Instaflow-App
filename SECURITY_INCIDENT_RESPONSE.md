# 🚨 Security Incident Response - API Keys Exposed

**Date:** July 3, 2026
**Severity:** HIGH
**Status:** IN PROGRESS

---

## 🔴 What Was Exposed:

### 1. OpenAI API Key (CRITICAL)
- **Key Pattern:** `sk-proj-...`
- **Location:** `.env.local` file
- **Commit History:** YES (exposed in git)
- **Severity:** 🔴 **CRITICAL**
- **Action Required:** IMMEDIATE REVOCATION

### 2. Firebase API Key (Low Risk)
- **Key:** `AIzaSyDHHgU847UdvxnHyNHEv7vHLg81w-C8Pbw`
- **Location:** `.env` and `.env.local`
- **Severity:** 🟡 **LOW** (public by design)
- **Action Required:** Optional rotation

---

## ✅ IMMEDIATE ACTIONS (DO NOW!):

### Step 1: Revoke OpenAI API Key ⚠️
1. Go to: https://platform.openai.com/api-keys
2. Sign in to your OpenAI account
3. Find the key: `sk-proj-bSHRD...` (starts with sk-proj)
4. Click **"Revoke"** button
5. Confirm revocation

### Step 2: Create New OpenAI API Key
1. On same page, click **"Create new secret key"**
2. Give it a name: "InstaFlow Production"
3. Set permissions (if available)
4. **COPY THE KEY IMMEDIATELY** (you won't see it again!)
5. Store it securely

### Step 3: Update Vercel Environment Variables
1. Go to: Vercel Dashboard → Settings → Environment Variables
2. Find or Add: `OPENAI_API_KEY`
3. Paste your **NEW** key
4. Mark as **"Sensitive"** ✅
5. Apply to: Production, Preview, Development
6. Click **Save**
7. **Redeploy** your app

### Step 4: Update Local .env Files
1. Open `.env.local` (NOT committed to git)
2. Replace old OpenAI key with new one:
   ```
   OPENAI_API_KEY=your-new-key-here
   ```
3. Save the file
4. **DO NOT COMMIT THIS FILE**

### Step 5: Verify .gitignore
Make sure these files are ignored:
```
.env
.env.local
.env.*.local
*.env
serviceAccountKey.json
```

---

## 🔧 Clean Up Git History (Advanced):

### Option A: Remove Sensitive Files from History (Recommended)

**Using BFG Repo-Cleaner:**

1. Download BFG: https://rtyley.github.io/bfg-repo-cleaner/
2. Run:
   ```bash
   java -jar bfg.jar --delete-files .env.local
   java -jar bfg.jar --replace-text passwords.txt
   git reflog expire --expire=now --all
   git gc --prune=now --aggressive
   git push --force
   ```

3. Create `passwords.txt` with your exposed keys:
   ```
   sk-proj-bSHRDpSfZ3teZpfean5s47IX51HkXsBQCnO6SjUAUne5B4NSRCFSCzvdWxGq4_oS8-a6pX42Bq
   ```

### Option B: Use git-filter-repo (Easier)

1. Install: `pip install git-filter-repo`
2. Run:
   ```bash
   git filter-repo --invert-paths --path .env.local --path .env --force
   git push --force --all
   ```

### Option C: Nuclear Option - New Repo (Safest)

1. Create a brand new GitHub repository
2. Copy ONLY your source code (exclude .env files)
3. Push to the new repo
4. Update Vercel to use new repo
5. Delete old repo

**⚠️ WARNING:** Force push will rewrite history. Coordinate with team if any.

---

## 📋 Verification Checklist:

After completing above steps:

- [ ] Old OpenAI key revoked on OpenAI platform
- [ ] New OpenAI key created
- [ ] New key added to Vercel (marked sensitive)
- [ ] Local `.env.local` updated with new key
- [ ] Verified `.env*` files in `.gitignore`
- [ ] No `.env` files in current git staging area
- [ ] Git history cleaned (if using Option A or B above)
- [ ] Vercel app redeployed with new key
- [ ] App tested and working with new key
- [ ] Old repo deleted (if using Option C)

---

## 🔒 Prevention Measures:

### 1. Add Pre-commit Hook
Create `.git/hooks/pre-commit`:
```bash
#!/bin/sh
if git diff --cached --name-only | grep -E '\.env'; then
  echo "ERROR: Attempting to commit .env file!"
  exit 1
fi
```

### 2. Use git-secrets
```bash
git clone https://github.com/awslabs/git-secrets.git
cd git-secrets
make install
git secrets --install
git secrets --register-aws
```

### 3. Double Check .gitignore
Ensure `.gitignore` has:
```
# Environment variables
.env
.env.local
.env.*.local
*.env
.env.production

# Secrets
serviceAccountKey.json
*.pem
*.key
*-key.json
```

---

## 📊 Damage Assessment:

### Potential Risks:
1. **OpenAI API Abuse:**
   - Others may have used your API key
   - Check usage at: https://platform.openai.com/usage
   - Look for suspicious activity
   - You may have unexpected charges

2. **Firebase (Low Risk):**
   - Firebase keys are public
   - Protected by security rules
   - No immediate action needed

### Cost Check:
1. **OpenAI Usage:**
   - Go to: https://platform.openai.com/usage
   - Check last 7 days for unusual spikes
   - Check last 30 days for total usage

2. **Set Usage Limits:**
   - Go to: https://platform.openai.com/account/billing/limits
   - Set monthly budget limit
   - Set email alerts

---

## 📝 Post-Incident:

### Document What Happened:
1. When keys were exposed
2. When discovered
3. Actions taken
4. Keys rotated
5. Git history cleaned (or not)

### Update Security Practices:
1. Never commit `.env` files
2. Use `.env.example` for templates
3. Rotate keys regularly (every 90 days)
4. Set up monitoring alerts
5. Use git hooks to prevent commits

---

## 🎯 Current Status:

- [ ] OpenAI Key Revoked
- [ ] New OpenAI Key Created
- [ ] Vercel Updated
- [ ] Local Files Updated
- [ ] Git History Cleaned
- [ ] Incident Resolved

---

**Next Steps:**
1. Complete all items in "IMMEDIATE ACTIONS"
2. Check OpenAI usage dashboard
3. Clean git history (recommended)
4. Update security practices
5. Monitor for 7 days

**Last Updated:** July 3, 2026
**Incident ID:** GH-SECRET-SCAN-20260703
