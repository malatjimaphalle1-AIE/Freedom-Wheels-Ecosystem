import { NextRequest, NextResponse } from 'next/server'
import { checkAdminAuth } from '@/lib/admin-auth'
import { db } from '@/lib/db'

// GET /api/admin/marketing
// Returns marketing analytics: referral counts, UTM breakdown, share clicks, top referrers

export async function GET(req: NextRequest) {
  const authError = await checkAdminAuth(req)
  if (authError) return authError

  // Total members with referral codes
  const totalMembers = await db.user.count({ where: { status: 'ACTIVE' } })

  // Members who have referred at least 1 person
  const referrers = await db.user.findMany({
    where: { referrals: { some: {} } },
    select: {
      id: true,
      name: true,
      email: true,
      referralCode: true,
      _count: { select: { referrals: true } },
    },
    orderBy: { referrals: { _count: 'desc' } },
    take: 20,
  })

  const topReferrers = referrers.map(r => ({
    id: r.id,
    name: r.name || r.email,
    referralCode: r.referralCode,
    referralCount: r._count.referrals,
  }))

  // UTM source breakdown
  const utmBreakdown = await db.user.groupBy({
    by: ['utmSource'],
    where: { utmSource: { not: null } },
    _count: { _all: true },
    orderBy: { _count: { id: 'desc' } },
  })

  const utmStats = utmBreakdown.map(u => ({
    source: u.utmSource || '(none)',
    count: u._count._all,
  }))

  // Share platform breakdown
  const shareBreakdown = await db.socialShare.groupBy({
    by: ['platform'],
    _count: { _all: true },
    orderBy: { _count: { platform: 'desc' } },
  })

  const shareStats = shareBreakdown.map(s => ({
    platform: s.platform,
    count: s._count._all,
  }))

  // Referral visits (last 30 days)
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const referralVisits = await db.referralVisit.count({
    where: { createdAt: { gte: thirtyDaysAgo } },
  })

  const convertedVisits = await db.referralVisit.count({
    where: {
      createdAt: { gte: thirtyDaysAgo },
      converted: true,
    },
  })

  const conversionRate = referralVisits > 0 ? (convertedVisits / referralVisits * 100).toFixed(1) : '0'

  // Total referral codes issued
  const referralCodesIssued = await db.user.count({
    where: { referralCode: { not: null } },
  })

  // Total referrals (users who were referred)
  const totalReferredUsers = await db.user.count({
    where: { referredById: { not: null } },
  })

  // Page view trends (last 30 days, grouped by day)
  const thirtyDaysAgoDate = new Date()
  thirtyDaysAgoDate.setDate(thirtyDaysAgoDate.getDate() - 30)

  const pageViews = await db.pageView.findMany({
    where: { createdAt: { gte: thirtyDaysAgoDate } },
    select: { path: true, createdAt: true, utmSource: true },
  })

  // Group by day
  const dailyViews: Record<string, number> = {}
  const last30Days: string[] = []
  for (let i = 29; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const key = d.toISOString().slice(0, 10)
    dailyViews[key] = 0
    last30Days.push(key)
  }

  for (const pv of pageViews) {
    const key = pv.createdAt.toISOString().slice(0, 10)
    if (key in dailyViews) {
      dailyViews[key]++
    }
  }

  const dailyTrend = last30Days.map(date => ({ date, views: dailyViews[date] }))

  // Weekly trend (last 7 days)
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  const last7DaysViews = pageViews.filter(pv => pv.createdAt >= sevenDaysAgo)
  const totalViewsLast7Days = last7DaysViews.length
  const totalViewsLast30Days = pageViews.length

  // Top pages (by view count, last 30 days)
  const pageCounts: Record<string, number> = {}
  for (const pv of pageViews) {
    pageCounts[pv.path] = (pageCounts[pv.path] || 0) + 1
  }
  const topPages = Object.entries(pageCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([path, count]) => ({ path, count }))

  // Newsletter subscribers count
  const newsletterCount = await db.newsletterSubscriber.count({
    where: { isActive: true },
  })

  const pageViewStats = {
    totalLast7Days: totalViewsLast7Days,
    totalLast30Days: totalViewsLast30Days,
    dailyTrend,
    topPages,
    avgDaily: Math.round(totalViewsLast30Days / 30 * 10) / 10,
  }

  return NextResponse.json({
    summary: {
      totalMembers,
      referralCodesIssued,
      totalReferredUsers,
      referralVisitsLast30Days: referralVisits,
      convertedVisitsLast30Days: convertedVisits,
      conversionRate: `${conversionRate}%`,
    },
    topReferrers,
    utmBreakdown: utmStats,
    shareBreakdown: shareStats,
    pageViews: pageViewStats,
    newsletterSubscribers: newsletterCount,
  })
}
