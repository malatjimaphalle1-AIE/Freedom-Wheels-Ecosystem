'use client'

import { useFreedomStore } from '@/lib/freedom-store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DollarSign,
  Activity,
  Wallet,
  Shield,
  Brain,
  TrendingUp,
  Zap,
  AlertCircle,
} from 'lucide-react'
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import { useState } from 'react'

const revenueData = [
  { month: 'Sep', revenue: 1200, profit: 800 },
  { month: 'Oct', revenue: 2400, profit: 1600 },
  { month: 'Nov', revenue: 3200, profit: 2100 },
  { month: 'Dec', revenue: 4100, profit: 2800 },
  { month: 'Jan', revenue: 5800, profit: 3900 },
  { month: 'Feb', revenue: 7200, profit: 4800 },
  { month: 'Mar', revenue: 9251, profit: 6100 },
]

const profitabilityData = [
  { name: 'Content Syndicator', value: 4820 },
  { name: 'Lead Magnet', value: 3150 },
  { name: 'Arbitrage Bot', value: 1281 },
]

const conversionData = [
  { stage: 'Visitors', count: 4500 },
  { stage: 'Leads', count: 1800 },
  { stage: 'Qualified', count: 720 },
  { stage: 'Proposals', count: 288 },
  { stage: 'Closed', count: 115 },
]

const roiData = [
  { month: 'Sep', roi: 12 },
  { month: 'Oct', roi: 18 },
  { month: 'Nov', roi: 24 },
  { month: 'Dec', roi: 31 },
  { month: 'Jan', roi: 42 },
  { month: 'Feb', roi: 55 },
  { month: 'Mar', roi: 68 },
]

const leadSourceData = [
  { name: 'LinkedIn', value: 35, color: '#00f2ff' },
  { name: 'Referral', value: 25, color: '#f59e0b' },
  { name: 'Website', value: 20, color: '#10b981' },
  { name: 'Conference', value: 12, color: '#a855f7' },
  { name: 'Twitter', value: 8, color: '#ef4444' },
]

const statCards = [
  {
    title: 'Total Sync',
    value: '$9,251',
    change: '+23.4%',
    icon: DollarSign,
    color: 'text-fw-accent',
  },
  {
    title: 'Active Yield',
    value: '$7,970',
    change: '+18.2%',
    icon: Activity,
    color: 'text-fw-green',
  },
  {
    title: 'Liquid Assets',
    value: '$24,580',
    change: '+12.8%',
    icon: Wallet,
    color: 'text-fw-gold',
  },
  {
    title: 'Secured',
    value: '98.7%',
    change: '+0.3%',
    icon: Shield,
    color: 'text-fw-purple',
  },
]

export default function DashboardView() {
  const { engines, logs } = useFreedomStore()
  const [insights, setInsights] = useState<string | null>(null)
  const [loadingInsights, setLoadingInsights] = useState(false)

  const handleAnalyze = async () => {
    setLoadingInsights(true)
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'insights',
          data: {
            engines: engines.map((e) => ({
              name: e.name,
              status: e.status,
              revenue: e.revenue,
              performance: e.performance,
            })),
            totalRevenue: engines.reduce((a, e) => a + e.revenue, 0),
          },
        }),
      })
      const data = await res.json()
      setInsights(data.result)
    } catch {
      setInsights('Failed to generate insights. Please try again.')
    }
    setLoadingInsights(false)
  }

  return (
    <div className="p-4 md:p-6 space-y-6 fw-scrollbar overflow-y-auto h-full">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <Card
            key={card.title}
            className="bg-fw-surface border-fw-border hover:border-fw-accent/30 transition-colors"
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-mono tracking-widest uppercase text-fw-dim">
                {card.title}
              </CardTitle>
              <card.icon className={`w-4 h-4 ${card.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-mono">{card.value}</div>
              <div className="flex items-center gap-1 mt-1">
                <TrendingUp className="w-3 h-3 text-fw-green" />
                <span className="text-xs text-fw-green font-mono">
                  {card.change}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Revenue Chart + Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 bg-fw-surface border-fw-border">
          <CardHeader>
            <CardTitle className="text-xs font-mono tracking-widest uppercase text-fw-dim">
              Revenue Sync Over Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueData}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00f2ff" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#00f2ff" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#161b22" />
                  <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} />
                  <YAxis stroke="#94a3b8" fontSize={11} />
                  <Tooltip
                    contentStyle={{
                      background: '#0a0e14',
                      border: '1px solid #161b22',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#00f2ff"
                    fill="url(#colorRevenue)"
                    strokeWidth={2}
                  />
                  <Area
                    type="monotone"
                    dataKey="profit"
                    stroke="#10b981"
                    fill="url(#colorProfit)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-fw-surface border-fw-border">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-mono tracking-widest uppercase text-fw-dim">
              Strategic Insights
            </CardTitle>
            <Brain className="w-4 h-4 text-fw-accent" />
          </CardHeader>
          <CardContent>
            {insights ? (
              <div className="text-sm text-fw-dim leading-relaxed space-y-2 max-h-56 overflow-y-auto fw-scrollbar">
                {insights.split('\n').map((line, i) => (
                  <p key={i} className="flex gap-2">
                    {line.trim()}
                  </p>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-48 text-center">
                <Zap className="w-8 h-8 text-fw-accent/30 mb-3" />
                <p className="text-fw-dim text-sm mb-4">
                  AI-powered analysis of your ecosystem
                </p>
              </div>
            )}
            <Button
              onClick={handleAnalyze}
              disabled={loadingInsights}
              className="w-full mt-4 bg-fw-accent/10 text-fw-accent hover:bg-fw-accent/20 border border-fw-accent/30"
              size="sm"
            >
              {loadingInsights ? (
                <span className="flex items-center gap-2">
                  <span className="w-3 h-3 border-2 border-fw-accent/50 border-t-fw-accent rounded-full animate-spin" />
                  Analyzing...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Brain className="w-3 h-3" />
                  AI Analyze
                </span>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Profitability + Funnel + Lead Sources */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="bg-fw-surface border-fw-border">
          <CardHeader>
            <CardTitle className="text-xs font-mono tracking-widest uppercase text-fw-dim">
              Profitability Matrix
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={profitabilityData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#161b22" />
                  <XAxis type="number" stroke="#94a3b8" fontSize={11} />
                  <YAxis type="category" dataKey="name" stroke="#94a3b8" fontSize={10} width={100} />
                  <Tooltip
                    contentStyle={{
                      background: '#0a0e14',
                      border: '1px solid #161b22',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="value" fill="#00f2ff" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-fw-surface border-fw-border">
          <CardHeader>
            <CardTitle className="text-xs font-mono tracking-widest uppercase text-fw-dim">
              Lead Conversion Funnel
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={conversionData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#161b22" />
                  <XAxis dataKey="stage" stroke="#94a3b8" fontSize={10} />
                  <YAxis stroke="#94a3b8" fontSize={11} />
                  <Tooltip
                    contentStyle={{
                      background: '#0a0e14',
                      border: '1px solid #161b22',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="count" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-fw-surface border-fw-border">
          <CardHeader>
            <CardTitle className="text-xs font-mono tracking-widest uppercase text-fw-dim">
              Lead Sources
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={leadSourceData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {leadSourceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: '#0a0e14',
                      border: '1px solid #161b22',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {leadSourceData.map((s) => (
                <div key={s.name} className="flex items-center gap-1.5 text-xs">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ background: s.color }}
                  />
                  <span className="text-fw-dim">{s.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ROI + Neural Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 bg-fw-surface border-fw-border">
          <CardHeader>
            <CardTitle className="text-xs font-mono tracking-widest uppercase text-fw-dim">
              ROI Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={roiData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#161b22" />
                  <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} />
                  <YAxis stroke="#94a3b8" fontSize={11} />
                  <Tooltip
                    contentStyle={{
                      background: '#0a0e14',
                      border: '1px solid #161b22',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="roi"
                    stroke="#a855f7"
                    strokeWidth={2}
                    dot={{ fill: '#a855f7', r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-fw-surface border-fw-border">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-mono tracking-widest uppercase text-fw-dim">
              Neural Logs
            </CardTitle>
            <Activity className="w-4 h-4 text-fw-accent" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-48 overflow-y-auto fw-scrollbar">
              {logs.map((log) => (
                <div key={log.id} className="flex items-start gap-3">
                  <div
                    className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                      log.type === 'revenue'
                        ? 'bg-fw-green'
                        : log.type === 'engine'
                        ? 'bg-fw-accent'
                        : log.type === 'lead'
                        ? 'bg-fw-gold'
                        : log.type === 'referral'
                        ? 'bg-fw-purple'
                        : 'bg-fw-dim'
                    }`}
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-bold tracking-wider uppercase truncate">
                      {log.title}
                    </p>
                    <p className="text-[10px] text-fw-dim truncate">
                      {log.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Engine Status */}
      <Card className="bg-fw-surface border-fw-border">
        <CardHeader>
          <CardTitle className="text-xs font-mono tracking-widest uppercase text-fw-dim">
            Active Income Engines
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {engines.map((engine) => (
              <div
                key={engine.id}
                className="p-4 rounded-lg border border-fw-border bg-fw-bg hover:border-fw-accent/30 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono tracking-widest uppercase">
                    {engine.name}
                  </span>
                  <Badge
                    variant="outline"
                    className={`text-[10px] ${
                      engine.status === 'ACTIVE'
                        ? 'border-fw-green/50 text-fw-green'
                        : 'border-fw-gold/50 text-fw-gold'
                    }`}
                  >
                    {engine.status}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-fw-green" />
                  <span className="text-lg font-bold font-mono">
                    ${engine.revenue.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center gap-1 mt-1">
                  {engine.performance === 'OPTIMAL' ? (
                    <Activity className="w-3 h-3 text-fw-green" />
                  ) : (
                    <AlertCircle className="w-3 h-3 text-fw-gold" />
                  )}
                  <span className="text-[10px] text-fw-dim font-mono">
                    {engine.performance}
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
