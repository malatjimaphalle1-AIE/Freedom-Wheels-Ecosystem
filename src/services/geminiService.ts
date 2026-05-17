import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY;

export const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

export const analyzeStrategicInsights = async (revenueBreakdown: any, engines: any[]) => {
  if (!ai) return {
    summary: "Strategic Synthesis Awaiting Master Protocol. Establish API Handshake.",
    actionItems: ["Initialize Neural Bridge", "Synthesize Data Nodes"],
    riskLevel: "Unknown"
  };

  try {
    const prompt = `You are the Sovereign Strategy Engine. Analyze this data:
    Revenue Breakdown: ${JSON.stringify(revenueBreakdown)}
    Engines: ${JSON.stringify(engines)}
    
    Provide a strategic overview in a JSON object:
    {
      "summary": "A 1-2 sentence high-level summary of performance",
      "actionItems": ["Action item 1", "Action item 2", "Action item 3"],
      "riskLevel": "Low | Medium | High"
    }`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ parts: [{ text: prompt }] }],
      config: { responseMimeType: "application/json" }
    });

    return JSON.parse(response.text || "{}");
  } catch (err: any) {
    console.error("AI Analysis failed:", err);
    
    // Check for rate limit error
    const isRateLimit = 
      err?.message?.includes("429") || 
      err?.status === 429 || 
      err?.error?.code === 429 || 
      err?.error?.status === "RESOURCE_EXHAUSTED" ||
      JSON.stringify(err).includes("429") ||
      JSON.stringify(err).includes("RESOURCE_EXHAUSTED");

    if (isRateLimit) {
      return {
        summary: "Digital bandwidth saturated. Neural throughput is currently at peak capacity. Analysis will resume shortly.",
        actionItems: ["Monitor Operational Pulse", "Await Bandwidth Refresh"],
        riskLevel: "Low"
      };
    }

    return {
      summary: "Neural pulse interrupted. Core systems operational but strategy delayed.",
      actionItems: ["Verify API Key", "Re-engage Analysis"],
      riskLevel: "Medium"
    };
  }
};

export const generateLeadFollowup = async (
  lead: any, 
  strategy: "Empathetic" | "Direct" | "Curiosity" | "Value-First" = "Direct", 
  options: { tone?: string, length?: string, context?: string } = {}
) => {
  if (!ai) return {
    subject: "Sovereign Sync Protocol",
    message: `Hey ${lead.name}, I noticed your interest in the Sovereign Core protocols. Let's sync up!`
  };

  const strategyPrompts = {
    "Empathetic": "Focus on understanding their pain points and offering genuine help. Be warm and human.",
    "Direct": "Be punchy, bold, and efficient. Respect their time with a clear value proposition.",
    "Curiosity": "Focus on creating mystery and intrigue about the 'Sovereign Engine'. Use a curiosity gap.",
    "Value-First": "Provide an immediate insight or 'gift' related to their engagement data before asking for anything."
  };

  try {
    const prompt = `You are a world-class AI conversion strategist. Write a high-performance email follow-up.
    Lead Profile: ${JSON.stringify(lead)}
    Strategy: ${strategy} - ${strategyPrompts[strategy]}
    Desired Tone: ${options.tone || "Professional"}
    Requested Length: ${options.length || "Medium"}
    Additional Context: ${options.context || "Initial engagement handshake"}
    
    The brand voice is "Sovereign/Cyberpunk/Elite-Professional" but adjusted to the Desired Tone. High stakes, high reward.
    Return a JSON object:
    {
      "subject": "Compelling Subject Line",
      "message": "The complete email body content"
    }`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ parts: [{ text: prompt }] }],
      config: { responseMimeType: "application/json" }
    });

    return JSON.parse(response.text || "{}");
  } catch (err: any) {
    console.error("Follow-up generation failed:", err);
    
    if (err?.message?.includes("429") || err?.status === 429 || err?.error?.code === 429 || JSON.stringify(err).includes("429") || JSON.stringify(err).includes("RESOURCE_EXHAUSTED")) {
      return {
        subject: "Sovereign Sync (Rate Limited)",
        message: `Strategic bandwidth limit reached. I'll reach out to you as soon as the neural channels clear up, ${lead.name}!`
      };
    }

    return {
      subject: "Sovereign Core Sync",
      message: `Protocol handshake failed, but I'd love to chat, ${lead.name}.`
    };
  }
};

export const enrichLeadData = async (name: string, email: string) => {
  if (!ai) return {
    bio: "Core Intelligence Fetching... establish API key for neural enrichment.",
    company: "Syncing...",
    title: "Resolving...",
    location: "Global Distributed Node",
    linkedin: "linkedin.com/in/sync-pending",
    twitter: "@resolving",
    technologies: ["Quantum Verification", "Sovereign Auth"],
    potentialValue: "$0"
  };

  try {
    const prompt = `Enrich this lead data with professional insights for a futuristic "Sovereign Core" fintech automation platform. 
    Name: ${name}
    Email: ${email}
    
    Generate a highly realistic but futuristic professional profile.
    Return a JSON object:
    {
      "bio": "A short 1-2 sentence professional bio in a cyberpunk/fintech style",
      "company": "Fictional but professional company name",
      "title": "Creative tech job title (e.g. Lead Revenue Architect, Neural Operations Specialist)",
      "location": "City, Country or Remote Region",
      "linkedin": "linkedin path (e.g. linkedin.com/in/john-doe)",
      "twitter": "@handle",
      "technologies": ["Tech A", "Tech B", "Tech C"],
      "potentialValue": "$Amount (estimated LVT)"
    }`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ parts: [{ text: prompt }] }],
      config: { responseMimeType: "application/json" }
    });

    return JSON.parse(response.text || "{}");
  } catch (err: any) {
    console.error("Lead enrichment failed:", err);

    if (err?.message?.includes("429") || err?.status === 429 || err?.error?.code === 429 || JSON.stringify(err).includes("429") || JSON.stringify(err).includes("RESOURCE_EXHAUSTED")) {
      return {
         bio: "Enrichment protocol on standby due to high neural traffic.",
         potentialValue: "Recalculating...",
         company: "Protocol Congested",
         title: "Sync Error"
      };
    }

    return {
       bio: "Manual enrichment required. Neural link unstable.",
       potentialValue: "Undetermined",
       company: "Unknown Node",
       title: "Unknown Vector"
    };
  }
};
