import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/cron/keepalive?secret=XXX
//
// Daily keep-alive ping for the Supabase database.
// Supabase free tier auto-pauses projects after 7 days of inactivity.
// This endpoint runs a trivial query to keep the database awake.
//
// Schedule with any free cron service (cron-job.org, UptimeRobot, etc.)
// Recommended: once daily. Twice daily for safety.
//
// Security: requires CRON_SECRET env var to match ?secret= parameter.
// Without this, anyone could hammer the endpoint and use up your DB connections.

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const providedSecret = url.searchParams.get('secret')
  const expectedSecret = process.env.CRON_SECRET

  if (!expectedSecret) {
    return NextResponse.json(
      { error: 'CRON_SECRET not configured. Set it in Render env vars.' },
      { status: 503 }
    )
  }

  if (providedSecret !== expectedSecret) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  try {
    // Trivial query — just touches the database to reset the inactivity timer
    const result = await db.$queryRaw`SELECT 1 AS ok, NOW() AS pinged_at`

    return NextResponse.json({
      ok: true,
      pingedAt: new Date().toISOString(),
      database: 'reachable',
      result,
    })
  } catch (err) {
    console.error('[cron/keepalive] DB ping failed:', err)
    return NextResponse.json(
      {
        ok: false,
        pingedAt: new Date().toISOString(),
        database: 'unreachable',
        error: err instanceof Error ? err.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
