import { NextRequest, NextResponse } from 'next/server'
import { checkAdminAuth } from '@/lib/admin-auth'
import { db } from '@/lib/db'

// GET — list all digital products
export async function GET(req: NextRequest) {
  const authError = await checkAdminAuth(req)
  if (authError) return authError
  const products = await db.digitalProduct.findMany({ orderBy: { displayOrder: 'asc' } })
  return NextResponse.json({ products })
}

// POST — create new digital product
export async function POST(req: NextRequest) {
  const authError = await checkAdminAuth(req)
  if (authError) return authError
  try {
    const body = await req.json()
    const { slug, title, subtitle, description, longDescription, coverImageUrl,
      pdfUrl, bonusUrl, priceCents, compareAtCents, tier, isPublished,
      isFeatured, features, displayOrder } = body

    if (!title || !description || !priceCents) {
      return NextResponse.json({ error: 'title, description, priceCents required' }, { status: 400 })
    }

    const genSlug = slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80)

    const product = await db.digitalProduct.create({
      data: { slug: genSlug, title, subtitle: subtitle || null, description,
        longDescription: longDescription || null, coverImageUrl: coverImageUrl || null,
        pdfUrl: pdfUrl || null, bonusUrl: bonusUrl || null,
        priceCents: Number(priceCents), compareAtCents: compareAtCents ? Number(compareAtCents) : null,
        tier: tier || 'standard', isPublished: isPublished !== false,
        isFeatured: isFeatured || false, features: features || null,
        displayOrder: displayOrder || 100 },
    })
    return NextResponse.json({ ok: true, product })
  } catch (err) {
    console.error('[admin/digital-products POST] error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
