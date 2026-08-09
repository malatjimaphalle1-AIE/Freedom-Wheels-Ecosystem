import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import crypto from 'crypto'

// POST /api/analytics/track
// Body: { path, referrer?, utmSource?, utmMedium?, utmCampaign? }
// Records a page view for analytics. Fire-and-forget from the client.

function hashIp(ip: string): string {
  return crypto.createHash('sha256').update(ip).digest('hex').slice(0, 16)
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { path, referrer } = body as { path?: string; referrer?: string }

    if (!path) {
      return NextResponse.json({ error: 'path required' }, { status: 400 })
    }

    // Read UTM from cookies (set by MarketingTracker)
    const utmSource = req.cookies.get('fwe_utm_source')?.value || null
    const utmMedium = req.cookies.get('fwe_utm_medium')?.value || null
    const utmCampaign = req.cookies.get('fwe_utm_campaign')?.value || null

    // Read session if logged in
    const userId = req.cookies.get('fwe_session')?.value || null

    // Hash IP for privacy
    const forwarded = req.headers.get('x-forwarded-for')
    const ip = forwarded ? forwarded.split(',')[0]! : 'unknown'
    const hashedIp = hashIp(ip)

    const userAgent = req.headers.get('user-agent')?.slice(0, 500) || null

    await db.pageView.create({
      data: {
        path,
        userAgent,
        referrer: referrer?.slice(0, 500) || null,
        ipAddress: hashedIp,
        utmSource,
        utmMedium,
        utmCampaign,
        userId: userId || null,
      },
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[analytics/track] error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
