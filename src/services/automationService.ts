// src/services/automationService.ts

import { auth } from '../lib/firebase';
import { CreateRuleRequest, UpdateRuleRequest, AutomationRule } from '../types/automationTypes';

const API_BASE = '/api/automation';

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
 * Create a new automation rule
 */
export async function createRule(ruleData: CreateRuleRequest): Promise<AutomationRule> {
  try {
    const token = await getAuthToken();
    const response = await fetch(`${API_BASE}/rules`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(ruleData)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create rule');
    }

    const data = await response.json();
    return data.rule;
  } catch (error: any) {
    console.error('[AutomationService] Error creating rule:', error);
    throw error;
  }
}

/**
 * Get all automation rules for the current user
 */
export async function getRules(): Promise<AutomationRule[]> {
  try {
    const token = await getAuthToken();
    const response = await fetch(`${API_BASE}/rules`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch rules');
    }

    const data = await response.json();
    return data.rules;
  } catch (error: any) {
    console.error('[AutomationService] Error fetching rules:', error);
    throw error;
  }
}

/**
 * Get a single automation rule by ID
 */
export async function getRule(ruleId: string): Promise<AutomationRule> {
  try {
    const token = await getAuthToken();
    const response = await fetch(`${API_BASE}/rules/${ruleId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch rule');
    }

    const data = await response.json();
    return data.rule;
  } catch (error: any) {
    console.error('[AutomationService] Error fetching rule:', error);
    throw error;
  }
}

/**
 * Update an existing automation rule
 */
export async function updateRule(ruleId: string, updates: UpdateRuleRequest): Promise<AutomationRule> {
  try {
    const token = await getAuthToken();
    const response = await fetch(`${API_BASE}/rules/${ruleId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updates)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update rule');
    }

    const data = await response.json();
    return data.rule;
  } catch (error: any) {
    console.error('[AutomationService] Error updating rule:', error);
    throw error;
  }
}

/**
 * Delete an automation rule
 */
export async function deleteRule(ruleId: string): Promise<void> {
  try {
    const token = await getAuthToken();
    const response = await fetch(`${API_BASE}/rules/${ruleId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete rule');
    }
  } catch (error: any) {
    console.error('[AutomationService] Error deleting rule:', error);
    throw error;
  }
}

/**
 * Toggle a rule's enabled status
 */
export async function toggleRule(ruleId: string): Promise<AutomationRule> {
  try {
    const token = await getAuthToken();
    const response = await fetch(`${API_BASE}/rules/${ruleId}/toggle`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to toggle rule');
    }

    const data = await response.json();
    return data.rule;
  } catch (error: any) {
    console.error('[AutomationService] Error toggling rule:', error);
    throw error;
  }
}
