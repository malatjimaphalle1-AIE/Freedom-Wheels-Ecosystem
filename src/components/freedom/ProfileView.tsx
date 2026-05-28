'use client'

import { useFreedomStore } from '@/lib/freedom-store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  User,
  Trophy,
  Star,
  Shield,
  TrendingUp,
  Users,
  Coins,
  Award,
  Crown,
} from 'lucide-react'

const achievements = [
  { name: 'First Engine', desc: 'Deploy your first income engine', earned: true, icon: '🚀' },
  { name: 'Revenue Milestone', desc: 'Earn $1,000 in a single month', earned: true, icon: '💰' },
  { name: 'Lead Master', desc: 'Convert 10 leads to clients', earned: true, icon: '🎯' },
  { name: 'Network Builder', desc: 'Refer 10 users to the platform', earned: true, icon: '🌐' },
  { name: 'Sovereign Operator', desc: 'Earn $10,000 cumulative revenue', earned: true, icon: '👑' },
  { name: 'Automation Expert', desc: 'Run 5 active workflows simultaneously', earned: false, icon: '⚡' },
  { name: 'Multi-Asset Master', desc: 'Hold assets in 5+ currencies', earned: true, icon: '💎' },
  { name: 'Content King', desc: 'Generate 100 pieces of AI content', earned: false, icon: '📝' },
]

const cryptoBalances = [
  { symbol: 'BTC', name: 'Bitcoin', amount: 0.015, value: '$1,245', change: '+2.4%' },
  { symbol: 'ETH', name: 'Ethereum', amount: 0.45, value: '$1,620', change: '+1.8%' },
  { symbol: 'SOL', name: 'Solana', amount: 12.5, value: '$1,875', change: '+5.2%' },
  { symbol: 'USDT', name: 'Tether', amount: 3500, value: '$3,500', change: '0.0%' },
]

export default function ProfileView() {
  const { user } = useFreedomStore()

  return (
    <div className="p-4 md:p-6 space-y-6 fw-scrollbar overflow-y-auto h-full">
      {/* Profile Header */}
      <Card className="bg-fw-surface border-fw-border relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-r from-fw-accent/10 via-fw-gold/10 to-fw-purple/10" />
        <CardContent className="relative z-10 pt-12">
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
            <div className="w-20 h-20 rounded-full bg-fw-accent/10 border-2 border-fw-accent/30 flex items-center justify-center">
              <User className="w-10 h-10 text-fw-accent" />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold tracking-wider uppercase">
                {user.name}
              </h2>
              <p className="text-fw-dim text-sm font-mono">{user.email}</p>
              <div className="flex items-center gap-2 mt-2">
                <Badge className="bg-fw-gold/10 text-fw-gold border border-fw-gold/30 text-xs">
                  <Crown className="w-3 h-3 mr-1" />
                  {user.plan} PLAN
                </Badge>
                <span className="text-[10px] text-fw-dim font-mono">
                  Member since {user.joinDate}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* User Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="bg-fw-surface border-fw-border">
          <CardContent className="pt-6 text-center">
            <TrendingUp className="w-5 h-5 text-fw-green mx-auto mb-2" />
            <p className="text-xl font-bold font-mono">$9.2K</p>
            <p className="text-[10px] text-fw-dim font-mono tracking-widest uppercase">
              Total Revenue
            </p>
          </CardContent>
        </Card>
        <Card className="bg-fw-surface border-fw-border">
          <CardContent className="pt-6 text-center">
            <Trophy className="w-5 h-5 text-fw-gold mx-auto mb-2" />
            <p className="text-xl font-bold font-mono">3</p>
            <p className="text-[10px] text-fw-dim font-mono tracking-widest uppercase">
              Active Engines
            </p>
          </CardContent>
        </Card>
        <Card className="bg-fw-surface border-fw-border">
          <CardContent className="pt-6 text-center">
            <Users className="w-5 h-5 text-fw-accent mx-auto mb-2" />
            <p className="text-xl font-bold font-mono">24</p>
            <p className="text-[10px] text-fw-dim font-mono tracking-widest uppercase">
              Referrals
            </p>
          </CardContent>
        </Card>
        <Card className="bg-fw-surface border-fw-border">
          <CardContent className="pt-6 text-center">
            <Star className="w-5 h-5 text-fw-purple mx-auto mb-2" />
            <p className="text-xl font-bold font-mono">#1</p>
            <p className="text-[10px] text-fw-dim font-mono tracking-widest uppercase">
              Leaderboard
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Achievements */}
      <Card className="bg-fw-surface border-fw-border">
        <CardHeader>
          <CardTitle className="text-xs font-mono tracking-widest uppercase text-fw-dim flex items-center gap-2">
            <Award className="w-4 h-4 text-fw-gold" />
            Achievement Badges
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-fw-dim font-mono">
              {achievements.filter((a) => a.earned).length}/{achievements.length} earned
            </span>
            <span className="text-xs text-fw-gold font-mono">
              {Math.round(
                (achievements.filter((a) => a.earned).length / achievements.length) * 100
              )}%
            </span>
          </div>
          <Progress
            value={
              (achievements.filter((a) => a.earned).length / achievements.length) * 100
            }
            className="mb-4 h-2 bg-fw-bg"
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {achievements.map((ach) => (
              <div
                key={ach.name}
                className={`flex items-center gap-3 p-3 rounded-lg border ${
                  ach.earned
                    ? 'border-fw-gold/30 bg-fw-gold/5'
                    : 'border-fw-border bg-fw-bg opacity-50'
                }`}
              >
                <span className="text-2xl">{ach.icon}</span>
                <div>
                  <p className="text-xs font-bold tracking-wider uppercase">
                    {ach.name}
                  </p>
                  <p className="text-[10px] text-fw-dim font-mono">{ach.desc}</p>
                </div>
                {ach.earned && (
                  <CheckMark />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Crypto Balances */}
      <Card className="bg-fw-surface border-fw-border">
        <CardHeader>
          <CardTitle className="text-xs font-mono tracking-widest uppercase text-fw-dim flex items-center gap-2">
            <Coins className="w-4 h-4 text-fw-gold" />
            Crypto Balances
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {cryptoBalances.map((crypto) => (
              <div
                key={crypto.symbol}
                className="flex items-center justify-between p-3 rounded-lg border border-fw-border bg-fw-bg"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-fw-gold/10 flex items-center justify-center">
                    <Coins className="w-5 h-5 text-fw-gold" />
                  </div>
                  <div>
                    <p className="text-sm font-bold tracking-wider uppercase">
                      {crypto.name}
                    </p>
                    <p className="text-[10px] text-fw-dim font-mono">
                      {crypto.amount} {crypto.symbol}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold font-mono">{crypto.value}</p>
                  <p
                    className={`text-[10px] font-mono ${
                      crypto.change.startsWith('+')
                        ? 'text-fw-green'
                        : 'text-fw-dim'
                    }`}
                  >
                    {crypto.change}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Referral Network */}
      <Card className="bg-fw-surface border-fw-border">
        <CardHeader>
          <CardTitle className="text-xs font-mono tracking-widest uppercase text-fw-dim flex items-center gap-2">
            <Shield className="w-4 h-4 text-fw-accent" />
            Referral Network
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 p-4 rounded-lg border border-fw-accent/20 bg-fw-accent/5">
            <div className="w-12 h-12 rounded-full bg-fw-accent/10 flex items-center justify-center">
              <Users className="w-6 h-6 text-fw-accent" />
            </div>
            <div>
              <p className="text-lg font-bold font-mono">24 Active Referrals</p>
              <p className="text-xs text-fw-dim font-mono">
                $4,320 earned from referral network
              </p>
            </div>
            <Badge className="ml-auto bg-fw-gold/10 text-fw-gold border border-fw-gold/30">
              GOLD TIER
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function CheckMark() {
  return (
    <div className="ml-auto w-5 h-5 rounded-full bg-fw-green/20 flex items-center justify-center flex-shrink-0">
      <svg className="w-3 h-3 text-fw-green" viewBox="0 0 12 12" fill="none">
        <path d="M2 6L5 9L10 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  )
}
