import { NextRequest, NextResponse } from 'next/server'

// Firebase API route for backend operations
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, email } = body

    switch (action) {
      case 'verify-founder': {
        const founderEmail = process.env.NEXT_PUBLIC_FOUNDER_EMAIL || 'malatjimaphalle1@gmail.com'
        const isFounder = email?.toLowerCase() === founderEmail.toLowerCase()
        return NextResponse.json({ isFounder, role: isFounder ? 'FOUNDER' : 'FREE' })
      }

      case 'get-role': {
        const founderEmail = process.env.NEXT_PUBLIC_FOUNDER_EMAIL || 'malatjimaphalle1@gmail.com'
        const isFounder = email?.toLowerCase() === founderEmail.toLowerCase()
        const role = isFounder ? 'FOUNDER' : 'FREE'
        return NextResponse.json({ role, isFounder })
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('Firebase API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    service: 'Freedom Wheels Firebase API',
    version: '2.0',
    status: 'operational',
    features: ['authentication', 'firestore', 'storage', 'roles', 'founder-access'],
  })
}
