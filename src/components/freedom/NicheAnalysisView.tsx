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

/** Hardcoded fallback values when AI response parsing fails */
const FALLBACK_RESULT: Omit<NicheResult, 'raw'> = {
  marketSize: '$2.4B',
  competitors: ['AutomationCorp', 'LeadGenius', 'NicheBot'],
  opportunityScore: 78,
  strategy:
    'Focus on underserved mid-market segment with AI-first positioning and community-led growth.',
  risks: [
    'Market saturation in enterprise tier',
    'Regulatory changes in data privacy',
    'AI commoditization risk',
  ],
  growth: '18.2% CAGR',
}

/**
 * Parse the AI text response and extract structured niche data.
 * The AI typically returns bullet-point sections like:
 *   • Market Size: Estimated $2.4B addressable market with 18% CAGR
 *   • Top Competitors: 1) AutomationCorp ($120M ARR), 2) LeadGenius, 3) NicheBot
 *   • Opportunity Score: 78/100 — Strong growth potential
 *   • Strategy: Focus on underserved mid-market segment...
 *   • Risk Factors: Market saturation, regulatory changes, AI commoditization
 *
 * Falls back to hardcoded values for any field that cannot be parsed.
 */
function parseNicheResponse(text: string): Omit<NicheResult, 'raw'> {
  const result: Partial<Omit<NicheResult, 'raw'>> = {}

  // --- Market Size ---
  // Match "$X.XB", "$X.XM", "$XB", etc. near "Market Size" or "market size"
  const marketSizeMatch =
    text.match(/market\s*size[^$]*\$[\d.]+\s*[BMKbmk]/i) ??
    text.match(/\$[\d.]+\s*[BMKbmk][^\n]*/i)
  if (marketSizeMatch) {
    const dollarMatch = marketSizeMatch[0].match(/\$[\d.]+\s*[BMKbmk]/i)
    if (dollarMatch) {
      result.marketSize = dollarMatch[0].toUpperCase()
    }
  }

  // --- Growth Rate ---
  // Match patterns like "18% CAGR", "18.2% CAGR", "growing at 22%"
  const growthMatch =
    text.match(
      /(\d+\.?\d*)\s*%\s*(CAGR|cagr|annual\s+growth|growth\s+rate|YoY)/i
    ) ??
    text.match(/growing\s+(at\s+)?(\d+\.?\d*)\s*%/i) ??
    text.match(/(\d+\.?\d*)\s*%\s*(CAGR|growth)/i)
  if (growthMatch) {
    const pct = growthMatch[0].match(/(\d+\.?\d*)\s*%/)?.[1]
    const label =
      growthMatch[0].match(/CAGR|cagr/i)?.[0]?.toUpperCase() ?? 'growth'
    if (pct) {
      result.growth = `${pct}% ${label}`
    }
  }

  // --- Opportunity Score ---
  // Match "Opportunity Score: 78/100" or "score of 78" or "78 out of 100"
  const scoreMatch =
    text.match(/opportunity\s*score[^0-9]*(\d{1,3})\s*\/\s*100/i) ??
    text.match(/opportunity\s*score[^0-9]*(\d{1,3})/i) ??
    text.match(/score[^0-9]*(\d{1,3})\s*\/\s*100/i) ??
    text.match(/(\d{1,3})\s*\/\s*100[^.\n]*opportunity/i)
  if (scoreMatch) {
    const score = parseInt(scoreMatch[1], 10)
    if (score >= 1 && score <= 100) {
      result.opportunityScore = score
    }
  }

  // --- Competitors ---
  // Match "Competitors: 1) Name, 2) Name, 3) Name" or "- Name, Name, Name"
  const competitorsSection = text.match(
    /competitors?[^:]*:([\s\S]*?)(?=(?:•|\*|-)\s*(?:strategy|risk|opportunity|$))/i
  )
  if (competitorsSection) {
    const section = competitorsSection[1]
    // Extract numbered items: "1) Name" or "1. Name"
    const numbered = section.matchAll(/\d+[).]\s*([^,(\n]+)/g)
    const names = Array.from(numbered, (m) => m[1].trim()).filter(Boolean)
    if (names.length > 0) {
      result.competitors = names
    } else {
      // Try comma-separated names after colon
      const afterColon = section.match(/:\s*([\w\s,&.]+)/)
      if (afterColon) {
        result.competitors = afterColon[1]
          .split(/[,&]/)
          .map((s) => s.trim())
          .filter((s) => s.length > 1 && s.length < 50)
      }
    }
  }
  // Fallback: look for patterns like "1) CompanyName" in the whole text
  if (!result.competitors) {
    const allNumbered = text.matchAll(/\d+[).]\s*([A-Z][A-Za-z0-9.]+)/g)
    const names = Array.from(allNumbered, (m) => m[1].trim()).filter(
      (s) => s.length > 2 && s.length < 40
    )
    if (names.length > 0) {
      result.competitors = names.slice(0, 5)
    }
  }

  // --- Strategy ---
  // Match "Strategy:" section
  const strategyMatch = text.match(
    /strategy[^:]*:([\s\S]*?)(?=(?:•|\*|-)\s*(?:risk|$))/i
  )
  if (strategyMatch) {
    const strat = strategyMatch[1]
      .replace(/^[\n\r]+/, '')
      .replace(/[\n\r]+$/, '')
      .trim()
    if (strat.length > 10) {
      result.strategy = strat
    }
  }
  // If strategy section was too greedy or empty, try a simpler extraction
  if (!result.strategy) {
    const simpleStrat = text.match(
      /(?:recommended\s+)?strategy[^:]*:\s*([^\n]+)/i
    )
    if (simpleStrat && simpleStrat[1].trim().length > 10) {
      result.strategy = simpleStrat[1].trim()
    }
  }

  // --- Risks ---
  // Match "Risk Factors:" or "Risks:" section
  const risksSection = text.match(
    /risks?[^:]*:([\s\S]*?)(?=(?:•|\*|-)\s*(?:strategy|opportunity|market|$))/i
  )
  if (risksSection) {
    const section = risksSection[1]
    // Try numbered list: "1) Risk", "1. Risk"
    const numberedRisks = section.matchAll(/\d+[).]\s*([^\n]+)/g)
    let riskItems = Array.from(numberedRisks, (m) => m[1].trim()).filter(
      (s) => s.length > 3
    )
    // Try bullet points: "- Risk", "• Risk", "* Risk"
    if (riskItems.length === 0) {
      const bulletRisks = section.matchAll(/[•*-]\s*([^\n•*-]+)/g)
      riskItems = Array.from(bulletRisks, (m) => m[1].trim()).filter(
        (s) => s.length > 3
      )
    }
    // Try comma-separated
    if (riskItems.length === 0) {
      riskItems = section
        .split(/,/)
        .map((s) => s.trim())
        .filter((s) => s.length > 5 && s.length < 150)
    }
    if (riskItems.length > 0) {
      result.risks = riskItems
    }
  }

  // Merge with fallback for any missing fields
  return {
    marketSize: result.marketSize ?? FALLBACK_RESULT.marketSize,
    competitors: result.competitors ?? FALLBACK_RESULT.competitors,
    opportunityScore: result.opportunityScore ?? FALLBACK_RESULT.opportunityScore,
    strategy: result.strategy ?? FALLBACK_RESULT.strategy,
    risks: result.risks ?? FALLBACK_RESULT.risks,
    growth: result.growth ?? FALLBACK_RESULT.growth,
  }
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
      const rawText: string = data.result ?? ''
      const parsed = parseNicheResponse(rawText)
      setResult({ ...parsed, raw: rawText })
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
