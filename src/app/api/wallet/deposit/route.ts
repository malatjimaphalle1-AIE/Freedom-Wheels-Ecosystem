import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

// POST /api/wallet/deposit
// Body: { email: string, amount: number, description: string }
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, amount, description = 'Engine Revenue' } = body

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Amount must be greater than 0' },
        { status: 400 }
      )
    }

    // Find wallet
    const wallet = await db.wallet.findUnique({
      where: { email },
      include: {
        assets: true,
        transactions: {
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
        withdrawals: {
          orderBy: { createdAt: 'desc' },
          take: 50,
        },
      },
    })

    if (!wallet) {
      return NextResponse.json({ error: 'Wallet not found' }, { status: 404 })
    }

    // Use a transaction for atomicity
    const updatedWallet = await db.$transaction(async (tx) => {
      // Update wallet balance
      const updated = await tx.wallet.update({
        where: { id: wallet.id },
        data: { balance: { increment: amount } },
        include: {
          assets: true,
          transactions: {
            orderBy: { createdAt: 'desc' },
            take: 20,
          },
          withdrawals: {
            orderBy: { createdAt: 'desc' },
            take: 50,
          },
        },
      })

      // Create credit transaction
      await tx.transaction.create({
        data: {
          type: 'credit',
          amount,
          description,
          status: 'completed',
          userEmail: email,
          walletId: wallet.id,
        },
      })

      return updated
    })

    return NextResponse.json({ wallet: updatedWallet })
  } catch (error) {
    console.error('[DEPOSIT_POST]', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
