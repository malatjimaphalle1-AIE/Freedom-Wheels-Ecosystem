import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { PAYFAST_ENDPOINT, buildPayFastSignature } from '@/lib/payfast'
import crypto from 'crypto'

// POST /api/payfast/digital-checkout
// Body: { productId: string, email: string, name?: string }
// Creates a digital product purchase record + redirects to PayFast for one-time payment.

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { productId, email, name } = body as { productId?: string; email?: string; name?: string }

    if (!productId || !email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      return NextResponse.json({ error: 'Valid productId and email required' }, { status: 400 })
    }

    const product = await db.digitalProduct.findUnique({ where: { id: productId } })
    if (!product || !product.isPublished) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    const merchantId = process.env.PAYFAST_MERCHANT_ID
    const merchantKey = process.env.PAYFAST_MERCHANT_KEY
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.freedomwheels.online'

    if (!merchantId || !merchantKey) {
      return NextResponse.json({
        error: 'PayFast not configured.',
        devMode: true,
      }, { status: 503 })
    }

    const amountRand = (product.priceCents / 100).toFixed(2)

    // Generate a secure download token (valid for 7 days)
    const downloadToken = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7)

    // Create purchase record
    const purchase = await db.digitalProductPurchase.create({
      data: {
        productId: product.id,
        email: email.toLowerCase().trim(),
        name: name || null,
        amountCents: product.priceCents,
        status: 'pending',
        downloadToken,
        expiresAt,
      },
    })

    // Build PayFast parameters (one-time payment, NOT subscription)
    const params: Record<string, string | number | undefined> = {
      merchant_id: merchantId,
      merchant_key: merchantKey,
      return_url: `${baseUrl}/api/payfast/success?digitalPurchaseId=${purchase.id}`,
      cancel_url: `${baseUrl}/api/payfast/cancel?digitalPurchaseId=${purchase.id}`,
      notify_url: `${baseUrl}/api/payfast/digital-notify`,
      name_first: name?.split(' ')[0] || '',
      name_last: name?.split(' ').slice(1).join(' ') || '',
      email_address: email,
      m_payment_id: purchase.id,
      amount: amountRand,
      item_name: product.title,
      item_description: product.subtitle || `Digital product — ${product.title}`,
      custom_str1: 'digital_product',
      custom_str2: product.id,
      custom_str3: downloadToken,
    }

    const signature = buildPayFastSignature(params)
    params.signature = signature

    const url = new URL(PAYFAST_ENDPOINT)
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== '') url.searchParams.append(k, String(v))
    }

    return NextResponse.json({
      redirectUrl: url.toString(),
      purchaseId: purchase.id,
      productTitle: product.title,
      amount: amountRand,
    })
  } catch (err) {
    console.error('[payfast/digital-checkout] error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
