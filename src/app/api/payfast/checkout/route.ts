import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import {
  PAYFAST_ENDPOINT,
  PF_TIER_PRICES,
  PF_TIER_NAMES,
  buildPayFastSignature,
  type Tier,
} from '@/lib/payfast'

// POST /api/payfast/checkout
// Body: { tier: 'STARTER'|'PRO'|'ELITE', email, name }
// Returns: { redirectUrl } — full URL the browser should navigate to

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { tier, email, name } = body as { tier: Tier; email: string; name?: string }

    // Validate tier
    if (!tier || !(tier in PF_TIER_PRICES)) {
      return NextResponse.json({ error: 'Invalid tier' }, { status: 400 })
    }

    // Validate email
    if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 })
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    const merchantId = process.env.PAYFAST_MERCHANT_ID
    const merchantKey = process.env.PAYFAST_MERCHANT_KEY

    if (!merchantId || !merchantKey) {
      // Dev mode — return a friendly error explaining the missing config
      return NextResponse.json({
        error: 'PayFast not configured. Set PAYFAST_MERCHANT_ID, PAYFAST_MERCHANT_KEY, PAYFAST_PASSPHRASE, NEXT_PUBLIC_BASE_URL in .env.local',
        devMode: true,
      }, { status: 503 })
    }

    const amountCents = PF_TIER_PRICES[tier]
    const amountRand = (amountCents / 100).toFixed(2)

    // Create user record (or update existing)
    const user = await db.user.upsert({
      where: { email },
      create: {
        email,
        name: name || null,
        tier,
        status: 'PENDING_PAYMENT',
      },
      update: {
        name: name || undefined,
        tier,
      },
    })

    // Create pending payment record
    const payment = await db.subscriptionPayment.create({
      data: {
        userId: user.id,
        amountCents,
        currency: 'ZAR',
        status: 'PENDING',
      },
    })

    // PayFast payment parameters
    // Reference: https://developers.payfast.co.za/api#process-payment
    // Subscription tokenisation: https://developers.payfast.co.za/api#subscriptions
    //
    // We set subscription_type=1 to enable recurring billing.
    // PayFast will charge the user monthly on the billing_date,
    // and send an ITN each cycle with the same token.
    const today = new Date().toISOString().slice(0, 10) // YYYY-MM-DD

    const params: Record<string, string | number | undefined> = {
      merchant_id: merchantId,
      merchant_key: merchantKey,
      return_url: `${baseUrl}/api/payfast/success?paymentId=${payment.id}`,
      cancel_url: `${baseUrl}/api/payfast/cancel?paymentId=${payment.id}`,
      notify_url: `${baseUrl}/api/payfast/notify`,
      name_first: name?.split(' ')[0] || '',
      name_last: name?.split(' ').slice(1).join(' ') || '',
      email_address: email,
      m_payment_id: payment.id,
      amount: amountRand,
      item_name: `Freedom Wheels ${PF_TIER_NAMES[tier]} Membership`,
      item_description: `Monthly subscription — ${PF_TIER_NAMES[tier]} tier`,
      // Subscription tokenisation — enables recurring billing
      subscription_type: '1',           // 1 = recurring subscription
      billing_date: today,              // First charge today, recurring monthly
      recurring_amount: amountRand,     // Amount to charge each cycle
      frequency: '3',                   // 3 = monthly (1=daily, 2=weekly, 3=monthly, 6=quarterly, 7=biannual, 8=yearly)
      cycles: '0',                      // 0 = indefinite (until cancelled)
      custom_str1: tier,
      custom_str2: user.id,
      custom_str3: 'subscription_initial', // Marker: this is the first payment of a subscription
    }

    const signature = buildPayFastSignature(params)
    params.signature = signature

    // Build the redirect URL with all params
    const url = new URL(PAYFAST_ENDPOINT)
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== '') url.searchParams.append(k, String(v))
    }

    return NextResponse.json({
      redirectUrl: url.toString(),
      paymentId: payment.id,
      tier,
      amount: amountRand,
    })
  } catch (err) {
    console.error('[payfast/checkout] error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
