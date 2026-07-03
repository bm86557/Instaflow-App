export interface InstagramAccount {
  id: string;
  username: string;
  profilePictureUrl: string;
  followersCount: number;
  followingCount: number;
  mediaCount: number;
}

export interface ScheduledPost {
  id: string;
  caption: string;
  mediaUrl: string;
  mediaType: 'IMAGE' | 'VIDEO';
  scheduledAt: string;
  status: 'PENDING' | 'PUBLISHED' | 'FAILED';
  isStory?: boolean;
  hasPoll?: boolean;
}

export interface AutoReplyRule {
  id: string;
  keyword: string;
  replyMessage: string;
  type: 'COMMENT' | 'MESSAGE' | 'ALL';
  enabled: boolean;
}

export interface AnalyticsData {
  date: string;
  engagement: number;
  reach: number;
  followersChange: number;
}

export interface Comment {
  id: string;
  text: string;
  username: string;
  timestamp: string;
  mediaId: string;
  replied: boolean;
}
