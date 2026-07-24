// Transparency report logic — publishes a public monthly report
// after the distribution has been run.

import { db } from '@/lib/db'

export interface TransparencyReportData {
  month: string
  totalMembers: number
  newMembers: number
  churnedMembers: number
  totalRevenueCents: number
  platformShareCents: number
  distributableCents: number
  totalDistributedCents: number
  partnerBreakdown: Record<string, number> // partnerName -> amountCents
}

export async function publishTransparencyReport(monthStr?: string): Promise<TransparencyReportData> {
  const now = new Date()
  const targetDate = monthStr
    ? new Date(monthStr + '-01T00:00:00Z')
    : new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1))

  const month = monthStr || targetDate.toISOString().slice(0, 7)

  // Pool must exist (distribution must have been run)
  const pool = await db.revenueSharePool.findUnique({ where: { month } })
  if (!pool) {
    throw new Error(`No pool found for ${month}. Run distribution first.`)
  }
  if (!pool.distributedAt) {
    throw new Error(`Pool for ${month} has not been distributed yet.`)
  }

  // Calculate month range
  const startOfMonth = new Date(Date.UTC(targetDate.getUTCFullYear(), targetDate.getUTCMonth(), 1))
  const endOfMonth = new Date(Date.UTC(targetDate.getUTCFullYear(), targetDate.getUTCMonth() + 1, 1))

  // New members = users created in this month
  const newMembers = await db.user.count({
    where: { createdAt: { gte: startOfMonth, lt: endOfMonth } },
  })

  // Churned members = subscriptions cancelled in this month
  const churnedMembers = await db.subscription.count({
    where: {
      status: 'CANCELLED',
      updatedAt: { gte: startOfMonth, lt: endOfMonth },
    },
  })

  // Partner breakdown — sum commissions by partner
  const commissions = await db.affiliateCommission.findMany({
    where: { recordedAt: { gte: startOfMonth, lt: endOfMonth } },
    include: { partner: { select: { name: true } } },
  })

  const partnerBreakdown: Record<string, number> = {}
  for (const c of commissions) {
    const name = c.partner?.name || 'Unknown'
    partnerBreakdown[name] = (partnerBreakdown[name] || 0) + c.amountCents
  }

  // Total distributed
  const totalDistributed = await db.revenueShareDistribution.aggregate({
    where: { poolId: pool.id },
    _sum: { amountCents: true },
  })

  const reportData: TransparencyReportData = {
    month,
    totalMembers: pool.totalMembers,
    newMembers,
    churnedMembers,
    totalRevenueCents: pool.totalRevenueCents,
    platformShareCents: pool.platformShareCents,
    distributableCents: pool.distributableCents,
    totalDistributedCents: totalDistributed._sum.amountCents || 0,
    partnerBreakdown,
  }

  // Upsert transparency report
  await db.transparencyReport.upsert({
    where: { month },
    create: {
      month,
      totalMembers: reportData.totalMembers,
      newMembers: reportData.newMembers,
      churnedMembers: reportData.churnedMembers,
      totalRevenueCents: reportData.totalRevenueCents,
      platformShareCents: reportData.platformShareCents,
      distributableCents: reportData.distributableCents,
      totalDistributedCents: reportData.totalDistributedCents,
      partnerBreakdown: JSON.stringify(reportData.partnerBreakdown),
      publishedAt: new Date(),
    },
    update: {
      totalMembers: reportData.totalMembers,
      newMembers: reportData.newMembers,
      churnedMembers: reportData.churnedMembers,
      totalRevenueCents: reportData.totalRevenueCents,
      platformShareCents: reportData.platformShareCents,
      distributableCents: reportData.distributableCents,
      totalDistributedCents: reportData.totalDistributedCents,
      partnerBreakdown: JSON.stringify(reportData.partnerBreakdown),
      publishedAt: new Date(),
    },
  })

  return reportData
}
