import ZAI from 'z-ai-web-dev-sdk'

export async function POST(req: Request) {
  try {
    const { question, articleTitle, articleContent } = await req.json()

    if (!question) {
      return Response.json({ reply: 'Please provide a question.' }, { status: 400 })
    }

    const zai = new ZAI()
    const response = await zai.chat.completions.create({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: `You are a Freedom Wheels™ ecosystem expert assistant. Answer questions about the platform based on the article context provided. Be concise, helpful, and specific. Use markdown formatting. Article: "${articleTitle || 'General'}"` },
        { role: 'user', content: `Context: ${articleContent || 'No specific article context.'}\n\nQuestion: ${question}` }
      ],
    })
    const reply = response.choices?.[0]?.message?.content || 'I couldn\'t generate a response. Please try again.'
    return Response.json({ reply })
  } catch (error) {
    console.error('KB AI error:', error)
    return Response.json({ reply: 'AI assistant is currently unavailable. Please try again later.' }, { status: 500 })
  }
}
