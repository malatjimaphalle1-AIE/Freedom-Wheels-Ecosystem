import { NextResponse } from 'next/server'

// GET /api/debug/db
// Diagnostic endpoint — shows database connection status without exposing credentials.
// Safe to leave public; only reveals prefixes and lengths.

export async function GET() {
  const dbUrl = process.env.DATABASE_URL || '(not set)'
  const adminKey = process.env.ADMIN_API_KEY || '(not set)'
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || '(not set)'

  // Detect protocol without exposing credentials
  let dbProtocol = 'unknown'
  if (dbUrl.startsWith('postgresql://') || dbUrl.startsWith('postgres://')) {
    dbProtocol = 'postgresql ✓'
  } else if (dbUrl.startsWith('file:')) {
    dbProtocol = 'file (SQLite) ✗ — should be postgresql:// for Supabase'
  } else if (dbUrl === '(not set)') {
    dbProtocol = 'not set ✗'
  }

  // Extract host only (safe to show)
  let dbHost = 'unknown'
  try {
    if (dbUrl.startsWith('postgresql://') || dbUrl.startsWith('postgres://')) {
      const match = dbUrl.match(/@([^:/]+)[:/]/)
      dbHost = match ? match[1] : 'could not parse'
    } else if (dbUrl.startsWith('file:')) {
      dbHost = '(local file path)'
    }
  } catch {}

  return NextResponse.json({
    database: {
      protocol: dbProtocol,
      host: dbHost,
      urlLength: dbUrl.length,
      // Show first 15 chars only — never enough to expose credentials
      urlPrefix: dbUrl.slice(0, 15) + '...',
    },
    adminApiKey: {
      isSet: adminKey !== '(not set)',
      length: adminKey.length,
    },
    baseUrl: {
      value: baseUrl,
    },
    nodeEnv: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
    diagnosis: dbUrl.startsWith('file:')
      ? 'PROBLEM: DATABASE_URL is set to a SQLite file path. Update it to your Supabase PostgreSQL connection string on Render → Environment → DATABASE_URL.'
      : dbUrl.startsWith('postgresql://') || dbUrl.startsWith('postgres://')
        ? 'OK: DATABASE_URL is set to PostgreSQL. If you still see errors, the connection string may have a wrong password or host.'
        : 'PROBLEM: DATABASE_URL is not set. Add it on Render → Environment → DATABASE_URL with your Supabase connection string.',
  })
}
