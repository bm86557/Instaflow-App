import type { VercelRequest, VercelResponse } from '@vercel/node';
import express from 'express';
import cookieSession from 'cookie-session';
import dotenv from 'dotenv';
import axios from 'axios';
import { GoogleGenAI } from '@google/genai';
import OpenAI from 'openai';
import stringSimilarity from 'string-similarity';
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

  if (!data.type || !['COMMENT', 'MESSAGE', 'ALL'].includes(data.type)) {
    errors.push('Invalid type. Must be COMMENT, MESSAGE, or ALL');
  }

  const hasCommentReply = typeof data.replyMessage === 'string' && data.replyMessage.trim() !== '';
  const hasDmReply = typeof data.dmMessage === 'string' && data.dmMessage.trim() !== '';

  if (data.type === 'COMMENT' && !hasCommentReply) {
    errors.push('Comment reply message is required');
  } else if (data.type === 'MESSAGE' && !hasDmReply && !hasCommentReply) {
    errors.push('DM message is required');
  } else if (data.type === 'ALL' && (!hasCommentReply || !hasDmReply)) {
    errors.push('Both Comment reply message and DM message are required when trigger type is Both');
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

async function sendPrivateReplyToComment(
  instagramUserId: string,
  commentId: string,
  dmMessage: string,
  accessToken: string
) {
  try {
    const response = await axios.post(
      `https://graph.facebook.com/v19.0/${instagramUserId}/messages`,
      { recipient: { comment_id: commentId }, message: { text: dmMessage } },
      { params: { access_token: accessToken } }
    );
    return { success: true, messageId: response.data.message_id || response.data.id || null };
  } catch (error: any) {
    console.error('[Instagram API] Error sending private DM:', error.response?.data || error.message);
    return { success: false, error: error.response?.data?.error?.message || error.message };
  }
}

async function sendDirectMessage(
  instagramUserId: string,
  recipientId: string,
  dmMessage: string,
  accessToken: string
) {
  try {
    const response = await axios.post(
      `https://graph.facebook.com/v19.0/${instagramUserId}/messages`,
      { recipient: { id: recipientId }, message: { text: dmMessage } },
      { params: { access_token: accessToken } }
    );
    return { success: true, messageId: response.data.message_id || response.data.id || null };
  } catch (error: any) {
    console.error('[Instagram API] Error sending DM:', error.response?.data || error.message);
    return { success: false, error: error.response?.data?.error?.message || error.message };
  }
}

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  return apiKey ? new GoogleGenAI({ apiKey }) : null;
}

function getOpenAIClient(): OpenAI | null {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  return apiKey ? new OpenAI({ apiKey }) : null;
}

const STOP_WORDS = new Set([
  'match', 'if', 'user', 'users', 'ask', 'asked', 'asking', 'about', 'for', 'the', 'and', 'or',
  'is', 'are', 'was', 'were', 'this', 'that', 'these', 'those', 'any', 'other', 'related', 'to',
  'in', 'on', 'of', 'with', 'how', 'much', 'what', 'when', 'where', 'who', 'can', 'you', 'it', 'a', 'an'
]);

async function findMatchingRuleWithNarration(text: string, rules: any[]): Promise<{ rule: any; matchType: 'exact' | 'semantic' } | null> {
  const textLower = (text || '').toLowerCase().trim();
  if (!textLower || rules.length === 0) return null;

  for (const rule of rules) {
    const keyword = typeof rule.keyword === 'string' ? rule.keyword.toLowerCase().trim() : '';
    if (keyword && textLower.includes(keyword)) {
      return { rule, matchType: 'exact' };
    }
  }

  if (process.env.SEMANTIC_MATCHING_ENABLED === 'false') return null;
  const threshold = Number(process.env.SEMANTIC_THRESHOLD) || 0.75;
  const ruleSummaries = rules.map((r, idx) => ({
    index: idx,
    ruleId: r.ruleId,
    keyword: r.keyword,
    narration: r.narration || `User is asking about or referring to "${r.keyword}"`
  }));

  const geminiClient = getGeminiClient();
  if (geminiClient) {
    try {
      const prompt =
        'You match an Instagram user comment/DM to automation rules by semantic meaning and intent. ' +
        'Return ONLY valid JSON: {"matchedRuleId": string | null, "confidence": number}. ' +
        'Match if the user message has the same meaning or intent as the rule keyword or narration.\n\n' +
        JSON.stringify({ message: text, rules: ruleSummaries });
      const response = await geminiClient.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: { temperature: 0, responseMimeType: 'application/json' }
      });
      const raw = response.text;
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.matchedRuleId && (typeof parsed.confidence !== 'number' || parsed.confidence >= threshold)) {
          const found = rules.find((r) => r.ruleId === parsed.matchedRuleId);
          if (found) return { rule: found, matchType: 'semantic' };
        }
      }
    } catch (err: any) {
      console.warn('[AutoReply] Gemini semantic match failed, trying fallback:', err.message);
    }
  }

  const openaiClient = getOpenAIClient();
  if (openaiClient) {
    try {
      const completion = await openaiClient.chat.completions.create({
        model: 'gpt-4o-mini',
        temperature: 0,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content:
              'You match an Instagram user comment/DM to automation rules by semantic meaning and intent. ' +
              'Return JSON: {"matchedRuleId": string | null, "confidence": number}. ' +
              'Match if the user message has the same meaning or intent as the rule keyword or narration.'
          },
          { role: 'user', content: JSON.stringify({ message: text, rules: ruleSummaries }) }
        ]
      });
      const raw = completion.choices[0]?.message?.content;
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.matchedRuleId && (typeof parsed.confidence !== 'number' || parsed.confidence >= threshold)) {
          const found = rules.find((r) => r.ruleId === parsed.matchedRuleId);
          if (found) return { rule: found, matchType: 'semantic' };
        }
      }
    } catch (err: any) {
      console.warn('[AutoReply] OpenAI semantic match failed, using narration/similarity fallback:', err.message);
    }
  }

  const commentWords = textLower
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w: string) => w.length >= 3 && !STOP_WORDS.has(w));

  for (const rule of rules) {
    const narrationText = typeof rule.narration === 'string' ? rule.narration.toLowerCase() : '';
    if (narrationText) {
      const narrationWords = new Set(
        narrationText
          .replace(/[^a-z0-9\s]/g, ' ')
          .split(/\s+/)
          .filter((w: string) => w.length >= 3 && !STOP_WORDS.has(w))
      );
      if (commentWords.some((w: string) => narrationWords.has(w))) {
        return { rule, matchType: 'semantic' };
      }
    }

    const keyword = typeof rule.keyword === 'string' ? rule.keyword.toLowerCase().trim() : '';
    if (keyword && stringSimilarity.compareTwoStrings(textLower, keyword) >= 0.6) {
      return { rule, matchType: 'semantic' };
    }
  }

  return null;
}

async function saveInstagramComment(params: {
  commentId: string;
  userId: string;
  instagramUserId: string;
  mediaId: string | null;
  text: string;
  commenterId?: string | null;
  commenterUsername?: string | null;
  commentedAt?: string | null;
  source?: 'webhook' | 'poll' | 'sync';
}) {
  if (!params.commentId) return;

  await db.collection('instagramComments').doc(params.commentId).set(
    {
      commentId: params.commentId,
      userId: params.userId,
      instagramUserId: params.instagramUserId,
      mediaId: params.mediaId || null,
      text: params.text || '',
      commenterId: params.commenterId || null,
      commenterUsername: params.commenterUsername || null,
      commentedAt: params.commentedAt || null,
      source: params.source || 'webhook',
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    },
    { merge: true }
  );
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

    // Store every incoming comment on the post in Firestore
    await saveInstagramComment({
      commentId,
      userId,
      instagramUserId,
      mediaId: mediaId || null,
      text: commentText,
      commenterId: commenterId || null,
      commenterUsername: commenterUsername || null,
      commentedAt: commentData.timestamp || null,
      source: commentData._source || 'webhook'
    });

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

    let matchedRule: any = null;

    const rules: any[] = rulesDocs
      .map(doc => ({ ruleId: doc.id, ...doc.data() }))
      .filter((rule: any) => (rule.type === 'COMMENT' || rule.type === 'ALL') && (!rule.targetMediaId || rule.targetMediaId === mediaId));

    rules.sort((a: any, b: any) => {
      const aSpecific = a.targetMediaId && a.targetMediaId === mediaId ? 0 : 1;
      const bSpecific = b.targetMediaId && b.targetMediaId === mediaId ? 0 : 1;
      if (aSpecific !== bSpecific) return aSpecific - bSpecific;
      return (a.priority || 0) - (b.priority || 0);
    });

    const matchResult = await findMatchingRuleWithNarration(commentText, rules);
    if (matchResult) {
      matchedRule = matchResult.rule;
      console.log('[AutoReply] Matched rule:', matchedRule.ruleId, '- Keyword:', matchedRule.keyword, '- Type:', matchResult.matchType, '- Target:', matchedRule.targetMediaId || 'ALL_POSTS');
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

    const replyResult = matchedRule.replyMessage
      ? await sendReplyToComment(commentId, matchedRule.replyMessage, accessToken)
      : { success: false, error: 'No comment reply message configured' };

    let dmResult: { success: boolean; messageId?: string | null; error?: string } | null = null;
    if (matchedRule.type === 'ALL' && matchedRule.dmMessage) {
      dmResult = await sendPrivateReplyToComment(
        instagramUserId,
        commentId,
        matchedRule.dmMessage,
        accessToken
      );
    }

    if (replyResult.success || dmResult?.success) {
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
        instagramReplyId: (replyResult as any).replyId || null,
        dmMessageId: dmResult?.messageId || null,
        dmStatus: dmResult ? (dmResult.success ? 'sent' : 'failed') : null,
        dmError: dmResult && !dmResult.success ? dmResult.error || null : null,
        triggerKeyword: matchedRule.keyword,
        originalComment: commentText,
        originalCommenter: commenterUsername,
        originalCommenterId: commenterId,
        replyMessage: matchedRule.replyMessage,
        dmMessage: matchedRule.dmMessage || null,
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

const POLL_MAX_COMMENT_AGE_MS = 24 * 60 * 60 * 1000;

async function pollCommentsForUser(firebaseUid: string) {
  const userDoc = await db.collection('users').doc(firebaseUid).get();
  if (!userDoc.exists) {
    return { checkedMedia: 0, checkedComments: 0, skipped: 'User not found' };
  }

  const userData = userDoc.data() || {};
  const instagramUserId = userData.instagramUserId;
  const accessToken = userData.instagramAccessToken;

  if (!instagramUserId || !accessToken) {
    return { checkedMedia: 0, checkedComments: 0, skipped: 'Instagram not connected' };
  }

  const mediaRes = await axios.get(`https://graph.facebook.com/v19.0/${instagramUserId}/media`, {
    params: {
      fields: 'id,timestamp',
      limit: 10,
      access_token: accessToken
    }
  });

  const mediaList: any[] = mediaRes.data?.data || [];
  let checkedComments = 0;

  for (const media of mediaList) {
    try {
      const commentsRes = await axios.get(`https://graph.facebook.com/v19.0/${media.id}/comments`, {
        params: {
          fields: 'id,text,timestamp,from,username',
          limit: 25,
          access_token: accessToken
        }
      });

      const comments: any[] = commentsRes.data?.data || [];
      for (const comment of comments) {
        if (!comment?.id || !comment?.text) continue;

        if (comment.timestamp) {
          const ageMs = Date.now() - new Date(comment.timestamp).getTime();
          if (!Number.isNaN(ageMs) && ageMs > POLL_MAX_COMMENT_AGE_MS) {
            continue;
          }
        }

        checkedComments++;
        await processComment(instagramUserId, {
          id: comment.id,
          text: comment.text,
          timestamp: comment.timestamp || null,
          from: comment.from || (comment.username ? { id: '', username: comment.username } : undefined),
          media: { id: media.id },
          _source: 'poll'
        });
      }
    } catch (err: any) {
      console.error(`[Poll] Failed to fetch comments for media ${media.id}:`, err.response?.data || err.message);
    }
  }

  return { checkedMedia: mediaList.length, checkedComments };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function isLocalHost(host?: string | null): boolean {
  if (!host) return false;
  const hostname = host.split(':')[0].toLowerCase();
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1';
}

function resolvePublicAppUrl(req: express.Request): string {
  const forwardedProto = req.get('x-forwarded-proto')?.split(',')[0]?.trim();
  const forwardedHost = req.get('x-forwarded-host')?.split(',')[0]?.trim() || req.get('x-forwarded-server')?.split(',')[0]?.trim();
  const host = req.get('host');
  const resolvedHost = forwardedHost || host || 'localhost:3000';
  const protocol = forwardedProto || req.protocol || 'http';

  // Always use the local origin when running on localhost so a production APP_URL in .env doesn't hijack local OAuth
  if (isLocalHost(resolvedHost)) {
    return `${protocol}://${resolvedHost}`.replace(/\/+$/, '');
  }

  if (forwardedProto && forwardedHost) {
    return `${forwardedProto}://${forwardedHost}`.replace(/\/+$/, '');
  }

  const configuredAppUrl = process.env.APP_URL?.trim().replace(/\/+$/, '');
  if (configuredAppUrl && configuredAppUrl !== 'http://localhost:3000' && configuredAppUrl !== 'http://127.0.0.1:3000') {
    return configuredAppUrl;
  }

  return `${protocol}://${resolvedHost}`.replace(/\/+$/, '');
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
    'instagram_manage_messages',
    'instagram_content_publish',
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

app.post('/api/user/disconnect', verifyFirebaseToken, async (req: any, res) => {
  const firebaseUid = req.firebaseUid;
  try {
    await saveUserData(firebaseUid, {
      instagramAccessToken: null,
      instagramUserId: null,
      instagramUsername: null,
      instagramProfilePictureUrl: null,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    res.json({ success: true });
  } catch (error: any) {
    console.error('[Disconnect] Error:', error.message);
    res.status(500).json({ error: 'Failed to disconnect Instagram account' });
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

app.get('/api/instagram/posts', verifyFirebaseToken, async (req: any, res) => {
  const firebaseUid = req.firebaseUid;
  try {
    const userData = await getUserData(firebaseUid);
    if (!userData || !userData.instagramAccessToken || !userData.instagramUserId) {
      return res.status(400).json({ error: 'Instagram account not connected' });
    }

    const mediaResponse = await axios.get(`https://graph.facebook.com/v19.0/${userData.instagramUserId}/media`, {
      params: {
        fields: 'id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,like_count,comments_count',
        limit: 25,
        access_token: userData.instagramAccessToken
      }
    });

    res.json({
      success: true,
      posts: mediaResponse.data?.data || []
    });
  } catch (error: any) {
    console.error('[Analytics] Error fetching posts:', error.response?.data || error.message);
    res.status(500).json({
      error: 'Failed to fetch Instagram posts',
      details: error.response?.data?.error?.message || error.message
    });
  }
});

app.get('/api/instagram/posts/:mediaId/comments', verifyFirebaseToken, async (req: any, res) => {
  const firebaseUid = req.firebaseUid;
  const { mediaId } = req.params;

  try {
    const userData = await getUserData(firebaseUid);
    if (!userData || !userData.instagramAccessToken || !userData.instagramUserId) {
      return res.status(400).json({ error: 'Instagram account not connected' });
    }

    const { instagramAccessToken, instagramUserId } = userData;

    const commentsResponse = await axios.get(`https://graph.facebook.com/v19.0/${mediaId}/comments`, {
      params: {
        fields: 'id,text,timestamp,from,username',
        limit: 100,
        access_token: instagramAccessToken
      }
    });

    const comments: any[] = commentsResponse.data?.data || [];

    await Promise.all(
      comments
        .filter((c) => c?.id)
        .map((c) =>
          saveInstagramComment({
            commentId: c.id,
            userId: firebaseUid,
            instagramUserId,
            mediaId,
            text: c.text || '',
            commenterId: c.from?.id || null,
            commenterUsername: c.from?.username || c.username || null,
            commentedAt: c.timestamp || null,
            source: 'sync'
          })
        )
    );

    res.json({
      success: true,
      mediaId,
      savedCount: comments.length,
      comments
    });
  } catch (error: any) {
    console.error('[Analytics] Error fetching/syncing post comments:', error.response?.data || error.message);
    res.status(500).json({
      error: 'Failed to fetch post comments',
      details: error.response?.data?.error?.message || error.message
    });
  }
});

app.get('/api/instagram/dashboard-overview', verifyFirebaseToken, async (req: any, res) => {
  const firebaseUid = req.firebaseUid;
  const days = req.query.days === '30' ? 30 : 7;

  try {
    const userData = await getUserData(firebaseUid);

    const rulesSnapshot = await db.collection('automationRules')
      .where('userId', '==', firebaseUid)
      .where('enabled', '==', true)
      .get();
    const activeAutomations = rulesSnapshot.size;

    let posts: any[] = [];
    if (userData?.instagramAccessToken && userData?.instagramUserId) {
      try {
        const mediaResponse = await axios.get(`https://graph.facebook.com/v19.0/${userData.instagramUserId}/media`, {
          params: {
            fields: 'id,caption,timestamp,like_count,comments_count',
            limit: 50,
            access_token: userData.instagramAccessToken
          }
        });
        posts = mediaResponse.data?.data || [];
      } catch (err: any) {
        console.warn('[Dashboard Overview] Failed to fetch media:', err.response?.data || err.message);
      }
    }

    const now = new Date();
    const dayBuckets = new Map<string, { date: string; engagement: number; posts: number }>();
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const isoKey = d.toISOString().slice(0, 10);
      const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      dayBuckets.set(isoKey, { date: label, engagement: 0, posts: 0 });
    }

    for (const post of posts) {
      if (!post.timestamp) continue;
      const key = new Date(post.timestamp).toISOString().slice(0, 10);
      const bucket = dayBuckets.get(key);
      if (bucket) {
        bucket.engagement += (post.like_count || 0) + (post.comments_count || 0);
        bucket.posts += 1;
      }
    }

    const commentsSnapshot = await db.collection('instagramComments')
      .where('userId', '==', firebaseUid)
      .limit(25)
      .get();

    const replySnapshot = await db.collection('replyHistory')
      .where('userId', '==', firebaseUid)
      .limit(25)
      .get();

    const repliedCommentMap = new Map<string, any>();
    replySnapshot.docs.forEach((doc) => {
      const d = doc.data();
      if (d.instagramCommentId) {
        repliedCommentMap.set(d.instagramCommentId, d);
      }
    });

    const toIso = (val: any): string => {
      if (!val) return new Date(0).toISOString();
      if (typeof val === 'string') return new Date(val).toISOString();
      if (typeof val?.toDate === 'function') return val.toDate().toISOString();
      return new Date(0).toISOString();
    };

    const recentActivity = commentsSnapshot.docs
      .map((doc) => {
        const c = doc.data();
        const reply = repliedCommentMap.get(c.commentId);
        const timestamp = c.commentedAt ? toIso(c.commentedAt) : toIso(c.updatedAt);
        return {
          id: doc.id,
          username: c.commenterUsername || 'instagram_user',
          text: c.text || '',
          mediaId: c.mediaId || null,
          replyStatus: reply?.status || null,
          replyMessage: reply?.replyMessage || null,
          timestamp
        };
      })
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 6);

    replySnapshot.docs.forEach((doc) => {
      const d = doc.data();
      const iso = toIso(d.createdAt).slice(0, 10);
      const bucket = dayBuckets.get(iso);
      if (bucket) {
        bucket.engagement += 1;
      }
    });

    res.json({
      success: true,
      activeAutomations,
      postsCount: posts.length,
      engagementSeries: Array.from(dayBuckets.values()),
      recentActivity
    });
  } catch (error: any) {
    console.error('[Dashboard Overview] Error:', error.message);
    res.status(500).json({ error: 'Failed to load dashboard overview', details: error.message });
  }
});

app.post('/api/automation/rules', verifyFirebaseToken, async (req: any, res) => {
  const firebaseUid = req.firebaseUid;
  const {
    keyword,
    replyMessage,
    dmMessage,
    narration,
    type,
    enabled,
    priority,
    dailyLimit,
    targetMediaId,
    targetMediaCaption,
    targetMediaUrl
  } = req.body;

  console.log('[Automation] Creating rule for user:', firebaseUid);

  try {
    const validation = validateRuleData({ keyword, replyMessage, dmMessage, type });
    if (!validation.valid) {
      return res.status(400).json({ error: validation.errors.join(', ') });
    }

    const normalizedKeyword = keyword.toLowerCase().trim();
    const normalizedMediaId = typeof targetMediaId === 'string' && targetMediaId.trim() ? targetMediaId.trim() : null;

    const existingRules = await db.collection('automationRules')
      .where('userId', '==', firebaseUid)
      .where('keyword', '==', normalizedKeyword)
      .get();

    const hasSameTarget = existingRules.docs.some((doc) => {
      const existingMediaId = doc.data()?.targetMediaId || null;
      return existingMediaId === normalizedMediaId;
    });

    if (hasSameTarget) {
      return res.status(400).json({
        error: normalizedMediaId
          ? 'A rule with this keyword already exists for this post'
          : 'A global rule with this keyword already exists'
      });
    }

    const userDoc = await db.collection('users').doc(firebaseUid).get();
    const connectedInstagramUserId = userDoc.exists ? userDoc.data()?.instagramUserId || null : null;

    const ruleData: any = {
      userId: firebaseUid,
      keyword: normalizedKeyword,
      replyMessage: typeof replyMessage === 'string' ? replyMessage.trim() : '',
      dmMessage: typeof dmMessage === 'string' && dmMessage.trim() ? dmMessage.trim() : null,
      narration: typeof narration === 'string' && narration.trim() ? narration.trim() : null,
      type: type,
      targetMediaId: normalizedMediaId,
      targetMediaCaption: normalizedMediaId && typeof targetMediaCaption === 'string' ? targetMediaCaption.slice(0, 120) : null,
      targetMediaUrl: normalizedMediaId && typeof targetMediaUrl === 'string' ? targetMediaUrl : null,
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

    const currentData = verification.doc!.data();

    if (
      updates.keyword !== undefined ||
      updates.replyMessage !== undefined ||
      updates.dmMessage !== undefined ||
      updates.type !== undefined
    ) {
      const dataToValidate = {
        keyword: updates.keyword !== undefined ? updates.keyword : currentData?.keyword,
        replyMessage: updates.replyMessage !== undefined ? updates.replyMessage : currentData?.replyMessage,
        dmMessage: updates.dmMessage !== undefined ? updates.dmMessage : currentData?.dmMessage,
        type: updates.type !== undefined ? updates.type : currentData?.type
      };

      const validation = validateRuleData(dataToValidate);
      if (!validation.valid) {
        return res.status(400).json({ error: validation.errors.join(', ') });
      }
    }

    const nextKeyword = (updates.keyword !== undefined ? updates.keyword : currentData?.keyword || '').toLowerCase().trim();
    const nextMediaId = updates.targetMediaId !== undefined
      ? (typeof updates.targetMediaId === 'string' && updates.targetMediaId.trim() ? updates.targetMediaId.trim() : null)
      : (currentData?.targetMediaId || null);

    if (updates.keyword !== undefined || updates.targetMediaId !== undefined) {
      updates.keyword = nextKeyword;
      updates.targetMediaId = nextMediaId;

      const existingRules = await db.collection('automationRules')
        .where('userId', '==', firebaseUid)
        .where('keyword', '==', nextKeyword)
        .get();

      const hasDuplicate = existingRules.docs.some(doc => {
        if (doc.id === ruleId) return false;
        const existingMediaId = doc.data()?.targetMediaId || null;
        return existingMediaId === nextMediaId;
      });
      
      if (hasDuplicate) {
        return res.status(400).json({
          error: nextMediaId
            ? 'A rule with this keyword already exists for this post'
            : 'A global rule with this keyword already exists'
        });
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

// Poll comments manually (Graph API fallback when webhooks are unavailable)
app.post('/api/automation/poll-comments', verifyFirebaseToken, async (req: any, res) => {
  const firebaseUid = req.firebaseUid;
  try {
    const result = await pollCommentsForUser(firebaseUid);
    res.json({ success: true, ...result });
  } catch (error: any) {
    console.error('[Automation] Error polling comments:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to poll comments', details: error.message });
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
  console.log('[Webhook] =====================================');
  console.log('[Webhook] Notification received at:', new Date().toISOString());
  console.log('[Webhook] Request body:', JSON.stringify(req.body, null, 2));
  console.log('[Webhook] =====================================');

  try {
    const body = req.body;

    if (!body || typeof body !== 'object') {
      console.error('[Webhook] Invalid body - not an object');
      return res.status(200).send('EVENT_RECEIVED');
    }

    console.log('[Webhook] Body object type:', body.object);

    if (body.object !== 'instagram') {
      console.log('[Webhook] Not an Instagram notification, ignoring');
      return res.status(200).send('EVENT_RECEIVED');
    }

    console.log('[Webhook] ✅ This is an Instagram notification');
    console.log('[Webhook] Entry count:', (body.entry || []).length);

    for (const entry of body.entry || []) {
      const instagramUserId = entry.id;
      
      console.log('[Webhook] Processing entry for Instagram user:', instagramUserId);
      console.log('[Webhook] Changes count:', (entry.changes || []).length);

      for (const change of entry.changes || []) {
        console.log('[Webhook] Change field:', change.field);
        
        if (change.field === 'comments') {
          const commentData = change.value;
          
          console.log('[Webhook] ✅ Comment event detected!');
          console.log('[Webhook] Comment data:', JSON.stringify(commentData, null, 2));

          // Await processing before responding so Vercel does not freeze the serverless function early
          console.log('[Webhook] Calling processComment function...');
          try {
            await processComment(instagramUserId, commentData);
          } catch (err: any) {
            console.error('[Webhook] ❌ Error in processComment:', err);
            console.error('[Webhook] Error stack:', err?.stack);
          }
        } else {
          console.log('[Webhook] Ignoring change field:', change.field);
        }
      }
    }
  } catch (error: any) {
    console.error('[Webhook] ❌ Error processing notification:', error);
    console.error('[Webhook] Error stack:', error.stack);
  }

  return res.status(200).send('EVENT_RECEIVED');
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
// SCHEDULER HELPERS & ROUTES (inlined from schedulerService & scheduler.routes)
// ============================================================================

async function waitForContainerReady(creationId: string, accessToken: string, maxAttempts = 18, delayMs = 2500): Promise<{ ready: boolean; error?: string }> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const statusRes = await axios.get(`https://graph.facebook.com/v19.0/${creationId}`, {
        params: { fields: 'status_code,status', access_token: accessToken }
      });
      const statusCode = statusRes.data?.status_code;
      if (statusCode === 'FINISHED' || statusCode === 'PUBLISHED') return { ready: true };
      if (statusCode === 'ERROR' || statusCode === 'EXPIRED') {
        return { ready: false, error: statusRes.data?.status || `Media processing failed (${statusCode})` };
      }
    } catch (err: any) {
      console.warn(`[Instagram Publish] Status poll ${attempt} failed:`, err.response?.data || err.message);
    }
    await new Promise((r) => setTimeout(r, delayMs));
  }
  return { ready: false, error: 'Timed out waiting for Instagram media container to finish processing' };
}

async function publishInstagramPost(params: {
  instagramUserId: string;
  accessToken: string;
  mediaType: 'IMAGE' | 'REELS' | 'STORIES' | 'CAROUSEL';
  mediaItems: Array<{ url: string; isVideo?: boolean }>;
  caption?: string;
  userTags?: string[];
}): Promise<{ success: boolean; publishedMediaId?: string; error?: string }> {
  const { instagramUserId, accessToken, mediaType, mediaItems, caption, userTags } = params;
  if (!mediaItems || mediaItems.length === 0) return { success: false, error: 'At least one media URL is required' };

  const cleanTags = Array.isArray(userTags)
    ? Array.from(new Set(userTags.map((t) => String(t).replace(/^@+/, '').trim()).filter(Boolean))).slice(0, 20)
    : [];
  const formattedUserTags = cleanTags.length > 0
    ? cleanTags.map((username, idx) => ({
        username,
        x: Number(Math.min(0.85, 0.25 + (idx % 5) * 0.15).toFixed(2)),
        y: Number(Math.min(0.85, 0.35 + Math.floor(idx / 5) * 0.15).toFixed(2))
      }))
    : null;

  try {
    let creationId: string;
    if (mediaType === 'CAROUSEL' && mediaItems.length >= 2) {
      const childIds: string[] = [];
      for (const item of mediaItems.slice(0, 10)) {
        const childBody: Record<string, any> = { is_carousel_item: true, access_token: accessToken };
        if (item.isVideo) {
          childBody.media_type = 'VIDEO';
          childBody.video_url = item.url;
        } else {
          childBody.image_url = item.url;
          if (formattedUserTags) childBody.user_tags = formattedUserTags;
        }
        const childRes = await axios.post(`https://graph.facebook.com/v19.0/${instagramUserId}/media`, childBody);
        const childId = childRes.data?.id;
        if (!childId) return { success: false, error: 'Failed to create carousel child container' };
        if (item.isVideo) {
          const check = await waitForContainerReady(childId, accessToken);
          if (!check.ready) return { success: false, error: check.error };
        }
        childIds.push(childId);
      }
      const parentRes = await axios.post(`https://graph.facebook.com/v19.0/${instagramUserId}/media`, {
        media_type: 'CAROUSEL',
        children: childIds,
        caption: caption || '',
        access_token: accessToken
      });
      creationId = parentRes.data?.id;
    } else if (mediaType === 'STORIES') {
      const first = mediaItems[0];
      const storyBody: Record<string, any> = { media_type: 'STORIES', access_token: accessToken };
      if (first.isVideo) storyBody.video_url = first.url;
      else storyBody.image_url = first.url;
      const res = await axios.post(`https://graph.facebook.com/v19.0/${instagramUserId}/media`, storyBody);
      creationId = res.data?.id;
    } else if (mediaType === 'REELS' || mediaItems[0].isVideo) {
      const reelBody: Record<string, any> = { media_type: 'REELS', video_url: mediaItems[0].url, caption: caption || '', access_token: accessToken };
      if (formattedUserTags) reelBody.user_tags = formattedUserTags;
      const res = await axios.post(`https://graph.facebook.com/v19.0/${instagramUserId}/media`, reelBody);
      creationId = res.data?.id;
    } else {
      const imageBody: Record<string, any> = { image_url: mediaItems[0].url, caption: caption || '', access_token: accessToken };
      if (formattedUserTags) imageBody.user_tags = formattedUserTags;
      const res = await axios.post(`https://graph.facebook.com/v19.0/${instagramUserId}/media`, imageBody);
      creationId = res.data?.id;
    }

    if (!creationId) return { success: false, error: 'Instagram did not return a creation_id' };

    if (mediaType !== 'IMAGE' || mediaItems.some((m) => m.isVideo)) {
      const ready = await waitForContainerReady(creationId, accessToken);
      if (!ready.ready) return { success: false, error: ready.error };
    } else {
      await new Promise((r) => setTimeout(r, 1500));
    }

    const publishRes = await axios.post(`https://graph.facebook.com/v19.0/${instagramUserId}/media_publish`, null, {
      params: { creation_id: creationId, access_token: accessToken }
    });
    return { success: true, publishedMediaId: publishRes.data?.id };
  } catch (error: any) {
    const apiErr = error.response?.data?.error;
    return { success: false, error: apiErr?.error_user_msg || apiErr?.message || error.message };
  }
}

async function publishScheduledPostById(postId: string, force = false): Promise<{ success: boolean; publishedMediaId?: string; error?: string; skipped?: boolean }> {
  const postRef = db.collection('scheduledPosts').doc(postId);
  let postData: any = null;
  try {
    await db.runTransaction(async (tx) => {
      const snap = await tx.get(postRef);
      if (!snap.exists) throw new Error('NOT_FOUND');
      const data = snap.data()!;
      if ((!force && data.status !== 'scheduled') || data.status === 'publishing' || data.status === 'published') {
        throw new Error('ALREADY_HANDLED');
      }
      postData = data;
      tx.update(postRef, { status: 'publishing', updatedAt: admin.firestore.FieldValue.serverTimestamp() });
    });
  } catch (err: any) {
    if (err.message === 'NOT_FOUND') return { success: false, error: 'Scheduled post not found' };
    if (err.message === 'ALREADY_HANDLED') return { success: false, skipped: true, error: 'Post already handled' };
    return { success: false, error: err.message };
  }

  try {
    const userData = await getUserData(postData.userId);
    if (!userData?.instagramAccessToken || !userData?.instagramUserId) {
      await postRef.update({ status: 'failed', errorMessage: 'Instagram account is not connected', updatedAt: admin.firestore.FieldValue.serverTimestamp() });
      return { success: false, error: 'Instagram account is not connected' };
    }

    const mediaItems = Array.isArray(postData.mediaItems) && postData.mediaItems.length > 0
      ? postData.mediaItems
      : (postData.mediaUrls || []).map((url: string) => ({ url, isVideo: postData.mediaType === 'REELS' || /\.(mp4|mov|webm)(\?|$)/i.test(url) }));

    const result = await publishInstagramPost({
      instagramUserId: userData.instagramUserId,
      accessToken: userData.instagramAccessToken,
      mediaType: postData.mediaType || 'IMAGE',
      mediaItems,
      caption: postData.mediaType === 'STORIES' ? '' : (postData.caption || ''),
      userTags: postData.mediaType === 'STORIES' ? [] : (postData.userTags || [])
    });

    if (!result.success || !result.publishedMediaId) {
      await postRef.update({ status: 'failed', errorMessage: result.error || 'Publish failed', updatedAt: admin.firestore.FieldValue.serverTimestamp() });
      return { success: false, error: result.error || 'Publish failed' };
    }

    let createdRuleId: string | null = null;
    const autoEng = postData.autoEngagement;
    if (autoEng?.enabled && autoEng.keyword?.trim()) {
      const ruleDocRef = await db.collection('automationRules').add({
        userId: postData.userId,
        instagramUserId: userData.instagramUserId,
        keyword: autoEng.keyword.toLowerCase().trim(),
        replyMessage: typeof autoEng.replyMessage === 'string' ? autoEng.replyMessage.trim() : '',
        dmMessage: typeof autoEng.dmMessage === 'string' && autoEng.dmMessage.trim() ? autoEng.dmMessage.trim() : null,
        narration: typeof autoEng.narration === 'string' && autoEng.narration.trim() ? autoEng.narration.trim() : null,
        type: autoEng.type || 'COMMENT',
        targetMediaId: result.publishedMediaId,
        targetMediaCaption: typeof postData.caption === 'string' ? postData.caption.slice(0, 120) : null,
        targetMediaUrl: mediaItems[0]?.url || null,
        enabled: true,
        priority: 1,
        triggerCount: 0,
        successCount: 0,
        failureCount: 0,
        lastTriggeredAt: null,
        dailyLimit: 0,
        dailyUsage: 0,
        lastResetAt: admin.firestore.FieldValue.serverTimestamp(),
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      createdRuleId = ruleDocRef.id;
    }

    await postRef.update({
      status: 'published',
      publishedMediaId: result.publishedMediaId,
      createdRuleId,
      errorMessage: null,
      publishedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    return { success: true, publishedMediaId: result.publishedMediaId };
  } catch (err: any) {
    const errorMsg = err.response?.data?.error?.message || err.message || 'Publish error';
    await postRef.update({ status: 'failed', errorMessage: errorMsg, updatedAt: admin.firestore.FieldValue.serverTimestamp() });
    return { success: false, error: errorMsg };
  }
}

app.post('/api/scheduler/posts', verifyFirebaseToken, async (req: any, res) => {
  const firebaseUid = req.firebaseUid;
  const { mediaType, mediaItems, caption, userTags, scheduledAt, autoPublish, autoEngagement } = req.body;
  try {
    if (!Array.isArray(mediaItems) || mediaItems.length === 0) {
      return res.status(400).json({ error: 'At least one uploaded media item or public HTTPS URL is required' });
    }
    const validItems = mediaItems.filter((item: any) => item && typeof item.url === 'string' && /^https?:\/\//i.test(item.url.trim()));
    if (validItems.length === 0) {
      return res.status(400).json({ error: 'Media URLs must be valid public HTTP(S) URLs' });
    }
    if (!scheduledAt || Number.isNaN(new Date(scheduledAt).getTime())) {
      return res.status(400).json({ error: 'A valid scheduled date and time is required' });
    }

    const validTypes = ['IMAGE', 'REELS', 'STORIES', 'CAROUSEL'];
    const resolvedType = validTypes.includes(mediaType)
      ? mediaType
      : (validItems.length > 1 ? 'CAROUSEL' : (validItems[0].isVideo ? 'REELS' : 'IMAGE'));
    const userData = await getUserData(firebaseUid);

    const docRef = await db.collection('scheduledPosts').add({
      userId: firebaseUid,
      instagramUserId: userData?.instagramUserId || null,
      mediaType: resolvedType,
      mediaItems: validItems.map((i: any) => ({ url: i.url.trim(), isVideo: Boolean(i.isVideo) })),
      mediaUrls: validItems.map((i: any) => i.url.trim()),
      caption: resolvedType === 'STORIES' ? '' : (typeof caption === 'string' ? caption.trim() : ''),
      userTags: resolvedType === 'STORIES'
        ? []
        : (Array.isArray(userTags) ? Array.from(new Set(userTags.map((t: any) => String(t).replace(/^@+/, '').trim()).filter(Boolean))).slice(0, 20) : []),
      scheduledAt: new Date(scheduledAt).toISOString(),
      autoPublish: autoPublish !== undefined ? Boolean(autoPublish) : true,
      autoEngagement: autoEngagement?.enabled
        ? {
            enabled: true,
            keyword: String(autoEngagement.keyword || '').toLowerCase().trim(),
            type: ['COMMENT', 'MESSAGE', 'ALL'].includes(autoEngagement.type) ? autoEngagement.type : 'COMMENT',
            replyMessage: typeof autoEngagement.replyMessage === 'string' ? autoEngagement.replyMessage.trim() : '',
            dmMessage: typeof autoEngagement.dmMessage === 'string' && autoEngagement.dmMessage.trim() ? autoEngagement.dmMessage.trim() : null,
            narration: typeof autoEngagement.narration === 'string' && autoEngagement.narration.trim() ? autoEngagement.narration.trim() : null
          }
        : null,
      status: 'scheduled',
      publishedMediaId: null,
      createdRuleId: null,
      errorMessage: null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    const created = await docRef.get();
    res.status(201).json({ success: true, post: { postId: docRef.id, ...created.data() } });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to schedule post', details: error.message });
  }
});

app.get('/api/scheduler/posts', verifyFirebaseToken, async (req: any, res) => {
  const firebaseUid = req.firebaseUid;
  try {
    const snapshot = await db.collection('scheduledPosts').where('userId', '==', firebaseUid).get();
    const posts = snapshot.docs
      .map((doc) => ({ postId: doc.id, ...doc.data() }))
      .sort((a: any, b: any) => new Date(b.scheduledAt || 0).getTime() - new Date(a.scheduledAt || 0).getTime());
    res.json({ success: true, posts });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch scheduled posts', details: error.message });
  }
});

app.put('/api/scheduler/posts/:postId', verifyFirebaseToken, async (req: any, res) => {
  const firebaseUid = req.firebaseUid;
  const { postId } = req.params;
  const updates = req.body;
  try {
    const ref = db.collection('scheduledPosts').doc(postId);
    const doc = await ref.get();
    if (!doc.exists) return res.status(404).json({ error: 'Scheduled post not found' });
    if (doc.data()?.userId !== firebaseUid) return res.status(403).json({ error: 'Unauthorized' });
    if (doc.data()?.status === 'published') return res.status(400).json({ error: 'Cannot edit an already published post' });

    const patch: Record<string, any> = { updatedAt: admin.firestore.FieldValue.serverTimestamp() };
    if (typeof updates.caption === 'string') patch.caption = updates.caption.trim();
    if (updates.scheduledAt && !Number.isNaN(new Date(updates.scheduledAt).getTime())) {
      patch.scheduledAt = new Date(updates.scheduledAt).toISOString();
      if (doc.data()?.status === 'failed') {
        patch.status = 'scheduled';
        patch.errorMessage = null;
      }
    }
    if (updates.autoPublish !== undefined) patch.autoPublish = Boolean(updates.autoPublish);
    if (updates.autoEngagement !== undefined) patch.autoEngagement = updates.autoEngagement;

    await ref.update(patch);
    const updated = await ref.get();
    res.json({ success: true, post: { postId, ...updated.data() } });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to update scheduled post', details: error.message });
  }
});

app.delete('/api/scheduler/posts/:postId', verifyFirebaseToken, async (req: any, res) => {
  const firebaseUid = req.firebaseUid;
  const { postId } = req.params;
  try {
    const ref = db.collection('scheduledPosts').doc(postId);
    const doc = await ref.get();
    if (!doc.exists) return res.status(404).json({ error: 'Scheduled post not found' });
    if (doc.data()?.userId !== firebaseUid) return res.status(403).json({ error: 'Unauthorized' });
    await ref.delete();
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to delete scheduled post', details: error.message });
  }
});

app.post('/api/scheduler/posts/:postId/publish-now', verifyFirebaseToken, async (req: any, res) => {
  const firebaseUid = req.firebaseUid;
  const { postId } = req.params;
  try {
    const ref = db.collection('scheduledPosts').doc(postId);
    const doc = await ref.get();
    if (!doc.exists) return res.status(404).json({ error: 'Scheduled post not found' });
    if (doc.data()?.userId !== firebaseUid) return res.status(403).json({ error: 'Unauthorized' });

    const result = await publishScheduledPostById(postId, true);
    if (!result.success) return res.status(400).json({ error: result.error || 'Failed to publish post' });
    const updated = await ref.get();
    res.json({ success: true, publishedMediaId: result.publishedMediaId, post: { postId, ...updated.data() } });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to publish post', details: error.message });
  }
});

app.get('/api/scheduler/run-due', async (req, res) => {
  const cronSecret = process.env.CRON_SECRET?.trim();
  if (cronSecret) {
    const authHeader = req.headers.authorization;
    const querySecret = req.query.secret;
    const provided = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : String(querySecret || '');
    if (provided !== cronSecret) return res.status(401).json({ error: 'Unauthorized cron request' });
  }
  try {
    const nowMs = Date.now();
    const snapshot = await db.collection('scheduledPosts').where('status', '==', 'scheduled').get();
    const dueDocs = snapshot.docs.filter((doc) => {
      const data = doc.data();
      if (data.autoPublish === false || !data.scheduledAt) return false;
      const ms = new Date(data.scheduledAt).getTime();
      return !Number.isNaN(ms) && ms <= nowMs;
    });
    let published = 0;
    let failed = 0;
    for (const doc of dueDocs) {
      const result = await publishScheduledPostById(doc.id, false);
      if (result.skipped) continue;
      if (result.success) published++;
      else failed++;
    }
    res.json({ success: true, processed: dueDocs.length, published, failed });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to run due scheduled posts', details: error.message });
  }
});

// Combined 1-minute cron endpoint for Vercel (runs both scheduled posts + comment/DM auto-reply polling)
app.get('/api/cron/tick', async (req, res) => {
  const cronSecret = process.env.CRON_SECRET?.trim();
  if (cronSecret) {
    const authHeader = req.headers.authorization;
    const querySecret = req.query.secret;
    const provided = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : String(querySecret || '');
    if (provided !== cronSecret) {
      return res.status(401).json({ error: 'Unauthorized cron request' });
    }
  }

  const summary: any = {
    success: true,
    timestamp: new Date().toISOString(),
    scheduler: { processed: 0, published: 0, failed: 0 },
    polling: { usersPolled: 0, usersSkipped: 0, checkedComments: 0 }
  };

  // 1. Run due scheduled posts
  try {
    const nowMs = Date.now();
    const snapshot = await db.collection('scheduledPosts').where('status', '==', 'scheduled').get();
    const dueDocs = snapshot.docs.filter((doc) => {
      const data = doc.data();
      if (data.autoPublish === false || !data.scheduledAt) return false;
      const ms = new Date(data.scheduledAt).getTime();
      return !Number.isNaN(ms) && ms <= nowMs;
    });
    summary.scheduler.processed = dueDocs.length;
    for (const doc of dueDocs) {
      const result = await publishScheduledPostById(doc.id, false);
      if (result.skipped) continue;
      if (result.success) summary.scheduler.published++;
      else summary.scheduler.failed++;
    }
  } catch (err: any) {
    console.error('[Cron Tick] Scheduler error:', err.message);
    summary.scheduler.error = err.message;
  }

  // 2. Poll recent Instagram comments for all users with active automation rules
  try {
    const activeRulesSnapshot = await db.collection('automationRules')
      .where('enabled', '==', true)
      .get();

    const userIds = new Set<string>();
    activeRulesSnapshot.docs.forEach((doc) => {
      const uid = doc.data()?.userId;
      if (uid) userIds.add(uid);
    });

    for (const uid of userIds) {
      try {
        const pollRes = await pollCommentsForUser(uid);
        summary.polling.usersPolled++;
        summary.polling.checkedComments += pollRes.checkedComments || 0;
      } catch (err: any) {
        const oauthCode = err.response?.data?.error?.code;
        summary.polling.usersSkipped++;
        if (oauthCode === 190) {
          console.warn(`[Cron Tick] Skipping user ${uid} (expired/invalid Facebook token code 190)`);
        } else {
          console.error(`[Cron Tick] Poll error for user ${uid}:`, err.response?.data || err.message);
        }
      }
    }
  } catch (err: any) {
    console.error('[Cron Tick] Polling error:', err.message);
    summary.polling.error = err.message;
  }

  res.json(summary);
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
