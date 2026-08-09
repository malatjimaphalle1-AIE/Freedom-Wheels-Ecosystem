import type { MetadataRoute } from 'next'

// robots.ts — automatically generates /robots.txt
// Allows all crawlers, points to sitemap.

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.freedomwheels.online'

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin', '/api/admin', '/api/auth', '/api/member', '/api/debug'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
