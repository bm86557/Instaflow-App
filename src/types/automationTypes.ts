// Automation Rules Types

export interface AutomationRule {
  // Rule Identity
  ruleId: string;
  userId: string;
  
  // Rule Configuration
  keyword: string;
  replyMessage: string;
  dmMessage?: string | null;
  narration?: string | null;
  type: 'COMMENT' | 'MESSAGE' | 'ALL';
  targetMediaId?: string | null;
  targetMediaCaption?: string | null;
  targetMediaUrl?: string | null;
  
  // Status & Control
  enabled: boolean;
  priority: number;
  
  // Performance Metrics
  triggerCount: number;
  successCount: number;
  failureCount: number;
  lastTriggeredAt: string | null;
  
  // Rate Limiting
  dailyLimit: number;
  dailyUsage: number;
  lastResetAt: string;
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
}

export interface CreateRuleRequest {
  keyword: string;
  replyMessage: string;
  dmMessage?: string | null;
  narration?: string | null;
  type: 'COMMENT' | 'MESSAGE' | 'ALL';
  targetMediaId?: string | null;
  targetMediaCaption?: string | null;
  targetMediaUrl?: string | null;
  enabled?: boolean;
  priority?: number;
  dailyLimit?: number;
}

export interface InstagramPost {
  id: string;
  caption?: string;
  media_type?: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM' | string;
  media_url?: string;
  thumbnail_url?: string;
  permalink?: string;
  timestamp?: string;
  like_count?: number;
  comments_count?: number;
}

export interface UpdateRuleRequest {
  keyword?: string;
  replyMessage?: string;
  dmMessage?: string | null;
  narration?: string | null;
  type?: 'COMMENT' | 'MESSAGE' | 'ALL';
  targetMediaId?: string | null;
  targetMediaCaption?: string | null;
  targetMediaUrl?: string | null;
  enabled?: boolean;
  priority?: number;
  dailyLimit?: number;
}
