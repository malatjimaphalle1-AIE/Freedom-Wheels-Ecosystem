'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Trophy, TrendingUp, Zap, Crown, Medal } from 'lucide-react'
import { useState } from 'react'

const tabs = ['All', 'Revenue', 'Engines', 'Referrals', 'Community']

const leaderboardData = [
  { rank: 1, name: 'Marcus Freedom', score: 9840, revenue: '$24.5K', engines: 7, badge: 'SOVEREIGN', pulse: true },
  { rank: 2, name: 'Sarah Chen', score: 8720, revenue: '$19.2K', engines: 5, badge: 'COMMANDER', pulse: true },
  { rank: 3, name: 'David Kim', score: 7650, revenue: '$16.8K', engines: 4, badge: 'COMMANDER', pulse: false },
  { rank: 4, name: 'Amara Osei', score: 6890, revenue: '$14.1K', engines: 4, badge: 'OPERATOR', pulse: true },
  { rank: 5, name: 'James Okonkwo', score: 5430, revenue: '$11.7K', engines: 3, badge: 'OPERATOR', pulse: false },
  { rank: 6, name: 'Elena Vasquez', score: 4210, revenue: '$8.9K', engines: 2, badge: 'BUILDER', pulse: true },
  { rank: 7, name: 'Liam Nascimento', score: 3870, revenue: '$7.4K', engines: 2, badge: 'BUILDER', pulse: false },
  { rank: 8, name: 'Priya Sharma', score: 2940, revenue: '$5.2K', engines: 1, badge: 'INITIATE', pulse: false },
]

const badgeColors: Record<string, string> = {
  SOVEREIGN: 'border-fw-gold/50 text-fw-gold bg-fw-gold/10',
  COMMANDER: 'border-fw-accent/50 text-fw-accent bg-fw-accent/10',
  OPERATOR: 'border-fw-green/50 text-fw-green bg-fw-green/10',
  BUILDER: 'border-fw-purple/50 text-fw-purple bg-fw-purple/10',
  INITIATE: 'border-fw-dim/50 text-fw-dim bg-fw-dim/10',
}

const rankIcons = [Crown, Trophy, Medal]

export default function LeaderboardView() {
  const [activeTab, setActiveTab] = useState('All')

  return (
    <div className="p-4 md:p-6 space-y-6 fw-scrollbar overflow-y-auto h-full">
      <div>
        <h2 className="text-xl font-bold tracking-widest uppercase">
          Leaderboard
        </h2>
        <p className="text-fw-dim text-sm font-mono">
          Top performers in the Freedom Wheels ecosystem
        </p>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-1.5 rounded-full text-xs font-mono tracking-wider uppercase whitespace-nowrap transition-colors ${
              activeTab === tab
                ? 'bg-fw-accent/10 text-fw-accent border border-fw-accent/30'
                : 'border border-fw-border text-fw-dim hover:border-fw-accent/20 hover:text-fw-text'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Top 3 */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {leaderboardData.slice(0, 3).map((user, i) => {
          const RankIcon = rankIcons[i]
          return (
            <Card
              key={user.rank}
              className={`bg-fw-surface border-fw-border relative overflow-hidden ${
                i === 0 ? 'fw-glow-gold' : ''
              }`}
            >
              <div
                className={`absolute top-0 left-0 right-0 h-1 ${
                  i === 0
                    ? 'bg-fw-gold'
                    : i === 1
                    ? 'bg-fw-accent'
                    : 'bg-fw-green'
                }`}
              />
              <CardContent className="pt-8 text-center">
                <RankIcon
                  className={`w-8 h-8 mx-auto mb-3 ${
                    i === 0
                      ? 'text-fw-gold'
                      : i === 1
                      ? 'text-fw-accent'
                      : 'text-fw-green'
                  }`}
                />
                <h3 className="text-sm font-bold tracking-wider uppercase">
                  {user.name}
                </h3>
                <p className="text-2xl font-bold font-mono mt-2">
                  {user.score.toLocaleString()}
                </p>
                <p className="text-xs text-fw-dim font-mono">points</p>
                <div className="flex items-center justify-center gap-2 mt-3">
                  <Badge
                    variant="outline"
                    className={`text-[9px] ${badgeColors[user.badge] || ''}`}
                  >
                    {user.badge}
                  </Badge>
                  {user.pulse && (
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-fw-green animate-pulse" />
                      <span className="text-[9px] text-fw-green font-mono">
                        LIVE
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Full Leaderboard */}
      <Card className="bg-fw-surface border-fw-border">
        <CardHeader>
          <CardTitle className="text-xs font-mono tracking-widest uppercase text-fw-dim">
            Full Rankings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {leaderboardData.map((user) => (
              <div
                key={user.rank}
                className="flex items-center gap-4 p-3 rounded-lg border border-fw-border/50 bg-fw-bg hover:border-fw-accent/20 transition-colors"
              >
                <span
                  className={`text-lg font-bold font-mono w-8 text-center ${
                    user.rank <= 3
                      ? 'text-fw-gold'
                      : 'text-fw-dim'
                  }`}
                >
                  #{user.rank}
                </span>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold tracking-wider truncate">
                      {user.name}
                    </span>
                    {user.pulse && (
                      <div className="w-1.5 h-1.5 rounded-full bg-fw-green animate-pulse flex-shrink-0" />
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 flex-shrink-0">
                  <div className="text-right hidden sm:block">
                    <span className="text-xs text-fw-dim font-mono">
                      {user.revenue}
                    </span>
                  </div>
                  <div className="text-right hidden md:block">
                    <span className="text-xs text-fw-dim font-mono">
                      {user.engines} engines
                    </span>
                  </div>
                  <Badge
                    variant="outline"
                    className={`text-[9px] ${badgeColors[user.badge] || ''}`}
                  >
                    {user.badge}
                  </Badge>
                  <span className="text-sm font-bold font-mono text-fw-accent w-16 text-right">
                    {user.score.toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
