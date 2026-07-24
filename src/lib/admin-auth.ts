// Admin API key helper — used to protect /api/admin/* routes
// Set ADMIN_API_KEY in env. Requests must include header: X-Admin-Key: <key>

import { NextRequest, NextResponse } from 'next/server'

export function checkAdminAuth(req: NextRequest): NextResponse | null {
  const adminKey = process.env.ADMIN_API_KEY
  if (!adminKey) {
    return NextResponse.json(
      { error: 'Admin API not configured. Set ADMIN_API_KEY in env.' },
      { status: 503 }
    )
  }

  const providedKey = req.headers.get('x-admin-key')
  if (!providedKey || providedKey !== adminKey) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  return null // auth passed
}
