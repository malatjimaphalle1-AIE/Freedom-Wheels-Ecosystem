import ZAI from 'z-ai-web-dev-sdk'

export async function POST(req: Request) {
  try {
    const { question, articleTitle, articleContent } = await req.json()

    if (!question) {
      return Response.json({ reply: 'Please provide a question.' }, { status: 400 })
    }

    try {
      const zai = await ZAI.create()
      const response = await zai.chat.completions.create({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: `You are a Freedom Wheels™ ecosystem expert assistant. Answer questions about the platform based on the article context provided. Be concise, helpful, and specific. Use markdown formatting. Article: "${articleTitle || 'General'}"` },
          { role: 'user', content: `Context: ${articleContent || 'No specific article context.'}\n\nQuestion: ${question}` }
        ],
      })
      const reply = response.choices?.[0]?.message?.content || 'I couldn\'t generate a response. Please try again.'
      return Response.json({ reply })
    } catch (aiError) {
      console.error('KB AI error:', aiError)
      // Fallback response when AI is unavailable
      const fallbackReply = generateFallbackReply(question, articleTitle)
      return Response.json({ reply: fallbackReply })
    }
  } catch (error) {
    console.error('KB AI request error:', error)
    return Response.json({ reply: 'AI assistant is currently unavailable. Please try again later.' }, { status: 500 })
  }
}

function generateFallbackReply(question: string, articleTitle?: string): string {
  const q = question.toLowerCase()
  
  if (q.includes('engine') || q.includes('income')) {
    return `**Income Engines** are autonomous systems that generate revenue 24/7 without your constant attention. Start with the **Content Syndicator** template — it's the easiest to set up and shows results within days.\n\nKey steps:\n1. Go to **Engine Builder** → New Engine\n2. Select your engine type\n3. Configure inputs → AI processing → outputs\n4. Click **Deploy** and monitor in Live Engines\n\nNeed more details? Check the "Building Your First Income Engine" article in the Knowledge Base.`
  }
  
  if (q.includes('lead') || q.includes('scor')) {
    return `**Lead Scoring** in Freedom Wheels uses AI to rank prospects from 0-100:\n- **Hot (80-100):** Immediate personalized outreach\n- **Warm (50-79):** Targeted nurture sequences\n- **Cold (0-49):** Long-term automated campaigns\n\nThe AI re-scores leads every 6 hours based on behavioral, demographic, intent, and recency signals.`
  }
  
  if (q.includes('wallet') || q.includes('withdraw') || q.includes('money')) {
    return `The **Multi-Asset Wallet** supports both fiat (USD, EUR, GBP, ZAR) and crypto (BTC, ETH, SOL, USDT). All engine earnings flow in automatically.\n\n**Withdrawal options:**\n- Wise: 1-2 business days\n- Crypto: 10-30 minutes\n- Bank: 3-5 business days\n\nMinimum withdrawal: $50 fiat / $25 crypto equivalent.`
  }
  
  if (q.includes('referral') || q.includes('refer')) {
    return `The **Referral Program** rewards you for bringing new users:\n- FREE signup: **$5 credit**\n- STARTER upgrade: **$25 bonus**\n- PRO upgrade: **$75 bonus**\n- SOVEREIGN upgrade: **$200 bonus**\n\nPlus **5% revenue share** from referral earnings for 12 months!`
  }
  
  return `Great question! While the AI is temporarily unavailable, I can tell you that the Freedom Wheels™ Knowledge Base covers topics including:\n\n- 🚀 **Getting Started** — Quick start guide\n- ⚙️ **Engines** — Building and configuring income engines\n- 👥 **Leads** — AI-powered lead scoring\n- 💰 **Wallet** — Multi-asset financial management\n- 🌐 **Traffic** — AI content generation\n- ⚡ **Automation** — Workflow patterns\n- 🔐 **Security** — Best practices\n\nPlease try your question again in a moment when the AI service is back online.`
}
