'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

// PageViewTracker — fires a page view event on every route change.
// Mounted in the root layout so it runs on every page.

export function PageViewTracker() {
  const pathname = usePathname()

  useEffect(() => {
    // Don't track admin or API routes
    if (pathname?.startsWith('/admin') || pathname?.startsWith('/api')) {
      return
    }

    // Fire-and-forget page view tracking
    fetch('/api/analytics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        path: pathname,
        referrer: document.referrer || null,
      }),
    }).catch(() => {
      // ignore tracking errors — don't break the page
    })
  }, [pathname])

  return null
}
