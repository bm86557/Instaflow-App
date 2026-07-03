import { GoogleGenAI } from "@google/genai";

const aiString = process.env.GEMINI_API_KEY;
const ai = aiString ? new GoogleGenAI({ apiKey: aiString }) : null;

export async function generateSmartReply(commentText: string, context: string = ""): Promise<string> {
  if (!ai) return "Thank you for your comment!";

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `You are an Instagram assistant for a brand. 
      Context: ${context}
      User Comment: "${commentText}"
      Generate a friendly, concise, and professional reply (max 150 characters). Use emojis if appropriate.`,
    });

    return response.text?.trim() || "Thanks for reaching out!";
  } catch (error) {
    console.error("AI Generation Error:", error);
    return "Thanks for your engagement!";
  }
}
