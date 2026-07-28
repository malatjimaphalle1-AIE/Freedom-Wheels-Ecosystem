import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hashIp } from '@/lib/marketing'

// POST /api/marketing/track-visit
// Body: { referralCode?, utmSource?, utmMedium?, utmCampaign?, utmContent?, utmTerm?, landingPage? }
// Called on page load when UTM params or ref= param are present.
// Stores the visit for marketing attribution.

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      referralCode,
      utmSource,
      utmMedium,
      utmCampaign,
      utmContent,
      utmTerm,
      landingPage,
    } = body

    // Only track if there's something to track (UTM or ref)
    if (!referralCode && !utmSource && !utmMedium && !utmCampaign) {
      return NextResponse.json({ ok: true, tracked: false, reason: 'no marketing params' })
    }

    // Hash IP for privacy
    const forwarded = req.headers.get('x-forwarded-for')
    const ip = forwarded ? forwarded.split(',')[0]! : 'unknown'
    const hashedIp = hashIp(ip)

    const userAgent = req.headers.get('user-agent')?.slice(0, 500) || null

    const visit = await db.referralVisit.create({
      data: {
        referralCode: referralCode || null,
        utmSource: utmSource || null,
        utmMedium: utmMedium || null,
        utmCampaign: utmCampaign || null,
        utmContent: utmContent || null,
        utmTerm: utmTerm || null,
        landingPage: landingPage || '/',
        userAgent,
        ipAddress: hashedIp,
      },
    })

    return NextResponse.json({ ok: true, tracked: true, visitId: visit.id })
  } catch (err) {
    console.error('[marketing/track-visit] error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
