import { NextRequest, NextResponse } from 'next/server'
import { checkAdminAuth } from '@/lib/admin-auth'
import { db } from '@/lib/db'

// PATCH /api/admin/product-of-the-day/{id}
// Update an existing product. If activating, deactivates all others.
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authError = await checkAdminAuth(req)
  if (authError) return authError

  const { id } = await params

  try {
    const body = await req.json()
    const {
      productName, asin, affiliateUrl, imageUrl,
      description, originalPrice, dealPrice, whyWeLikeIt,
      category, isActive,
    } = body

    const existing = await db.productOfTheDay.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    // If activating, deactivate all others first
    if (isActive === true) {
      await db.productOfTheDay.updateMany({
        where: { isActive: true, id: { not: id } },
        data: { isActive: false },
      })
    }

    const updated = await db.productOfTheDay.update({
      where: { id },
      data: {
        ...(productName !== undefined && { productName }),
        ...(asin !== undefined && { asin: asin || null }),
        ...(affiliateUrl !== undefined && { affiliateUrl }),
        ...(imageUrl !== undefined && { imageUrl: imageUrl || null }),
        ...(description !== undefined && { description }),
        ...(originalPrice !== undefined && { originalPrice: originalPrice || null }),
        ...(dealPrice !== undefined && { dealPrice: dealPrice || null }),
        ...(whyWeLikeIt !== undefined && { whyWeLikeIt: whyWeLikeIt || null }),
        ...(category !== undefined && { category: category || null }),
        ...(isActive !== undefined && { isActive }),
      },
    })

    return NextResponse.json({ ok: true, product: updated })
  } catch (err) {
    console.error('[admin/product-of-the-day PATCH] error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/admin/product-of-the-day/{id}
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authError = await checkAdminAuth(req)
  if (authError) return authError

  const { id } = await params

  try {
    await db.productOfTheDay.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[admin/product-of-the-day DELETE] error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
