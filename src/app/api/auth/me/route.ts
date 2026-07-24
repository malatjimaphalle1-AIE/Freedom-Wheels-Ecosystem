import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { SESSION_COOKIE_NAME } from '@/lib/auth'

// GET /api/auth/me
// Returns the logged-in user's profile, or 401 if not authenticated.

export async function GET(req: NextRequest) {
  const userId = req.cookies.get(SESSION_COOKIE_NAME)?.value

  if (!userId) {
    return NextResponse.json({ authenticated: false }, { status: 401 })
  }

  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      tier: true,
      status: true,
      createdAt: true,
    },
  })

  if (!user) {
    const response = NextResponse.json({ authenticated: false }, { status: 401 })
    response.cookies.delete(SESSION_COOKIE_NAME)
    return response
  }

  return NextResponse.json({ authenticated: true, user })
}
