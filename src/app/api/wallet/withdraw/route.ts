import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

// POST /api/wallet/withdraw
// Body: { email, amount, assetSymbol, destinationType, destinationInfo, notes }
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      email,
      amount,
      assetSymbol,
      destinationType = 'bank',
      destinationInfo = {},
      notes = '',
    } = body

    // Validation
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Amount must be greater than 0' },
        { status: 400 }
      )
    }

    if (amount < 10) {
      return NextResponse.json(
        { error: 'Minimum withdrawal amount is $10' },
        { status: 400 }
      )
    }

    if (!assetSymbol) {
      return NextResponse.json(
        { error: 'Asset symbol is required' },
        { status: 400 }
      )
    }

    // Find wallet
    const wallet = await db.wallet.findUnique({
      where: { email },
      include: { assets: true },
    })

    if (!wallet) {
      return NextResponse.json({ error: 'Wallet not found' }, { status: 404 })
    }

    // Find the asset in the wallet
    const asset = wallet.assets.find((a) => a.symbol === assetSymbol)

    if (!asset) {
      return NextResponse.json(
        { error: `Asset ${assetSymbol} not found in wallet` },
        { status: 400 }
      )
    }

    // Check sufficient balance
    if (asset.type === 'fiat') {
      // For fiat, check the total wallet balance
      if (wallet.balance < amount) {
        return NextResponse.json(
          { error: 'Insufficient wallet balance' },
          { status: 400 }
        )
      }
    } else {
      // For crypto, check the specific asset amount
      if (asset.amount < amount) {
        return NextResponse.json(
          { error: `Insufficient ${assetSymbol} balance` },
          { status: 400 }
        )
      }
    }

    // Use a transaction for atomicity
    const result = await db.$transaction(async (tx) => {
      // Deduct balance
      if (asset.type === 'fiat') {
        await tx.wallet.update({
          where: { id: wallet.id },
          data: {
            balance: { decrement: amount },
            withdrawn: { increment: amount },
          },
        })
      } else {
        // For crypto, deduct from the specific asset
        await tx.walletAsset.update({
          where: { id: asset.id },
          data: { amount: { decrement: amount } },
        })
        await tx.wallet.update({
          where: { id: wallet.id },
          data: { withdrawn: { increment: amount } },
        })
      }

      // Create withdrawal request
      const withdrawal = await tx.withdrawalRequest.create({
        data: {
          amount,
          assetSymbol,
          status: 'processing',
          userEmail: email,
          destinationType,
          destinationInfo: JSON.stringify(destinationInfo),
          notes,
          walletId: wallet.id,
        },
      })

      // Create debit transaction
      await tx.transaction.create({
        data: {
          type: 'debit',
          amount: -amount,
          description: `Withdrawal to ${destinationType === 'bank' ? 'Bank Account' : 'Crypto Wallet'} (${assetSymbol})`,
          status: 'completed',
          userEmail: email,
          walletId: wallet.id,
        },
      })

      return withdrawal
    })

    return NextResponse.json({ withdrawal: result }, { status: 201 })
  } catch (error) {
    console.error('[WITHDRAW_POST]', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH /api/wallet/withdraw
// Body: { withdrawalId, status: "completed" | "failed" | "cancelled" }
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { withdrawalId, status } = body

    if (!withdrawalId) {
      return NextResponse.json(
        { error: 'Withdrawal ID is required' },
        { status: 400 }
      )
    }

    if (!['completed', 'failed', 'cancelled'].includes(status)) {
      return NextResponse.json(
        { error: 'Status must be completed, failed, or cancelled' },
        { status: 400 }
      )
    }

    // Find the withdrawal request
    const withdrawal = await db.withdrawalRequest.findUnique({
      where: { id: withdrawalId },
    })

    if (!withdrawal) {
      return NextResponse.json(
        { error: 'Withdrawal request not found' },
        { status: 404 }
      )
    }

    if (withdrawal.status !== 'processing') {
      return NextResponse.json(
        { error: `Cannot update withdrawal with status "${withdrawal.status}". Only processing withdrawals can be updated.` },
        { status: 400 }
      )
    }

    let updatedWithdrawal

    if (status === 'completed') {
      // Mark as completed
      updatedWithdrawal = await db.withdrawalRequest.update({
        where: { id: withdrawalId },
        data: {
          status: 'completed',
          processedAt: new Date(),
        },
      })
    } else {
      // "failed" or "cancelled" — refund the amount
      const wallet = await db.wallet.findUnique({
        where: { id: withdrawal.walletId },
        include: { assets: true },
      })

      if (!wallet) {
        return NextResponse.json(
          { error: 'Associated wallet not found' },
          { status: 404 }
        )
      }

      const asset = wallet.assets.find((a) => a.symbol === withdrawal.assetSymbol)
      const isFiat = asset?.type === 'fiat'

      updatedWithdrawal = await db.$transaction(async (tx) => {
        // Refund the amount
        if (isFiat) {
          await tx.wallet.update({
            where: { id: wallet.id },
            data: {
              balance: { increment: withdrawal.amount },
              withdrawn: { decrement: withdrawal.amount },
            },
          })
        } else {
          // Refund crypto asset
          if (asset) {
            await tx.walletAsset.update({
              where: { id: asset.id },
              data: { amount: { increment: withdrawal.amount } },
            })
          }
          await tx.wallet.update({
            where: { id: wallet.id },
            data: { withdrawn: { decrement: withdrawal.amount } },
          })
        }

        // Create credit transaction for the refund
        const refundDescription =
          status === 'failed'
            ? `Failed withdrawal refund (${withdrawal.assetSymbol})`
            : `Cancelled withdrawal refund (${withdrawal.assetSymbol})`

        await tx.transaction.create({
          data: {
            type: 'credit',
            amount: withdrawal.amount,
            description: refundDescription,
            status: 'completed',
            userEmail: withdrawal.userEmail,
            walletId: wallet.id,
          },
        })

        // Update the withdrawal request
        return tx.withdrawalRequest.update({
          where: { id: withdrawalId },
          data: {
            status,
            processedAt: new Date(),
          },
        })
      })
    }

    return NextResponse.json({ withdrawal: updatedWithdrawal })
  } catch (error) {
    console.error('[WITHDRAW_PATCH]', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
