import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { SESSION_COOKIE_NAME } from '@/lib/auth'

// GET /api/guides/{slug}
// Returns a single published guide by slug.
// Member-only guides return only excerpt + truncated content for non-members.

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const userId = req.cookies.get(SESSION_COOKIE_NAME)?.value

  const guide = await db.guide.findUnique({
    where: { slug },
    include: {
      partnerLinks: {
        include: {
          partner: {
            select: { id: true, name: true, url: true, affiliateUrl: true, commissionRate: true, category: true }
          }
        }
      }
    }
  })

  if (!guide || !guide.isPublished) {
    return NextResponse.json({ error: 'Guide not found' }, { status: 404 })
  }

  // Increment view count (fire and forget)
  db.guide.update({
    where: { id: guide.id },
    data: { viewCount: { increment: 1 } }
  }).catch(() => {})

  // Check if user is a member (for member-only content)
  let isMember = false
  if (userId) {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { status: true }
    })
    isMember = user?.status === 'ACTIVE' || user?.status === 'PAST_DUE'
  }

  const isLocked = guide.isMemberOnly && !isMember

  return NextResponse.json({
    guide: {
      id: guide.id,
      slug: guide.slug,
      title: guide.title,
      excerpt: guide.excerpt,
      category: guide.category,
      tags: guide.tags,
      coverImageUrl: guide.coverImageUrl,
      isMemberOnly: guide.isMemberOnly,
      publishedAt: guide.publishedAt,
      viewCount: guide.viewCount + 1,
      content: isLocked
        ? guide.contentMarkdown.slice(0, 500) + '\n\n**[The rest of this guide is for Freedom Wheels members only. Subscribe to read the full review.](/#pricing)**'
        : guide.contentMarkdown,
      isLocked,
      isMember,
    },
    partners: guide.partnerLinks.map(pl => pl.partner)
  })
}
