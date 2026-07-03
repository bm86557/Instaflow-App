// src/services/instagramService.ts

import { auth } from '../lib/firebase';

const API_BASE = '/api/instagram';

/**
 * Get Firebase ID token for authenticated requests
 */
async function getAuthToken(): Promise<string> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('User not authenticated');
  }
  return await user.getIdToken();
}

/**
 * Fetch followers count
 */
export async function fetchFollowers() {
  try {
    const token = await getAuthToken();
    const response = await fetch(`${API_BASE}/followers`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch followers');
    }

    const data = await response.json();
    return data.followers;
  } catch (error: any) {
    console.error('[InstagramService] Error fetching followers:', error);
    throw error;
  }
}

/**
 * Fetch engagement rate
 */
export async function fetchEngagementRate() {
  try {
    const token = await getAuthToken();
    const response = await fetch(`${API_BASE}/engagement`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch engagement rate');
    }

    const data = await response.json();
    return data.engagementRate;
  } catch (error: any) {
    console.error('[InstagramService] Error fetching engagement:', error);
    throw error;
  }
}

/**
 * Fetch weekly reach
 */
export async function fetchWeeklyReach() {
  try {
    const token = await getAuthToken();
    const response = await fetch(`${API_BASE}/reach`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch weekly reach');
    }

    const data = await response.json();
    return data.weeklyReach;
  } catch (error: any) {
    console.error('[InstagramService] Error fetching reach:', error);
    throw error;
  }
}

/**
 * Fetch auto-replies count
 */
export async function fetchAutoReplies() {
  try {
    const token = await getAuthToken();
    const response = await fetch(`${API_BASE}/auto-replies`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch auto-replies');
    }

    const data = await response.json();
    return data.autoReplies;
  } catch (error: any) {
    console.error('[InstagramService] Error fetching auto-replies:', error);
    throw error;
  }
}

/**
 * Fetch all stats at once
 */
export async function fetchAllStats() {
  try {
    const [followers, engagementRate, weeklyReach, autoReplies] = await Promise.all([
      fetchFollowers(),
      fetchEngagementRate(),
      fetchWeeklyReach(),
      fetchAutoReplies()
    ]);

    return {
      followers,
      engagementRate,
      weeklyReach,
      autoReplies,
      lastUpdated: new Date().toISOString()
    };
  } catch (error: any) {
    console.error('[InstagramService] Error fetching all stats:', error);
    throw error;
  }
}

/**
 * Format large numbers (e.g., 12500 -> "12.5K")
 */
export function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}

/**
 * Format percentage (e.g., 5.234 -> "5.2%")
 */
export function formatPercentage(num: number): string {
  return num.toFixed(1) + '%';
}
