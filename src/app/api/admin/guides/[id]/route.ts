import { NextRequest, NextResponse } from 'next/server'
import { checkAdminAuth } from '@/lib/admin-auth'
import { db } from '@/lib/db'

// PATCH /api/admin/guides/{id}
// Update an existing guide.

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authError = checkAdminAuth(req)
  if (authError) return authError

  const { id } = await params

  try {
    const body = await req.json()
    const {
      title, slug, excerpt, contentMarkdown,
      category, tags, coverImageUrl,
      isMemberOnly, isPublished, partnerIds
    } = body

    const existing = await db.guide.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Guide not found' }, { status: 404 })
    }

    if (slug && slug !== existing.slug) {
      const slugExists = await db.guide.findUnique({ where: { slug } })
      if (slugExists) {
        return NextResponse.json({ error: 'Slug already exists' }, { status: 400 })
      }
    }

    const wasUnpublished = !existing.isPublished
    const nowPublishing = isPublished === true
    const newPublishedAt = wasUnpublished && nowPublishing
      ? new Date()
      : isPublished === false
        ? null
        : existing.publishedAt

    const updated = await db.guide.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(slug !== undefined && { slug }),
        ...(excerpt !== undefined && { excerpt }),
        ...(contentMarkdown !== undefined && { contentMarkdown }),
        ...(category !== undefined && { category }),
        ...(tags !== undefined && { tags }),
        ...(coverImageUrl !== undefined && { coverImageUrl }),
        ...(isMemberOnly !== undefined && { isMemberOnly }),
        ...(isPublished !== undefined && { isPublished, publishedAt: newPublishedAt }),
      },
    })

    if (Array.isArray(partnerIds)) {
      await db.guidePartnerLink.deleteMany({ where: { guideId: id } })
      if (partnerIds.length > 0) {
        await db.guidePartnerLink.createMany({
          data: partnerIds.map((partnerId: string) => ({ guideId: id, partnerId })),
          skipDuplicates: true,
        })
      }
    }

    return NextResponse.json({ ok: true, guide: updated })
  } catch (err) {
    console.error('[admin/guides PATCH] error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/admin/guides/{id}
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authError = checkAdminAuth(req)
  if (authError) return authError

  const { id } = await params

  try {
    await db.guide.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[admin/guides DELETE] error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
