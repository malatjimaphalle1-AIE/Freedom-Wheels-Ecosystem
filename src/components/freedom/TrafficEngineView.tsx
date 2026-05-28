'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import {
  Brain,
  Search,
  Globe,
  Hash,
  Share2,
  Loader2,
  Copy,
  Check,
} from 'lucide-react'
import { useState } from 'react'

const platforms = [
  { name: 'LinkedIn', active: true, icon: '🔗' },
  { name: 'Twitter/X', active: true, icon: '🐦' },
  { name: 'Instagram', active: false, icon: '📷' },
  { name: 'YouTube', active: true, icon: '▶️' },
  { name: 'TikTok', active: false, icon: '🎵' },
  { name: 'Medium', active: true, icon: '📝' },
]

const keywords = [
  { keyword: 'AI automation', volume: '12.4K', difficulty: 72 },
  { keyword: 'passive income', volume: '24.8K', difficulty: 85 },
  { keyword: 'income engine', volume: '3.2K', difficulty: 34 },
  { keyword: 'automated business', volume: '8.1K', difficulty: 61 },
  { keyword: 'wealth building', volume: '15.6K', difficulty: 78 },
  { keyword: 'digital entrepreneurship', volume: '5.9K', difficulty: 45 },
]

export default function TrafficEngineView() {
  const [prompt, setPrompt] = useState('')
  const [generated, setGenerated] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [seoQuery, setSeoQuery] = useState('')
  const [seoResults, setSeoResults] = useState<string | null>(null)

  const handleGenerate = async () => {
    if (!prompt.trim()) return
    setLoading(true)
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'content', data: { topic: prompt } }),
      })
      const data = await res.json()
      setGenerated(data.result)
    } catch {
      setGenerated('Content generation failed. Please try again.')
    }
    setLoading(false)
  }

  const handleSeoAnalysis = async () => {
    if (!seoQuery.trim()) return
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'insights',
          data: { query: seoQuery, type: 'seo' },
        }),
      })
      const data = await res.json()
      setSeoResults(data.result)
    } catch {
      setSeoResults('SEO analysis failed.')
    }
  }

  const handleCopy = () => {
    if (generated) {
      navigator.clipboard.writeText(generated)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="p-4 md:p-6 space-y-6 fw-scrollbar overflow-y-auto h-full">
      <div>
        <h2 className="text-xl font-bold tracking-widest uppercase">
          Traffic Engine
        </h2>
        <p className="text-fw-dim text-sm font-mono">
          AI content generation & multi-platform distribution
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* AI Content Generation */}
        <Card className="bg-fw-surface border-fw-border">
          <CardHeader>
            <CardTitle className="text-xs font-mono tracking-widest uppercase text-fw-dim flex items-center gap-2">
              <Brain className="w-4 h-4 text-fw-accent" />
              AI Content Generator
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe the content you want to generate..."
              className="bg-fw-bg border-fw-border text-fw-text font-mono text-sm min-h-24 focus:border-fw-accent/50 resize-none"
            />
            <Button
              onClick={handleGenerate}
              disabled={loading || !prompt.trim()}
              className="w-full bg-fw-accent/10 text-fw-accent border border-fw-accent/30 hover:bg-fw-accent/20 font-mono tracking-wider"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Brain className="w-4 h-4 mr-2" />
              )}
              {loading ? 'Generating...' : 'GENERATE CONTENT'}
            </Button>

            {generated && (
              <div className="relative">
                <div className="p-4 rounded-lg bg-fw-bg border border-fw-border text-xs text-fw-dim font-mono leading-relaxed max-h-64 overflow-y-auto fw-scrollbar">
                  {generated.split('\n').map((line, i) => (
                    <p key={i} className="mb-1">
                      {line}
                    </p>
                  ))}
                </div>
                <Button
                  onClick={handleCopy}
                  variant="ghost"
                  size="sm"
                  className="absolute top-2 right-2 h-6 w-6 p-0 text-fw-dim hover:text-fw-accent"
                >
                  {copied ? (
                    <Check className="w-3 h-3" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* SEO Tools */}
        <Card className="bg-fw-surface border-fw-border">
          <CardHeader>
            <CardTitle className="text-xs font-mono tracking-widest uppercase text-fw-dim flex items-center gap-2">
              <Search className="w-4 h-4 text-fw-gold" />
              SEO Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={seoQuery}
                onChange={(e) => setSeoQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSeoAnalysis()}
                placeholder="Enter URL or keyword..."
                className="flex-1 bg-fw-bg border border-fw-border rounded px-3 py-2 text-sm text-fw-text font-mono focus:border-fw-gold/50 outline-none"
              />
              <Button
                onClick={handleSeoAnalysis}
                variant="outline"
                size="sm"
                className="border-fw-gold/30 text-fw-gold hover:bg-fw-gold/10"
              >
                <Search className="w-3 h-3" />
              </Button>
            </div>

            {seoResults && (
              <div className="p-3 rounded-lg bg-fw-bg border border-fw-border text-xs text-fw-dim font-mono leading-relaxed max-h-48 overflow-y-auto fw-scrollbar">
                {seoResults.split('\n').map((line, i) => (
                  <p key={i} className="mb-1">
                    {line}
                  </p>
                ))}
              </div>
            )}

            {/* Keyword Research */}
            <div>
              <h4 className="text-xs font-mono tracking-widest uppercase text-fw-dim mb-3 flex items-center gap-2">
                <Hash className="w-3 h-3" />
                Keyword Research
              </h4>
              <div className="space-y-2">
                {keywords.map((kw) => (
                  <div
                    key={kw.keyword}
                    className="flex items-center justify-between p-2 rounded bg-fw-bg border border-fw-border/50"
                  >
                    <div className="flex items-center gap-2">
                      <Hash className="w-3 h-3 text-fw-accent" />
                      <span className="text-xs font-mono">{kw.keyword}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] text-fw-dim font-mono">
                        {kw.volume} vol
                      </span>
                      <Badge
                        variant="outline"
                        className={`text-[9px] ${
                          kw.difficulty > 70
                            ? 'border-fw-red/50 text-fw-red'
                            : kw.difficulty > 40
                            ? 'border-fw-gold/50 text-fw-gold'
                            : 'border-fw-green/50 text-fw-green'
                        }`}
                      >
                        {kw.difficulty}% diff
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Platform Sync */}
      <Card className="bg-fw-surface border-fw-border">
        <CardHeader>
          <CardTitle className="text-xs font-mono tracking-widest uppercase text-fw-dim flex items-center gap-2">
            <Share2 className="w-4 h-4 text-fw-purple" />
            Platform Sync Controls
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {platforms.map((p) => (
              <div
                key={p.name}
                className={`flex items-center gap-2 p-3 rounded-lg border transition-colors cursor-pointer ${
                  p.active
                    ? 'border-fw-accent/30 bg-fw-accent/5'
                    : 'border-fw-border bg-fw-bg opacity-50'
                }`}
              >
                <span className="text-sm">{p.icon}</span>
                <span className="text-xs font-mono">{p.name}</span>
                <div
                  className={`w-2 h-2 rounded-full ml-auto ${
                    p.active ? 'bg-fw-green animate-pulse' : 'bg-fw-dim'
                  }`}
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
