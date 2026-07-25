// Monthly revenue share distribution logic
//
// Flow:
// 1. Sum all AffiliateCommission entries for the target month
// 2. Subtract platform operations share (15% growth reserve)
// 3. Distribute remainder: 10% Starter / 25% Pro / 50% Elite (pro-rata within tier)
// 4. Create RevenueShareDistribution record per active member
// 5. Mark pool as distributed
//
// Safety:
// - Idempotent: re-running for an already-distributed month is a no-op
// - Admin-only: protected by ADMIN_API_KEY env var
// - Atomic: all distribution records created in a single transaction
// - Auditable: every distribution logged with pool reference

import { db } from '@/lib/db'
import { sendDistributionNotifications } from '@/lib/email'

const TIER_SHARE_PERCENTAGES = {
  STARTER: 10,
  PRO: 25,
  ELITE: 50,
} as const

const PLATFORM_RESERVE_PERCENTAGE = 15 // growth reserve

export interface DistributionResult {
  month: string
  totalRevenueCents: number
  platformShareCents: number
  distributableCents: number
  tierBreakdown: {
    STARTER: { members: number; shareCents: number; perMemberCents: number }
    PRO: { members: number; shareCents: number; perMemberCents: number }
    ELITE: { members: number; shareCents: number; perMemberCents: number }
  }
  totalDistributedCents: number
  poolId: string
}

export async function runMonthlyDistribution(monthStr?: string): Promise<DistributionResult> {
  // Default to previous month (distributions run after month-end)
  const now = new Date()
  const targetDate = monthStr
    ? new Date(monthStr + '-01T00:00:00Z')
    : new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1))

  const month = monthStr || targetDate.toISOString().slice(0, 7)

  // Idempotency check
  const existing = await db.revenueSharePool.findUnique({ where: { month } })
  if (existing?.distributedAt) {
    throw new Error(`Month ${month} already distributed at ${existing.distributedAt.toISOString()}`)
  }

  // Calculate month range
  const startOfMonth = new Date(Date.UTC(targetDate.getUTCFullYear(), targetDate.getUTCMonth(), 1))
  const endOfMonth = new Date(Date.UTC(targetDate.getUTCFullYear(), targetDate.getUTCMonth() + 1, 1))

  // 1. Sum affiliate commissions for the month
  const commissions = await db.affiliateCommission.findMany({
    where: {
      recordedAt: {
        gte: startOfMonth,
        lt: endOfMonth,
      },
    },
  })

  const totalRevenueCents = commissions.reduce((sum, c) => sum + c.amountCents, 0)

  // If zero revenue, still create an empty pool record (transparency)
  const platformShareCents = Math.floor(totalRevenueCents * PLATFORM_RESERVE_PERCENTAGE / 100)
  const distributableCents = totalRevenueCents - platformShareCents

  // 2. Count active members per tier (status = ACTIVE)
  const activeUsers = await db.user.findMany({
    where: { status: 'ACTIVE' },
    select: { id: true, tier: true },
  })

  const tierMembers = {
    STARTER: activeUsers.filter(u => u.tier === 'STARTER'),
    PRO: activeUsers.filter(u => u.tier === 'PRO'),
    ELITE: activeUsers.filter(u => u.tier === 'ELITE'),
  }

  const tierShares = {
    STARTER: Math.floor(distributableCents * TIER_SHARE_PERCENTAGES.STARTER / 100),
    PRO: Math.floor(distributableCents * TIER_SHARE_PERCENTAGES.PRO / 100),
    ELITE: Math.floor(distributableCents * TIER_SHARE_PERCENTAGES.ELITE / 100),
  }

  const perMember = (totalCents: number, members: { id: string }[]) =>
    members.length > 0 ? Math.floor(totalCents / members.length) : 0

  const tierBreakdown = {
    STARTER: {
      members: tierMembers.STARTER.length,
      shareCents: tierShares.STARTER,
      perMemberCents: perMember(tierShares.STARTER, tierMembers.STARTER),
    },
    PRO: {
      members: tierMembers.PRO.length,
      shareCents: tierShares.PRO,
      perMemberCents: perMember(tierShares.PRO, tierMembers.PRO),
    },
    ELITE: {
      members: tierMembers.ELITE.length,
      shareCents: tierShares.ELITE,
      perMemberCents: perMember(tierShares.ELITE, tierMembers.ELITE),
    },
  }

  const totalDistributedCents =
    tierBreakdown.STARTER.shareCents +
    tierBreakdown.PRO.shareCents +
    tierBreakdown.ELITE.shareCents

  // 3. Create pool record + all distribution records in a transaction
  const result = await db.$transaction(async (tx) => {
    // Create or update pool
    const pool = await tx.revenueSharePool.upsert({
      where: { month },
      create: {
        month,
        totalRevenueCents,
        platformShareCents,
        distributableCents,
        starterSharePct: TIER_SHARE_PERCENTAGES.STARTER,
        proSharePct: TIER_SHARE_PERCENTAGES.PRO,
        eliteSharePct: TIER_SHARE_PERCENTAGES.ELITE,
        starterMembers: tierBreakdown.STARTER.members,
        proMembers: tierBreakdown.PRO.members,
        eliteMembers: tierBreakdown.ELITE.members,
        totalMembers: activeUsers.length,
        distributedAt: new Date(),
      },
      update: {
        totalRevenueCents,
        platformShareCents,
        distributableCents,
        starterMembers: tierBreakdown.STARTER.members,
        proMembers: tierBreakdown.PRO.members,
        eliteMembers: tierBreakdown.ELITE.members,
        totalMembers: activeUsers.length,
        distributedAt: new Date(),
      },
    })

    // Delete any prior distributions for this pool (in case of re-run before distributedAt was set)
    await tx.revenueShareDistribution.deleteMany({ where: { poolId: pool.id } })

    // Create per-member distribution records
    const distributionData: { userId: string; poolId: string; tier: 'STARTER' | 'PRO' | 'ELITE'; amountCents: number }[] = []
    for (const tier of ['STARTER', 'PRO', 'ELITE'] as const) {
      const perMemberCents = tierBreakdown[tier].perMemberCents
      if (perMemberCents <= 0) continue
      for (const member of tierMembers[tier]) {
        distributionData.push({
          userId: member.id,
          poolId: pool.id,
          tier,
          amountCents: perMemberCents,
        })
      }
    }

    if (distributionData.length > 0) {
      await tx.revenueShareDistribution.createMany({ data: distributionData })
    }

    return pool
  })

  return {
    month,
    totalRevenueCents,
    platformShareCents,
    distributableCents,
    tierBreakdown,
    totalDistributedCents,
    poolId: result.id,
  }
}
