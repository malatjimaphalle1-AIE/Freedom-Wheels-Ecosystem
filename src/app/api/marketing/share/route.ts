import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// POST /api/marketing/share
// Body: { platform: string, urlShared: string, page: string, userId?: string }
// Tracks when someone clicks a share button. Fire-and-forget from the client.

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { platform, urlShared, page, userId } = body as {
      platform?: string
      urlShared?: string
      page?: string
      userId?: string
    }

    if (!platform || !urlShared || !page) {
      return NextResponse.json({ error: 'platform, urlShared, and page are required' }, { status: 400 })
    }

    await db.socialShare.create({
      data: {
        platform,
        urlShared,
        page,
        userId: userId || null,
      },
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[marketing/share] error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
