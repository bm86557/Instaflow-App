# 🏗️ System Architecture

## 📊 Complete Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER JOURNEY                             │
└─────────────────────────────────────────────────────────────────┘

1️⃣ User Creates Rule
   ↓
Frontend (React) → POST /api/automation/rules
   ↓
Backend validates → Saves to Firestore
   ↓
Rule stored in `automationRules` collection ✅


2️⃣ Instagram User Comments
   ↓
"What's the price?" posted on Instagram
   ↓
Instagram detects comment → Sends webhook to your server
   ↓
POST /api/webhooks/instagram (with comment data)


3️⃣ Auto-Reply Engine Activates
   ↓
webhookService.processComment() runs
   ↓
┌─────────────────────────────────────┐
│ Step 1: Find user                   │
│ Query: instagramUserId → Firebase   │
└─────────────────────────────────────┘
   ↓
┌─────────────────────────────────────┐
│ Step 2: Check duplicates            │
│ Query: replyHistory by commentId    │
└─────────────────────────────────────┘
   ↓
┌─────────────────────────────────────┐
│ Step 3: Get active rules            │
│ Query: automationRules (enabled)    │
└─────────────────────────────────────┘
   ↓
┌─────────────────────────────────────┐
│ Step 4: Match keyword               │
│ "price" matches "What's the price?" │
└─────────────────────────────────────┘
   ↓
┌─────────────────────────────────────┐
│ Step 5: Check daily limit           │
│ dailyUsage < dailyLimit? ✅         │
└─────────────────────────────────────┘
   ↓
┌─────────────────────────────────────┐
│ Step 6: Send reply                  │
│ POST to Instagram Graph API          │
│ /comments/{id}/replies               │
└─────────────────────────────────────┘
   ↓
┌─────────────────────────────────────┐
│ Step 7: Update statistics           │
│ - Rule: triggerCount++              │
│ - Rule: successCount++               │
│ - User stats: totalCount++          │
└─────────────────────────────────────┘
   ↓
┌─────────────────────────────────────┐
│ Step 8: Log to history              │
│ Save to replyHistory collection     │
└─────────────────────────────────────┘
   ↓
✅ Reply appears on Instagram!
```

---

## 🗂️ File Structure & Responsibilities

```
┌─────────────────────────────────────────────────────────┐
│                     server.ts                           │
│  (Main Server - Routes Manager)                        │
│                                                         │
│  • Initializes Express                                 │
│  • Loads environment variables                         │
│  • Sets up middleware (sessions, JSON)                 │
│  • Registers all route modules                         │
│  • Starts server on port 3000                          │
└─────────────────────────────────────────────────────────┘
                          ↓
        ┌─────────────────┴─────────────────┐
        ↓                                     ↓
┌──────────────────┐              ┌──────────────────┐
│  config/         │              │  middleware/     │
│  firebase.ts     │              │  auth.ts         │
│                  │              │                  │
│  • Init Admin    │              │  • Verify JWT    │
│  • Export db     │              │  • Extract UID   │
└──────────────────┘              └──────────────────┘
        ↓                                     ↓
        └─────────────────┬─────────────────┘
                          ↓
        ┌─────────────────────────────────────┐
        │         routes/ (API Endpoints)     │
        └─────────────────────────────────────┘
                          ↓
    ┌─────────┬──────────┬──────────┬─────────┬──────────┐
    ↓         ↓          ↓          ↓         ↓          ↓
┌────────┐┌────────┐┌────────┐┌────────┐┌────────┐┌────────┐
│auth    ││user    ││analytics││automation││webhook  │
│.routes ││.routes ││.routes ││.routes ││.routes  │
│        ││        ││        ││        ││         │
│/login  ││/status ││/followers││/rules  ││/instagram│
│/oauth  ││        ││/engagement││/toggle ││(POST)   │
│/logout ││        ││/reach   ││/delete ││(GET)    │
└────────┘└────────┘└────────┘└────────┘└────────┘
    ↓         ↓          ↓          ↓         ↓
    └─────────┴──────────┴──────────┴─────────┘
                          ↓
        ┌─────────────────────────────────────┐
        │       services/ (Business Logic)     │
        └─────────────────────────────────────┘
                          ↓
    ┌─────────┬──────────┬──────────┬─────────┐
    ↓         ↓          ↓          ↓         ↓
┌────────┐┌────────┐┌────────┐┌────────┐┌────────┐
│user    ││instagram││automation││webhook  │
│Service ││Service ││Service ││Service  │
│        ││        ││        ││ ⭐      │
│getUser ││sendReply││validate││process  │
│saveUser││getMedia ││verify  ││Comment  │
└────────┘└────────┘└────────┘└────────┘
                                   ↓
                            ┌──────────────┐
                            │ THE ENGINE   │
                            │ Full logic   │
                            │ for auto-    │
                            │ replies      │
                            └──────────────┘
```

---

## 🔄 Data Flow

### Creating an Automation Rule

```
Frontend
   ↓
[User fills form]
keyword: "price"
reply: "Check our prices at example.com"
type: "COMMENT"
   ↓
POST /api/automation/rules
   ↓
auth.ts middleware
   ↓ [verifies JWT token]
automation.routes.ts
   ↓ [receives request]
automationService.validateRuleData()
   ↓ [validates input]
Firestore: automationRules.add()
   ↓ [saves to database]
Response → Frontend
   ↓
✅ Rule displayed in UI
```

---

### Processing Instagram Comment

```
Instagram App
   ↓
[User posts comment]
"What's the price?"
   ↓
Instagram servers detect comment
   ↓
Webhook sent to your server
   ↓
POST /api/webhooks/instagram
{
  object: "instagram",
  entry: [{
    id: "17841491125501570",
    changes: [{
      field: "comments",
      value: {
        id: "comment_123",
        text: "What's the price?",
        from: { username: "john_doe" }
      }
    }]
  }]
}
   ↓
webhook.routes.ts receives
   ↓
Immediately responds: 200 OK
   ↓
Calls webhookService.processComment()
   ↓
┌─────────────────────────────────┐
│ 1. Query Firestore for user    │
│    WHERE instagramUserId == ... │
└─────────────────────────────────┘
   ↓
┌─────────────────────────────────┐
│ 2. Check replyHistory           │
│    Prevent duplicate replies    │
└─────────────────────────────────┘
   ↓
┌─────────────────────────────────┐
│ 3. Get automation rules         │
│    WHERE userId && enabled      │
│    ORDER BY priority            │
└─────────────────────────────────┘
   ↓
┌─────────────────────────────────┐
│ 4. Match keyword                │
│    "price" in "What's the price?│
│    ✅ Match found!              │
└─────────────────────────────────┘
   ↓
┌─────────────────────────────────┐
│ 5. Check daily limit            │
│    dailyUsage: 5 / limit: 10    │
│    ✅ Within limit              │
└─────────────────────────────────┘
   ↓
┌─────────────────────────────────┐
│ 6. Call Instagram API           │
│    POST /comments/123/replies   │
│    body: { message: "Check..." }│
└─────────────────────────────────┘
   ↓
Instagram API responds
{ id: "reply_456" }
   ↓
┌─────────────────────────────────┐
│ 7. Update rule stats            │
│    triggerCount++               │
│    successCount++               │
│    dailyUsage++                 │
└─────────────────────────────────┘
   ↓
┌─────────────────────────────────┐
│ 8. Update user stats            │
│    users/{uid}/stats/autoReplies│
│    totalCount++                 │
└─────────────────────────────────┘
   ↓
┌─────────────────────────────────┐
│ 9. Log to history               │
│    replyHistory.add({           │
│      commentId: "comment_123",  │
│      status: "sent",            │
│      ...                        │
│    })                           │
└─────────────────────────────────┘
   ↓
✅ Reply appears on Instagram
✅ Dashboard stats update
```

---

## 🗄️ Database Architecture

```
Firestore
├── users/
│   └── {firebaseUid}/
│       ├── email
│       ├── instagramAccessToken
│       ├── instagramUserId
│       ├── createdAt
│       ├── connectedAt
│       └── stats/
│           └── autoReplies/
│               ├── totalCount
│               └── lastReplyAt
│
├── automationRules/
│   └── {ruleId}/
│       ├── userId
│       ├── keyword ← Used for matching
│       ├── replyMessage ← Sent to Instagram
│       ├── type (COMMENT/MESSAGE/ALL)
│       ├── enabled ← Must be true
│       ├── priority ← Lower = higher priority
│       ├── triggerCount
│       ├── successCount
│       ├── failureCount
│       ├── lastTriggeredAt
│       ├── dailyLimit
│       ├── dailyUsage
│       └── timestamps
│
└── replyHistory/
    └── {replyId}/
        ├── userId
        ├── ruleId ← Links to rule
        ├── instagramCommentId ← Original comment
        ├── instagramReplyId ← Our reply
        ├── originalComment ← Full text
        ├── replyMessage ← What we sent
        ├── status (sent/failed/rate_limited)
        ├── errorMessage
        └── timestamps
```

---

## 🔌 External Services Integration

```
┌────────────────────────────────────────────────────┐
│              External Services                      │
└────────────────────────────────────────────────────┘

1. Firebase Auth
   • User authentication
   • JWT token generation
   • Token verification

2. Firestore
   • User data storage
   • Rules storage
   • History logging
   • Real-time updates

3. Instagram Graph API
   • OAuth authentication
   • Fetch account data (followers, reach)
   • Send comment replies
   • Read comment data

4. Facebook Webhooks
   • Real-time notifications
   • Comment events
   • Webhook verification
```

---

## 🔐 Security Flow

```
Frontend Request
   ↓
[User clicks "Create Rule"]
   ↓
Gets Firebase ID token
await user.getIdToken()
   ↓
Sends to backend
Authorization: Bearer {token}
   ↓
Middleware: verifyFirebaseToken()
   ↓
admin.auth().verifyIdToken(token)
   ↓
✅ Valid → Extract UID → Continue
❌ Invalid → 401 Unauthorized
   ↓
Check rule ownership
req.firebaseUid === rule.userId
   ↓
✅ Authorized → Process request
❌ Unauthorized → 403 Forbidden
```

---

## 📊 Performance Considerations

### Webhook Processing
- ✅ **Immediate Response** - Returns 200 OK instantly
- ✅ **Async Processing** - Processes comment in background
- ✅ **No Blocking** - Won't delay Instagram's webhook

### Database Queries
- ✅ **Indexed** - userId + enabled for fast rule lookup
- ✅ **Ordered** - Priority-based rule matching
- ✅ **Cached** - User data fetched once per comment

### Rate Limiting
- ✅ **Daily Limits** - Per-rule quotas
- ✅ **Auto-Reset** - Resets every 24 hours
- ✅ **Tracked** - All usage logged

---

## 🎯 Key Design Decisions

### Why Separate Services?
- **Reusability** - Functions used across routes
- **Testability** - Easy to unit test
- **Maintainability** - Clear responsibilities

### Why Async Webhook Processing?
- **Speed** - Instagram requires < 5 second response
- **Reliability** - Won't timeout on slow operations
- **Scalability** - Can handle burst of comments

### Why Reply History?
- **Debugging** - See what was sent
- **Analytics** - Track performance
- **Compliance** - Audit trail
- **Duplicate Prevention** - Don't spam users

---

## 🔄 Lifecycle of a Request

```
1. Browser → Frontend React Component
2. Frontend → API Request (with JWT)
3. Express → Route Handler
4. Middleware → Auth Verification
5. Route → Service Function
6. Service → Database Query
7. Database → Returns Data
8. Service → Business Logic
9. Service → External API (if needed)
10. Route → Format Response
11. Express → Send JSON
12. Frontend → Update UI
```

---

## 🎓 Architecture Patterns Used

- **MVC-like** - Routes (Controllers), Services (Models), Frontend (Views)
- **Middleware Pattern** - Auth verification
- **Service Layer** - Business logic separation
- **Repository Pattern** - Database abstraction
- **Webhook Pattern** - Event-driven architecture
- **REST API** - Standard HTTP methods

---

**This architecture is production-ready, scalable, and maintainable!** 🚀
