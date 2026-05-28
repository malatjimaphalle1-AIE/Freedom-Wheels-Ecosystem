'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Star, ShoppingCart, Brain, Filter } from 'lucide-react'
import { useState } from 'react'

const categories = ['All', 'Engines', 'Templates', 'Data', 'AI Models', 'Plugins']

const products = [
  {
    id: 'p1',
    name: 'AI Content Engine Pro',
    category: 'Engines',
    price: 149,
    rating: 4.8,
    reviews: 234,
    desc: 'Advanced content generation and syndication engine with multi-platform support',
    badge: 'BEST SELLER',
  },
  {
    id: 'p2',
    name: 'Lead Scoring AI',
    category: 'AI Models',
    price: 79,
    rating: 4.6,
    reviews: 156,
    desc: 'Machine learning model for predictive lead scoring and qualification',
    badge: 'NEW',
  },
  {
    id: 'p3',
    name: 'Crypto Arbitrage Template',
    category: 'Templates',
    price: 99,
    rating: 4.3,
    reviews: 89,
    desc: 'Pre-built arbitrage detection and execution template for crypto markets',
    badge: null,
  },
  {
    id: 'p4',
    name: 'Social Media Sync',
    category: 'Plugins',
    price: 49,
    rating: 4.5,
    reviews: 201,
    desc: 'Cross-platform social media synchronization and scheduling plugin',
    badge: 'POPULAR',
  },
  {
    id: 'p5',
    name: 'Market Data Feed',
    category: 'Data',
    price: 199,
    rating: 4.9,
    reviews: 312,
    desc: 'Real-time market data aggregation from 50+ sources with AI analysis',
    badge: 'PREMIUM',
  },
  {
    id: 'p6',
    name: 'Email Sequence Builder',
    category: 'Templates',
    price: 69,
    rating: 4.4,
    reviews: 178,
    desc: 'Drag-and-drop email sequence builder with AI-powered copy optimization',
    badge: null,
  },
]

export default function MarketplaceView() {
  const [activeCategory, setActiveCategory] = useState('All')
  const [aiDescriptions, setAiDescriptions] = useState<Record<string, string>>({})
  const [loadingAi, setLoadingAi] = useState<string | null>(null)

  const filteredProducts =
    activeCategory === 'All'
      ? products
      : products.filter((p) => p.category === activeCategory)

  const generateDescription = async (productId: string, productName: string) => {
    setLoadingAi(productId)
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'content',
          data: { topic: `Write a compelling 2-sentence product description for: ${productName}` },
        }),
      })
      const data = await res.json()
      setAiDescriptions((prev) => ({ ...prev, [productId]: data.result }))
    } catch {
      setAiDescriptions((prev) => ({
        ...prev,
        [productId]: 'AI description generation failed.',
      }))
    }
    setLoadingAi(null)
  }

  return (
    <div className="p-4 md:p-6 space-y-6 fw-scrollbar overflow-y-auto h-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-widest uppercase">
            Marketplace
          </h2>
          <p className="text-fw-dim text-sm font-mono">
            Curated engines, templates, and AI tools
          </p>
        </div>
      </div>

      {/* Category Filters */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        <Filter className="w-4 h-4 text-fw-dim flex-shrink-0" />
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-4 py-1.5 rounded-full text-xs font-mono tracking-wider uppercase whitespace-nowrap transition-colors ${
              activeCategory === cat
                ? 'bg-fw-accent/10 text-fw-accent border border-fw-accent/30'
                : 'border border-fw-border text-fw-dim hover:border-fw-accent/20 hover:text-fw-text'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredProducts.map((product) => (
          <Card
            key={product.id}
            className="bg-fw-surface border-fw-border hover:border-fw-accent/30 transition-colors group"
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-sm font-bold tracking-wider uppercase truncate">
                    {product.name}
                  </CardTitle>
                  <Badge
                    variant="outline"
                    className="text-[9px] border-fw-accent/30 text-fw-accent mt-1"
                  >
                    {product.category}
                  </Badge>
                </div>
                {product.badge && (
                  <Badge className="text-[9px] bg-fw-gold/10 text-fw-gold border border-fw-gold/30 ml-2">
                    {product.badge}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-fw-dim leading-relaxed mb-3">
                {aiDescriptions[product.id]
                  ? aiDescriptions[product.id].split('\n')[0]
                  : product.desc}
              </p>

              <div className="flex items-center gap-2 mb-3">
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`w-3 h-3 ${
                        i < Math.floor(product.rating)
                          ? 'text-fw-gold fill-fw-gold'
                          : 'text-fw-border'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-[10px] text-fw-dim font-mono">
                  {product.rating} ({product.reviews})
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-lg font-bold font-mono text-fw-text">
                  ${product.price}
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => generateDescription(product.id, product.name)}
                    disabled={loadingAi === product.id}
                    variant="ghost"
                    size="sm"
                    className="text-fw-dim hover:text-fw-accent h-8 w-8 p-0"
                  >
                    <Brain className="w-3 h-3" />
                  </Button>
                  <Button
                    size="sm"
                    className="bg-fw-accent/10 text-fw-accent border border-fw-accent/30 hover:bg-fw-accent/20 h-8"
                  >
                    <ShoppingCart className="w-3 h-3 mr-1" />
                    Add
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
