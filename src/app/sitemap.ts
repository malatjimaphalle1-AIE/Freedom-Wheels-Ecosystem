import type { MetadataRoute } from 'next'
import { db } from '@/lib/db'

// sitemap.ts — automatically generates /sitemap.xml
// Includes: landing page, guides (published), member, transparency, admin

export const dynamic = 'force-dynamic'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.freedomwheels.online'

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/guides`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/transparency`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/member`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ]

  // Add all published guides
  let guidePages: MetadataRoute.Sitemap = []
  try {
    const guides = await db.guide.findMany({
      where: { isPublished: true },
      select: { slug: true, updatedAt: true },
      orderBy: { updatedAt: 'desc' },
    })

    guidePages = guides.map(g => ({
      url: `${baseUrl}/guides/${g.slug}`,
      lastModified: g.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }))
  } catch (err) {
    console.error('[sitemap] failed to fetch guides:', err)
  }

  return [...staticPages, ...guidePages]
}
