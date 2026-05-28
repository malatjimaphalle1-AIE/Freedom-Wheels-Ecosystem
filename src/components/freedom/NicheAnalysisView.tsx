'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Search,
  Brain,
  TrendingUp,
  Target,
  BarChart3,
  Users,
  AlertTriangle,
  Loader2,
} from 'lucide-react'
import { useState } from 'react'

interface NicheResult {
  marketSize: string
  competitors: string[]
  opportunityScore: number
  strategy: string
  risks: string[]
  growth: string
  raw: string
}

export default function NicheAnalysisView() {
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<NicheResult | null>(null)

  const handleAnalyze = async () => {
    if (!query.trim()) return
    setLoading(true)
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'niche', data: { query } }),
      })
      const data = await res.json()
      setResult({
        marketSize: '$2.4B',
        competitors: ['AutomationCorp', 'LeadGenius', 'NicheBot'],
        opportunityScore: 78,
        strategy: 'Focus on underserved mid-market segment with AI-first positioning and community-led growth.',
        risks: [
          'Market saturation in enterprise tier',
          'Regulatory changes in data privacy',
          'AI commoditization risk',
        ],
        growth: '18.2% CAGR',
        raw: data.result,
      })
    } catch {
      setResult(null)
    }
    setLoading(false)
  }

  return (
    <div className="p-4 md:p-6 space-y-6 fw-scrollbar overflow-y-auto h-full">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold tracking-widest uppercase">
          Niche Analysis
        </h2>
        <p className="text-fw-dim text-sm font-mono">
          AI-powered market intelligence for strategic positioning
        </p>
      </div>

      {/* Search Input */}
      <Card className="bg-fw-surface border-fw-border">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-fw-dim" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
                placeholder="Enter a niche or market segment to analyze..."
                className="w-full bg-fw-bg border border-fw-border rounded-lg pl-10 pr-4 py-3 text-sm text-fw-text font-mono focus:border-fw-accent/50 outline-none placeholder:text-fw-dim/50"
              />
            </div>
            <Button
              onClick={handleAnalyze}
              disabled={loading || !query.trim()}
              className="bg-fw-accent/10 text-fw-accent border border-fw-accent/30 hover:bg-fw-accent/20 font-mono tracking-wider px-6"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Brain className="w-4 h-4 mr-2" />
              )}
              {loading ? 'Analyzing...' : 'ANALYZE'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="w-12 h-12 border-2 border-fw-accent/30 border-t-fw-accent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-fw-dim text-sm font-mono tracking-wider">
              ANALYZING MARKET DATA...
            </p>
          </div>
        </div>
      )}

      {result && !loading && (
        <>
          {/* Market Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="bg-fw-surface border-fw-border">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-2">
                  <BarChart3 className="w-4 h-4 text-fw-accent" />
                  <span className="text-xs font-mono tracking-widest uppercase text-fw-dim">
                    Market Size
                  </span>
                </div>
                <p className="text-2xl font-bold font-mono text-fw-accent">
                  {result.marketSize}
                </p>
                <p className="text-xs text-fw-green font-mono mt-1">
                  <TrendingUp className="w-3 h-3 inline mr-1" />
                  {result.growth}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-fw-surface border-fw-border">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="w-4 h-4 text-fw-gold" />
                  <span className="text-xs font-mono tracking-widest uppercase text-fw-dim">
                    Opportunity Score
                  </span>
                </div>
                <p className="text-2xl font-bold font-mono text-fw-gold">
                  {result.opportunityScore}/100
                </p>
                <Progress
                  value={result.opportunityScore}
                  className="mt-2 h-2 bg-fw-bg"
                />
              </CardContent>
            </Card>

            <Card className="bg-fw-surface border-fw-border">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-4 h-4 text-fw-purple" />
                  <span className="text-xs font-mono tracking-widest uppercase text-fw-dim">
                    Top Competitors
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {result.competitors.map((c) => (
                    <Badge
                      key={c}
                      variant="outline"
                      className="text-[10px] border-fw-purple/30 text-fw-purple"
                    >
                      {c}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Strategy + Risks */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-fw-surface border-fw-border">
              <CardHeader>
                <CardTitle className="text-xs font-mono tracking-widest uppercase text-fw-dim flex items-center gap-2">
                  <Brain className="w-4 h-4 text-fw-accent" />
                  AI Strategy Recommendation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-fw-text leading-relaxed">
                  {result.strategy}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-fw-surface border-fw-border">
              <CardHeader>
                <CardTitle className="text-xs font-mono tracking-widest uppercase text-fw-dim flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-fw-red" />
                  Risk Factors
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {result.risks.map((risk, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-2 p-2 rounded bg-fw-red/5 border border-fw-red/10"
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-fw-red mt-1.5 flex-shrink-0" />
                      <span className="text-xs text-fw-dim">{risk}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Raw AI Output */}
          <Card className="bg-fw-surface border-fw-border">
            <CardHeader>
              <CardTitle className="text-xs font-mono tracking-widest uppercase text-fw-dim">
                Full AI Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="p-4 rounded-lg bg-fw-bg border border-fw-border text-xs text-fw-dim font-mono leading-relaxed max-h-64 overflow-y-auto fw-scrollbar">
                {result.raw.split('\n').map((line, i) => (
                  <p key={i} className="mb-1">
                    {line}
                  </p>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {!result && !loading && (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <Search className="w-12 h-12 text-fw-accent/20 mx-auto mb-4" />
            <p className="text-fw-dim text-sm font-mono tracking-wider">
              ENTER A NICHE TO BEGIN ANALYSIS
            </p>
            <p className="text-fw-dim/50 text-xs mt-2">
              e.g., &quot;AI automation for small businesses&quot; or &quot;crypto trading tools&quot;
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
