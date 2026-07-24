import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/payfast/cancel?paymentId=xxx
// PayFast redirects here if the user cancels during checkout.

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const paymentId = url.searchParams.get('paymentId')

  if (paymentId) {
    try {
      await db.subscriptionPayment.update({
        where: { id: paymentId },
        data: { status: 'CANCELLED' },
      })
    } catch {
      // ignore
    }
  }

  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Payment cancelled — Freedom Wheels</title>
  <style>
    body { font-family: -apple-system, system-ui, sans-serif; max-width: 500px; margin: 4rem auto; padding: 1rem; text-align: center; color: #1f2937; }
    .cancel { color: #6b7280; font-size: 3rem; margin-bottom: 1rem; }
    h1 { font-size: 1.5rem; margin-bottom: 0.5rem; }
    p { color: #6b7280; line-height: 1.6; }
    a { display: inline-block; margin-top: 1.5rem; padding: 0.75rem 1.5rem; background: #059669; color: white; text-decoration: none; border-radius: 0.375rem; }
  </style>
</head>
<body>
  <div class="cancel">&times;</div>
  <h1>Payment cancelled</h1>
  <p>No charge was made. You can try again whenever you are ready.</p>
  <a href="/#pricing">Back to pricing</a>
</body>
</html>`

  return new NextResponse(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}
