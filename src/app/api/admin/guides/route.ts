import { NextRequest, NextResponse } from 'next/server'
import { checkAdminAuth } from '@/lib/admin-auth'
import { db } from '@/lib/db'

// POST /api/admin/guides
// Create a new guide.
// Body: { title, slug?, excerpt, contentMarkdown, category, tags?, coverImageUrl?, isMemberOnly?, isPublished?, partnerIds? }

export async function POST(req: NextRequest) {
  const authError = await checkAdminAuth(req)
  if (authError) return authError

  try {
    const body = await req.json()
    const {
      title, slug: providedSlug, excerpt, contentMarkdown,
      category, tags = '', coverImageUrl = null, metaDescription = null,
      isMemberOnly = false, isPublished = false, partnerIds = []
    } = body

    if (!title || !excerpt || !contentMarkdown || !category) {
      return NextResponse.json(
        { error: 'title, excerpt, contentMarkdown, and category are required' },
        { status: 400 }
      )
    }

    // Generate slug from title if not provided
    const slug = providedSlug || title.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 80)

    // Check slug uniqueness
    const existing = await db.guide.findUnique({ where: { slug } })
    if (existing) {
      return NextResponse.json({ error: 'Slug already exists' }, { status: 400 })
    }

    const now = new Date()
    const guide = await db.guide.create({
      data: {
        title,
        slug,
        excerpt,
        contentMarkdown,
        category,
        tags,
        coverImageUrl,
        metaDescription,
        isMemberOnly,
        isPublished,
        publishedAt: isPublished ? now : null,
      },
    })

    // Link affiliate partners
    if (Array.isArray(partnerIds) && partnerIds.length > 0) {
      await db.guidePartnerLink.createMany({
        data: partnerIds.map((partnerId: string) => ({
          guideId: guide.id,
          partnerId,
        })),
        skipDuplicates: true,
      })
    }

    return NextResponse.json({ ok: true, guide })
  } catch (err) {
    console.error('[admin/guides POST] error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET /api/admin/guides
// List all guides (including drafts) for admin management
export async function GET(req: NextRequest) {
  const authError = await checkAdminAuth(req)
  if (authError) return authError

  const guides = await db.guide.findMany({
    orderBy: { updatedAt: 'desc' },
    select: {
      id: true,
      slug: true,
      title: true,
      excerpt: true,
      category: true,
      isMemberOnly: true,
      isPublished: true,
      publishedAt: true,
      viewCount: true,
      updatedAt: true,
    },
  })

  return NextResponse.json({ guides })
}
