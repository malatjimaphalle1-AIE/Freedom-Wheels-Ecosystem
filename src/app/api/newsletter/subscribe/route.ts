import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// POST /api/newsletter/subscribe
// Body: { email, name?, source?, utmSource?, utmCampaign? }
// Stores the email for newsletter notifications.

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email, name, source, utmSource, utmCampaign } = body as {
      email?: string
      name?: string
      source?: string
      utmSource?: string
      utmCampaign?: string
    }

    if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      return NextResponse.json({ error: 'Valid email required' }, { status: 400 })
    }

    const normalizedEmail = email.toLowerCase().trim()

    // Upsert — if already subscribed, update their info but don't error
    const subscriber = await db.newsletterSubscriber.upsert({
      where: { email: normalizedEmail },
      create: {
        email: normalizedEmail,
        name: name || null,
        source: source || 'landing_page',
        utmSource: utmSource || null,
        utmCampaign: utmCampaign || null,
        isActive: true,
      },
      update: {
        name: name || undefined,
        isActive: true, // re-subscribe if they previously unsubscribed
      },
    })

    return NextResponse.json({
      ok: true,
      message: 'Subscribed! We\'ll notify you when new guides are published.',
      subscriberId: subscriber.id,
    })
  } catch (err) {
    console.error('[newsletter/subscribe] error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
