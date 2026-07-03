// /**
//  * ⚠️ ============================================
//  * 🚨 BACKUP FILE - DO NOT USE THIS FILE
//  * ⚠️ ============================================
//  * 
//  * This is a backup of the OLD monolithic server.ts
//  * file before refactoring into modular structure.
//  * 
//  * 📅 Backed up: July 2, 2026
//  * 📏 Size: 903 lines (34KB)
//  * 
//  * ✅ NEW STRUCTURE: Use server.ts (87 lines) + server/ folder
//  * 
//  * This file is kept for reference only.
//  * All functionality has been migrated to:
//  * 
//  * - server.ts              → Main entry point (87 lines)
//  * - server/config/         → Firebase config
//  * - server/middleware/     → Authentication
//  * - server/services/       → Business logic
//  * - server/routes/         → API endpoints
//  * 
//  * ⚠️ DO NOT MODIFY OR USE THIS FILE
//  * ============================================
//  */

// import express from 'express';
// import { createServer as createViteServer } from 'vite';
// import path from 'path';
// import { fileURLToPath } from 'url';
// import axios from 'axios';
// import session from 'express-session';
// import dotenv from 'dotenv';
// import admin from 'firebase-admin';
// import { getFirestore } from 'firebase-admin/firestore';

// // Load environment variables FIRST
// // Try .env.local first, then fall back to .env
// dotenv.config({ path: '.env.local' });
// dotenv.config(); // Fallback to .env if .env.local doesn't have all vars

// // Debug: Verify environment variables are loaded
// console.log('\n🔍 Environment Variables Check:');
// console.log('FACEBOOK_APP_ID:', process.env.FACEBOOK_APP_ID ? '✅ Loaded' : '❌ Missing');
// console.log('FACEBOOK_APP_SECRET:', process.env.FACEBOOK_APP_SECRET ? '✅ Loaded' : '❌ Missing');
// console.log('APP_URL:', process.env.APP_URL || '⚠️  Not set (will auto-detect)');
// console.log('SESSION_SECRET:', process.env.SESSION_SECRET ? '✅ Loaded' : '❌ Missing');
// console.log('NODE_ENV:', process.env.NODE_ENV || 'development');
// console.log('');

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// // Initialize Firebase Admin SDK
// import serviceAccount from './serviceAccountKey.json' assert { type: 'json' };

// admin.initializeApp({
//   credential: admin.credential.cert(serviceAccount as admin.ServiceAccount)
// });

// // Initialize Firestore
// const db = getFirestore();

// console.log('✅ Firebase Admin initialized');


// async function startServer() {
//   const app = express();
//   const PORT = 3000;

//   app.set('trust proxy', true);

//   // Middleware for parsing
//   app.use(express.json());
  
//   // NOTE: In modern express-session, cookie-parser is not needed unless you have other cookies.
//   // Using it before session() sometimes causes issues with signed cookies if secrets don't match.
  
// app.use(session({
//   name: 'instaflow.sid',
//   secret: process.env.SESSION_SECRET || 'instaflow-secret-123',
//   resave: true,
//   saveUninitialized: true,
//   rolling: true,
//   proxy: true,
//   cookie: { 
//     secure: process.env.NODE_ENV === 'production', // ✅ Only secure in production
//     sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', // ✅ Lax for localhost
//     httpOnly: true,
//     maxAge: 7 * 24 * 60 * 60 * 1000
//   }
// }));

//   // Debug session helper
//   app.get('/api/debug/session', (req, res) => {
//     res.json({
//       sessionID: req.sessionID,
//       firebaseUid: (req.session as any).firebaseUid,
//       cookies: req.headers.cookie,
//       env: process.env.NODE_ENV
//     });
//   });

//   // Firestore Helper Functions
  
//   /**
//    * Get user data from Firestore
//    */
//   async function getUserData(firebaseUid: string) {
//     try {
//       const userDoc = await db.collection('users').doc(firebaseUid).get();
      
//       if (!userDoc.exists) {
//         return null;
//       }
      
//       return userDoc.data();
//     } catch (error) {
//       console.error('[Firestore] Error getting user:', error);
//       return null;
//     }
//   }

//   /**
//    * Create or update user in Firestore
//    */
//   async function saveUserData(firebaseUid: string, data: any) {
//     try {
//       await db.collection('users').doc(firebaseUid).set(data, { merge: true });
//       console.log('[Firestore] User data saved:', firebaseUid);
//       return true;
//     } catch (error) {
//       console.error('[Firestore] Error saving user:', error);
//       return false;
//     }
//   }

//   /**
//    * Save Instagram connection data
//    */
//   async function saveInstagramConnection(
//     firebaseUid: string, 
//     accessToken: string, 
//     instagramUserId: string
//   ) {
//     try {
//       const userData = {
//         instagramAccessToken: accessToken,
//         instagramUserId: instagramUserId,
//         connectedAt: admin.firestore.FieldValue.serverTimestamp(),
//         updatedAt: admin.firestore.FieldValue.serverTimestamp()
//       };
      
//       await db.collection('users').doc(firebaseUid).set(userData, { merge: true });
//       console.log('[Firestore] Instagram connection saved:', firebaseUid);
//       return true;
//     } catch (error) {
//       console.error('[Firestore] Error saving Instagram connection:', error);
//       return false;
//     }
//   }

//   /**
//    * Middleware to verify Firebase ID token
//    */
//   const verifyFirebaseToken = async (req: any, res: any, next: any) => {
//     const authHeader = req.headers.authorization;
    
//     if (!authHeader || !authHeader.startsWith('Bearer ')) {
//       console.error('[Auth] No token provided');
//       return res.status(401).json({ error: 'No token provided' });
//     }

//     const idToken = authHeader.split('Bearer ')[1];

//     try {
//       const decodedToken = await admin.auth().verifyIdToken(idToken);
//       req.firebaseUid = decodedToken.uid;
//       req.userEmail = decodedToken.email;
      
//       console.log('[Auth] Token verified for:', decodedToken.uid);
//       next();
//     } catch (error: any) {
//       console.error('[Auth] Token verification failed:', error.message);
//       return res.status(401).json({ error: 'Invalid token' });
//     }
//   };

//   // API Routes (Instagram)
  
//   // 1. Get Auth URL
//   app.get('/api/auth/instagram/url', verifyFirebaseToken, (req: any, res) => {
//     const firebaseUid = req.firebaseUid;
//     console.log('[Instagram Auth] Getting auth URL for user:', firebaseUid);
    
//     // Store Firebase UID in session for callback
//     (req.session as any).firebaseUid = firebaseUid;
//     console.log('[Session] Saved firebaseUid to session:', firebaseUid);

//     const FACEBOOK_APP_ID = process.env.FACEBOOK_APP_ID;
//     const FACEBOOK_APP_SECRET = process.env.FACEBOOK_APP_SECRET;
    
//     // Attempt to detect APP_URL if not set
//     let APP_URL = process.env.APP_URL;
//     if (!APP_URL) {
//       const protocol = req.get('X-Forwarded-Proto') || req.protocol;
//       const host = req.get('Host');
//       APP_URL = `${protocol}://${host}`;
//       console.log('[Auth URL] Detected APP_URL:', APP_URL);
//     }
    
//     const REDIRECT_URI = `${APP_URL}/auth/instagram/callback`;

//     if (!FACEBOOK_APP_ID || !FACEBOOK_APP_SECRET) {
//       console.error('[Auth URL] Missing Facebook credentials:', {
//         hasAppId: !!FACEBOOK_APP_ID,
//         hasAppSecret: !!FACEBOOK_APP_SECRET
//       });
//       return res.status(500).json({ 
//         error: 'You need to add your FACEBOOK_APP_ID and FACEBOOK_APP_SECRET to the environment variables'
//       });
//     }

//    const scope = [
//   'pages_show_list',
//   'pages_read_engagement',
//   'pages_manage_metadata',
//   'instagram_basic',
//   'instagram_manage_insights',
//   'instagram_manage_comments',        // ← ADD THIS - Required to reply
//   'business_management'
// ].join(',');


//     const authUrl = `https://www.facebook.com/v19.0/dialog/oauth?client_id=${FACEBOOK_APP_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=${scope}&response_type=code&auth_type=rerequest`;
    
//     console.log('[Auth URL] Generated OAuth URL with scopes:', scope);
//     res.json({ url: authUrl });
//   });

//   // 2. OAuth Callback
//   app.get(['/auth/instagram/callback', '/auth/instagram/callback/'], async (req, res) => {
//     const { code } = req.query;
//     const FACEBOOK_APP_ID = process.env.FACEBOOK_APP_ID;
//     const FACEBOOK_APP_SECRET = process.env.FACEBOOK_APP_SECRET;

//     // Attempt to detect APP_URL if not set
//     let APP_URL = process.env.APP_URL;
//     if (!APP_URL) {
//       const protocol = req.get('X-Forwarded-Proto') || req.protocol;
//       const host = req.get('Host');
//       APP_URL = `${protocol}://${host}`;
//       console.log('[Auth Callback] Detected APP_URL:', APP_URL);
//     }

//     const REDIRECT_URI = `${APP_URL}/auth/instagram/callback`;

//     if (!code) {
//       return res.status(400).send('No code provided');
//     }

//     try {
//       // Exchange code for short-lived access token
//       const tokenResponse = await axios.get('https://graph.facebook.com/v19.0/oauth/access_token', {
//         params: {
//           client_id: FACEBOOK_APP_ID,
//           client_secret: FACEBOOK_APP_SECRET,
//           redirect_uri: REDIRECT_URI,
//           code
//         }
//       });

//       const userAccessToken = tokenResponse.data.access_token;
//       console.log('[OAuth Callback] Got access token');

//       // Check what permissions were granted
//       try {
//         const permissionsCheck = await axios.get('https://graph.facebook.com/v19.0/me/permissions', {
//           params: { access_token: userAccessToken }
//         });
//         console.log('[OAuth Callback] Granted permissions:', JSON.stringify(permissionsCheck.data.data, null, 2));
//       } catch (err: any) {
//         console.error('[OAuth Callback] Could not check permissions:', err.message);
//       }

//       // Diagnostic: Check if they have a page and an IG account
//       const meResponse = await axios.get('https://graph.facebook.com/v19.0/me/accounts', {
//         params: { access_token: userAccessToken, fields: 'instagram_business_account,name,access_token' }
//       });

//       console.log('[OAuth Callback] Facebook API response:', JSON.stringify(meResponse.data, null, 2));

//       const pages = meResponse.data.data;
//       console.log('[OAuth Callback] Number of pages found:', pages?.length || 0);
      
//       if (!pages || pages.length === 0) {
//         console.error('[OAuth Callback] NO_PAGES - Facebook returned no pages');
//         return res.send(errorPage('NO_PAGES', 'We couldn\'t find any Facebook Pages linked to your account. You need a Page to manage Instagram automations.'));
//       }

//       console.log('[OAuth Callback] Pages data:', JSON.stringify(pages, null, 2));

//       const connectedAccount = pages.find((p: any) => p.instagram_business_account);
      
//       if (!connectedAccount) {
//         console.error('[OAuth Callback] NO_INSTAGRAM_LINK - None of the pages have instagram_business_account');
//         return res.send(errorPage('NO_INSTAGRAM_LINK', 'Your Facebook Page is not linked to an Instagram Business account. Please link them in your Page settings.'));
//       }

//       const instagramUserId = connectedAccount.instagram_business_account.id;
//       console.log('[OAuth Callback] Found Instagram account:', instagramUserId);

//       // Save to Firestore
//       const firebaseUid = (req.session as any).firebaseUid;
      
//       if (!firebaseUid) {
//         console.error('[OAuth Callback] No Firebase UID in session');
//         return res.send(errorPage('SESSION_ERROR', 'Session expired. Please try connecting again.'));
//       }

//       console.log('[OAuth Callback] Saving Instagram connection for:', firebaseUid);

//       const saved = await saveInstagramConnection(
//         firebaseUid,
//         userAccessToken,
//         instagramUserId
//       );

//       if (!saved) {
//         return res.send(errorPage('SAVE_ERROR', 'Failed to save Instagram connection. Please try again.'));
//       }

//       console.log('[OAuth Callback] Instagram connected successfully');

//       // Return success HTML to close popup
//       res.send(`
//         <html>
//           <body style="font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; background: #0f172a; color: white;">
//             <script>
//               if (window.opener) {
//                 window.opener.postMessage({ type: 'INSTAGRAM_AUTH_SUCCESS' }, '*');
//                 window.close();
//               } else {
//                 window.location.href = '/';
//               }
//             </script>
//             <div style="text-align: center;">
//               <h2 style="color: #6366f1;">Authentication Successful!</h2>
//               <p style="opacity: 0.6;">This window will close automatically.</p>
//             </div>
//           </body>
//         </html>
//       `);
//     } catch (error: any) {
//       console.error('OAuth Error:', error.response?.data || error.message);
//       const errorMsg = error.response?.data?.error?.message || error.message;
//       res.send(errorPage('OAUTH_ERROR', errorMsg));
//     }
//   });

//   // Helper for error reporting
//   function errorPage(code: string, message: string) {
//     return `
//       <html>
//         <body style="font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; background: #0f172a; color: white; padding: 2rem; text-align: center;">
//           <script>
//             if (window.opener) {
//               window.opener.postMessage({ type: 'INSTAGRAM_AUTH_ERROR', code: '${code}', message: \`${message}\` }, '*');
//             }
//           </script>
//           <div style="max-width: 400px; padding: 2rem; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,0,0,0.2); border-radius: 2rem;">
//             <h2 style="color: #ef4444;">Connection Failed</h2>
//             <p style="opacity: 0.6; font-size: 0.9rem; line-height: 1.6;">${message}</p>
//             <button onclick="window.close()" style="margin-top: 1.5rem; background: #ef4444; color: white; border: none; padding: 0.6rem 1.5rem; border-radius: 0.8rem; font-weight: bold; cursor: pointer;">Close Window</button>
//           </div>
//         </body>
//       </html>
//     `;
//   }

//   // 3. User Status
//   app.get('/api/user/status', verifyFirebaseToken, async (req: any, res) => {
//     const firebaseUid = req.firebaseUid;
//     const userEmail = req.userEmail;
    
//     console.log('[Status] Checking status for Firebase UID:', firebaseUid);
    
//     try {
//       // Get user data from Firestore
//       const userData = await getUserData(firebaseUid);
      
//       if (!userData) {
//         // User exists in Firebase Auth but not in Firestore yet
//         console.log('[Status] Creating new user document');
        
//         await saveUserData(firebaseUid, {
//           email: userEmail,
//           createdAt: admin.firestore.FieldValue.serverTimestamp(),
//           updatedAt: admin.firestore.FieldValue.serverTimestamp()
//         });
        
//         return res.json({
//           isGuest: false,
//           email: userEmail,
//           isConnected: false
//         });
//       }
      
//       // Check if Instagram is connected
//       const isConnected = !!(userData.instagramAccessToken && userData.instagramUserId);
      
//       console.log('[Status] User found, Instagram connected:', isConnected);
      
//       res.json({
//         isGuest: false,
//         email: userData.email || userEmail,
//         isConnected: isConnected,
//         instagramUserId: userData.instagramUserId || null
//       });
      
//     } catch (error: any) {
//       console.error('[Status] Error:', error.message);
//       res.status(500).json({ error: 'Failed to get user status' });
//     }
//   });

//   // 4. Logout
//   app.post('/api/auth/logout', (req, res) => {
//     req.session.destroy(() => {
//       res.json({ success: true });
//     }); 
//   });

//      // Instagram Analytics API Routes
  
//   // 1. Get Followers Count
//   app.get('/api/instagram/followers', verifyFirebaseToken, async (req: any, res) => {
//     const firebaseUid = req.firebaseUid;
    
//     try {
//       console.log('[Analytics] Fetching followers for user:', firebaseUid);
      
//       // Get user data from Firestore
//       const userData = await getUserData(firebaseUid);
      
//       if (!userData || !userData.instagramAccessToken || !userData.instagramUserId) {
//         return res.status(400).json({ error: 'Instagram account not connected' });
//       }
      
//       const { instagramAccessToken, instagramUserId } = userData;
      
//       // Call Instagram Graph API
//       const response = await axios.get(`https://graph.facebook.com/v19.0/${instagramUserId}`, {
//         params: {
//           fields: 'followers_count',
//           access_token: instagramAccessToken
//         }
//       });
      
//       console.log('[Analytics] Followers response:', response.data);
      
//       res.json({
//         followers: response.data.followers_count,
//         instagramUserId: instagramUserId
//       });
      
//     } catch (error: any) {
//       console.error('[Analytics] Error fetching followers:', error.response?.data || error.message);
//       res.status(500).json({ 
//         error: 'Failed to fetch followers',
//         details: error.response?.data?.error?.message || error.message
//       });
//     }
//   });

//         // 2. Get Engagement Rate
//   app.get('/api/instagram/engagement', verifyFirebaseToken, async (req: any, res) => {
//     const firebaseUid = req.firebaseUid;
    
//     try {
//       console.log('[Analytics] Fetching engagement rate for user:', firebaseUid);
      
//       // Get user data
//       const userData = await getUserData(firebaseUid);
      
//       if (!userData || !userData.instagramAccessToken || !userData.instagramUserId) {
//         return res.status(400).json({ error: 'Instagram account not connected' });
//       }
      
//       const { instagramAccessToken, instagramUserId } = userData;
      
//       // Get followers count first
//       const profileResponse = await axios.get(`https://graph.facebook.com/v19.0/${instagramUserId}`, {
//         params: {
//           fields: 'followers_count',
//           access_token: instagramAccessToken
//         }
//       });
      
//       const followersCount = profileResponse.data.followers_count;
      
//       // Get recent media posts (last 25 posts)
//       const mediaResponse = await axios.get(`https://graph.facebook.com/v19.0/${instagramUserId}/media`, {
//         params: {
//           fields: 'id,like_count,comments_count,timestamp,media_type',
//           limit: 25,
//           access_token: instagramAccessToken
//         }
//       });
      
//       console.log('[Analytics] Media response:', mediaResponse.data);
      
//       const posts = mediaResponse.data.data || [];
      
//       if (posts.length === 0) {
//         return res.json({
//           engagementRate: 0,
//           totalPosts: 0,
//           message: 'No posts found'
//         });
//       }
      
//       // Calculate total engagements
//       let totalEngagements = 0;
//       posts.forEach((post: any) => {
//         const likes = post.like_count || 0;
//         const comments = post.comments_count || 0;
//         totalEngagements += (likes + comments);
//       });
      
//       // Calculate engagement rate
//       // Formula: (Total Engagements / (Total Posts * Followers)) * 100
//       const engagementRate = followersCount > 0 
//         ? (totalEngagements / (posts.length * followersCount)) * 100
//         : 0;
      
//       console.log('[Analytics] Engagement calculation:', {
//         totalEngagements,
//         postsCount: posts.length,
//         followersCount,
//         engagementRate: engagementRate.toFixed(2)
//       });
      
//       res.json({
//         engagementRate: parseFloat(engagementRate.toFixed(2)),
//         totalEngagements,
//         totalPosts: posts.length,
//         followersCount
//       });
      
//     } catch (error: any) {
//       console.error('[Analytics] Error fetching engagement:', error.response?.data || error.message);
//       res.status(500).json({ 
//         error: 'Failed to fetch engagement rate',
//         details: error.response?.data?.error?.message || error.message
//       });
//     }
//   });
                  

//     // 3. Get Weekly Reach
//   app.get('/api/instagram/reach', verifyFirebaseToken, async (req: any, res) => {
//     const firebaseUid = req.firebaseUid;
    
//     try {
//       console.log('[Analytics] Fetching weekly reach for user:', firebaseUid);
      
//       // Get user data
//       const userData = await getUserData(firebaseUid);
      
//       if (!userData || !userData.instagramAccessToken || !userData.instagramUserId) {
//         return res.status(400).json({ error: 'Instagram account not connected' });
//       }
      
//       const { instagramAccessToken, instagramUserId } = userData;
      
//       // Calculate timestamps for last 7 days
//       const now = Math.floor(Date.now() / 1000);
//       const sevenDaysAgo = now - (7 * 24 * 60 * 60);
      
//       // Get reach insights
//       const insightsResponse = await axios.get(`https://graph.facebook.com/v19.0/${instagramUserId}/insights`, {
//         params: {
//           metric: 'reach',
//           period: 'day',
//           since: sevenDaysAgo,
//           until: now,
//           access_token: instagramAccessToken
//         }
//       });
      
//       console.log('[Analytics] Reach response:', JSON.stringify(insightsResponse.data, null, 2));
      
//       const reachData = insightsResponse.data.data || [];
      
//       if (reachData.length === 0 || !reachData[0].values) {
//         return res.json({
//           weeklyReach: 0,
//           dailyReach: [],
//           message: 'No reach data available'
//         });
//       }
      
//       // Sum up daily reach values
//       const dailyValues = reachData[0].values || [];
//       const weeklyReach = dailyValues.reduce((sum: number, day: any) => {
//         return sum + (day.value || 0);
//       }, 0);
      
//       console.log('[Analytics] Weekly reach calculation:', {
//         dailyValues: dailyValues.length,
//         weeklyReach
//       });
      
//       res.json({
//         weeklyReach,
//         dailyReach: dailyValues,
//         period: '7 days'
//       });
      
//     } catch (error: any) {
//       console.error('[Analytics] Error fetching reach:', error.response?.data || error.message);
      
//       // Instagram Insights might not be available for all account types
//       if (error.response?.data?.error?.code === 100) {
//         return res.json({
//           weeklyReach: 0,
//           message: 'Insights not available for this account type',
//           error: error.response.data.error.message
//         });
//       }
      
//       res.status(500).json({ 
//         error: 'Failed to fetch weekly reach',
//         details: error.response?.data?.error?.message || error.message
//       });
//     }
//   });


//     // 4. Get Auto-Replies Count
//   app.get('/api/instagram/auto-replies', verifyFirebaseToken, async (req: any, res) => {
//     const firebaseUid = req.firebaseUid;
    
//     try {
//       console.log('[Analytics] Fetching auto-replies count for user:', firebaseUid);
      
//       // Get stats from Firestore
//       const statsDoc = await db.collection('users').doc(firebaseUid).collection('stats').doc('autoReplies').get();
      
//       if (!statsDoc.exists) {
//         // Initialize stats if doesn't exist
//         await db.collection('users').doc(firebaseUid).collection('stats').doc('autoReplies').set({
//           totalCount: 0,
//           lastReplyAt: null,
//           createdAt: admin.firestore.FieldValue.serverTimestamp()
//         });
        
//         return res.json({
//           autoReplies: 0,
//           lastReplyAt: null
//         });
//       }
      
//       const statsData = statsDoc.data();
      
//       res.json({
//         autoReplies: statsData?.totalCount || 0,
//         lastReplyAt: statsData?.lastReplyAt || null
//       });
      
//     } catch (error: any) {
//       console.error('[Analytics] Error fetching auto-replies:', error.message);
//       res.status(500).json({ 
//         error: 'Failed to fetch auto-replies count',
//         details: error.message
//       });
//     }
//   });

//     // ============================================
//   // AUTOMATION RULES API ENDPOINTS
//   // ============================================

//   /**
//    * Helper function to validate rule data
//    */
//   function validateRuleData(data: any) {
//     const errors: string[] = [];

//     if (!data.keyword || typeof data.keyword !== 'string' || data.keyword.trim() === '') {
//       errors.push('Keyword is required');
//     }

//     if (!data.replyMessage || typeof data.replyMessage !== 'string' || data.replyMessage.trim() === '') {
//       errors.push('Reply message is required');
//     }

//     if (!data.type || !['COMMENT', 'MESSAGE', 'ALL'].includes(data.type)) {
//       errors.push('Invalid type. Must be COMMENT, MESSAGE, or ALL');
//     }

//     return { valid: errors.length === 0, errors };
//   }

//   /**
//    * Helper function to check rule ownership
//    */
//   async function verifyRuleOwnership(ruleId: string, userId: string) {
//     try {
//       const ruleDoc = await db.collection('automationRules').doc(ruleId).get();
      
//       if (!ruleDoc.exists) {
//         return { valid: false, error: 'Rule not found' };
//       }

//       const ruleData = ruleDoc.data();
      
//       if (ruleData?.userId !== userId) {
//         return { valid: false, error: 'Unauthorized' };
//       }

//       return { valid: true, doc: ruleDoc };
//     } catch (error: any) {
//       return { valid: false, error: error.message };
//     }
//   }

//   // 1. CREATE AUTOMATION RULE
//   app.post('/api/automation/rules', verifyFirebaseToken, async (req: any, res) => {
//     const firebaseUid = req.firebaseUid;
//     const { keyword, replyMessage, type, enabled, priority, dailyLimit } = req.body;

//     console.log('[Automation] Creating rule for user:', firebaseUid);

//     try {
//       // Validate input
//       const validation = validateRuleData({ keyword, replyMessage, type });
//       if (!validation.valid) {
//         return res.status(400).json({ error: validation.errors.join(', ') });
//       }

//       // Normalize keyword
//       const normalizedKeyword = keyword.toLowerCase().trim();

//       // Check for duplicate keyword
//       const existingRules = await db.collection('automationRules')
//         .where('userId', '==', firebaseUid)
//         .where('keyword', '==', normalizedKeyword)
//         .get();

//       if (!existingRules.empty) {
//         return res.status(400).json({ error: 'A rule with this keyword already exists' });
//       }

//       // Create rule
//       const ruleData = {
//         userId: firebaseUid,
//         keyword: normalizedKeyword,
//         replyMessage: replyMessage.trim(),
//         type: type,
//         enabled: enabled !== undefined ? enabled : true,
//         priority: priority || 1,
//         triggerCount: 0,
//         successCount: 0,
//         failureCount: 0,
//         lastTriggeredAt: null,
//         dailyLimit: dailyLimit || 0,
//         dailyUsage: 0,
//         lastResetAt: admin.firestore.FieldValue.serverTimestamp(),
//         createdAt: admin.firestore.FieldValue.serverTimestamp(),
//         updatedAt: admin.firestore.FieldValue.serverTimestamp()
//       };

//       const docRef = await db.collection('automationRules').add(ruleData);
//       const newRule = await docRef.get();

//       console.log('[Automation] Rule created:', docRef.id);

//       res.status(201).json({
//         success: true,
//         rule: {
//           ruleId: docRef.id,
//           ...newRule.data()
//         }
//       });
//     } catch (error: any) {
//       console.error('[Automation] Error creating rule:', error.message);
//       res.status(500).json({ error: 'Failed to create rule', details: error.message });
//     }
//   });

//   // 2. GET ALL AUTOMATION RULES
//   app.get('/api/automation/rules', verifyFirebaseToken, async (req: any, res) => {
//     const firebaseUid = req.firebaseUid;

//     console.log('[Automation] Fetching rules for user:', firebaseUid);

//     try {
//       const snapshot = await db.collection('automationRules')
//         .where('userId', '==', firebaseUid)
//         .orderBy('priority', 'asc')
//         .get();

//       const rules = snapshot.docs.map(doc => ({
//         ruleId: doc.id,
//         ...doc.data()
//       }));

//       console.log('[Automation] Found', rules.length, 'rules');

//       res.json({
//         success: true,
//         rules: rules,
//         total: rules.length
//       });
//     } catch (error: any) {
//       console.error('[Automation] Error fetching rules:', error.message);
//       res.status(500).json({ error: 'Failed to fetch rules', details: error.message });
//     }
//   });

//   // 3. GET SINGLE AUTOMATION RULE
//   app.get('/api/automation/rules/:ruleId', verifyFirebaseToken, async (req: any, res) => {
//     const firebaseUid = req.firebaseUid;
//     const { ruleId } = req.params;

//     console.log('[Automation] Fetching rule:', ruleId);

//     try {
//       const verification = await verifyRuleOwnership(ruleId, firebaseUid);

//       if (!verification.valid) {
//         return res.status(verification.error === 'Rule not found' ? 404 : 403)
//           .json({ error: verification.error });
//       }

//       const ruleData = verification.doc!.data();

//       res.json({
//         success: true,
//         rule: {
//           ruleId: ruleId,
//           ...ruleData
//         }
//       });
//     } catch (error: any) {
//       console.error('[Automation] Error fetching rule:', error.message);
//       res.status(500).json({ error: 'Failed to fetch rule', details: error.message });
//     }
//   });

//   // 4. UPDATE AUTOMATION RULE
//   app.put('/api/automation/rules/:ruleId', verifyFirebaseToken, async (req: any, res) => {
//     const firebaseUid = req.firebaseUid;
//     const { ruleId } = req.params;
//     const updates = req.body;

//     console.log('[Automation] Updating rule:', ruleId);

//     try {
//       const verification = await verifyRuleOwnership(ruleId, firebaseUid);

//       if (!verification.valid) {
//         return res.status(verification.error === 'Rule not found' ? 404 : 403)
//           .json({ error: verification.error });
//       }

//       // Validate updates if provided
//       if (updates.keyword !== undefined || updates.replyMessage !== undefined || updates.type !== undefined) {
//         const currentData = verification.doc!.data();
//         const dataToValidate = {
//           keyword: updates.keyword || currentData?.keyword,
//           replyMessage: updates.replyMessage || currentData?.replyMessage,
//           type: updates.type || currentData?.type
//         };

//         const validation = validateRuleData(dataToValidate);
//         if (!validation.valid) {
//           return res.status(400).json({ error: validation.errors.join(', ') });
//         }
//       }

//       // Normalize keyword if provided
//       if (updates.keyword) {
//         updates.keyword = updates.keyword.toLowerCase().trim();

//         // Check for duplicate keyword (excluding current rule)
//         const existingRules = await db.collection('automationRules')
//           .where('userId', '==', firebaseUid)
//           .where('keyword', '==', updates.keyword)
//           .get();

//         const hasDuplicate = existingRules.docs.some(doc => doc.id !== ruleId);
        
//         if (hasDuplicate) {
//           return res.status(400).json({ error: 'A rule with this keyword already exists' });
//         }
//       }

//       // Update rule
//       const updateData = {
//         ...updates,
//         updatedAt: admin.firestore.FieldValue.serverTimestamp()
//       };

//       await verification.doc!.ref.update(updateData);
//       const updatedRule = await verification.doc!.ref.get();

//       console.log('[Automation] Rule updated:', ruleId);

//       res.json({
//         success: true,
//         rule: {
//           ruleId: ruleId,
//           ...updatedRule.data()
//         }
//       });
//     } catch (error: any) {
//       console.error('[Automation] Error updating rule:', error.message);
//       res.status(500).json({ error: 'Failed to update rule', details: error.message });
//     }
//   });

  

//   // 5. DELETE AUTOMATION RULE
//   app.delete('/api/automation/rules/:ruleId', verifyFirebaseToken, async (req: any, res) => {
//     const firebaseUid = req.firebaseUid;
//     const { ruleId } = req.params;

//     console.log('[Automation] Deleting rule:', ruleId);

//     try {
//       const verification = await verifyRuleOwnership(ruleId, firebaseUid);

//       if (!verification.valid) {
//         return res.status(verification.error === 'Rule not found' ? 404 : 403)
//           .json({ error: verification.error });
//       }

//       await verification.doc!.ref.delete();

//       console.log('[Automation] Rule deleted:', ruleId);

//       res.json({
//         success: true,
//         message: 'Rule deleted successfully'
//       });
//     } catch (error: any) {
//       console.error('[Automation] Error deleting rule:', error.message);
//       res.status(500).json({ error: 'Failed to delete rule', details: error.message });
//     }
//   });

//   // ============================================
// // INSTAGRAM WEBHOOKS
// // ============================================

// /**
//  * Webhook Verification Endpoint
//  * Facebook will call this to verify your webhook is legitimate
//  */
// app.get('/api/webhooks/instagram', (req, res) => {
//   // Extract verification parameters
//   const mode = req.query['hub.mode'];
//   const token = req.query['hub.verify_token'];
//   const challenge = req.query['hub.challenge'];

//   console.log('[Webhook] Verification request received');
//   console.log('[Webhook] Mode:', mode);
//   console.log('[Webhook] Token:', token);

//   // Define your verification token (set this in .env)
//   const VERIFY_TOKEN = process.env.WEBHOOK_VERIFY_TOKEN || 'instaflow_webhook_token_123';

//   // Check if mode and token are correct
//   if (mode === 'subscribe' && token === VERIFY_TOKEN) {
//     console.log('[Webhook] Verification successful');
//     // Respond with the challenge to verify
//     res.status(200).send(challenge);
//   } else {
//     console.error('[Webhook] Verification failed');
//     res.status(403).send('Forbidden');
//   }
// });


//   // 6. TOGGLE AUTOMATION RULE
//   app.patch('/api/automation/rules/:ruleId/toggle', verifyFirebaseToken, async (req: any, res) => {
//     const firebaseUid = req.firebaseUid;
//     const { ruleId } = req.params;

//     console.log('[Automation] Toggling rule:', ruleId);

//     try {
//       const verification = await verifyRuleOwnership(ruleId, firebaseUid);

//       if (!verification.valid) {
//         return res.status(verification.error === 'Rule not found' ? 404 : 403)
//           .json({ error: verification.error });
//       }

//       const currentData = verification.doc!.data();
//       const newEnabledState = !currentData?.enabled;

//       await verification.doc!.ref.update({
//         enabled: newEnabledState,
//         updatedAt: admin.firestore.FieldValue.serverTimestamp()
//       });

//       const updatedRule = await verification.doc!.ref.get();

//       console.log('[Automation] Rule toggled:', ruleId, '- Enabled:', newEnabledState);

//       res.json({
//         success: true,
//         rule: {
//           ruleId: ruleId,
//           ...updatedRule.data()
//         },
//         enabled: newEnabledState
//       });
//     } catch (error: any) {
//       console.error('[Automation] Error toggling rule:', error.message);
//       res.status(500).json({ error: 'Failed to toggle rule', details: error.message });
//     }
//   });



//   // Vite middleware for development
//   if (process.env.NODE_ENV !== 'production') {
//     const vite = await createViteServer({
//       server: { middlewareMode: true },
//       appType: 'spa',
//     });
//     app.use(vite.middlewares);
//   } else {
//     const distPath = path.join(process.cwd(), 'dist');
//     app.use(express.static(distPath));
//     app.get('*', (req, res) => {
//       res.sendFile(path.join(distPath, 'index.html'));
//     });
//   }

//   app.listen(PORT, '0.0.0.0', () => {
//     console.log(`Server running on http://localhost:${PORT}`);
//   });
// }

// startServer();
