// Magic-link authentication for members.
//
// Flow:
// 1. Member visits /#member and enters their email
// 2. POST /api/auth/magic-link { email } → generates token, returns it (in dev) or emails it (in prod)
// 3. Member clicks link with ?token=xxx → POST /api/auth/verify { token }
// 4. Server sets httpOnly cookie "fwe_session" with user ID
// 5. Subsequent requests use /api/auth/me to fetch user data
//
// In production, step 2 should send an email. For MVP without email infra,
// we return the token in the response and show it on screen for the user to click.
// This is acceptable because the token is single-use and expires in 15 minutes.

import { db } from '@/lib/db'
import crypto from 'crypto'

const MAGIC_TOKEN_EXPIRY_MINUTES = 15

export async function generateMagicToken(email: string): Promise<{ token: string; expiresAt: Date }> {
  const user = await db.user.findUnique({ where: { email: email.toLowerCase().trim() } })
  if (!user) {
    throw new Error('No account found with that email. Subscribe first.')
  }

  if (user.status !== 'ACTIVE' && user.status !== 'PAST_DUE') {
    throw new Error(`Account is not active (status: ${user.status}). Contact maphalle@freedomwheels.online if this is an error.`)
  }

  const token = crypto.randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + MAGIC_TOKEN_EXPIRY_MINUTES * 60 * 1000)

  await db.user.update({
    where: { id: user.id },
    data: { magicToken: token, magicTokenExpiry: expiresAt },
  })

  return { token, expiresAt }
}

export async function verifyMagicToken(token: string): Promise<{ userId: string } | null> {
  if (!token || token.length !== 64) return null

  const user = await db.user.findFirst({
    where: {
      magicToken: token,
      magicTokenExpiry: { gt: new Date() },
    },
    select: { id: true },
  })

  if (!user) return null

  // Clear the token (single-use)
  await db.user.update({
    where: { id: user.id },
    data: { magicToken: null, magicTokenExpiry: null },
  })

  return { userId: user.id }
}

export const SESSION_COOKIE_NAME = 'fwe_session'
export const SESSION_EXPIRY_DAYS = 30
