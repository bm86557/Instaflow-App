// Automation Rules Types

export interface AutomationRule {
  // Rule Identity
  ruleId: string;
  userId: string;
  
  // Rule Configuration
  keyword: string;
  replyMessage: string;
  type: 'COMMENT' | 'MESSAGE' | 'ALL';
  
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
  type: 'COMMENT' | 'MESSAGE' | 'ALL';
  enabled?: boolean;
  priority?: number;
  dailyLimit?: number;
}

export interface UpdateRuleRequest {
  keyword?: string;
  replyMessage?: string;
  type?: 'COMMENT' | 'MESSAGE' | 'ALL';
  enabled?: boolean;
  priority?: number;
  dailyLimit?: number;
}
