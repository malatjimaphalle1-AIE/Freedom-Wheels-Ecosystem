import { NextRequest, NextResponse } from 'next/server'
import { verifyMagicToken, SESSION_COOKIE_NAME, SESSION_EXPIRY_DAYS } from '@/lib/auth'

// POST /api/auth/verify
// Body: { token: string }
// Verifies the magic-link token and sets a session cookie.

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { token } = body as { token?: string }

    if (!token) {
      return NextResponse.json({ error: 'Token required' }, { status: 400 })
    }

    const result = await verifyMagicToken(token)
    if (!result) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 })
    }

    const response = NextResponse.json({ ok: true, userId: result.userId })
    response.cookies.set(SESSION_COOKIE_NAME, result.userId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: SESSION_EXPIRY_DAYS * 24 * 60 * 60,
      path: '/',
    })

    return response
  } catch (err) {
    console.error('[auth/verify] error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
