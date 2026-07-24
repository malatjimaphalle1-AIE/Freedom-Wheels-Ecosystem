import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/affiliates
// Public list of affiliate partners (displayed on landing page).
export async function GET() {
  const partners = await db.affiliatePartner.findMany({
    where: { isActive: true },
    orderBy: { displayOrder: 'asc' },
    select: {
      id: true,
      name: true,
      url: true,
      commissionRate: true,
      category: true,
      description: true,
    },
  })

  return NextResponse.json({ partners })
}
