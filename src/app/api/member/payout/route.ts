import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { SESSION_COOKIE_NAME } from '@/lib/auth'

// POST /api/member/payout
// Body: { amountCents: number, method: string }
// Creates a payout request for the authenticated member.

export async function POST(req: NextRequest) {
  const userId = req.cookies.get(SESSION_COOKIE_NAME)?.value

  if (!userId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { amountCents, method } = body as { amountCents?: number; method?: string }

    if (typeof amountCents !== 'number' || amountCents < 1000) {
      return NextResponse.json(
        { error: 'Minimum payout is R10.00 (1000 cents)' },
        { status: 400 }
      )
    }

    if (!method || !['bank_transfer', 'payfast_wallet'].includes(method)) {
      return NextResponse.json(
        { error: 'Method must be bank_transfer or payfast_wallet' },
        { status: 400 }
      )
    }

    // Verify pending balance
    const distributions = await db.revenueShareDistribution.aggregate({
      where: { userId },
      _sum: { amountCents: true },
    })
    const totalDistributed = distributions._sum.amountCents || 0

    const payoutRequests = await db.payoutRequest.findMany({ where: { userId } })
    const alreadyRequestedOrPaid = payoutRequests
      .filter(p => p.status !== 'REJECTED')
      .reduce((sum, p) => sum + p.amountCents, 0)

    const pendingBalance = totalDistributed - alreadyRequestedOrPaid

    if (amountCents > pendingBalance) {
      return NextResponse.json(
        {
          error: `Insufficient balance. Pending: R${(pendingBalance / 100).toFixed(2)}, requested: R${(amountCents / 100).toFixed(2)}`,
        },
        { status: 400 }
      )
    }

    const request = await db.payoutRequest.create({
      data: {
        userId,
        amountCents,
        method,
        status: 'PENDING',
      },
    })

    return NextResponse.json({ ok: true, request })
  } catch (err) {
    console.error('[member/payout] error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
