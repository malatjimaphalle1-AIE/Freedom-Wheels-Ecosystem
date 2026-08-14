import { NextRequest, NextResponse } from 'next/server'
import { checkAdminAuth } from '@/lib/admin-auth'

// POST /api/admin/ai-generate-image
// Headers: X-Admin-Key or session
// Body: { prompt: string, size?: string, style?: string }
//
// Generates an AI image using Pollinations.ai (FREE, no API key, no auth).
// Returns base64 image data that the client can display + download.
//
// Pollinations.ai API:
//   GET https://image.pollinations.ai/prompt/{encoded_prompt}?width=W&height=H&seed=S&nologo=true&model=flux
//   Returns: image/jpeg directly

const SIZE_DIMENSIONS: Record<string, { width: number; height: number }> = {
  '1024x1024': { width: 1024, height: 1024 },
  '768x1344':  { width: 768,  height: 1344 },
  '864x1152':  { width: 864,  height: 1152 },
  '1344x768':  { width: 1344, height: 768 },
  '1152x864':  { width: 1152, height: 864 },
  '1440x720':  { width: 1440, height: 720 },
  '720x1440':  { width: 720,  height: 1440 },
}

const STYLE_PRESETS: Record<string, string> = {
  'product-photo': 'professional product photography, studio lighting, white background, high quality, detailed, commercial style',
  'marketing-banner': 'modern marketing banner design, clean layout, professional, vibrant colors, high quality',
  'social-media-post': 'eye-catching social media post graphic, bold, vibrant, modern, high quality',
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

    const dims = SIZE_DIMENSIONS[size] || SIZE_DIMENSIONS['1024x1024']
    const styleEnhancer = STYLE_PRESETS[style] || STYLE_PRESETS['product-photo']
    const fullPrompt = `${prompt}, ${styleEnhancer}`

    console.log('[ai-generate-image] generating via Pollinations.ai:', {
      prompt: prompt.slice(0, 80),
      size,
      style,
      dims,
    })

    // Build Pollinations.ai URL
    // model=flux gives the best quality, nologo=true removes the watermark
    const encodedPrompt = encodeURIComponent(fullPrompt)
    const seed = Math.floor(Math.random() * 1000000)
    const pollinationsUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${dims.width}&height=${dims.height}&seed=${seed}&nologo=true&model=flux`

    // Fetch the image from Pollinations.ai
    const imageResponse = await fetch(pollinationsUrl, {
      method: 'GET',
      headers: {
        'Accept': 'image/jpeg',
      },
    })

    if (!imageResponse.ok) {
      throw new Error(`Pollinations.ai returned ${imageResponse.status}: ${imageResponse.statusText}`)
    }

    // Get the image as a buffer
    const imageBuffer = await imageResponse.arrayBuffer()
    const buffer = Buffer.from(imageBuffer)

    // Convert to base64 data URL
    const base64 = buffer.toString('base64')
    const dataUrl = `data:image/jpeg;base64,${base64}`

    console.log('[ai-generate-image] success:', {
      size: buffer.length,
      prompt: prompt.slice(0, 50),
    })

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
