import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/digital-products
// Public — lists all published digital products
export async function GET() {
  const products = await db.digitalProduct.findMany({
    where: { isPublished: true },
    orderBy: [{ isFeatured: 'desc' }, { displayOrder: 'asc' }],
    select: {
      id: true, slug: true, title: true, subtitle: true, description: true,
      coverImageUrl: true, priceCents: true, compareAtCents: true,
      tier: true, isFeatured: true, features: true,
    },
  })

  return NextResponse.json({ products })
}
