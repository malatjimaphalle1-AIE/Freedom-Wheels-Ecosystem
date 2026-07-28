// Referral code generation + UTM tracking utilities

import crypto from 'crypto'
import { db } from '@/lib/db'

// Generate a unique referral code for a user.
// Format: first 8 chars of name (uppercase, alnum only) + 4 random digits
// Example: "MAPHALLE1234" or "JANE8765"
//
// Falls back to "FW" + userId-suffix if name is empty.
export async function generateUniqueReferralCode(name?: string | null, userId?: string): Promise<string> {
  const base = (name || '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 8)

  // If no usable name chars, use "FW" prefix
  const prefix = base.length >= 3 ? base : 'FW' + (userId || '').slice(-4).toUpperCase()

  // Try up to 10 times to find a unique code
  for (let attempt = 0; attempt < 10; attempt++) {
    const randomDigits = Math.floor(1000 + Math.random() * 9000).toString()
    const code = prefix + randomDigits

    const existing = await db.user.findUnique({ where: { referralCode: code } })
    if (!existing) {
      return code
    }
  }

  // Fallback: use userId suffix (guaranteed unique)
  return 'FW' + (userId || Math.random().toString(36).slice(2, 8)).toUpperCase().slice(-8)
}

// Parse UTM params from a URL
export interface UTMParams {
  utmSource?: string
  utmMedium?: string
  utmCampaign?: string
  utmContent?: string
  utmTerm?: string
  ref?: string // referral code
}

export function parseUTMParams(url: URL): UTMParams {
  return {
    utmSource: url.searchParams.get('utm_source') || undefined,
    utmMedium: url.searchParams.get('utm_medium') || undefined,
    utmCampaign: url.searchParams.get('utm_campaign') || undefined,
    utmContent: url.searchParams.get('utm_content') || undefined,
    utmTerm: url.searchParams.get('utm_term') || undefined,
    ref: url.searchParams.get('ref') || undefined,
  }
}

// Build a referral URL for a member
// Example: https://www.freedomwheels.online/?ref=MAPHALLE1234
export function buildReferralUrl(referralCode: string, page?: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.freedomwheels.online'
  const path = page || '/'
  return `${baseUrl}${path}?ref=${referralCode}`
}

// Social share URL builders
export function buildShareUrl(platform: string, url: string, text: string): string {
  const encodedUrl = encodeURIComponent(url)
  const encodedText = encodeURIComponent(text)

  switch (platform) {
    case 'whatsapp':
      return `https://wa.me/?text=${encodedText}%20${encodedUrl}`
    case 'facebook':
      return `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedText}`
    case 'twitter':
      return `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`
    case 'linkedin':
      return `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`
    case 'telegram':
      return `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`
    case 'email':
      return `mailto:?subject=${encodedText}&body=${encodedText}%0A%0A${encodedUrl}`
    case 'copy':
      return url // just copy the URL
    default:
      return url
  }
}

// Hash an IP address for privacy (SHA-256, truncated)
export function hashIp(ip: string): string {
  return crypto.createHash('sha256').update(ip).digest('hex').slice(0, 16)
}
