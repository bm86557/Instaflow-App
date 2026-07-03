import { InstagramAccount, ScheduledPost, AutoReplyRule, AnalyticsData, Comment } from './types';

// Mock data
export const MOCK_ACCOUNT: InstagramAccount = {
  id: 'instaflow_official',
  username: 'instaflow_official',
  profilePictureUrl: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=150&h=150&fit=crop',
  followersCount: 12500,
  followingCount: 450,
  mediaCount: 84,
};

export const MOCK_ANALYTICS: AnalyticsData[] = [
  { date: '2024-04-20', engagement: 450, reach: 1200, followersChange: 15 },
  { date: '2024-04-21', engagement: 520, reach: 1400, followersChange: 22 },
  { date: '2024-04-22', engagement: 480, reach: 1300, followersChange: -5 },
  { date: '2024-04-23', engagement: 610, reach: 1800, followersChange: 45 },
  { date: '2024-04-24', engagement: 750, reach: 2200, followersChange: 60 },
  { date: '2024-04-25', engagement: 680, reach: 1900, followersChange: 30 },
  { date: '2024-04-26', engagement: 820, reach: 2500, followersChange: 85 },
];

export const MOCK_RULES: AutoReplyRule[] = [
  { id: '1', keyword: 'price', replyMessage: 'Hi! Our pricing details are sent to your DM. Check it out!', type: 'COMMENT', enabled: true },
  { id: '2', keyword: 'info', replyMessage: 'Hello! You can find more info at instaflow.app/features', type: 'ALL', enabled: true },
];

export const MOCK_POSTS: ScheduledPost[] = [
  { id: 'p1', caption: 'New features coming soon! 🚀', mediaUrl: 'https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?w=800&q=80', mediaType: 'IMAGE', scheduledAt: '2024-04-30T10:00:00Z', status: 'PENDING' },
];

export const MOCK_COMMENTS: Comment[] = [
  { id: 'c1', text: 'How much does this cost?', username: 'tech_enthusiast', timestamp: '2024-04-27T14:30:00Z', mediaId: 'm1', replied: true },
  { id: 'c2', text: 'Love the new update!', username: 'creative_mind', timestamp: '2024-04-27T15:10:00Z', mediaId: 'm1', replied: false },
];
