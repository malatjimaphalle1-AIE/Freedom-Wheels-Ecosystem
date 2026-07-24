import { NextRequest, NextResponse } from 'next/server'
import { checkAdminAuth } from '@/lib/admin-auth'
import { db } from '@/lib/db'

// POST /api/admin/record-commission
// Headers: X-Admin-Key: <ADMIN_API_KEY>
// Body: { partnerName: string, amountCents: number, sourceRef?: string, notes?: string, recordedAt?: ISO date }
// Records an external affiliate commission received by the platform.
// Used by the founder (admin) when affiliate partners report payouts.

export async function POST(req: NextRequest) {
  const authError = checkAdminAuth(req)
  if (authError) return authError

  try {
    const body = await req.json()
    const { partnerName, amountCents, sourceRef, notes, recordedAt } = body as {
      partnerName: string
      amountCents: number
      sourceRef?: string
      notes?: string
      recordedAt?: string
    }

    if (!partnerName || typeof amountCents !== 'number' || amountCents <= 0) {
      return NextResponse.json(
        { error: 'partnerName and positive amountCents are required' },
        { status: 400 }
      )
    }

    // Find partner by name
    const partner = await db.affiliatePartner.findUnique({
      where: { name: partnerName },
    })
    if (!partner) {
      return NextResponse.json(
        { error: `Partner "${partnerName}" not found. Seed the partners first.` },
        { status: 404 }
      )
    }

    const commission = await db.affiliateCommission.create({
      data: {
        partnerId: partner.id,
        amountCents,
        currency: 'ZAR',
        sourceRef: sourceRef || null,
        notes: notes || null,
        recordedAt: recordedAt ? new Date(recordedAt) : new Date(),
      },
    })

    console.log('[admin/record-commission] recorded:', {
      partner: partnerName,
      amountCents,
      id: commission.id,
    })

    return NextResponse.json({ ok: true, commission })
  } catch (err) {
    console.error('[admin/record-commission] error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
