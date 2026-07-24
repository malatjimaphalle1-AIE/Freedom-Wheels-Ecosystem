import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyPayFastItn } from '@/lib/payfast'
import type { Tier } from '@/lib/payfast'
import { sendSubscriptionConfirmationEmail } from '@/lib/email'

// POST /api/payfast/notify
// PayFast ITN (Instant Transaction Notification) webhook.
// PayFast posts form-encoded data here when a payment completes (or fails).

export async function POST(req: NextRequest) {
  try {
    // PayFast sends application/x-www-form-urlencoded
    const formData = await req.formData()
    const params: Record<string, string> = {}
    for (const [k, v] of formData.entries()) {
      params[k] = String(v)
    }

    console.log('[payfast/notify] ITN received:', {
      m_payment_id: params['m_payment_id'],
      pf_payment_id: params['pf_payment_id'],
      payment_status: params['payment_status'],
      amount_gross: params['amount_gross'],
    })

    // 1. Verify signature
    const sigCheck = verifyPayFastItn(params)
    if (!sigCheck.valid) {
      console.warn('[payfast/notify] signature invalid:', sigCheck.reason)
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    // 2. Verify payment status
    const paymentStatus = params['payment_status']
    if (paymentStatus !== 'COMPLETE') {
      console.warn('[payfast/notify] non-complete status:', paymentStatus)
      return NextResponse.json({ received: true, status: paymentStatus })
    }

    // 3. Verify amount matches expected subscription price
    const paymentId = params['m_payment_id']
    if (!paymentId) {
      console.warn('[payfast/notify] no m_payment_id')
      return NextResponse.json({ error: 'Missing payment id' }, { status: 400 })
    }

    const payment = await db.subscriptionPayment.findUnique({
      where: { id: paymentId },
    })
    if (!payment) {
      console.warn('[payfast/notify] payment not found:', paymentId)
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
    }

    const expectedAmount = (payment.amountCents / 100).toFixed(2)
    const receivedAmount = parseFloat(params['amount_gross'] || '0').toFixed(2)
    if (expectedAmount !== receivedAmount) {
      console.warn(`[payfast/notify] amount mismatch: expected ${expectedAmount}, got ${receivedAmount}`)
      return NextResponse.json({ error: 'Amount mismatch' }, { status: 400 })
    }

    // 4. Mark payment complete
    await db.subscriptionPayment.update({
      where: { id: payment.id },
      data: {
        status: 'COMPLETED',
        payfastPaymentId: params['pf_payment_id'],
        rawPayload: JSON.stringify(params),
      },
    })

    // 5. Determine if this is the initial subscription payment or a recurring cycle
    // PayFast sends `subscription_type` on the first payment, and a `token` on all recurring payments.
    const token = params['token'] // present on recurring ITNs
    const isInitialSubscription = params['custom_str3'] === 'subscription_initial'
    const isRecurring = !!token && !isInitialSubscription

    const tier = (params['custom_str1'] as Tier) || 'STARTER'
    const userId = params['custom_str2'] || payment.userId
    const now = new Date()
    const periodEnd = new Date(now)
    periodEnd.setMonth(periodEnd.getMonth() + 1)

    if (isInitialSubscription) {
      // First payment — create subscription record, activate user, store token if present
      const subscriptionToken = token || null

      await db.user.update({
        where: { id: userId },
        data: {
          tier,
          status: 'ACTIVE',
          payfastToken: subscriptionToken, // store for future cancellation/management
        },
      })

      // Deactivate any prior active subscriptions for this user
      await db.subscription.updateMany({
        where: { userId, status: 'ACTIVE' },
        data: { status: 'EXPIRED' },
      })

      await db.subscription.create({
        data: {
          userId,
          tier,
          amountCents: payment.amountCents,
          billingCycle: 'MONTHLY',
          status: 'ACTIVE',
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
        },
      })

      console.log('[payfast/notify] initial subscription activated:', { userId, tier, hasToken: !!subscriptionToken })

      // Send subscription confirmation email (non-blocking — don't fail the ITN if email fails)
      const user = await db.user.findUnique({ where: { id: userId }, select: { email: true, name: true } })
      if (user) {
        sendSubscriptionConfirmationEmail(user.email, user.name, tier.charAt(0) + tier.slice(1).toLowerCase(), payment.amountCents)
          .catch(err => console.error('[payfast/notify] confirmation email failed:', err))
      }
    } else if (isRecurring) {
      // Recurring payment — extend subscription period, reactivate if was past_due
      const user = await db.user.findUnique({ where: { id: userId } })

      if (!user) {
        console.warn('[payfast/notify] recurring payment for unknown user:', userId)
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
      }

      // Verify token matches the one we have stored (security check)
      if (user.payfastToken && user.payfastToken !== token) {
        console.warn('[payfast/notify] token mismatch for user:', userId, {
          stored: user.payfastToken,
          received: token,
        })
        return NextResponse.json({ error: 'Token mismatch' }, { status: 400 })
      }

      // Update token if we didn't have it
      if (!user.payfastToken) {
        await db.user.update({
          where: { id: userId },
          data: { payfastToken: token },
        })
      }

      // Find active subscription, extend period
      const activeSub = await db.subscription.findFirst({
        where: { userId, status: 'ACTIVE' },
        orderBy: { createdAt: 'desc' },
      })

      if (activeSub) {
        // Extend from current period end (not from now) to avoid extending twice if ITN is delayed
        const baseDate = activeSub.currentPeriodEnd > now ? activeSub.currentPeriodEnd : now
        const newPeriodEnd = new Date(baseDate)
        newPeriodEnd.setMonth(newPeriodEnd.getMonth() + 1)

        await db.subscription.update({
          where: { id: activeSub.id },
          data: {
            currentPeriodEnd: newPeriodEnd,
            status: 'ACTIVE',
          },
        })

        console.log('[payfast/notify] recurring payment processed:', {
          userId,
          tier,
          newPeriodEnd: newPeriodEnd.toISOString(),
        })
      } else {
        // No active subscription — re-activate (user may have been past_due)
        await db.subscription.create({
          data: {
            userId,
            tier,
            amountCents: payment.amountCents,
            billingCycle: 'MONTHLY',
            status: 'ACTIVE',
            currentPeriodStart: now,
            currentPeriodEnd: periodEnd,
          },
        })

        await db.user.update({
          where: { id: userId },
          data: { tier, status: 'ACTIVE' },
        })

        console.log('[payfast/notify] subscription re-activated:', { userId, tier })
      }
    } else {
      // Non-subscription payment (shouldn't happen with current checkout, but handle gracefully)
      console.warn('[payfast/notify] non-subscription payment received:', payment.id)

      await db.user.update({
        where: { id: userId },
        data: { tier, status: 'ACTIVE' },
      })

      await db.subscription.create({
        data: {
          userId,
          tier,
          amountCents: payment.amountCents,
          billingCycle: 'MONTHLY',
          status: 'ACTIVE',
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
        },
      })
    }

    return NextResponse.json({ received: true, status: 'COMPLETE' })
  } catch (err) {
    console.error('[payfast/notify] error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PayFast also does a GET to verify the URL is live
export async function GET() {
  return NextResponse.json({ ok: true, service: 'payfast-itn' })
}
