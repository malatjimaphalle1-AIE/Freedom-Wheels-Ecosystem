import { NextRequest, NextResponse } from 'next/server'
import { checkAdminAuth } from '@/lib/admin-auth'
import { db } from '@/lib/db'

// GET /api/admin/product-of-the-day
// Returns all products (active + inactive) for admin management.
export async function GET(req: NextRequest) {
  const authError = await checkAdminAuth(req)
  if (authError) return authError

  const products = await db.productOfTheDay.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      productName: true,
      asin: true,
      affiliateUrl: true,
      imageUrl: true,
      description: true,
      originalPrice: true,
      dealPrice: true,
      whyWeLikeIt: true,
      category: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    },
  })

  return NextResponse.json({ products })
}

// POST /api/admin/product-of-the-day
// Create a new product. Body contains all fields.
// If isActive: true, deactivates all other products (only one active at a time).
export async function POST(req: NextRequest) {
  const authError = await checkAdminAuth(req)
  if (authError) return authError

  try {
    const body = await req.json()
    const {
      productName, asin, affiliateUrl, imageUrl,
      description, originalPrice, dealPrice, whyWeLikeIt,
      category, isActive,
    } = body

    if (!productName || !affiliateUrl || !description) {
      return NextResponse.json(
        { error: 'productName, affiliateUrl, and description are required' },
        { status: 400 }
      )
    }

    // If activating, deactivate all others first
    if (isActive) {
      await db.productOfTheDay.updateMany({
        where: { isActive: true },
        data: { isActive: false },
      })
    }

    const product = await db.productOfTheDay.create({
      data: {
        productName,
        asin: asin || null,
        affiliateUrl,
        imageUrl: imageUrl || null,
        description,
        originalPrice: originalPrice || null,
        dealPrice: dealPrice || null,
        whyWeLikeIt: whyWeLikeIt || null,
        category: category || null,
        isActive: isActive || false,
      },
    })

    console.log('[admin/product-of-the-day] created:', product.id, product.productName)

    return NextResponse.json({ ok: true, product })
  } catch (err) {
    console.error('[admin/product-of-the-day POST] error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
