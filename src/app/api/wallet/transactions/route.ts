import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/wallet/transactions?email=user@example.com&limit=20&offset=0
export async function GET(request: NextRequest) {
  try {
    const email = request.nextUrl.searchParams.get('email')
    const limitParam = request.nextUrl.searchParams.get('limit')
    const offsetParam = request.nextUrl.searchParams.get('offset')

    if (!email) {
      return NextResponse.json(
        { error: 'Email query parameter is required' },
        { status: 400 }
      )
    }

    const limit = Math.min(Math.max(parseInt(limitParam || '20', 10) || 20, 1), 100)
    const offset = Math.max(parseInt(offsetParam || '0', 10) || 0, 0)

    // Find wallet first
    const wallet = await db.wallet.findUnique({
      where: { email },
    })

    if (!wallet) {
      return NextResponse.json(
        { error: 'Wallet not found' },
        { status: 404 }
      )
    }

    // Get total count for pagination info
    const total = await db.transaction.count({
      where: { walletId: wallet.id },
    })

    // Get paginated transactions
    const transactions = await db.transaction.findMany({
      where: { walletId: wallet.id },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    })

    return NextResponse.json({
      transactions,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    })
  } catch (error) {
    console.error('[TRANSACTIONS_GET]', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
