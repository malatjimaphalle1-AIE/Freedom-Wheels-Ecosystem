import { NextRequest, NextResponse } from 'next/server'
import { checkAdminAuth } from '@/lib/admin-auth'
import ZAI from 'z-ai-web-dev-sdk'
import fs from 'fs'
import path from 'path'

// Initialize ZAI with config from env vars or /etc/.z-ai-config
// On Vercel, the config file doesn't exist, so we use env vars instead.
let zaiInstance: ZAI | null = null

async function getZAI() {
  if (zaiInstance) return zaiInstance

  // Try config file first (works locally + on some hosts)
  const configPaths = [
    path.join(process.cwd(), '.z-ai-config'),
    '/etc/.z-ai-config',
  ]

  for (const configPath of configPaths) {
    try {
      const configStr = fs.readFileSync(configPath, 'utf-8')
      const config = JSON.parse(configStr)
      if (config.baseUrl && config.apiKey) {
        zaiInstance = new ZAI(config)
        return zaiInstance
      }
    } catch {
      // file doesn't exist, try next
    }
  }

  // Fall back to env vars (set these on Vercel)
  if (process.env.ZAI_BASE_URL && process.env.ZAI_API_KEY) {
    zaiInstance = new ZAI({
      baseUrl: process.env.ZAI_BASE_URL,
      apiKey: process.env.ZAI_API_KEY,
      token: process.env.ZAI_TOKEN || undefined,
      chatId: process.env.ZAI_CHAT_ID || undefined,
      userId: process.env.ZAI_USER_ID || undefined,
    })
    return zaiInstance
  }

  throw new Error('ZAI configuration not found. Set ZAI_BASE_URL, ZAI_API_KEY, ZAI_TOKEN, ZAI_CHAT_ID, ZAI_USER_ID env vars on Vercel.')
}

// POST /api/admin/ai-generate-image
// Headers: X-Admin-Key or session
// Body: { prompt: string, size?: string, style?: string }
//
// Generates an AI image using the z-ai-web-dev-sdk (free, no API key needed).
// Returns base64 image data that the client can display + download.

const SUPPORTED_SIZES = [
  '1024x1024',  // Square (Instagram, social media)
  '768x1344',   // Portrait (Stories, TikTok)
  '864x1152',   // Portrait (Pinterest)
  '1344x768',   // Landscape (blog header, YouTube)
  '1152x864',   // Landscape (Facebook post)
  '1440x720',   // Wide landscape (hero banner, OG image)
  '720x1440',   // Tall portrait (phone wallpaper)
]

// Style presets that enhance the user's prompt
const STYLE_PRESETS: Record<string, string> = {
  'product-photo': 'professional product photography, studio lighting, white background, high quality, detailed, commercial style',
  'marketing-banner': 'modern marketing banner design, clean layout, professional, vibrant colors, high quality',
  'social-media-post': 'eye-catching social media post graphic, bold typography area, vibrant, modern, high quality',
  'lifestyle-photo': 'lifestyle photography, natural lighting, authentic, warm tones, high quality, detailed',
  'illustration': 'digital illustration, modern art style, colorful, creative, high quality',
  'minimalist': 'minimalist design, clean, simple, elegant, modern, lots of white space',
  'hero-banner': 'wide hero banner image, professional, modern, clean, high quality, suitable for website header',
  'infographic': 'infographic style, data visualization, clean icons, modern design, professional',
}

export async function POST(req: NextRequest) {
  const authError = await checkAdminAuth(req)
  if (authError) return authError

  try {
    const body = await req.json()
    const { prompt, size = '1024x1024', style = 'product-photo' } = body as {
      prompt?: string
      size?: string
      style?: string
    }

    if (!prompt || prompt.trim().length < 3) {
      return NextResponse.json(
        { error: 'Prompt must be at least 3 characters' },
        { status: 400 }
      )
    }

    if (!SUPPORTED_SIZES.includes(size)) {
      return NextResponse.json(
        { error: `Invalid size. Supported: ${SUPPORTED_SIZES.join(', ')}` },
        { status: 400 }
      )
    }

    // Build the enhanced prompt with style preset
    const styleEnhancer = STYLE_PRESETS[style] || STYLE_PRESETS['product-photo']
    const fullPrompt = `${prompt}, ${styleEnhancer}`

    console.log('[ai-generate-image] generating:', { prompt: prompt.slice(0, 80), size, style })

    // Generate the image using z-ai-web-dev-sdk
    const zai = await getZAI()
    const response = await zai.images.generations.create({
      prompt: fullPrompt,
      size: size,
    })

    if (!response.data || !response.data[0] || !response.data[0].base64) {
      throw new Error('Image generation API returned no data')
    }

    const imageBase64 = response.data[0].base64
    const dataUrl = `data:image/png;base64,${imageBase64}`

    return NextResponse.json({
      ok: true,
      image: dataUrl,
      prompt: prompt,
      fullPrompt: fullPrompt,
      size: size,
      style: style,
      generatedAt: new Date().toISOString(),
    })
  } catch (err) {
    console.error('[ai-generate-image] error:', err)
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json(
      { error: `Image generation failed: ${message}` },
      { status: 500 }
    )
  }
}
