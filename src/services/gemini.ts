import { GoogleGenAI } from "@google/genai";

let aiInstance: GoogleGenAI | null = null;

export function getGeminiModel() {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is required but not found in the environment.");
    }
    aiInstance = new GoogleGenAI({ apiKey });
  }
  return aiInstance;
}

export async function generateMarketingContent(type: string, prompt: string) {
  const ai = getGeminiModel();
  
  const systemInstruction = `
    You are a master marketing strategist and high-level copywriter for "AutoIncome Engine™ – Sovereign Core".
    This platform allows users to build autonomous income streams using AI and cloud infrastructure.
    Tone: Powerful, intelligent, sophisticated, futuristic, and sovereign.
    Style: Minimalist but punchy.
    Goal: Convert readers into users of the Sovereign Core ecosystem.
    Focus on financial autonomy, 24/7 automation, and the shift from active labor to algorithmic revenue.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Generate a high-converting ${type} based on this input: "${prompt}".`,
      config: {
        systemInstruction,
        temperature: 0.8,
        topK: 40,
        topP: 0.95,
      },
    });

    return response.text || "";
  } catch (error: any) {
    console.error("Gemini Content Generation Error:", error);
    const isRateLimit = 
      error.message?.includes("429") || 
      error.status === 429 || 
      error.error?.code === 429 || 
      JSON.stringify(error).includes("429") ||
      JSON.stringify(error).includes("RESOURCE_EXHAUSTED");
      
    if (isRateLimit) {
      return "The Sovereign AI core is currently recalibrating its neural channels. Please attempt your transmission again shortly (Rate Limit Triggered).";
    }
    throw error;
  }
}
