import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/download/[token]
// Secure digital product download endpoint.
// Verifies the download token, checks expiry + download count, serves the content.
// Returns a redirect to the PDF URL or the content directly.

export async function GET(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params

  if (!token || token.length < 16) {
    return NextResponse.json({ error: 'Invalid download token' }, { status: 400 })
  }

  const purchase = await db.digitalProductPurchase.findUnique({
    where: { downloadToken: token },
    include: { product: true },
  })

  if (!purchase) {
    return NextResponse.json({ error: 'Download token not found' }, { status: 404 })
  }

  // Check purchase is completed
  if (purchase.status !== 'completed') {
    return NextResponse.json(
      { error: 'Payment not completed yet. Please wait a few minutes and try again.' },
      { status: 403 }
    )
  }

  // Check expiry
  if (purchase.expiresAt && purchase.expiresAt < new Date()) {
    return NextResponse.json(
      { error: 'Download link has expired. Please contact maphalle@freedomwheels.online for a new link.' },
      { status: 403 }
    )
  }

  // Check download count
  if (purchase.downloadCount >= purchase.maxDownloads) {
    return NextResponse.json(
      { error: `Download limit reached (${purchase.maxDownloads} downloads). Please contact maphalle@freedomwheels.online for assistance.` },
      { status: 403 }
    )
  }

  // Increment download count
  await db.digitalProductPurchase.update({
    where: { id: purchase.id },
    data: { downloadCount: { increment: 1 } },
  })

  console.log('[download] serving:', {
    purchaseId: purchase.id,
    product: purchase.product.title,
    downloadNumber: purchase.downloadCount + 1,
    maxDownloads: purchase.maxDownloads,
  })

  // Return download page with link
  const remaining = purchase.maxDownloads - (purchase.downloadCount + 1)

  return NextResponse.json({
    ok: true,
    productTitle: purchase.product.title,
    pdfUrl: purchase.product.pdfUrl,
    bonusUrl: purchase.product.bonusUrl || null,
    downloadsRemaining: Math.max(0, remaining),
    expiresAt: purchase.expiresAt?.toISOString() || null,
    message: remaining > 0
      ? `Download started. ${remaining} downloads remaining.`
      : 'This was your last download. Save the file — the link will no longer work.',
  })
}
