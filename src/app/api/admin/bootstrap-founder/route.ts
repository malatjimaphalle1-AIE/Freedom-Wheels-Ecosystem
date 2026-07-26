import { NextRequest, NextResponse } from 'next/server'
import { checkAdminAuth } from '@/lib/admin-auth'
import { db } from '@/lib/db'

// POST /api/admin/bootstrap-founder
// Headers: X-Admin-Key: <ADMIN_API_KEY>
// Body: { email: string, name?: string }
//
// One-time use: creates or upgrades a user to ELITE tier, ACTIVE status, isAdmin=true.
// Also creates an active subscription record (indefinite, no PayFast token — founder is grandfathered).
//
// After running this, the founder can log in at /member via magic link and access
// both their member dashboard AND /admin (without entering the API key each time).
//
// TEMPORARY BYPASS (remove after first successful bootstrap):
// If BOOTSTRAP_TOKEN env var is set, you can call this endpoint with
// ?bootstrap_token=XXX as a query param (matching the env var value) to bypass
// admin auth. This is a one-time escape hatch for cases where the X-Admin-Key
// header isn't working. After bootstrap succeeds, DELETE the BOOTSTRAP_TOKEN
// env var from Render to re-secure the endpoint.

export async function POST(req: NextRequest) {
  // Check for temporary bootstrap token bypass
  const url = new URL(req.url)
  const providedBypassToken = url.searchParams.get('bootstrap_token')
  const expectedBypassToken = process.env.BOOTSTRAP_TOKEN

  const bypassActive = !!(expectedBypassToken && providedBypassToken && providedBypassToken === expectedBypassToken)

  // If bypass isn't active, require normal admin auth
  if (!bypassActive) {
    const authError = await checkAdminAuth(req)
    if (authError) return authError
  }

  try {
    // Body can come from JSON POST body OR from query params (for bypass URL)
    let email: string | undefined
    let name: string | undefined

    if (bypassActive && providedBypassToken) {
      // Bypass mode: read from query params
      email = url.searchParams.get('email') || undefined
      name = url.searchParams.get('name') || undefined
    } else {
      // Normal mode: read from JSON body
      const body = await req.json()
      email = body.email
      name = body.name
    }

    if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      return NextResponse.json({ error: 'Valid email required' }, { status: 400 })
    }

    const normalizedEmail = email.toLowerCase().trim()

    // Check if user already exists
    const existing = await db.user.findUnique({ where: { email: normalizedEmail } })

    const now = new Date()
    const periodEnd = new Date(now)
    periodEnd.setFullYear(periodEnd.getFullYear() + 10) // founder subscription is effectively indefinite

    if (existing) {
      // Upgrade existing user
      const updated = await db.user.update({
        where: { id: existing.id },
        data: {
          name: name || existing.name,
          tier: 'ELITE',
          status: 'ACTIVE',
          isAdmin: true,
        },
      })

      // Deactivate any prior active subscriptions and create a founder subscription
      await db.subscription.updateMany({
        where: { userId: existing.id, status: 'ACTIVE' },
        data: { status: 'EXPIRED' },
      })

      const subscription = await db.subscription.create({
        data: {
          userId: existing.id,
          tier: 'ELITE',
          amountCents: 0, // founder — no charge
          billingCycle: 'MONTHLY',
          status: 'ACTIVE',
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
        },
      })

      console.log('[admin/bootstrap-founder] upgraded existing user:', updated.id, updated.email)

      return NextResponse.json({
        ok: true,
        action: 'upgraded',
        bypassed: bypassActive,
        user: {
          id: updated.id,
          email: updated.email,
          name: updated.name,
          tier: updated.tier,
          status: updated.status,
          isAdmin: updated.isAdmin,
        },
        subscriptionId: subscription.id,
        message: 'Founder account upgraded. Log in at /member to access the platform.',
      })
    } else {
      // Create new user
      const user = await db.user.create({
        data: {
          email: normalizedEmail,
          name: name || null,
          tier: 'ELITE',
          status: 'ACTIVE',
          isAdmin: true,
        },
      })

      const subscription = await db.subscription.create({
        data: {
          userId: user.id,
          tier: 'ELITE',
          amountCents: 0,
          billingCycle: 'MONTHLY',
          status: 'ACTIVE',
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
        },
      })

      console.log('[admin/bootstrap-founder] created new founder user:', user.id, user.email)

      return NextResponse.json({
        ok: true,
        action: 'created',
        bypassed: bypassActive,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          tier: user.tier,
          status: user.status,
          isAdmin: user.isAdmin,
        },
        subscriptionId: subscription.id,
        message: 'Founder account created. Log in at /member to access the platform.',
      })
    }
  } catch (err) {
    console.error('[admin/bootstrap-founder] error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Also support GET for the bypass URL (so you can visit it in a browser)
export async function GET(req: NextRequest) {
  // GET only works with the bypass token
  const url = new URL(req.url)
  const providedBypassToken = url.searchParams.get('bootstrap_token')
  const expectedBypassToken = process.env.BOOTSTRAP_TOKEN

  if (!expectedBypassToken || !providedBypassToken || providedBypassToken !== expectedBypassToken) {
    return NextResponse.json({
      error: 'GET method requires bootstrap_token query param matching BOOTSTRAP_TOKEN env var',
      hint: 'Set BOOTSTRAP_TOKEN in Render env vars, then visit /api/admin/bootstrap-founder?bootstrap_token=XXX&email=...&name=...',
    }, { status: 401 })
  }

  // Reuse the POST logic by calling it
  return POST(req)
}
