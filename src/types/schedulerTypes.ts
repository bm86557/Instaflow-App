export type ScheduledMediaType = 'IMAGE' | 'REELS' | 'STORIES' | 'CAROUSEL';

export interface ScheduledMediaItem {
  url: string;
  isVideo?: boolean;
}

export interface ScheduledAutoEngagement {
  enabled: boolean;
  keyword: string;
  type: 'COMMENT' | 'MESSAGE' | 'ALL';
  replyMessage?: string;
  dmMessage?: string | null;
  narration?: string | null;
}

export interface ScheduledPost {
  postId: string;
  userId: string;
  instagramUserId?: string | null;
  mediaType: ScheduledMediaType;
  mediaItems: ScheduledMediaItem[];
  mediaUrls: string[];
  caption: string;
  userTags?: string[];
  scheduledAt: string;
  autoPublish: boolean;
  autoEngagement?: ScheduledAutoEngagement | null;
  status: 'scheduled' | 'publishing' | 'published' | 'failed';
  publishedMediaId?: string | null;
  createdRuleId?: string | null;
  errorMessage?: string | null;
}

export interface CreateScheduledPostRequest {
  mediaType: ScheduledMediaType;
  mediaItems: ScheduledMediaItem[];
  caption: string;
  userTags?: string[];
  scheduledAt: string;
  autoPublish: boolean;
  autoEngagement?: ScheduledAutoEngagement | null;
}
