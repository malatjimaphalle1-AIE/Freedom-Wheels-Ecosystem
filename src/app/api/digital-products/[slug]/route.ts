import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/digital-products/[slug]
// Public — returns a single digital product by slug
export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  const product = await db.digitalProduct.findUnique({
    where: { slug },
    select: {
      id: true, slug: true, title: true, subtitle: true, description: true,
      longDescription: true, coverImageUrl: true, priceCents: true,
      compareAtCents: true, tier: true, isFeatured: true, features: true,
    },
  })

  if (!product || !product.isPublished) {
    // check isPublished separately since it's not in select
    const full = await db.digitalProduct.findUnique({ where: { slug }, select: { isPublished: true } })
    if (!full || !full.isPublished) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }
  }

  return NextResponse.json({ product })
}
