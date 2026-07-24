import { NextRequest, NextResponse } from 'next/server'
import { checkAdminAuth } from '@/lib/admin-auth'
import { sendDistributionNotifications } from '@/lib/email'

// POST /api/admin/notify-distributions
// Headers: X-Admin-Key: <ADMIN_API_KEY>
// Body: { month?: "YYYY-MM" } — defaults to previous month
// Sends distribution notification emails to all members who received a distribution that month.
// Call this AFTER running distribution AND publishing the transparency report.

export async function POST(req: NextRequest) {
  const authError = checkAdminAuth(req)
  if (authError) return authError

  try {
    const body = await req.json().catch(() => ({}))
    const month = body?.month as string | undefined

    if (month && !/^\d{4}-\d{2}$/.test(month)) {
      return NextResponse.json(
        { error: 'Invalid month format. Use YYYY-MM.' },
        { status: 400 }
      )
    }

    const targetMonth = month || new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth() - 1, 1)).toISOString().slice(0, 7)

    const result = await sendDistributionNotifications(targetMonth)

    console.log('[admin/notify-distributions] result:', result)

    return NextResponse.json({
      ok: true,
      month: targetMonth,
      ...result,
    })
  } catch (err) {
    console.error('[admin/notify-distributions] error:', err)
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
