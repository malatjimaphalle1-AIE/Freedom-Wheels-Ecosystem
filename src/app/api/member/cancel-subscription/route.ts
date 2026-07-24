import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { SESSION_COOKIE_NAME } from '@/lib/auth'
import { cancelPayFastSubscription } from '@/lib/payfast-api'

// POST /api/member/cancel-subscription
// Cancels the authenticated member's PayFast subscription.
// Subscription remains active until currentPeriodEnd, then expires.
// Sets cancelAtPeriodEnd=true on the subscription record.

export async function POST(req: NextRequest) {
  const userId = req.cookies.get(SESSION_COOKIE_NAME)?.value

  if (!userId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  try {
    const user = await db.user.findUnique({ where: { id: userId } })
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Find active subscription
    const activeSub = await db.subscription.findFirst({
      where: { userId, status: 'ACTIVE' },
      orderBy: { createdAt: 'desc' },
    })

    if (!activeSub) {
      return NextResponse.json({ error: 'No active subscription to cancel' }, { status: 400 })
    }

    // Mark subscription as cancel_at_period_end
    await db.subscription.update({
      where: { id: activeSub.id },
      data: { cancelAtPeriodEnd: true },
    })

    // If we have a PayFast token, attempt to cancel via API
    // This is best-effort — if it fails, we still mark cancelAtPeriodEnd locally
    // and PayFast will keep charging until we successfully cancel.
    let cancelApiResult: { ok: boolean; error?: string } | null = null
    if (user.payfastToken) {
      if (!process.env.PAYFAST_API_KEY) {
        // No PayFast API key configured — flag this for manual follow-up
        console.warn('[cancel-subscription] PAYFAST_API_KEY not set — manual cancellation required for token:', user.payfastToken)
        cancelApiResult = { ok: false, error: 'PayFast API not configured — founder will manually cancel' }
      } else {
        cancelApiResult = await cancelPayFastSubscription(user.payfastToken)
        if (cancelApiResult.ok) {
          console.log('[cancel-subscription] PayFast API cancellation successful for user:', userId)
        } else {
          console.error('[cancel-subscription] PayFast API cancellation failed:', cancelApiResult.error)
        }
      }
    }

    return NextResponse.json({
      ok: true,
      cancelAtPeriodEnd: true,
      periodEnd: activeSub.currentPeriodEnd.toISOString(),
      payfastApiResult: cancelApiResult,
    })
  } catch (err) {
    console.error('[cancel-subscription] error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
