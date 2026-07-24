import { NextRequest, NextResponse } from 'next/server'
import { checkAdminAuth } from '@/lib/admin-auth'
import { runMonthlyDistribution } from '@/lib/distribution'

// POST /api/admin/distribute
// Headers: X-Admin-Key: <ADMIN_API_KEY>
// Body: { month?: "YYYY-MM" } — defaults to previous month
// Runs the monthly revenue share distribution.

export async function POST(req: NextRequest) {
  const authError = checkAdminAuth(req)
  if (authError) return authError

  try {
    const body = await req.json().catch(() => ({}))
    const month = body?.month as string | undefined

    // Validate month format if provided
    if (month && !/^\d{4}-\d{2}$/.test(month)) {
      return NextResponse.json(
        { error: 'Invalid month format. Use YYYY-MM.' },
        { status: 400 }
      )
    }

    const result = await runMonthlyDistribution(month)

    console.log('[admin/distribute] success:', result)

    return NextResponse.json({
      ok: true,
      result,
    })
  } catch (err) {
    console.error('[admin/distribute] error:', err)
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
