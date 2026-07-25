import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { SESSION_COOKIE_NAME } from '@/lib/auth'

// POST /api/member/click
// Body: { partnerId: string }
// Records an affiliate link click by the authenticated member.
// Used for transparency ("you've clicked X affiliate links this month").

export async function POST(req: NextRequest) {
  const userId = req.cookies.get(SESSION_COOKIE_NAME)?.value

  try {
    const body = await req.json()
    const { partnerId } = body as { partnerId?: string }

    if (!partnerId) {
      return NextResponse.json({ error: 'partnerId required' }, { status: 400 })
    }

    const partner = await db.affiliatePartner.findUnique({ where: { id: partnerId } })
    if (!partner) {
      return NextResponse.json({ error: 'Partner not found' }, { status: 404 })
    }

    const click = await db.affiliateClick.create({
      data: {
        partnerId,
        userId: userId || null,
        userAgent: req.headers.get('user-agent')?.slice(0, 500) || null,
        referrer: req.headers.get('referer')?.slice(0, 500) || null,
      },
    })

    return NextResponse.json({
      ok: true,
      clickId: click.id,
      redirectUrl: partner.affiliateUrl,
    })
  } catch (err) {
    console.error('[member/click] error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
