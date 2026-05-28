import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

// Seed data constants
const SEED_ASSETS = [
  { name: 'Wise USD', symbol: 'USD', amount: 12450, type: 'fiat' },
  { name: 'Wise EUR', symbol: 'EUR', amount: 3200, type: 'fiat' },
  { name: 'Wise GBP', symbol: 'GBP', amount: 1850, type: 'fiat' },
  { name: 'Wise ZAR', symbol: 'ZAR', amount: 5200, type: 'fiat' },
  { name: 'USDT', symbol: 'USDT', amount: 3500, type: 'crypto' },
  { name: 'Bitcoin', symbol: 'BTC', amount: 0.015, type: 'crypto' },
  { name: 'Ethereum', symbol: 'ETH', amount: 0.45, type: 'crypto' },
  { name: 'Solana', symbol: 'SOL', amount: 12.5, type: 'crypto' },
]

const SEED_TRANSACTIONS = [
  { type: 'credit', amount: 2480, description: 'Content Syndicator Revenue', status: 'completed' },
  { type: 'credit', amount: 1560, description: 'Lead Magnet Revenue', status: 'completed' },
  { type: 'debit', amount: -2500, description: 'Withdrawal to Wise USD', status: 'completed' },
  { type: 'credit', amount: 780, description: 'Referral Bonus', status: 'completed' },
  { type: 'credit', amount: 1240, description: 'Arbitrage Bot Profit', status: 'completed' },
]

async function seedWallet(email: string, name?: string) {
  const wallet = await db.wallet.create({
    data: {
      email,
      balance: 24580.5,
      pending: 3240.0,
      withdrawn: 18200.0,
      currency: 'USD',
      assets: {
        create: SEED_ASSETS,
      },
      transactions: {
        create: SEED_TRANSACTIONS.map((tx) => ({
          ...tx,
          userEmail: email,
        })),
      },
    },
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

  return wallet
}

// GET /api/wallet?email=user@example.com
export async function GET(request: NextRequest) {
  try {
    const email = request.nextUrl.searchParams.get('email')

    if (!email) {
      return NextResponse.json(
        { error: 'Email query parameter is required' },
        { status: 400 }
      )
    }

    let wallet = await db.wallet.findUnique({
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

    // If wallet doesn't exist, create one with seed data
    if (!wallet) {
      wallet = await seedWallet(email)
    }

    return NextResponse.json({ wallet })
  } catch (error) {
    console.error('[WALLET_GET]', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/wallet
// Body: { email: string, name?: string }
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, name } = body

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // Check if wallet already exists
    const existing = await db.wallet.findUnique({
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

    if (existing) {
      return NextResponse.json({ wallet: existing })
    }

    // Create wallet with seed data
    const wallet = await seedWallet(email, name)

    return NextResponse.json({ wallet }, { status: 201 })
  } catch (error) {
    console.error('[WALLET_POST]', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
