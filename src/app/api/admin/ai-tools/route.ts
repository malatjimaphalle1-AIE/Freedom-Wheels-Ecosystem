import { NextRequest, NextResponse } from 'next/server'
import { checkAdminAuth } from '@/lib/admin-auth'
import { db } from '@/lib/db'

// GET /api/admin/ai-tools — list all tools (including unpublished)
export async function GET(req: NextRequest) {
  const authError = await checkAdminAuth(req)
  if (authError) return authError

  const tools = await db.aiTool.findMany({
    orderBy: [{ category: 'asc' }, { subcategory: 'asc' }, { displayOrder: 'asc' }],
  })
  return NextResponse.json({ tools })
}

// POST /api/admin/ai-tools — create new tool
export async function POST(req: NextRequest) {
  const authError = await checkAdminAuth(req)
  if (authError) return authError

  try {
    const body = await req.json()
    const { name, description, longDescription, url, affiliateUrl, imageUrl,
      category, subcategory, pricing, features, rating, isFeatured, isPublished, displayOrder } = body

    if (!name || !description || !url || !category || !subcategory) {
      return NextResponse.json({ error: 'name, description, url, category, subcategory required' }, { status: 400 })
    }

    const tool = await db.aiTool.create({
      data: { name, description, longDescription: longDescription || null, url,
        affiliateUrl: affiliateUrl || null, imageUrl: imageUrl || null,
        category, subcategory, pricing: pricing || 'Freemium',
        features: features || null, rating: rating || 4,
        isFeatured: isFeatured || false, isPublished: isPublished !== false,
        displayOrder: displayOrder || 100 },
    })
    return NextResponse.json({ ok: true, tool })
  } catch (err) {
    console.error('[admin/ai-tools POST] error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
