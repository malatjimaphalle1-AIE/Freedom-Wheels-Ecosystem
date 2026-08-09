import type { Metadata } from 'next'
import { db } from '@/lib/db'

// generateMetadata for /guides/[slug]
// Fetches the guide and generates:
// - <title> tag (guide title)
// - <meta name="description"> (guide metaDescription or excerpt)
// - Open Graph tags (for Facebook, WhatsApp, LinkedIn previews)
// - Twitter Card tags (for X/Twitter previews)
// - canonical URL

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.freedomwheels.online'

  try {
    const guide = await db.guide.findUnique({
      where: { slug },
      select: {
        title: true,
        excerpt: true,
        metaDescription: true,
        coverImageUrl: true,
        category: true,
        isPublished: true,
      },
    })

    if (!guide || !guide.isPublished) {
      return {
        title: 'Guide not found — Freedom Wheels',
        robots: { index: false, follow: false },
      }
    }

    const description = guide.metaDescription || guide.excerpt || `Freedom Wheels guide: ${guide.title}`
    const imageUrl = guide.coverImageUrl || `${baseUrl}/og-image.png`

    return {
      title: `${guide.title} — Freedom Wheels`,
      description,
      alternates: {
        canonical: `${baseUrl}/guides/${slug}`,
      },
      openGraph: {
        title: guide.title,
        description,
        url: `${baseUrl}/guides/${slug}`,
        siteName: 'Freedom Wheels',
        type: 'article',
        locale: 'en_ZA',
        images: [
          {
            url: imageUrl,
            width: 1200,
            height: 630,
            alt: guide.title,
          },
        ],
      },
      twitter: {
        card: 'summary_large_image',
        title: guide.title,
        description,
        images: [imageUrl],
      },
      keywords: guide.category ? [guide.category, 'South Africa', 'freelancers', 'guide'] : ['South Africa', 'freelancers', 'guide'],
    }
  } catch (err) {
    console.error('[guide metadata] error:', err)
    return {
      title: 'Guide — Freedom Wheels',
      description: 'Tools, resources, and community for South African entrepreneurs.',
    }
  }
}

// Layout component — renders children with generated metadata
export default function GuideLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
