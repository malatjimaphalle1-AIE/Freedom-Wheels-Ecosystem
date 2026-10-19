import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyPayFastItn } from '@/lib/payfast'

// POST /api/payfast/digital-notify
// PayFast ITN webhook for digital product purchases (one-time payments).
// Separate from the subscription ITN handler.

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const params: Record<string, string> = {}
    for (const [k, v] of formData.entries()) {
      params[k] = String(v)
    }

    console.log('[payfast/digital-notify] ITN received:', {
      m_payment_id: params['m_payment_id'],
      pf_payment_id: params['pf_payment_id'],
      payment_status: params['payment_status'],
      amount_gross: params['amount_gross'],
    })

    // 1. Verify signature
    const sigCheck = verifyPayFastItn(params)
    if (!sigCheck.valid) {
      console.warn('[payfast/digital-notify] signature invalid:', sigCheck.reason)
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    // 2. Verify payment status
    if (params['payment_status'] !== 'COMPLETE') {
      return NextResponse.json({ received: true, status: params['payment_status'] })
    }

    // 3. Find the purchase record
    const purchaseId = params['m_payment_id']
    if (!purchaseId) {
      return NextResponse.json({ error: 'Missing payment id' }, { status: 400 })
    }

    const purchase = await db.digitalProductPurchase.findUnique({
      where: { id: purchaseId },
      include: { product: true },
    })

    if (!purchase) {
      return NextResponse.json({ error: 'Purchase not found' }, { status: 404 })
    }

    // 4. Verify amount
    const expectedAmount = (purchase.amountCents / 100).toFixed(2)
    const receivedAmount = parseFloat(params['amount_gross'] || '0').toFixed(2)
    if (expectedAmount !== receivedAmount) {
      console.warn(`[payfast/digital-notify] amount mismatch: expected ${expectedAmount}, got ${receivedAmount}`)
      return NextResponse.json({ error: 'Amount mismatch' }, { status: 400 })
    }

    // 5. Mark purchase as completed
    await db.digitalProductPurchase.update({
      where: { id: purchase.id },
      data: {
        status: 'completed',
        payfastPaymentId: params['pf_payment_id'],
        rawPayload: JSON.stringify(params),
      },
    })

    console.log('[payfast/digital-notify] purchase completed:', {
      purchaseId: purchase.id,
      email: purchase.email,
      product: purchase.product.title,
    })

    return NextResponse.json({ received: true, status: 'COMPLETE' })
  } catch (err) {
    console.error('[payfast/digital-notify] error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ ok: true, service: 'payfast-digital-itn' })
}
