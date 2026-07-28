'use client'

import { useEffect } from 'react'

// Marketing tracker — runs on every page load.
// If URL contains ?ref=CODE or ?utm_* params, stores them in cookies (30-day expiry)
// AND fires a track-visit API call for attribution.
//
// Cookies are read by the PayFast checkout endpoint to attribute signups
// to the correct referrer + UTM campaign.

const COOKIE_EXPIRY_DAYS = 30
const COOKIE_NAMES = {
  ref: 'fwe_ref',
  utm_source: 'fwe_utm_source',
  utm_medium: 'fwe_utm_medium',
  utm_campaign: 'fwe_utm_campaign',
  utm_content: 'fwe_utm_content',
  utm_term: 'fwe_utm_term',
} as const

function setCookie(name: string, value: string, days: number) {
  const expires = new Date()
  expires.setDate(expires.getDate() + days)
  document.cookie = `${name}=${encodeURIComponent(value)};expires=${expires.toUTCString()};path=/;SameSite=Lax;${process.env.NODE_ENV === 'production' ? 'Secure;' : ''}`
}

export function MarketingTracker() {
  useEffect(() => {
    const url = new URL(window.location.href)
    const params = url.searchParams

    // Collect marketing params from URL
    const ref = params.get('ref')
    const utmSource = params.get('utm_source')
    const utmMedium = params.get('utm_medium')
    const utmCampaign = params.get('utm_campaign')
    const utmContent = params.get('utm_content')
    const utmTerm = params.get('utm_term')

    // Set cookies for any params present (overwrites previous — last-touch attribution)
    if (ref) setCookie(COOKIE_NAMES.ref, ref, COOKIE_EXPIRY_DAYS)
    if (utmSource) setCookie(COOKIE_NAMES.utm_source, utmSource, COOKIE_EXPIRY_DAYS)
    if (utmMedium) setCookie(COOKIE_NAMES.utm_medium, utmMedium, COOKIE_EXPIRY_DAYS)
    if (utmCampaign) setCookie(COOKIE_NAMES.utm_campaign, utmCampaign, COOKIE_EXPIRY_DAYS)
    if (utmContent) setCookie(COOKIE_NAMES.utm_content, utmContent, COOKIE_EXPIRY_DAYS)
    if (utmTerm) setCookie(COOKIE_NAMES.utm_term, utmTerm, COOKIE_EXPIRY_DAYS)

    // Fire track-visit call if there's anything to track
    if (ref || utmSource || utmMedium || utmCampaign) {
      fetch('/api/marketing/track-visit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          referralCode: ref,
          utmSource,
          utmMedium,
          utmCampaign,
          utmContent,
          utmTerm,
          landingPage: url.pathname,
        }),
      }).catch(() => {
        // ignore tracking errors
      })
    }

    // If URL has marketing params, clean them from the address bar
    // (so users don't see ?ref=XXX&utm_source=facebook in the URL — cleaner UX)
    if (ref || utmSource || utmMedium || utmCampaign) {
      const cleanUrl = url.pathname + url.hash
      window.history.replaceState({}, '', cleanUrl)
    }
  }, [])

  return null // this component renders nothing
}
