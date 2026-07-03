import { Router, Request, Response } from 'express';
import { GoogleGenAI } from '@google/genai';

const router = Router();

// Initialize Google AI with server-side API key
const getAIInstance = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY not configured');
  }
  
  return new GoogleGenAI({ apiKey });
};

/**
 * POST /api/ai/generate
 * Generate AI content using Gemini
 */
router.post('/generate', async (req: Request, res: Response) => {
  try {
    const { prompt, systemInstruction, temperature, maxTokens } = req.body;

    if (!prompt) {
      return res.status(400).json({ 
        success: false, 
        error: 'Prompt is required' 
      });
    }

    const ai = getAIInstance();
    
    // Configure generation parameters
    const config: any = {
      model: 'gemini-2.0-flash-exp',
    };

    if (systemInstruction) {
      config.systemInstruction = systemInstruction;
    }

    if (temperature !== undefined) {
      config.temperature = temperature;
    }

    if (maxTokens) {
      config.maxOutputTokens = maxTokens;
    }

    // Generate content
    const result = await ai.generate({
      ...config,
      prompt,
    });

    return res.json({
      success: true,
      text: result.text,
      response: result,
    });

  } catch (error: any) {
    console.error('[AI Route] Error generating content:', error);
    
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate AI content',
    });
  }
});

/**
 * POST /api/ai/chat
 * Start or continue a chat conversation
 */
router.post('/chat', async (req: Request, res: Response) => {
  try {
    const { message, history, systemInstruction } = req.body;

    if (!message) {
      return res.status(400).json({ 
        success: false, 
        error: 'Message is required' 
      });
    }

    const ai = getAIInstance();
    
    const config: any = {
      model: 'gemini-2.0-flash-exp',
      history: history || [],
    };

    if (systemInstruction) {
      config.systemInstruction = systemInstruction;
    }

    // Generate chat response
    const result = await ai.generateContent({
      ...config,
      prompt: message,
    });

    return res.json({
      success: true,
      text: result.text,
      response: result,
    });

  } catch (error: any) {
    console.error('[AI Route] Error in chat:', error);
    
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to process chat message',
    });
  }
});

/**
 * GET /api/ai/health
 * Check if AI service is configured and available
 */
router.get('/health', (req: Request, res: Response) => {
  const isConfigured = !!process.env.GEMINI_API_KEY;
  
  res.json({
    success: true,
    configured: isConfigured,
    model: 'gemini-2.0-flash-exp',
  });
});

export default router;
