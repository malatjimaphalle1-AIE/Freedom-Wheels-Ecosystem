import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { seedAffiliatePartners } from '@/lib/seed'

// GET /api/seed
// One-time seed endpoint. Run after fresh DB init to populate affiliate partners.
// In production, restrict this to admin-only or remove after first run.
export async function GET() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Disabled in production' }, { status: 403 })
  }

  try {
    await seedAffiliatePartners()
    const count = await db.affiliatePartner.count()
    return NextResponse.json({ ok: true, partnersSeeded: count })
  } catch (err) {
    console.error('[seed] error:', err)
    return NextResponse.json({ error: 'Seed failed' }, { status: 500 })
  }
}
