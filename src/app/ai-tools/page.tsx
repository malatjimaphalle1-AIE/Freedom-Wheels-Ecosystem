'use client'

import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Link from 'next/link'
import { ArrowLeft, Search, Star, ExternalLink, Sparkles } from 'lucide-react'

interface AiTool {
  id: string
  name: string
  description: string
  longDescription: string | null
  url: string
  affiliateUrl: string | null
  imageUrl: string | null
  category: string
  subcategory: string
  pricing: string
  features: string | null
  rating: number
  isFeatured: boolean
}

const PRICING_COLORS: Record<string, string> = {
  'Free': 'bg-emerald-100 text-emerald-700',
  'Freemium': 'bg-blue-100 text-blue-700',
  'Paid': 'bg-amber-100 text-amber-700',
  'Free Trial': 'bg-violet-100 text-violet-700',
}

export default function AiToolsPage() {
  const [tools, setTools] = useState<AiTool[]>([])
  const [subcategories, setSubcategories] = useState<string[]>([])
  const [activeSub, setActiveSub] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/ai-tools')
      .then(r => r.json())
      .then(data => {
        setTools(data.tools || [])
        setSubcategories(data.subcategories || [])
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    return tools.filter(t => {
      if (activeSub !== 'all' && t.subcategory !== activeSub) return false
      if (search && !t.name.toLowerCase().includes(search.toLowerCase()) &&
          !t.description.toLowerCase().includes(search.toLowerCase())) return false
      return true
    })
  }, [tools, activeSub, search])

  const featuredTools = useMemo(() => tools.filter(t => t.isFeatured).slice(0, 6), [tools])

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="border-b sticky top-0 bg-background/95 backdrop-blur z-40">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-emerald-600 text-white font-bold text-sm">FW</div>
            <span className="font-semibold">Freedom Wheels · AI Tools</span>
          </Link>
          <Link href="/" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center">
            <ArrowLeft className="h-4 w-4 mr-1" /> Back to home
          </Link>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-8 max-w-6xl">
        {/* Hero */}
        <div className="text-center mb-8">
          <Badge className="bg-emerald-600 text-white mb-3">
            <Sparkles className="h-3 w-3 mr-1" /> AI Tools Marketplace
          </Badge>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">
            AI Creative Tools for SA Entrepreneurs
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Curated AI tools for image generation, marketing, branding, and content creation.
            Filter by category, search by name, and find the right tool for your business.
          </p>
        </div>

        {/* Featured tools */}
        {featuredTools.length > 0 && activeSub === 'all' && !search && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Star className="h-5 w-5 text-amber-500" /> Featured Tools
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {featuredTools.map(tool => (
                <ToolCard key={tool.id} tool={tool} compact />
              ))}
            </div>
          </div>
        )}

        {/* Search + filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search AI tools…"
              className="pl-9"
            />
          </div>
        </div>

        {/* Subcategory filters */}
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setActiveSub('all')}
            className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
              activeSub === 'all' ? 'bg-emerald-600 text-white border-emerald-600' : 'hover:bg-muted'
            }`}
          >
            All ({tools.length})
          </button>
          {subcategories.map(sub => {
            const count = tools.filter(t => t.subcategory === sub).length
            return (
              <button
                key={sub}
                onClick={() => setActiveSub(sub)}
                className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
                  activeSub === sub ? 'bg-emerald-600 text-white border-emerald-600' : 'hover:bg-muted'
                }`}
              >
                {sub} ({count})
              </button>
            )
          })}
        </div>

        {/* Tools grid */}
        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Loading AI tools…</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">No tools found. Try a different search.</div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(tool => (
              <ToolCard key={tool.id} tool={tool} />
            ))}
          </div>
        )}

        {/* Disclosure */}
        <div className="mt-12 text-center text-xs text-muted-foreground max-w-2xl mx-auto">
          Some tool links are affiliate links. Freedom Wheels earns a commission when you sign up through these links, at no additional cost to you.
          This funds our member revenue share program.
        </div>
      </main>

      <footer className="border-t mt-auto">
        <div className="container mx-auto px-4 py-4 text-xs text-muted-foreground text-center">
          Freedom Wheels · <Link href="/" className="hover:text-foreground">Home</Link> ·{' '}
          <Link href="/guides" className="hover:text-foreground">Guides</Link> ·{' '}
          <Link href="/member" className="hover:text-foreground">Member</Link>
        </div>
      </footer>
    </div>
  )
}

function ToolCard({ tool, compact }: { tool: AiTool; compact?: boolean }) {
  const link = tool.affiliateUrl || tool.url
  const features = tool.features ? tool.features.split(',').map(f => f.trim()).slice(0, 4) : []

  return (
    <Card className={tool.isFeatured ? 'border-emerald-300 shadow-md' : ''}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-base">{tool.name}</h3>
              {tool.isFeatured && <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />}
            </div>
            <Badge variant="outline" className="text-xs">{tool.subcategory}</Badge>
          </div>
          <Badge className={`text-xs ${PRICING_COLORS[tool.pricing] || 'bg-muted'}`}>
            {tool.pricing}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground leading-relaxed">
          {compact ? tool.description : (tool.longDescription || tool.description)}
        </p>

        {/* Rating */}
        <div className="flex items-center gap-1">
          {[1,2,3,4,5].map(i => (
            <Star
              key={i}
              className={`h-3.5 w-3.5 ${i <= tool.rating ? 'text-amber-500 fill-amber-500' : 'text-muted-foreground'}`}
            />
          ))}
          <span className="text-xs text-muted-foreground ml-1">{tool.rating}/5</span>
        </div>

        {/* Features */}
        {features.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {features.map((f, i) => (
              <span key={i} className="text-xs px-1.5 py-0.5 bg-muted rounded">{f}</span>
            ))}
          </div>
        )}

        {/* CTA */}
        <Button asChild size="sm" className="w-full">
          <a href={link} target="_blank" rel="noopener noreferrer nofollow sponsored">
            Visit {tool.name} <ExternalLink className="h-3 w-3 ml-1" />
          </a>
        </Button>
      </CardContent>
    </Card>
  )
}
