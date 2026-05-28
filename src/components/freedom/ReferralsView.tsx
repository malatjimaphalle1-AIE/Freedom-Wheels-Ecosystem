'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Copy, Check, Share2, Users, Gift, TrendingUp } from 'lucide-react'
import { useState } from 'react'

const referralCode = 'FW-MARCUS-2025'

const referralStats = {
  totalReferred: 24,
  activeReferred: 18,
  earnedFromReferrals: 4320,
  pendingRewards: 480,
}

const referralHistory = [
  { name: 'James Okonkwo', date: '2025-02-25', reward: '$200', status: 'PAID' },
  { name: 'Amara Osei', date: '2025-02-22', reward: '$200', status: 'PAID' },
  { name: 'Liam Nascimento', date: '2025-03-01', reward: '$200', status: 'PENDING' },
  { name: 'Priya Sharma', date: '2025-03-01', reward: '$80', status: 'PENDING' },
  { name: 'Chen Wei', date: '2025-01-15', reward: '$200', status: 'PAID' },
  { name: 'Anna Petrov', date: '2025-01-10', reward: '$200', status: 'PAID' },
]

const rewardTiers = [
  { tier: 'Bronze', referrals: 5, reward: '$50/referral', color: 'text-amber-700 border-amber-700/30' },
  { tier: 'Silver', referrals: 15, reward: '$100/referral', color: 'text-gray-400 border-gray-400/30' },
  { tier: 'Gold', referrals: 30, reward: '$200/referral', color: 'text-fw-gold border-fw-gold/30' },
  { tier: 'Sovereign', referrals: 50, reward: '$500/referral', color: 'text-fw-accent border-fw-accent/30' },
]

export default function ReferralsView() {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(referralCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="p-4 md:p-6 space-y-6 fw-scrollbar overflow-y-auto h-full">
      <div>
        <h2 className="text-xl font-bold tracking-widest uppercase">
          Referral Network
        </h2>
        <p className="text-fw-dim text-sm font-mono">
          Grow your network and earn rewards
        </p>
      </div>

      {/* Referral Code */}
      <Card className="bg-fw-surface border-fw-border relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-fw-accent/5 rounded-full blur-[60px]" />
        <CardContent className="relative z-10 pt-8">
          <div className="text-center">
            <p className="text-xs font-mono tracking-widest uppercase text-fw-dim mb-3">
              Your Referral Code
            </p>
            <div className="inline-flex items-center gap-3 px-6 py-3 rounded-lg border border-fw-accent/30 bg-fw-accent/5">
              <span className="text-2xl font-bold font-mono text-fw-accent tracking-widest">
                {referralCode}
              </span>
              <Button
                onClick={handleCopy}
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-fw-accent hover:text-fw-text"
              >
                {copied ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>
            <div className="flex items-center justify-center gap-4 mt-4">
              <Button
                variant="outline"
                size="sm"
                className="border-fw-accent/30 text-fw-accent hover:bg-fw-accent/10"
              >
                <Share2 className="w-3 h-3 mr-2" />
                Share Link
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="border-fw-border text-fw-dim hover:text-fw-text"
              >
                <Users className="w-3 h-3 mr-2" />
                Invite Email
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="bg-fw-surface border-fw-border">
          <CardContent className="pt-6 text-center">
            <Users className="w-5 h-5 text-fw-accent mx-auto mb-2" />
            <p className="text-2xl font-bold font-mono">
              {referralStats.totalReferred}
            </p>
            <p className="text-[10px] text-fw-dim font-mono tracking-widest uppercase">
              Total Referred
            </p>
          </CardContent>
        </Card>
        <Card className="bg-fw-surface border-fw-border">
          <CardContent className="pt-6 text-center">
            <TrendingUp className="w-5 h-5 text-fw-green mx-auto mb-2" />
            <p className="text-2xl font-bold font-mono">
              {referralStats.activeReferred}
            </p>
            <p className="text-[10px] text-fw-dim font-mono tracking-widest uppercase">
              Active
            </p>
          </CardContent>
        </Card>
        <Card className="bg-fw-surface border-fw-border">
          <CardContent className="pt-6 text-center">
            <Gift className="w-5 h-5 text-fw-gold mx-auto mb-2" />
            <p className="text-2xl font-bold font-mono text-fw-gold">
              ${referralStats.earnedFromReferrals.toLocaleString()}
            </p>
            <p className="text-[10px] text-fw-dim font-mono tracking-widest uppercase">
              Earned
            </p>
          </CardContent>
        </Card>
        <Card className="bg-fw-surface border-fw-border">
          <CardContent className="pt-6 text-center">
            <Gift className="w-5 h-5 text-fw-purple mx-auto mb-2" />
            <p className="text-2xl font-bold font-mono text-fw-purple">
              ${referralStats.pendingRewards}
            </p>
            <p className="text-[10px] text-fw-dim font-mono tracking-widest uppercase">
              Pending
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Reward Tiers */}
      <Card className="bg-fw-surface border-fw-border">
        <CardHeader>
          <CardTitle className="text-xs font-mono tracking-widest uppercase text-fw-dim">
            Reward Tiers
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {rewardTiers.map((tier) => (
              <div
                key={tier.tier}
                className={`p-4 rounded-lg border ${tier.color} bg-fw-bg text-center`}
              >
                <h4 className="text-sm font-bold tracking-widest uppercase">
                  {tier.tier}
                </h4>
                <p className="text-xs text-fw-dim font-mono mt-1">
                  {tier.referrals}+ referrals
                </p>
                <p className="text-lg font-bold font-mono mt-2">
                  {tier.reward}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Reward History */}
      <Card className="bg-fw-surface border-fw-border">
        <CardHeader>
          <CardTitle className="text-xs font-mono tracking-widest uppercase text-fw-dim">
            Reward History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {referralHistory.map((r, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-3 rounded-lg border border-fw-border/50 bg-fw-bg"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-fw-accent/10 flex items-center justify-center">
                    <Users className="w-4 h-4 text-fw-accent" />
                  </div>
                  <div>
                    <p className="text-xs font-bold tracking-wider">
                      {r.name}
                    </p>
                    <p className="text-[10px] text-fw-dim font-mono">
                      {r.date}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold font-mono text-fw-gold">
                    {r.reward}
                  </span>
                  <Badge
                    variant="outline"
                    className={`text-[9px] ${
                      r.status === 'PAID'
                        ? 'border-fw-green/50 text-fw-green'
                        : 'border-fw-gold/50 text-fw-gold'
                    }`}
                  >
                    {r.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
