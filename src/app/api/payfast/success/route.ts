import { NextRequest, NextResponse } from 'next/server'

// GET /api/payfast/success?paymentId=xxx
// PayFast redirects here after a successful payment.
// We don't trust this alone — the ITN webhook is the source of truth.

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const paymentId = url.searchParams.get('paymentId')

  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Payment received — Freedom Wheels</title>
  <style>
    body { font-family: -apple-system, system-ui, sans-serif; max-width: 500px; margin: 4rem auto; padding: 1rem; text-align: center; color: #1f2937; }
    .ok { color: #059669; font-size: 3rem; margin-bottom: 1rem; }
    h1 { font-size: 1.5rem; margin-bottom: 0.5rem; }
    p { color: #6b7280; line-height: 1.6; }
    a { display: inline-block; margin-top: 1.5rem; padding: 0.75rem 1.5rem; background: #059669; color: white; text-decoration: none; border-radius: 0.375rem; }
    .ref { font-family: monospace; font-size: 0.875rem; color: #9ca3af; margin-top: 1rem; }
  </style>
</head>
<body>
  <div class="ok">&#10003;</div>
  <h1>Payment received</h1>
  <p>Thanks! Your payment has been received by PayFast and your membership is being activated. You should receive a confirmation email within 5 minutes.</p>
  <p>If you don't see activation within 10 minutes, email <a href="mailto:maphalle@freedomwheels.online">maphalle@freedomwheels.online</a> with the reference below.</p>
  <div class="ref">Reference: ${paymentId || 'unknown'}</div>
  <a href="/">Return to Freedom Wheels</a>
</body>
</html>`

  return new NextResponse(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}
