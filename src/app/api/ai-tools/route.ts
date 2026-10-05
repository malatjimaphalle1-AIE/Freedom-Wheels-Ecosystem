import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/ai-tools
// Public endpoint — returns all published AI tools.
// Query params: ?category=xxx&subcategory=xxx&featured=true&search=xxx

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const category = url.searchParams.get('category')
  const subcategory = url.searchParams.get('subcategory')
  const featured = url.searchParams.get('featured')
  const search = url.searchParams.get('search')

  const where: Record<string, unknown> = { isPublished: true }
  if (category) where.category = category
  if (subcategory) where.subcategory = subcategory
  if (featured === 'true') where.isFeatured = true
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
      { features: { contains: search, mode: 'insensitive' } },
    ]
  }

  const tools = await db.aiTool.findMany({
    where,
    orderBy: [{ isFeatured: 'desc' }, { displayOrder: 'asc' }, { rating: 'desc' }],
    select: {
      id: true, name: true, description: true, longDescription: true,
      url: true, affiliateUrl: true, imageUrl: true,
      category: true, subcategory: true, pricing: true,
      features: true, rating: true, isFeatured: true,
    },
  })

  // Get distinct subcategories for filter UI (all categories)
  const subcategories = await db.aiTool.findMany({
    where: { isPublished: true },
    select: { subcategory: true },
    distinct: ['subcategory'],
    orderBy: { subcategory: 'asc' },
  })

  return NextResponse.json({
    tools,
    subcategories: subcategories.map(s => s.subcategory),
  })
}
