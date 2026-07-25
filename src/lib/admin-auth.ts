// Admin auth helper — used to protect /api/admin/* routes
// Two auth methods:
//   1. X-Admin-Key header (matches ADMIN_API_KEY env var)
//   2. Logged-in session with user.isAdmin = true (cookie-based, for founder UX)
//
// Either method grants admin access.

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { SESSION_COOKIE_NAME } from '@/lib/auth'

export async function checkAdminAuth(req: NextRequest): Promise<NextResponse | null> {
  // Method 1: X-Admin-Key header
  const adminKey = process.env.ADMIN_API_KEY
  if (adminKey) {
    const providedKey = req.headers.get('x-admin-key')
    if (providedKey && providedKey === adminKey) {
      return null // auth passed via API key
    }
  } else {
    return NextResponse.json(
      { error: 'Admin API not configured. Set ADMIN_API_KEY in env.' },
      { status: 503 }
    )
  }

  // Method 2: Session cookie + user.isAdmin
  const sessionUserId = req.cookies.get(SESSION_COOKIE_NAME)?.value
  if (sessionUserId) {
    const user = await db.user.findUnique({
      where: { id: sessionUserId },
      select: { isAdmin: true, status: true },
    })
    if (user?.isAdmin && (user.status === 'ACTIVE' || user.status === 'PAST_DUE')) {
      return null // auth passed via session
    }
  }

  return NextResponse.json(
    { error: 'Unauthorized — provide X-Admin-Key header or log in as an admin user' },
    { status: 401 }
  )
}
