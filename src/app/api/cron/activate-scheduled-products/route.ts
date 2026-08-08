import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/cron/activate-scheduled-products?secret=XXX
//
// Checks for products with scheduledAt <= now that aren't active yet.
// Activates the most recent scheduled product, deactivating all others.
//
// Schedule: run hourly (or daily) via cron-job.org.
// Also serves as a keep-alive for the database.

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const providedSecret = url.searchParams.get('secret')
  const expectedSecret = process.env.CRON_SECRET

  if (!expectedSecret) {
    return NextResponse.json(
      { error: 'CRON_SECRET not configured' },
      { status: 503 }
    )
  }

  if (providedSecret !== expectedSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const now = new Date()

    // Find products scheduled to activate (scheduledAt <= now, not yet active)
    const dueProducts = await db.productOfTheDay.findMany({
      where: {
        scheduledAt: { lte: now },
        isActive: false,
      },
      orderBy: { scheduledAt: 'desc' },
      take: 1,
    })

    if (dueProducts.length === 0) {
      return NextResponse.json({
        ok: true,
        message: 'No scheduled products to activate',
        timestamp: now.toISOString(),
      })
    }

    const productToActivate = dueProducts[0]!

    // Deactivate all currently active products
    await db.productOfTheDay.updateMany({
      where: { isActive: true },
      data: { isActive: false },
    })

    // Activate the scheduled product
    await db.productOfTheDay.update({
      where: { id: productToActivate.id },
      data: { isActive: true },
    })

    console.log('[cron/activate-scheduled-products] activated:', productToActivate.id, productToActivate.productName)

    return NextResponse.json({
      ok: true,
      message: `Activated: ${productToActivate.productName}`,
      productId: productToActivate.id,
      timestamp: now.toISOString(),
    })
  } catch (err) {
    console.error('[cron/activate-scheduled-products] error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
