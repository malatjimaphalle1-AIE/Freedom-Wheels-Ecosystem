import { NextRequest, NextResponse } from 'next/server'
import { checkAdminAuth } from '@/lib/admin-auth'
import { publishTransparencyReport } from '@/lib/transparency'

// POST /api/admin/transparency
// Headers: X-Admin-Key: <ADMIN_API_KEY>
// Body: { month?: "YYYY-MM" } — defaults to previous month
// Publishes the public transparency report for the given month.
// Distribution must have been run first.

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

    const result = await publishTransparencyReport(month)

    console.log('[admin/transparency] published:', result.month)

    return NextResponse.json({
      ok: true,
      result,
    })
  } catch (err) {
    console.error('[admin/transparency] error:', err)
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
