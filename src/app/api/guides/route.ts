import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/guides
// Public list of published guides.
// Query params: ?category=xxx&limit=20

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const category = url.searchParams.get('category')
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 100)

  const where = {
    isPublished: true,
    ...(category && category !== 'all' ? { category } : {}),
  }

  const guides = await db.guide.findMany({
    where,
    orderBy: { publishedAt: 'desc' },
    take: limit,
    select: {
      id: true,
      slug: true,
      title: true,
      excerpt: true,
      coverImageUrl: true,
      category: true,
      tags: true,
      isMemberOnly: true,
      publishedAt: true,
      viewCount: true,
    },
  })

  // Get distinct categories for filter UI
  const categories = await db.guide.findMany({
    where: { isPublished: true },
    select: { category: true },
    distinct: ['category'],
    orderBy: { category: 'asc' },
  })

  return NextResponse.json({
    guides,
    categories: categories.map(c => c.category),
  })
}
