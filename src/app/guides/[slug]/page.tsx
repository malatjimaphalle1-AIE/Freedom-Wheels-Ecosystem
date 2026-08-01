'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { ArrowLeft, Lock, Eye, Calendar, ExternalLink, Tag } from 'lucide-react'
import { SocialShare } from '@/components/social-share'

interface GuideData {
  guide: {
    id: string
    slug: string
    title: string
    excerpt: string
    category: string
    tags: string
    coverImageUrl: string | null
    isMemberOnly: boolean
    publishedAt: string | null
    viewCount: number
    content: string
    isLocked: boolean
    isMember: boolean
  }
  partners: Array<{
    id: string
    name: string
    url: string
    affiliateUrl: string
    commissionRate: string
    category: string
  }>
}

export default function GuidePage({ params }: { params: Promise<{ slug: string }> }) {
  const [data, setData] = useState<GuideData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [slug, setSlug] = useState<string>('')

  useEffect(() => {
    params.then(p => setSlug(p.slug))
  }, [params])

  useEffect(() => {
    if (!slug) return
    fetch(`/api/guides/${slug}`)
      .then(async r => {
        if (!r.ok) {
          const err = await r.json()
          throw new Error(err.error || 'Failed to load guide')
        }
        return r.json()
      })
      .then(setData)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [slug])

  async function handlePartnerClick(partnerId: string, affiliateUrl: string) {
    // Track click (fire-and-forget) — works whether user is logged in or not
    fetch('/api/member/click', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ partnerId }),
    }).catch(() => {})
    window.open(affiliateUrl, '_blank', 'noopener,noreferrer')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Loading guide…</div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <header className="border-b">
          <div className="container mx-auto px-4 h-16 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-emerald-600 text-white font-bold text-sm">FW</div>
              <span className="font-semibold">Freedom Wheels</span>
            </Link>
            <Link href="/guides" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center">
              <ArrowLeft className="h-4 w-4 mr-1" /> All guides
            </Link>
          </div>
        </header>
        <main className="flex-1 flex items-center justify-center p-4">
          <Card className="max-w-md">
            <CardContent className="pt-6 text-center">
              <div className="text-lg font-semibold mb-2">Guide not found</div>
              <div className="text-sm text-muted-foreground mb-4">{error || 'This guide may have been removed or unpublished.'}</div>
              <Button asChild>
                <Link href="/guides">Browse all guides</Link>
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

  const { guide, partners } = data
  const tags = guide.tags ? guide.tags.split(',').map(t => t.trim()).filter(Boolean) : []

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="border-b sticky top-0 bg-background/95 backdrop-blur z-40">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-emerald-600 text-white font-bold text-sm">FW</div>
            <span className="font-semibold">Freedom Wheels</span>
          </Link>
          <Link href="/guides" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center">
            <ArrowLeft className="h-4 w-4 mr-1" /> All guides
          </Link>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-8 max-w-3xl">
        {/* Breadcrumb */}
        <div className="mb-4 text-sm text-muted-foreground">
          <Link href="/guides" className="hover:text-foreground">Guides</Link>
          {' / '}
          <span className="text-foreground">{guide.category}</span>
        </div>

        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <Badge variant="secondary">{guide.category}</Badge>
            {guide.isMemberOnly && (
              <Badge variant="outline" className="text-amber-600 border-amber-300">
                <Lock className="h-3 w-3 mr-1" /> Members only
              </Badge>
            )}
          </div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">{guide.title}</h1>
          <p className="text-lg text-muted-foreground mb-4">{guide.excerpt}</p>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            {guide.publishedAt && (
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {new Date(guide.publishedAt).toLocaleDateString('en-ZA', { year: 'numeric', month: 'long', day: 'numeric' })}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Eye className="h-4 w-4" /> {guide.viewCount} views
            </span>
          </div>
        </div>

        {/* Cover image */}
        {guide.coverImageUrl && (
          <div className="aspect-video w-full bg-muted rounded-lg overflow-hidden mb-8">
            <img src={guide.coverImageUrl} alt="" className="w-full h-full object-cover" />
          </div>
        )}

        {/* Content */}
        <div className="prose prose-lg max-w-none mb-8">
          <MarkdownContent md={guide.content} />
        </div>

        {/* Locked guide CTA */}
        {guide.isLocked && (
          <Card className="border-emerald-300 bg-emerald-50 dark:bg-emerald-950/30 mb-8">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <Lock className="h-6 w-6 text-emerald-600 flex-shrink-0 mt-1" />
                <div>
                  <div className="font-semibold text-lg mb-1">This is a member-only guide</div>
                  <p className="text-sm text-muted-foreground mb-3">
                    Freedom Wheels members get full access to buying guides, tool reviews, software discounts, and a share of the platform&apos;s affiliate revenue.
                  </p>
                  <Button asChild>
                    <Link href="/#pricing">Subscribe to read more — from R99/month</Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tags */}
        {tags.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap mb-8">
            <Tag className="h-4 w-4 text-muted-foreground" />
            {tags.map(tag => (
              <Badge key={tag} variant="outline">{tag}</Badge>
            ))}
          </div>
        )}

        {/* Affiliate partners mentioned in this guide */}
        {partners.length > 0 && (
          <Card className="bg-muted/30">
            <CardContent className="pt-6">
              <div className="text-sm font-semibold mb-1">Products mentioned in this guide</div>
              <p className="text-xs text-muted-foreground mb-4">
                We earn a commission when you buy through these links — that&apos;s what funds your revenue share.
              </p>
              <div className="grid sm:grid-cols-2 gap-3">
                {partners.map(p => (
                  <button
                    key={p.id}
                    onClick={() => handlePartnerClick(p.id, p.affiliateUrl)}
                    className="flex items-center justify-between gap-2 p-3 bg-background border rounded-md hover:shadow-sm transition-shadow text-left"
                  >
                    <div>
                      <div className="font-medium text-sm">{p.name}</div>
                      <div className="text-xs text-muted-foreground">{p.commissionRate}</div>
                    </div>
                    <ExternalLink className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Share this guide */}
        <div className="mt-10 pt-6 border-t">
          <SocialShare
            url={typeof window !== 'undefined' ? window.location.href : `https://www.freedomwheels.online/guides/${guide.slug}`}
            text={`${guide.title} — via Freedom Wheels`}
            page="guide"
            variant="full"
          />
        </div>

        {/* Footer navigation */}
        <div className="mt-10 pt-6 border-t flex justify-between text-sm">
          <Link href="/guides" className="text-muted-foreground hover:text-foreground">
            ← All guides
          </Link>
          <Link href="/" className="text-muted-foreground hover:text-foreground">
            Back to home →
          </Link>
        </div>
      </main>

      <footer className="border-t mt-auto">
        <div className="container mx-auto px-4 py-4 text-xs text-muted-foreground text-center">
          Freedom Wheels · <Link href="/" className="hover:text-foreground">Home</Link> ·{' '}
          <Link href="/member" className="hover:text-foreground">Member</Link> ·{' '}
          <Link href="/transparency" className="hover:text-foreground">Transparency</Link>
        </div>
      </footer>
    </div>
  )
}

// Simple markdown renderer for guide content
function MarkdownContent({ md }: { md: string }) {
  const lines = md.split('\n')
  const blocks: React.ReactNode[] = []
  let i = 0
  let key = 0

  while (i < lines.length) {
    const line = lines[i]
    if (!line || !line.trim()) { i++; continue }

    // H1/H2/H3
    if (line.startsWith('### ')) { blocks.push(<h3 key={key++} className="text-xl font-semibold mt-6 mb-3">{renderInline(line.slice(4))}</h3>); i++; continue }
    if (line.startsWith('## ')) { blocks.push(<h2 key={key++} className="text-2xl font-bold mt-8 mb-3">{renderInline(line.slice(3))}</h2>); i++; continue }
    if (line.startsWith('# ')) { blocks.push(<h1 key={key++} className="text-3xl font-bold mt-8 mb-4">{renderInline(line.slice(2))}</h1>); i++; continue }

    // Horizontal rule
    if (line.trim() === '---') { blocks.push(<hr key={key++} className="my-6 border-t" />); i++; continue }

    // Blockquote
    if (line.startsWith('> ')) {
      const quote: string[] = []
      while (i < lines.length && lines[i].startsWith('> ')) { quote.push(lines[i].slice(2)); i++ }
      blocks.push(<blockquote key={key++} className="border-l-4 border-emerald-500 pl-4 italic my-4 text-muted-foreground">{renderInline(quote.join(' '))}</blockquote>)
      continue
    }

    // Unordered list
    if (line.startsWith('- ') || line.startsWith('* ')) {
      const items: string[] = []
      while (i < lines.length && (lines[i].startsWith('- ') || lines[i].startsWith('* '))) { items.push(lines[i].slice(2)); i++ }
      blocks.push(<ul key={key++} className="list-disc pl-6 my-4 space-y-1">{items.map((it, j) => <li key={j}>{renderInline(it)}</li>)}</ul>)
      continue
    }

    // Ordered list
    if (/^\d+\.\s/.test(line)) {
      const items: string[] = []
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) { items.push(lines[i].replace(/^\d+\.\s/, '')); i++ }
      blocks.push(<ol key={key++} className="list-decimal pl-6 my-4 space-y-1">{items.map((it, j) => <li key={j}>{renderInline(it)}</li>)}</ol>)
      continue
    }

    // Paragraph
    blocks.push(<p key={key++} className="my-3 leading-relaxed">{renderInline(line)}</p>)
    i++
  }

  return <>{blocks}</>
}

function renderInline(text: string): React.ReactNode {
  // Bold + italic + images + links + clickable images + inline code
  const parts: React.ReactNode[] = []
  let remaining = text
  let key = 0

  while (remaining.length > 0) {
    // Clickable image: [![alt](image-url)](link-url) — must be checked BEFORE regular image and link
    const clickableImageMatch = remaining.match(/\[!\[([^\]]*)\]\(([^)]+)\)\]\(([^)]+)\)/)
    // Image: ![alt](image-url)
    const imageMatch = remaining.match(/!\[([^\]]*)\]\(([^)]+)\)/)
    // Bold
    const boldMatch = remaining.match(/\*\*([^*]+)\*\*/)
    // Italic (single asterisk, not part of bold)
    const italicMatch = remaining.match(/\*([^*]+)\*/)
    // Link (but NOT an image — image starts with ! which we handle separately)
    const linkMatch = remaining.match(/\[([^\]]+)\]\(([^)]+)\)/)
    // Code
    const codeMatch = remaining.match(/`([^`]+)`/)

    const matches = [
      clickableImageMatch ? { type: 'clickableImage', match: clickableImageMatch, index: clickableImageMatch.index! } : null,
      imageMatch ? { type: 'image', match: imageMatch, index: imageMatch.index! } : null,
      boldMatch ? { type: 'bold', match: boldMatch, index: boldMatch.index! } : null,
      italicMatch ? { type: 'italic', match: italicMatch, index: italicMatch.index! } : null,
      linkMatch ? { type: 'link', match: linkMatch, index: linkMatch.index! } : null,
      codeMatch ? { type: 'code', match: codeMatch, index: codeMatch.index! } : null,
    ].filter(Boolean) as Array<{ type: string; match: RegExpMatchArray; index: number }>

    if (matches.length === 0) {
      parts.push(remaining)
      break
    }

    matches.sort((a, b) => a.index - b.index)
    const first = matches[0]!

    if (first.index > 0) {
      parts.push(remaining.slice(0, first.index))
    }

    if (first.type === 'clickableImage') {
      // [![alt](image-url)](link-url)
      const alt = first.match[1]
      const imageUrl = first.match[2]
      const linkUrl = first.match[3]
      parts.push(
        <a key={key++} href={linkUrl} target={linkUrl.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer">
          <img src={imageUrl} alt={alt} className="max-w-full h-auto rounded-lg my-2" loading="lazy" />
        </a>
      )
    } else if (first.type === 'image') {
      // ![alt](image-url)
      const alt = first.match[1]
      const imageUrl = first.match[2]
      parts.push(
        <img key={key++} src={imageUrl} alt={alt} className="max-w-full h-auto rounded-lg my-2" loading="lazy" />
      )
    } else if (first.type === 'bold') {
      parts.push(<strong key={key++}>{first.match[1]}</strong>)
    } else if (first.type === 'italic') {
      parts.push(<em key={key++}>{first.match[1]}</em>)
    } else if (first.type === 'link') {
      parts.push(<a key={key++} href={first.match[2]} target={first.match[2].startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer" className="text-emerald-600 hover:underline">{first.match[1]}</a>)
    } else if (first.type === 'code') {
      parts.push(<code key={key++} className="bg-muted px-1.5 py-0.5 rounded text-sm">{first.match[1]}</code>)
    }

    remaining = remaining.slice(first.index + first.match[0].length)
  }

  return <>{parts}</>
}
