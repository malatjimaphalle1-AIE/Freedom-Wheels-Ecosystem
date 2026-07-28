import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { SESSION_COOKIE_NAME } from '@/lib/auth'
import { generateUniqueReferralCode, buildReferralUrl } from '@/lib/marketing'

// GET /api/member/referral
// Returns the authenticated member's referral code + URL + referral count.

export async function GET(req: NextRequest) {
  const userId = req.cookies.get(SESSION_COOKIE_NAME)?.value

  if (!userId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      referralCode: true,
      utmSource: true,
      utmMedium: true,
      utmCampaign: true,
    },
  })

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  // Generate referral code if missing
  let referralCode = user.referralCode
  if (!referralCode) {
    referralCode = await generateUniqueReferralCode(user.name, user.id)
    await db.user.update({
      where: { id: user.id },
      data: { referralCode },
    })
  }

  // Count referrals
  const referralCount = await db.user.count({
    where: { referredById: user.id },
  })

  // Get referral details (anonymized — just count + tier breakdown)
  const referrals = await db.user.findMany({
    where: { referredById: user.id },
    select: { tier: true, status: true, createdAt: true },
  })

  const tierBreakdown = {
    STARTER: referrals.filter(r => r.tier === 'STARTER').length,
    PRO: referrals.filter(r => r.tier === 'PRO').length,
    ELITE: referrals.filter(r => r.tier === 'ELITE').length,
  }

  const activeReferrals = referrals.filter(r => r.status === 'ACTIVE').length

  return NextResponse.json({
    referralCode,
    referralUrl: buildReferralUrl(referralCode),
    referralCount,
    activeReferrals,
    tierBreakdown,
    // The member's own signup source (for their info)
    signedUpVia: user.utmSource || 'direct',
  })
}
