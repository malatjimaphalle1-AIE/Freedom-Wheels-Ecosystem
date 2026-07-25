import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { SESSION_COOKIE_NAME } from '@/lib/auth'

// GET /api/member/dashboard
// Returns the logged-in member's dashboard data:
// - profile
// - active subscription
// - lifetime distributions (with month + amount)
// - lifetime affiliate clicks
// - pending payout balance
// - list of affiliate partners (with their click counts for this user)

export async function GET(req: NextRequest) {
  const userId = req.cookies.get(SESSION_COOKIE_NAME)?.value

  if (!userId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      tier: true,
      status: true,
      createdAt: true,
    },
  })

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  // Active subscription (most recent, status ACTIVE)
  const activeSubscription = await db.subscription.findFirst({
    where: { userId, status: 'ACTIVE' },
    orderBy: { createdAt: 'desc' },
  })

  // Lifetime distributions
  const distributions = await db.revenueShareDistribution.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 50,
    include: {
      pool: {
        select: { month: true, totalRevenueCents: true, distributableCents: true },
      },
    },
  })

  const totalDistributedCents = distributions.reduce((sum, d) => sum + d.amountCents, 0)

  // Pending payouts (not yet requested but balance exists)
  // For MVP: pending = total distributed - total paid out - total pending in requests
  const payoutRequests = await db.payoutRequest.findMany({
    where: { userId },
    orderBy: { requestedAt: 'desc' },
  })

  const totalRequestedCents = payoutRequests
    .filter(p => p.status === 'PENDING' || p.status === 'APPROVED')
    .reduce((sum, p) => sum + p.amountCents, 0)

  const totalPaidOutCents = payoutRequests
    .filter(p => p.status === 'PAID')
    .reduce((sum, p) => sum + p.amountCents, 0)

  const pendingBalanceCents = totalDistributedCents - totalRequestedCents - totalPaidOutCents

  // Affiliate partners + this user's click counts
  const partners = await db.affiliatePartner.findMany({
    where: { isActive: true },
    orderBy: { displayOrder: 'asc' },
    select: {
      id: true,
      name: true,
      url: true,
      affiliateUrl: true,
      commissionRate: true,
      category: true,
      description: true,
    },
  })

  // Get click counts per partner for this user
  const clickCounts = await db.affiliateClick.groupBy({
    by: ['partnerId'],
    where: { userId },
    _count: { _all: true },
  })

  const clickMap = new Map(clickCounts.map(c => [c.partnerId, c._count._all]))

  const partnersWithClicks = partners.map(p => ({
    ...p,
    clickCount: clickMap.get(p.id) || 0,
  }))

  const totalClicks = clickCounts.reduce((sum, c) => sum + c._count._all, 0)

  return NextResponse.json({
    user,
    subscription: activeSubscription,
    distributions: distributions.map(d => ({
      id: d.id,
      month: d.pool.month,
      amountCents: d.amountCents,
      tier: d.tier,
      distributedAt: d.createdAt.toISOString(),
      poolTotalRevenueCents: d.pool.totalRevenueCents,
      poolDistributableCents: d.pool.distributableCents,
    })),
    summary: {
      totalDistributedCents,
      totalPaidOutCents,
      pendingBalanceCents: Math.max(0, pendingBalanceCents),
      totalClicks,
    },
    payoutRequests: payoutRequests.map(p => ({
      id: p.id,
      amountCents: p.amountCents,
      status: p.status,
      method: p.method,
      requestedAt: p.requestedAt.toISOString(),
      processedAt: p.processedAt?.toISOString(),
      reference: p.reference,
    })),
    affiliatePartners: partnersWithClicks,
  })
}
