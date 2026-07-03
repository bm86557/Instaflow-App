/**
 * AI Service - Secure Backend Implementation
 * All AI calls go through /api/ai endpoints to protect GEMINI_API_KEY
 */

interface AIGenerateOptions {
  prompt: string;
  systemInstruction?: string;
  temperature?: number;
  maxTokens?: number;
}

interface AIResponse {
  success: boolean;
  text?: string;
  error?: string;
}

/**
 * Generate AI content using backend API
 */
async function generateAIContent(options: AIGenerateOptions): Promise<AIResponse> {
  try {
    const response = await fetch('/api/ai/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(options),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to generate AI content');
    }

    return data;
  } catch (error: any) {
    console.error('[AI Service] Generate error:', error);
    return {
      success: false,
      error: error.message || 'Failed to generate AI content',
    };
  }
}

/**
 * Generate smart reply for Instagram comments
 */
export async function generateSmartReply(commentText: string, context: string = ""): Promise<string> {
  try {
    const prompt = `You are an Instagram assistant for a brand. 
Context: ${context}
User Comment: "${commentText}"
Generate a friendly, concise, and professional reply (max 150 characters). Use emojis if appropriate.`;

    const result = await generateAIContent({
      prompt,
      systemInstruction: "You are a helpful Instagram assistant that generates engaging replies to comments.",
      temperature: 0.7,
      maxTokens: 100,
    });

    if (result.success && result.text) {
      return result.text.trim();
    }

    return "Thank you for your comment!";
  } catch (error) {
    console.error("AI Generation Error:", error);
    return "Thanks for your engagement!";
  }
}

/**
 * Check if AI service is available
 */
export async function checkAIHealth(): Promise<{ configured: boolean; model?: string }> {
  try {
    const response = await fetch('/api/ai/health');
    const data = await response.json();
    
    return {
      configured: data.configured,
      model: data.model,
    };
  } catch (error) {
    console.error('[AI Service] Health check error:', error);
    return { configured: false };
  }
}
