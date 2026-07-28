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
  })
}
