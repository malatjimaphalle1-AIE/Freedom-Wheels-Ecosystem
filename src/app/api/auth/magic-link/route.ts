import { NextRequest, NextResponse } from 'next/server'
import { generateMagicToken } from '@/lib/auth'
import { sendMagicLinkEmail, isDevMode } from '@/lib/email'

// POST /api/auth/magic-link
// Body: { email: string }
// Generates a magic-link token.
// - If EMAIL_ENABLED=true and RESEND_API_KEY set: sends email, returns ok only
// - Otherwise (dev mode): returns token directly in response for testing

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email } = body as { email?: string }

    if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      return NextResponse.json({ error: 'Valid email required' }, { status: 400 })
    }

    const { token, expiresAt } = await generateMagicToken(email)

    const devMode = isDevMode()

    if (devMode) {
      // Dev mode: return token directly for testing
      console.log(`[auth/magic-link] DEV MODE — token for ${email}: ${token}`)
      return NextResponse.json({
        ok: true,
        token,
        expiresAt: expiresAt.toISOString(),
        devMode: true,
      })
    }

    // Production: send the email
    const emailResult = await sendMagicLinkEmail(email, token)
    if (!emailResult.ok) {
      console.error('[auth/magic-link] failed to send email to:', email)
      return NextResponse.json(
        { error: 'Failed to send magic link email. Please try again.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      ok: true,
      expiresAt: expiresAt.toISOString(),
      devMode: false,
      message: 'Check your email for the login link.',
    })
  } catch (err) {
    console.error('[auth/magic-link] error:', err)
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
