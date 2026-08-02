import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/product-of-the-day
// Public endpoint — returns the currently active Product of the Day.
// Returns null if none is active.

export async function GET() {
  const product = await db.productOfTheDay.findFirst({
    where: { isActive: true },
    orderBy: { updatedAt: 'desc' },
  })

  if (!product) {
    return NextResponse.json({ product: null })
  }

  return NextResponse.json({
    product: {
      id: product.id,
      productName: product.productName,
      asin: product.asin,
      affiliateUrl: product.affiliateUrl,
      imageUrl: product.imageUrl,
      description: product.description,
      originalPrice: product.originalPrice,
      dealPrice: product.dealPrice,
      whyWeLikeIt: product.whyWeLikeIt,
      category: product.category,
    },
  })
}
