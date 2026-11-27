import { auth } from '../lib/firebase';
import { CreateScheduledPostRequest, ScheduledMediaItem, ScheduledPost } from '../types/schedulerTypes';

const API_BASE = '/api/scheduler';

async function getAuthToken(): Promise<string> {
  const user = auth.currentUser;
  if (!user) throw new Error('User not authenticated');
  return await user.getIdToken();
}

/**
 * Upload an image or video file directly to Cloudinary (free tier, unsigned upload preset)
 * and return its public HTTPS URL for Meta's Instagram Graph API.
 */
export async function uploadMediaToCloudinary(file: File): Promise<ScheduledMediaItem> {
  const env = (import.meta as any).env || {};
  const cloudName = env.VITE_CLOUDINARY_CLOUD_NAME?.trim();
  const uploadPreset = env.VITE_CLOUDINARY_UPLOAD_PRESET?.trim();

  if (!cloudName || !uploadPreset) {
    throw new Error(
      'Cloudinary is not configured yet. Add VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET to your .env.local (or paste a public HTTPS media URL below).'
    );
  }

  const isVideo = file.type.startsWith('video/');
  const resourceType = isVideo ? 'video' : 'image';
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', uploadPreset);
  formData.append('folder', 'instaflow-scheduled');

  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`, {
    method: 'POST',
    body: formData
  });

  const data = await response.json();
  if (!response.ok || !data.secure_url) {
    throw new Error(data?.error?.message || 'Cloudinary upload failed');
  }

  return {
    url: data.secure_url,
    isVideo
  };
}

export async function getScheduledPosts(): Promise<ScheduledPost[]> {
  const token = await getAuthToken();
  const response = await fetch(`${API_BASE}/posts`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Failed to fetch scheduled posts');
  return data.posts || [];
}

export async function createScheduledPost(payload: CreateScheduledPostRequest): Promise<ScheduledPost> {
  const token = await getAuthToken();
  const response = await fetch(`${API_BASE}/posts`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Failed to schedule post');
  return data.post;
}

export async function deleteScheduledPost(postId: string): Promise<void> {
  const token = await getAuthToken();
  const response = await fetch(`${API_BASE}/posts/${postId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Failed to delete scheduled post');
}

export async function publishScheduledPostNow(postId: string): Promise<ScheduledPost> {
  const token = await getAuthToken();
  const response = await fetch(`${API_BASE}/posts/${postId}/publish-now`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Failed to publish post');
  return data.post;
}
