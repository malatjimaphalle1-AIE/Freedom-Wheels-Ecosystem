import { NextRequest, NextResponse } from 'next/server'
import { checkAdminAuth } from '@/lib/admin-auth'

// POST /api/admin/ai-generate-image
// Headers: X-Admin-Key or session
// Body: { prompt: string, size?: string, style?: string }
//
// Generates an AI image using Pollinations.ai (FREE, no API key, no auth).
// Uses the FLUX model with enhanced prompt engineering for high quality.
// Returns base64 image data that the client can display + download.

const SIZE_DIMENSIONS: Record<string, { width: number; height: number }> = {
  '1024x1024': { width: 1024, height: 1024 },
  '768x1344':  { width: 768,  height: 1344 },
  '864x1152':  { width: 864,  height: 1152 },
  '1344x768':  { width: 1344, height: 768 },
  '1152x864':  { width: 1152, height: 864 },
  '1440x720':  { width: 1440, height: 720 },
  '720x1440':  { width: 720,  height: 1440 },
}

// Enhanced style presets with quality boosters for FLUX model
const STYLE_PRESETS: Record<string, string> = {
  'product-photo': 'professional product photography, studio lighting, soft shadows, white seamless background, high-end commercial photography, 4K, ultra-detailed, sharp focus, depth of field',
  'marketing-banner': 'modern marketing banner, clean professional design, vibrant gradient background, copy space, premium quality, 4K, ultra-detailed, sharp focus, commercial advertising style',
  'social-media-post': 'eye-catching social media graphic, bold visual composition, modern aesthetic, vibrant colors, high engagement design, 4K, ultra-detailed, professional graphic design',
  'lifestyle-photo': 'authentic lifestyle photography, golden hour natural lighting, warm cinematic tones, shallow depth of field, candid moment, 4K, ultra-realistic, professional photography, film grain',
  'illustration': 'modern digital illustration, vibrant color palette, clean vector style, professional concept art, 4K, highly detailed, sharp lines, creative composition',
  'minimalist': 'minimalist design, clean composition, abundant negative space, elegant simplicity, soft neutral colors, modern aesthetic, 4K, ultra-clean, professional design',
  'hero-banner': 'wide cinematic hero banner, dramatic lighting, professional composition, modern aesthetic, suitable for website header, 4K, ultra-detailed, epic scale, sharp focus',
  'infographic': 'modern infographic style, clean data visualization, professional icon design, organized layout, corporate aesthetic, 4K, ultra-detailed, sharp vector graphics',
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

    // Enhanced prompt with quality boosters
    const fullPrompt = `${prompt}, ${styleEnhancer}, high quality, masterpiece, best quality, highly detailed`

    console.log('[ai-generate-image] generating via Pollinations.ai (FLUX):', {
      prompt: prompt.slice(0, 80),
      size,
      style,
      dims,
    })

    // Build Pollinations.ai URL with FLUX model + enhance
    // model=flux = best quality model on Pollinations (Black Forest Labs FLUX.1)
    // enhance=true = Pollinations enhances the prompt with AI before generating
    // nologo=true = removes watermark
    const encodedPrompt = encodeURIComponent(fullPrompt)
    const seed = Math.floor(Math.random() * 1000000)
    const pollinationsUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${dims.width}&height=${dims.height}&seed=${seed}&nologo=true&model=flux&enhance=true`

    // Fetch the image from Pollinations.ai
    // Increased timeout to 60s for FLUX model (higher quality = slower)
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 60000)

    const imageResponse = await fetch(pollinationsUrl, {
      method: 'GET',
      headers: { 'Accept': 'image/jpeg' },
      signal: controller.signal,
    })

    clearTimeout(timeout)

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
      model: 'flux',
    })

    return NextResponse.json({
      ok: true,
      image: dataUrl,
      prompt: prompt,
      fullPrompt: fullPrompt,
      size: size,
      style: style,
      model: 'flux',
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
