import type { VercelRequest, VercelResponse } from '@vercel/node';
import express from 'express';
import cookieSession from 'cookie-session';
import dotenv from 'dotenv';
import axios from 'axios';
import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import fs from 'fs';
import path from 'path';

// Load env variables
dotenv.config({ path: './.env.local' });
dotenv.config({ path: './backend/.env.local' });
dotenv.config();

// ============================================================================
// FIREBASE INITIALIZATION (inlined from config/firebase.ts)
// ============================================================================

function loadServiceAccount(): admin.ServiceAccount | null {
  // 1) JSON directly from env (useful for secret JSON values)
  if (process.env.SERVICE_ACCOUNT_JSON) {
    try {
      return JSON.parse(process.env.SERVICE_ACCOUNT_JSON) as admin.ServiceAccount;
    } catch (err) {
      console.error('Failed to parse SERVICE_ACCOUNT_JSON:', err);
    }
  }

  // 2) Path to file provided via env (Render secret file path)
  if (process.env.SERVICE_ACCOUNT_PATH) {
    try {
      const p = path.isAbsolute(process.env.SERVICE_ACCOUNT_PATH)
        ? process.env.SERVICE_ACCOUNT_PATH
        : path.join(process.cwd(), process.env.SERVICE_ACCOUNT_PATH);
      const raw = fs.readFileSync(p, 'utf8');
      return JSON.parse(raw) as admin.ServiceAccount;
    } catch (err) {
      console.error('Failed to read SERVICE_ACCOUNT_PATH file:', err);
    }
  }

  // 3) Local fallback for dev convenience: project root serviceAccountKey.json
  try {
    const localPath = path.join(process.cwd(), 'serviceAccountKey.json');
    if (fs.existsSync(localPath)) {
      const raw = fs.readFileSync(localPath, 'utf8');
      return JSON.parse(raw) as admin.ServiceAccount;
    }
  } catch (err) {
    console.error('Failed to load local serviceAccountKey.json:', err);
  }

  return null;
}

const serviceAccount = loadServiceAccount();
if (!serviceAccount) {
  throw new Error(
    'Firebase service account not found. Set SERVICE_ACCOUNT_JSON or SERVICE_ACCOUNT_PATH, or place serviceAccountKey.json in project root for local development.'
  );
}

// Initialize Firebase Admin SDK (only if not already initialized)
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
  });
  console.log('✅ Firebase Admin initialized');
}

// Initialize Firestore
const db = getFirestore();

// ============================================================================
// AUTH MIDDLEWARE (inlined from middleware/auth.ts)
// ============================================================================

const verifyFirebaseToken = async (req: any, res: any, next: any) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.error('[Auth] No token provided');
    return res.status(401).json({ error: 'No token provided' });
  }

  const idToken = authHeader.split('Bearer ')[1];

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    req.firebaseUid = decodedToken.uid;
    req.userEmail = decodedToken.email;
    
    console.log('[Auth] Token verified for:', decodedToken.uid);
    next();
  } catch (error: any) {
    console.error('[Auth] Token verification failed:', error.message);
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// ============================================================================
// SERVICE FUNCTIONS (inlined from services/)
// ============================================================================

// userService.ts functions
async function getUserData(firebaseUid: string) {
  try {
    const userDoc = await db.collection('users').doc(firebaseUid).get();
    if (!userDoc.exists) {
      return null;
    }
    return userDoc.data();
  } catch (error) {
    console.error('[Firestore] Error getting user:', error);
    return null;
  }
}

async function saveUserData(firebaseUid: string, data: any) {
  try {
    await db.collection('users').doc(firebaseUid).set(data, { merge: true });
    console.log('[Firestore] User data saved:', firebaseUid);
    return true;
  } catch (error) {
    console.error('[Firestore] Error saving user:', error);
    return false;
  }
}

async function saveInstagramConnection(
  firebaseUid: string,
  accessToken: string,
  instagramUserId: string,
  tokenMeta?: {
    tokenExpiresAt?: Date | null;
    tokenExpiresInSeconds?: number | null;
    tokenType?: string | null;
  },
  instagramProfile?: {
    username?: string | null;
    profilePictureUrl?: string | null;
  }
) {
  try {
    const userData: any = {
      instagramAccessToken: accessToken,
      instagramUserId: instagramUserId,
      connectedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    if (instagramProfile) {
      if (typeof instagramProfile.username === 'string') {
        userData.instagramUsername = instagramProfile.username;
      }
      if (typeof instagramProfile.profilePictureUrl === 'string') {
        userData.instagramProfilePictureUrl = instagramProfile.profilePictureUrl;
      }
    }

    if (tokenMeta) {
      if (typeof tokenMeta.tokenExpiresInSeconds === 'number') {
        userData.tokenExpiresInSeconds = tokenMeta.tokenExpiresInSeconds;
      }
      if (tokenMeta.tokenType) {
        userData.instagramTokenType = tokenMeta.tokenType;
      }
      if (tokenMeta.tokenExpiresAt) {
        userData.tokenExpiresAt = admin.firestore.Timestamp.fromDate(tokenMeta.tokenExpiresAt);
      }
    }

    await db.collection('users').doc(firebaseUid).set(userData, { merge: true });
    console.log('[Firestore] Instagram connection saved:', firebaseUid);
    return true;
  } catch (error) {
    console.error('[Firestore] Error saving Instagram connection:', error);
    return false;
  }
}

// automationService.ts functions
function validateRuleData(data: any) {
  const errors: string[] = [];

  if (!data.keyword || typeof data.keyword !== 'string' || data.keyword.trim() === '') {
    errors.push('Keyword is required');
  }

  if (!data.replyMessage || typeof data.replyMessage !== 'string' || data.replyMessage.trim() === '') {
    errors.push('Reply message is required');
  }

  if (!data.type || !['COMMENT', 'MESSAGE', 'ALL'].includes(data.type)) {
    errors.push('Invalid type. Must be COMMENT, MESSAGE, or ALL');
  }

  return { valid: errors.length === 0, errors };
}

async function verifyRuleOwnership(ruleId: string, userId: string) {
  try {
    const ruleDoc = await db.collection('automationRules').doc(ruleId).get();
    
    if (!ruleDoc.exists) {
      return { valid: false, error: 'Rule not found' };
    }

    const ruleData = ruleDoc.data();
    
    if (ruleData?.userId !== userId) {
      return { valid: false, error: 'Unauthorized' };
    }

    return { valid: true, doc: ruleDoc };
  } catch (error: any) {
    return { valid: false, error: error.message };
  }
}

// instagramService.ts functions
async function sendReplyToComment(
  commentId: string,
  replyMessage: string,
  accessToken: string
) {
  try {
    console.log('[Instagram API] Sending reply to comment:', commentId);

    const response = await axios.post(
      `https://graph.facebook.com/v19.0/${commentId}/replies`,
      {
        message: replyMessage
      },
      {
        params: {
          access_token: accessToken
        }
      }
    );

    console.log('[Instagram API] Reply sent successfully:', response.data);

    return {
      success: true,
      replyId: response.data.id
    };
  } catch (error: any) {
    console.error('[Instagram API] Error sending reply:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.error?.message || error.message
    };
  }
}

// webhookService.ts function (processComment)
async function processComment(instagramUserId: string, commentData: any) {
  try {
    const commentId = commentData.id;
    const commentText = commentData.text || '';
    const commenterId = commentData.from?.id;
    const commenterUsername = commentData.from?.username;
    const mediaId = commentData.media?.id;

    console.log('[AutoReply] Processing comment:', commentId);
    console.log('[AutoReply] Comment text:', commentText);
    console.log('[AutoReply] From:', commenterUsername);

    const userSnapshot = await db.collection('users')
      .where('instagramUserId', '==', instagramUserId)
      .limit(1)
      .get();

    if (userSnapshot.empty) {
      console.log('[AutoReply] No user found for Instagram ID:', instagramUserId);
      return;
    }

    const userDoc = userSnapshot.docs[0];
    const userId = userDoc.id;
    const userData = userDoc.data();
    const accessToken = userData.instagramAccessToken;

    console.log('[AutoReply] Found user:', userId);

    if (!accessToken) {
      console.log('[AutoReply] Missing Instagram access token for user:', userId);
      return;
    }

    const existingReply = await db.collection('replyHistory')
      .where('instagramCommentId', '==', commentId)
      .limit(1)
      .get();

    if (!existingReply.empty) {
      console.log('[AutoReply] Already replied to this comment');
      return;
    }

    if (commenterId === instagramUserId) {
      console.log('[AutoReply] Ignoring own comment');
      return;
    }

    const ownerUsersSnapshot = await db.collection('users')
      .where('instagramUserId', '==', instagramUserId)
      .get();

    const candidateUserIds = new Set<string>();
    candidateUserIds.add(userId);
    ownerUsersSnapshot.docs.forEach(ownerDoc => {
      if (ownerDoc.id) {
        candidateUserIds.add(ownerDoc.id);
      }
    });

    const rulesDocs: any[] = [];
    const seenRuleIds = new Set<string>();

    const addRules = (docs: any[]) => {
      docs.forEach(doc => {
        if (!seenRuleIds.has(doc.id)) {
          seenRuleIds.add(doc.id);
          rulesDocs.push(doc);
        }
      });
    };

    for (const candidateUserId of candidateUserIds) {
      const rulesSnapshot = await db.collection('automationRules')
        .where('userId', '==', candidateUserId)
        .where('enabled', '==', true)
        .get();

      addRules(rulesSnapshot.docs);
    }

    if (rulesDocs.length === 0) {
      const fallbackRulesSnapshot = await db.collection('automationRules')
        .where('enabled', '==', true)
        .where('instagramUserId', '==', instagramUserId)
        .get();

      addRules(fallbackRulesSnapshot.docs);
    }

    if (rulesDocs.length === 0) {
      console.log('[AutoReply] No active rules found for Instagram account');
      return;
    }

    console.log('[AutoReply] Found', rulesDocs.length, 'active rules');

    const commentTextLower = (commentText || '').toLowerCase();
    let matchedRule: any = null;

    const rules: any[] = rulesDocs.map(doc => ({ ruleId: doc.id, ...doc.data() }));
    rules.sort((a: any, b: any) => (a.priority || 0) - (b.priority || 0));

    for (const rule of rules) {
      const keywordRaw = typeof rule.keyword === 'string' ? rule.keyword : '';
      const keyword = keywordRaw.toLowerCase().trim();
      if (!keyword) continue;

      if (commentTextLower.includes(keyword)) {
        matchedRule = rule;
        console.log('[AutoReply] Matched rule:', matchedRule.ruleId, '- Keyword:', keyword);
        break;
      }
    }

    if (!matchedRule) {
      console.log('[AutoReply] No matching rule found for comment');
      return;
    }

    const dailyLimit = typeof matchedRule.dailyLimit === 'number' ? matchedRule.dailyLimit : 0;
    const dailyUsage = typeof matchedRule.dailyUsage === 'number' ? matchedRule.dailyUsage : 0;

    const parseToDate = (value: any): Date => {
      try {
        if (!value) return new Date(0);
        if (typeof value === 'string') return new Date(value);
        if (typeof value?.toDate === 'function') return value.toDate();
        if (value instanceof Date) return value;
        return new Date(0);
      } catch {
        return new Date(0);
      }
    };

    if (dailyLimit > 0) {
      const lastReset = parseToDate(matchedRule.lastResetAt);
      const now = new Date();
      const hoursSinceReset = (now.getTime() - lastReset.getTime()) / (1000 * 60 * 60);

      let shouldReset = hoursSinceReset >= 24;
      if (Number.isNaN(hoursSinceReset)) shouldReset = true;

      if (shouldReset) {
        await db.collection('automationRules').doc(matchedRule.ruleId).update({
          dailyUsage: 0,
          lastResetAt: admin.firestore.FieldValue.serverTimestamp()
        });
        matchedRule.dailyUsage = 0;
      }

      const usageToCheck =
        typeof matchedRule.dailyUsage === 'number' ? matchedRule.dailyUsage : dailyUsage;

      if (usageToCheck >= dailyLimit) {
        console.log('[AutoReply] Daily limit reached for rule:', matchedRule.ruleId);

        await db.collection('replyHistory').add({
          userId: userId,
          ruleId: matchedRule.ruleId,
          instagramMediaId: mediaId,
          instagramCommentId: commentId,
          instagramReplyId: null,
          triggerKeyword: matchedRule.keyword,
          originalComment: commentText,
          originalCommenter: commenterUsername,
          originalCommenterId: commenterId,
          replyMessage: matchedRule.replyMessage,
          status: 'rate_limited',
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        });

        return;
      }
    }

    const replyResult = await sendReplyToComment(
      commentId,
      matchedRule.replyMessage,
      accessToken
    );

    if (replyResult.success) {
      await db.collection('automationRules').doc(matchedRule.ruleId).update({
        triggerCount: admin.firestore.FieldValue.increment(1),
        successCount: admin.firestore.FieldValue.increment(1),
        dailyUsage: admin.firestore.FieldValue.increment(1),
        lastTriggeredAt: admin.firestore.FieldValue.serverTimestamp()
      });

      await db.collection('users')
        .doc(userId)
        .collection('stats')
        .doc('autoReplies')
        .set({
          totalCount: admin.firestore.FieldValue.increment(1),
          lastReplyAt: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });

      await db.collection('replyHistory').add({
        userId: userId,
        ruleId: matchedRule.ruleId,
        instagramMediaId: mediaId,
        instagramCommentId: commentId,
        instagramReplyId: replyResult.replyId || null,
        triggerKeyword: matchedRule.keyword,
        originalComment: commentText,
        originalCommenter: commenterUsername,
        originalCommenterId: commenterId,
        replyMessage: matchedRule.replyMessage,
        status: 'sent',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        sentAt: admin.firestore.FieldValue.serverTimestamp()
      });

      console.log('[AutoReply] ✅ Reply sent successfully');
    } else {
      await db.collection('automationRules').doc(matchedRule.ruleId).update({
        triggerCount: admin.firestore.FieldValue.increment(1),
        failureCount: admin.firestore.FieldValue.increment(1)
      });

      await db.collection('replyHistory').add({
        userId: userId,
        ruleId: matchedRule.ruleId,
        instagramMediaId: mediaId,
        instagramCommentId: commentId,
        instagramReplyId: null,
        triggerKeyword: matchedRule.keyword,
        originalComment: commentText,
        originalCommenter: commenterUsername,
        originalCommenterId: commenterId,
        replyMessage: matchedRule.replyMessage,
        status: 'failed',
        errorMessage: replyResult.error,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });

      console.log('[AutoReply] ❌ Failed to send reply');
    }
  } catch (error) {
    console.error('[AutoReply] Error processing comment:', error);
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function resolvePublicAppUrl(req: express.Request): string {
  const forwardedProto = req.get('x-forwarded-proto')?.split(',')[0]?.trim();
  const forwardedHost = req.get('x-forwarded-host')?.split(',')[0]?.trim() || req.get('x-forwarded-server')?.split(',')[0]?.trim();
  const host = req.get('host');

  if (forwardedProto && forwardedHost) {
    return `${forwardedProto}://${forwardedHost}`;
  }

  const configuredAppUrl = process.env.APP_URL?.trim();
  if (configuredAppUrl && configuredAppUrl !== 'http://localhost:3000' && configuredAppUrl !== 'http://127.0.0.1:3000') {
    return configuredAppUrl;
  }

  const protocol = forwardedProto || req.protocol || 'http';
  const resolvedHost = forwardedHost || host || 'localhost:3000';
  return `${protocol}://${resolvedHost}`;
}

function errorPage(code: string, message: string) {
  return `
    <html>
      <body style="font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; background: #0f172a; color: white; padding: 2rem; text-align: center;">
        <script>
          if (window.opener) {
            window.opener.postMessage({ type: 'INSTAGRAM_AUTH_ERROR', code: '${code}', message: \`${message}\` }, '*');
          }
        </script>
        <div style="max-width: 400px; padding: 2rem; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,0,0,0.2); border-radius: 2rem;">
          <h2 style="color: #ef4444;">Connection Failed</h2>
          <p style="opacity: 0.6; font-size: 0.9rem; line-height: 1.6;">${message}</p>
          <button onclick="window.close()" style="margin-top: 1.5rem; background: #ef4444; color: white; border: none; padding: 0.6rem 1.5rem; border-radius: 0.8rem; font-weight: bold; cursor: pointer;">Close Window</button>
        </div>
      </body>
    </html>
  `;
}

// ============================================================================
// EXPRESS APP SETUP WITH ALL ROUTES INLINED
// ============================================================================

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

// ============================================================================
// AUTH ROUTES (inlined from routes/auth.routes.ts)
// ============================================================================

// Get Instagram Auth URL
app.get('/api/auth/instagram/url', verifyFirebaseToken, (req: any, res) => {
  const firebaseUid = req.firebaseUid;
  console.log('[Instagram Auth] Getting auth URL for user:', firebaseUid);

  (req.session as any).firebaseUid = firebaseUid;
  console.log('[Session] Saved firebaseUid to session:', firebaseUid);

  const FACEBOOK_APP_ID = process.env.FACEBOOK_APP_ID;
  const FACEBOOK_APP_SECRET = process.env.FACEBOOK_APP_SECRET;

  const APP_URL = resolvePublicAppUrl(req);
  (req.session as any).appUrl = APP_URL;
  console.log('[Auth URL] Resolved APP_URL:', APP_URL);

  const authBasePath = process.env.AUTH_BASE_PATH || '/auth';
  const REDIRECT_URI = `${APP_URL}${authBasePath}/instagram/callback`;

  if (!FACEBOOK_APP_ID || !FACEBOOK_APP_SECRET) {
    console.error('[Auth URL] Missing Facebook credentials');
    return res.status(500).json({
      error: 'Missing Facebook credentials in environment variables'
    });
  }

  const scope = [
    'pages_show_list',
    'pages_read_engagement',
    'pages_manage_metadata',
    'instagram_basic',
    'instagram_manage_insights',
    'instagram_manage_comments',
    'business_management'
  ].join(',');

  const authUrl = `https://www.facebook.com/v19.0/dialog/oauth?client_id=${FACEBOOK_APP_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=${scope}&response_type=code&auth_type=rerequest`;

  console.log('[Auth URL] Generated OAuth URL');
  res.json({ url: authUrl });
});

// Instagram OAuth Callback
app.get('/api/auth/instagram/callback', async (req, res) => {
  const { code } = req.query;
  const FACEBOOK_APP_ID = process.env.FACEBOOK_APP_ID;
  const FACEBOOK_APP_SECRET = process.env.FACEBOOK_APP_SECRET;

  const APP_URL = (req.session as any).appUrl || resolvePublicAppUrl(req);
  const authBasePath = process.env.AUTH_BASE_PATH || '/auth';
  const REDIRECT_URI = `${APP_URL}${authBasePath}/instagram/callback`;

  if (!code) {
    return res.status(400).send('No code provided');
  }

  try {
    const tokenResponse = await axios.get('https://graph.facebook.com/v19.0/oauth/access_token', {
      params: {
        client_id: FACEBOOK_APP_ID,
        client_secret: FACEBOOK_APP_SECRET,
        redirect_uri: REDIRECT_URI,
        code
      }
    });

    const shortLivedToken = tokenResponse.data.access_token;
    console.log('[OAuth Callback] Got short-lived access token');

    const longLivedResponse = await axios.get('https://graph.facebook.com/v19.0/oauth/access_token', {
      params: {
        client_id: FACEBOOK_APP_ID,
        client_secret: FACEBOOK_APP_SECRET,
        grant_type: 'fb_exchange_token',
        fb_exchange_token: shortLivedToken
      }
    });

    const userAccessToken = longLivedResponse.data.access_token;
    const tokenExpiresInSeconds = longLivedResponse.data.expires_in ?? null;

    console.log('[OAuth Callback] Got long-lived access token. expires_in:', tokenExpiresInSeconds);

    const meResponse = await axios.get('https://graph.facebook.com/v19.0/me/accounts', {
      params: { access_token: userAccessToken, fields: 'instagram_business_account,name,access_token' }
    });

    const pages = meResponse.data.data;

    if (!pages || pages.length === 0) {
      return res.send(errorPage('NO_PAGES', 'No Facebook Pages found. You need a Page to manage Instagram automations.'));
    }

    const connectedAccount = pages.find((p: any) => p.instagram_business_account);

    if (!connectedAccount) {
      return res.send(errorPage('NO_INSTAGRAM_LINK', 'Your Facebook Page is not linked to an Instagram Business account.'));
    }

    const instagramUserId = connectedAccount.instagram_business_account.id;
    const firebaseUid = (req.session as any).firebaseUid;

    if (!firebaseUid) {
      return res.send(errorPage('SESSION_ERROR', 'Session expired. Please try connecting again.'));
    }

    const profileResponse = await axios.get(`https://graph.facebook.com/v19.0/${instagramUserId}`, {
      params: {
        fields: 'username,profile_picture_url',
        access_token: userAccessToken
      }
    });

    const instagramProfile = {
      username: profileResponse.data.username || null,
      profilePictureUrl: profileResponse.data.profile_picture_url || null
    };

    const tokenMeta = {
      tokenExpiresInSeconds,
      tokenType: (longLivedResponse.data?.token_type as string | undefined) ?? null,
      tokenExpiresAt: typeof tokenExpiresInSeconds === 'number'
        ? new Date(Date.now() + tokenExpiresInSeconds * 1000)
        : null
    };

    const saved = await saveInstagramConnection(firebaseUid, userAccessToken, instagramUserId, tokenMeta, instagramProfile);

    if (!saved) {
      return res.send(errorPage('SAVE_ERROR', 'Failed to save Instagram connection.'));
    }

    res.send(`
      <html>
        <body style="font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; background: #0f172a; color: white;">
          <script>
            if (window.opener) {
              window.opener.postMessage({ type: 'INSTAGRAM_AUTH_SUCCESS' }, '*');
              window.close();
            } else {
              window.location.href = '/';
            }
          </script>
          <div style="text-align: center;">
            <h2 style="color: #6366f1;">Authentication Successful!</h2>
            <p style="opacity: 0.6;">This window will close automatically.</p>
          </div>
        </body>
      </html>
    `);
  } catch (error: any) {
    console.error('OAuth Error:', error.response?.data || error.message);
    res.send(errorPage('OAUTH_ERROR', error.response?.data?.error?.message || error.message));
  }
});

// Also support /auth prefix for OAuth callbacks
app.get('/auth/instagram/callback', async (req, res) => {
  return app._router.handle(Object.assign(req, { url: '/api/auth/instagram/callback' + (req.url.includes('?') ? req.url.substring(req.url.indexOf('?')) : '') }), res, () => {});
});

// Logout
app.post('/api/auth/logout', (req: any, res) => {
  req.session = null;
  res.json({ success: true });
});

// ============================================================================
// USER ROUTES (inlined from routes/user.routes.ts)
// ============================================================================

app.get('/api/user/status', verifyFirebaseToken, async (req: any, res) => {
  const firebaseUid = req.firebaseUid;
  const userEmail = req.userEmail;
  
  console.log('[Status] Checking status for Firebase UID:', firebaseUid);
  
  try {
    const userData = await getUserData(firebaseUid);
    
    if (!userData) {
      console.log('[Status] Creating new user document');
      
      await saveUserData(firebaseUid, {
        email: userEmail,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      return res.json({
        connected: false,
        isConnected: false,
        email: userEmail
      });
    }

    let isConnected = false;
    const instagramUserId = userData.instagramUserId || null;
    const instagramAccessToken = userData.instagramAccessToken || null;
    let instagramUsername = userData.instagramUsername || null;
    let instagramProfilePictureUrl = userData.instagramProfilePictureUrl || null;

    if (instagramUserId && instagramAccessToken) {
      try {
        const validationResponse = await axios.get(`https://graph.facebook.com/v19.0/${instagramUserId}`, {
          params: {
            fields: 'id,username,profile_picture_url',
            access_token: instagramAccessToken
          }
        });

        if (validationResponse.data?.id === instagramUserId) {
          isConnected = true;
          instagramUsername = validationResponse.data.username || instagramUsername;
          instagramProfilePictureUrl = validationResponse.data.profile_picture_url || instagramProfilePictureUrl;

          await saveUserData(firebaseUid, {
            instagramUsername,
            instagramProfilePictureUrl,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          });
        }
      } catch (error: any) {
        console.error('[Status] Instagram token validation failed:', error.response?.data || error.message);
        isConnected = false;
      }
    }

    res.json({
      connected: isConnected,
      isConnected: isConnected,
      email: userData.email || userEmail,
      instagramUserId,
      instagramUsername,
      instagramProfilePictureUrl
    });
    
  } catch (error: any) {
    console.error('[Status] Error:', error.message);
    res.status(500).json({ error: 'Failed to get user status' });
  }
});

// ============================================================================
// ANALYTICS ROUTES (inlined from routes/analytics.routes.ts)
// ============================================================================

app.get('/api/instagram/followers', verifyFirebaseToken, async (req: any, res) => {
  const firebaseUid = req.firebaseUid;
  
  try {
    const userData = await getUserData(firebaseUid);
    
    if (!userData || !userData.instagramAccessToken || !userData.instagramUserId) {
      return res.status(400).json({ error: 'Instagram account not connected' });
    }
    
    const { instagramAccessToken, instagramUserId } = userData;
    
    const response = await axios.get(`https://graph.facebook.com/v19.0/${instagramUserId}`, {
      params: {
        fields: 'followers_count',
        access_token: instagramAccessToken
      }
    });
    
    res.json({
      followers: response.data.followers_count,
      instagramUserId: instagramUserId
    });
    
  } catch (error: any) {
    console.error('[Analytics] Error fetching followers:', error.response?.data || error.message);
    res.status(500).json({ 
      error: 'Failed to fetch followers',
      details: error.response?.data?.error?.message || error.message
    });
  }
});

app.get('/api/instagram/engagement', verifyFirebaseToken, async (req: any, res) => {
  const firebaseUid = req.firebaseUid;
  
  try {
    const userData = await getUserData(firebaseUid);
    
    if (!userData || !userData.instagramAccessToken || !userData.instagramUserId) {
      return res.status(400).json({ error: 'Instagram account not connected' });
    }

    const { instagramAccessToken, instagramUserId } = userData;
    
    const profileResponse = await axios.get(`https://graph.facebook.com/v19.0/${instagramUserId}`, {
      params: {
        fields: 'followers_count',
        access_token: instagramAccessToken
      }
    });
    
    const followersCount = profileResponse.data.followers_count;
    
    const mediaResponse = await axios.get(`https://graph.facebook.com/v19.0/${instagramUserId}/media`, {
      params: {
        fields: 'id,like_count,comments_count,timestamp,media_type',
        limit: 25,
        access_token: instagramAccessToken
      }
    });
    
    const posts = mediaResponse.data.data || [];
    
    if (posts.length === 0) {
      return res.json({
        engagementRate: 0,
        totalPosts: 0,
        message: 'No posts found'
      });
    }
    
    let totalEngagements = 0;
    posts.forEach((post: any) => {
      const likes = post.like_count || 0;
      const comments = post.comments_count || 0;
      totalEngagements += (likes + comments);
    });
    
    const engagementRate = followersCount > 0 
      ? (totalEngagements / (posts.length * followersCount)) * 100
      : 0;
    
    res.json({
      engagementRate: parseFloat(engagementRate.toFixed(2)),
      totalEngagements,
      totalPosts: posts.length,
      followersCount
    });
    
  } catch (error: any) {
    console.error('[Analytics] Error fetching engagement:', error.response?.data || error.message);
    res.status(500).json({ 
      error: 'Failed to fetch engagement rate',
      details: error.response?.data?.error?.message || error.message
    });
  }
});

app.get('/api/instagram/reach', verifyFirebaseToken, async (req: any, res) => {
  const firebaseUid = req.firebaseUid;
  
  try {
    const userData = await getUserData(firebaseUid);
    
    if (!userData || !userData.instagramAccessToken || !userData.instagramUserId) {
      return res.status(400).json({ error: 'Instagram account not connected' });
    }

    const { instagramAccessToken, instagramUserId } = userData;
    
    const now = Math.floor(Date.now() / 1000);
    const sevenDaysAgo = now - (7 * 24 * 60 * 60);
    
    const insightsResponse = await axios.get(`https://graph.facebook.com/v19.0/${instagramUserId}/insights`, {
      params: {
        metric: 'reach',
        period: 'day',
        since: sevenDaysAgo,
        until: now,
        access_token: instagramAccessToken
      }
    });
    
    const reachData = insightsResponse.data.data || [];
    
    if (reachData.length === 0 || !reachData[0].values) {
      return res.json({
        weeklyReach: 0,
        dailyReach: [],
        message: 'No reach data available'
      });
    }
    
    const dailyValues = reachData[0].values || [];
    const weeklyReach = dailyValues.reduce((sum: number, day: any) => {
      return sum + (day.value || 0);
    }, 0);
    
    res.json({
      weeklyReach,
      dailyReach: dailyValues,
      period: '7 days'
    });
    
  } catch (error: any) {
    console.error('[Analytics] Error fetching reach:', error.response?.data || error.message);
    
    if (error.response?.data?.error?.code === 100) {
      return res.json({
        weeklyReach: 0,
        message: 'Insights not available for this account type'
      });
    }
    
    res.status(500).json({ 
      error: 'Failed to fetch weekly reach',
      details: error.response?.data?.error?.message || error.message
    });
  }
});

app.get('/api/instagram/auto-replies', verifyFirebaseToken, async (req: any, res) => {
  const firebaseUid = req.firebaseUid;
  
  try {
    const statsDoc = await db.collection('users')
      .doc(firebaseUid)
      .collection('stats')
      .doc('autoReplies')
      .get();

    if (!statsDoc.exists) {
      await db.collection('users')
        .doc(firebaseUid)
        .collection('stats')
        .doc('autoReplies')
        .set({
          totalCount: 0,
          lastReplyAt: null,
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
      
      return res.json({
        autoReplies: 0,
        lastReplyAt: null
      });
    }
    
    const statsData = statsDoc.data();
    
    res.json({
      autoReplies: statsData?.totalCount || 0,
      lastReplyAt: statsData?.lastReplyAt || null
    });
    
  } catch (error: any) {
    console.error('[Analytics] Error fetching auto-replies:', error.message);
    res.status(500).json({ 
      error: 'Failed to fetch auto-replies count',
      details: error.message
    });
  }
});

// ============================================================================
// AUTOMATION ROUTES (inlined from routes/automation.routes.ts)
// ============================================================================

app.post('/api/automation/rules', verifyFirebaseToken, async (req: any, res) => {
  const firebaseUid = req.firebaseUid;
  const { keyword, replyMessage, type, enabled, priority, dailyLimit } = req.body;

  console.log('[Automation] Creating rule for user:', firebaseUid);

  try {
    const validation = validateRuleData({ keyword, replyMessage, type });
    if (!validation.valid) {
      return res.status(400).json({ error: validation.errors.join(', ') });
    }

    const normalizedKeyword = keyword.toLowerCase().trim();

    const existingRules = await db.collection('automationRules')
      .where('userId', '==', firebaseUid)
      .where('keyword', '==', normalizedKeyword)
      .get();

    if (!existingRules.empty) {
      return res.status(400).json({ error: 'A rule with this keyword already exists' });
    }

    const userDoc = await db.collection('users').doc(firebaseUid).get();
    const connectedInstagramUserId = userDoc.exists ? userDoc.data()?.instagramUserId || null : null;

    const ruleData: any = {
      userId: firebaseUid,
      keyword: normalizedKeyword,
      replyMessage: replyMessage.trim(),
      type: type,
      enabled: enabled !== undefined ? enabled : true,
      priority: priority || 1,
      triggerCount: 0,
      successCount: 0,
      failureCount: 0,
      lastTriggeredAt: null,
      dailyLimit: dailyLimit || 0,
      dailyUsage: 0,
      lastResetAt: admin.firestore.FieldValue.serverTimestamp(),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    if (connectedInstagramUserId) {
      ruleData.instagramUserId = connectedInstagramUserId;
    }

    const docRef = await db.collection('automationRules').add(ruleData);
    const newRule = await docRef.get();

    console.log('[Automation] Rule created:', docRef.id);

    res.status(201).json({
      success: true,
      rule: {
        ruleId: docRef.id,
        ...newRule.data()
      }
    });
  } catch (error: any) {
    console.error('[Automation] Error creating rule:', error.message);
    res.status(500).json({ error: 'Failed to create rule', details: error.message });
  }
});

app.get('/api/automation/rules', verifyFirebaseToken, async (req: any, res) => {
  const firebaseUid = req.firebaseUid;

  try {
    const snapshot = await db.collection('automationRules')
      .where('userId', '==', firebaseUid)
      .get();

    const rules = snapshot.docs.map(doc => ({
      ruleId: doc.id,
      ...doc.data()
    }));

    rules.sort((a: any, b: any) => (a.priority || 0) - (b.priority || 0));

    res.json({
      success: true,
      rules: rules,
      total: rules.length
    });
  } catch (error: any) {
    console.error('[Automation] Error fetching rules:', error.message);
    res.status(500).json({ error: 'Failed to fetch rules', details: error.message });
  }
});

app.get('/api/automation/rules/:ruleId', verifyFirebaseToken, async (req: any, res) => {
  const firebaseUid = req.firebaseUid;
  const { ruleId } = req.params;

  try {
    const verification = await verifyRuleOwnership(ruleId, firebaseUid);

    if (!verification.valid) {
      return res.status(verification.error === 'Rule not found' ? 404 : 403)
        .json({ error: verification.error });
    }

    const ruleData = verification.doc!.data();

    res.json({
      success: true,
      rule: {
        ruleId: ruleId,
        ...ruleData
      }
    });
  } catch (error: any) {
    console.error('[Automation] Error fetching rule:', error.message);
    res.status(500).json({ error: 'Failed to fetch rule', details: error.message });
  }
});

app.put('/api/automation/rules/:ruleId', verifyFirebaseToken, async (req: any, res) => {
  const firebaseUid = req.firebaseUid;
  const { ruleId } = req.params;
  const updates = req.body;

  try {
    const verification = await verifyRuleOwnership(ruleId, firebaseUid);

    if (!verification.valid) {
      return res.status(verification.error === 'Rule not found' ? 404 : 403)
        .json({ error: verification.error });
    }

    if (updates.keyword !== undefined || updates.replyMessage !== undefined || updates.type !== undefined) {
      const currentData = verification.doc!.data();
      const dataToValidate = {
        keyword: updates.keyword || currentData?.keyword,
        replyMessage: updates.replyMessage || currentData?.replyMessage,
        type: updates.type || currentData?.type
      };

      const validation = validateRuleData(dataToValidate);
      if (!validation.valid) {
        return res.status(400).json({ error: validation.errors.join(', ') });
      }
    }

    if (updates.keyword) {
      updates.keyword = updates.keyword.toLowerCase().trim();

      const existingRules = await db.collection('automationRules')
        .where('userId', '==', firebaseUid)
        .where('keyword', '==', updates.keyword)
        .get();

      const hasDuplicate = existingRules.docs.some(doc => doc.id !== ruleId);
      
      if (hasDuplicate) {
        return res.status(400).json({ error: 'A rule with this keyword already exists' });
      }
    }

    const updateData = {
      ...updates,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    await verification.doc!.ref.update(updateData);
    const updatedRule = await verification.doc!.ref.get();

    res.json({
      success: true,
      rule: {
        ruleId: ruleId,
        ...updatedRule.data()
      }
    });
  } catch (error: any) {
    console.error('[Automation] Error updating rule:', error.message);
    res.status(500).json({ error: 'Failed to update rule', details: error.message });
  }
});

app.delete('/api/automation/rules/:ruleId', verifyFirebaseToken, async (req: any, res) => {
  const firebaseUid = req.firebaseUid;
  const { ruleId } = req.params;

  try {
    const verification = await verifyRuleOwnership(ruleId, firebaseUid);

    if (!verification.valid) {
      return res.status(verification.error === 'Rule not found' ? 404 : 403)
        .json({ error: verification.error });
    }

    await verification.doc!.ref.delete();

    res.json({
      success: true,
      message: 'Rule deleted successfully'
    });
  } catch (error: any) {
    console.error('[Automation] Error deleting rule:', error.message);
    res.status(500).json({ error: 'Failed to delete rule', details: error.message });
  }
});

app.patch('/api/automation/rules/:ruleId/toggle', verifyFirebaseToken, async (req: any, res) => {
  const firebaseUid = req.firebaseUid;
  const { ruleId } = req.params;

  try {
    const verification = await verifyRuleOwnership(ruleId, firebaseUid);

    if (!verification.valid) {
      return res.status(verification.error === 'Rule not found' ? 404 : 403)
        .json({ error: verification.error });
    }

    const currentData = verification.doc!.data();
    const newEnabledState = !currentData?.enabled;

    await verification.doc!.ref.update({
      enabled: newEnabledState,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    const updatedRule = await verification.doc!.ref.get();

    res.json({
      success: true,
      rule: {
        ruleId: ruleId,
        ...updatedRule.data()
      },
      enabled: newEnabledState
    });
  } catch (error: any) {
    console.error('[Automation] Error toggling rule:', error.message);
    res.status(500).json({ error: 'Failed to toggle rule', details: error.message });
  }
});

// ============================================================================
// WEBHOOK ROUTES (inlined from routes/webhook.routes.ts)
// ============================================================================

app.get('/api/webhooks/instagram', (req, res) => {
  console.log('[Webhook] Verification request received');
  console.log('[Webhook] Full query params:', req.query);
  
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  console.log('[Webhook] Mode:', mode);
  console.log('[Webhook] Token:', token);

  const VERIFY_TOKEN = process.env.WEBHOOK_VERIFY_TOKEN || 'instaflow_webhook_token_123';

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('[Webhook] ✅ Verification successful');
    res.status(200).send(challenge);
  } else {
    console.error('[Webhook] ❌ Verification failed');
    res.status(403).send('Forbidden');
  }
});

app.post('/api/webhooks/instagram', async (req, res) => {
  console.log('[Webhook] Notification received');
  
  res.status(200).send('EVENT_RECEIVED');

  try {
    const body = req.body;

    if (body.object !== 'instagram') {
      console.log('[Webhook] Not an Instagram notification, ignoring');
      return;
    }

    for (const entry of body.entry || []) {
      const instagramUserId = entry.id;
      
      console.log('[Webhook] Processing entry for Instagram user:', instagramUserId);

      for (const change of entry.changes || []) {
        if (change.field === 'comments') {
          const commentData = change.value;
          
          console.log('[Webhook] Comment data:', JSON.stringify(commentData, null, 2));

          processComment(instagramUserId, commentData).catch(err => {
            console.error('[Webhook] Error in processComment:', err);
          });
        }
      }
    }
  } catch (error) {
    console.error('[Webhook] Error processing notification:', error);
  }
});

// ============================================================================
// AI ROUTES (inlined from routes/ai.routes.ts) - PLACEHOLDER
// ============================================================================

app.post('/api/ai/generate', async (req, res) => {
  try {
    return res.status(501).json({
      success: false,
      error: 'AI generation not implemented yet. Install and configure GEMINI_API_KEY to enable.'
    });
  } catch (error: any) {
    console.error('[AI Route] Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate AI content',
    });
  }
});

app.post('/api/ai/chat', async (req, res) => {
  try {
    return res.status(501).json({
      success: false,
      error: 'AI chat not implemented yet. Install and configure GEMINI_API_KEY to enable.'
    });
  } catch (error: any) {
    console.error('[AI Route] Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to process chat message',
    });
  }
});

app.get('/api/ai/health', (req, res) => {
  const isConfigured = !!process.env.GEMINI_API_KEY;
  
  res.json({
    success: true,
    configured: isConfigured,
    model: 'gemini-2.0-flash-exp',
    status: isConfigured ? 'ready' : 'not_configured'
  });
});

// ============================================================================
// HEALTH CHECK & CATCH-ALL
// ============================================================================

app.get('/api', (req, res) => {
  res.json({ status: 'ok', message: 'InstaFlow API is running' });
});

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// ============================================================================
// EXPORT VERCEL SERVERLESS FUNCTION HANDLER
// ============================================================================

export default (req: VercelRequest, res: VercelResponse) => {
  return app(req as any, res as any);
};
