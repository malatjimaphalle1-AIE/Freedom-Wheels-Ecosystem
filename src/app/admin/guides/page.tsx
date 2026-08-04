'use client'

import { useState, useEffect, memo, useCallback, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { ArrowLeft, Plus, Edit, Trash2, Eye, FileText, Save, Link2, Copy, Check, ExternalLink } from 'lucide-react'

interface Guide {
  id: string
  slug: string
  title: string
  excerpt: string
  category: string
  isMemberOnly: boolean
  isPublished: boolean
  publishedAt: string | null
  viewCount: number
  updatedAt: string
}

interface Partner {
  id: string
  name: string
  category: string
}

export default function AdminGuidesPage() {
  const [apiKey, setApiKey] = useState('')
  const [authed, setAuthed] = useState(false)
  const [guides, setGuides] = useState<Guide[]>([])
  const [partners, setPartners] = useState<Partner[]>([])
  const [editing, setEditing] = useState<Guide | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form state
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [excerpt, setExcerpt] = useState('')
  const [contentMarkdown, setContentMarkdown] = useState('')
  const [category, setCategory] = useState('')
  const [tags, setTags] = useState('')
  const [coverImageUrl, setCoverImageUrl] = useState('')
  const [isMemberOnly, setIsMemberOnly] = useState(false)
  const [isPublished, setIsPublished] = useState(false)
  const [selectedPartnerIds, setSelectedPartnerIds] = useState<string[]>([])

  useEffect(() => {
    if (authed) loadGuides()
  }, [authed])

  async function loadGuides() {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/guides', {
        headers: { 'X-Admin-Key': apiKey }
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to load')
      setGuides(data.guides)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  async function loadPartners() {
    const res = await fetch('/api/affiliates')
    const data = await res.json()
    setPartners(data.partners || [])
  }

  // Stable callback for inserting markdown — prevents AffiliateLinkHelper re-rendering on every keystroke
  const handleInsertMarkdown = useCallback((markdown: string) => {
    setContentMarkdown(prev => prev + '\n\n' + markdown)
  }, [])

  function startNew() {
    setEditing(null)
    setTitle(''); setSlug(''); setExcerpt(''); setContentMarkdown('')
    setCategory(''); setTags(''); setCoverImageUrl('')
    setIsMemberOnly(false); setIsPublished(false); setSelectedPartnerIds([])
    setShowForm(true)
    loadPartners()
  }

  function startEdit(g: Guide) {
    setEditing(g)
    // Pre-populate from the list data (always available)
    setTitle(g.title)
    setSlug(g.slug)
    setExcerpt(g.excerpt || '')
    setCategory(g.category || '')
    setIsMemberOnly(g.isMemberOnly ?? false)
    setIsPublished(g.isPublished ?? false)
    setContentMarkdown('')
    setTags('')
    setCoverImageUrl('')
    setSelectedPartnerIds([])
    setShowForm(true)
    loadPartners()

    // Fetch full guide details (content, tags, cover image, partners) via admin API
    // The admin API returns all guides including drafts (unpublished)
    const headers: Record<string, string> = {}
    if (apiKey) headers['X-Admin-Key'] = apiKey

    fetch(`/api/admin/guides/${g.id}`, { headers })
      .then(r => r.json())
      .then(data => {
        if (!r.ok) {
          setError(data.error || 'Failed to load guide details')
          return
        }
        const guide = data.guide
        if (guide) {
          setTitle(guide.title || g.title)
          setSlug(guide.slug || g.slug)
          setExcerpt(guide.excerpt || g.excerpt || '')
          setContentMarkdown(guide.contentMarkdown || '')
          setCategory(guide.category || g.category || '')
          setTags(guide.tags || '')
          setCoverImageUrl(guide.coverImageUrl || '')
          setIsMemberOnly(guide.isMemberOnly ?? false)
          setIsPublished(guide.isPublished ?? false)
          setSelectedPartnerIds((guide.partnerLinks || []).map((pl: { partnerId: string }) => pl.partnerId))
        }
      })
      .catch(err => setError(err.message))
  }

  async function saveGuide() {
    setLoading(true); setError(null)
    try {
      const payload = {
        title, slug: slug || undefined, excerpt, contentMarkdown,
        category, tags, coverImageUrl: coverImageUrl || null,
        isMemberOnly, isPublished, partnerIds: selectedPartnerIds
      }
      const url = editing ? `/api/admin/guides/${editing.id}` : '/api/admin/guides'
      const method = editing ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'X-Admin-Key': apiKey },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Save failed')
      setShowForm(false)
      await loadGuides()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  async function deleteGuide(id: string) {
    if (!confirm('Delete this guide? This cannot be undone.')) return
    const res = await fetch(`/api/admin/guides/${id}`, {
      method: 'DELETE',
      headers: { 'X-Admin-Key': apiKey }
    })
    if (res.ok) loadGuides()
    else setError('Delete failed')
  }

  function togglePartner(id: string) {
    setSelectedPartnerIds(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    )
  }

  if (!authed) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <header className="border-b">
          <div className="container mx-auto px-4 h-16 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-emerald-600 text-white font-bold text-sm">FW</div>
              <span className="font-semibold">Admin · Guides</span>
            </Link>
            <Link href="/admin" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center">
              <ArrowLeft className="h-4 w-4 mr-1" /> Back to admin
            </Link>
          </div>
        </header>
        <main className="flex-1 flex items-center justify-center px-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Admin authentication</CardTitle>
              <CardDescription>Enter your ADMIN_API_KEY to manage guides</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={(e) => { e.preventDefault(); if (apiKey) setAuthed(true) }} className="space-y-3">
                <Input type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="ADMIN_API_KEY" />
                <Button type="submit" className="w-full" disabled={!apiKey}>Authenticate</Button>
              </form>
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="border-b sticky top-0 bg-background/95 backdrop-blur z-40">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/admin" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-emerald-600 text-white font-bold text-sm">FW</div>
            <span className="font-semibold">Admin · Guides</span>
          </Link>
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={startNew}>
              <Plus className="h-4 w-4 mr-1" /> New guide
            </Button>
            <Button size="sm" variant="ghost" asChild>
              <Link href="/admin"><ArrowLeft className="h-4 w-4 mr-1" /> Back to admin</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-8 max-w-5xl">
        {error && (
          <Card className="mb-4 border-rose-300">
            <CardContent className="pt-4 text-sm text-rose-700">{error}</CardContent>
          </Card>
        )}

        {showForm ? (
          <Card>
            <CardHeader>
              <CardTitle>{editing ? 'Edit guide' : 'New guide'}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <Label>Title *</Label>
                  <Input value={title} onChange={(e) => setTitle(e.target.value)} />
                </div>
                <div>
                  <Label>Slug (URL, optional)</Label>
                  <Input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="auto-generated from title" />
                </div>
              </div>
              <div>
                <Label>Excerpt * (short summary shown in listings)</Label>
                <Textarea value={excerpt} onChange={(e) => setExcerpt(e.target.value)} rows={2} />
              </div>
              <div>
                <Label>Content (Markdown) *</Label>
                <Textarea value={contentMarkdown} onChange={(e) => setContentMarkdown(e.target.value)} rows={12} className="font-mono text-sm" placeholder="# Heading&#10;&#10;Body text with **bold** and [links](https://...)." />
              </div>

              {/* Affiliate Link Helper */}
              <AffiliateLinkHelper onInsert={handleInsertMarkdown} />
              <div className="grid sm:grid-cols-3 gap-3">
                <div>
                  <Label>Category *</Label>
                  <Input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="e.g. Laptops" />
                </div>
                <div>
                  <Label>Tags (comma-separated)</Label>
                  <Input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="budget, freelancing" />
                </div>
                <div>
                  <Label>Cover image URL (optional)</Label>
                  <Input value={coverImageUrl} onChange={(e) => setCoverImageUrl(e.target.value)} placeholder="https://..." />
                </div>
              </div>
              <div>
                <Label>Linked affiliate partners</Label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {partners.length === 0 && <span className="text-sm text-muted-foreground">Loading partners…</span>}
                  {partners.map(p => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => togglePartner(p.id)}
                      className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                        selectedPartnerIds.includes(p.id)
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'bg-background text-muted-foreground hover:bg-muted'
                      }`}
                    >
                      {p.name}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={isMemberOnly} onChange={(e) => setIsMemberOnly(e.target.checked)} />
                  Members only (locked for non-subscribers)
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={isPublished} onChange={(e) => setIsPublished(e.target.checked)} />
                  Published (visible on /guides)
                </label>
              </div>
              <div className="flex gap-2 pt-2">
                <Button onClick={saveGuide} disabled={loading || !title || !excerpt || !contentMarkdown || !category}>
                  <Save className="h-4 w-4 mr-1" /> {loading ? 'Saving…' : 'Save guide'}
                </Button>
                <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="mb-6">
              <h1 className="text-2xl font-bold tracking-tight">Guides ({guides.length})</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Buying guides drive affiliate clicks. Member-only guides give subscribers a reason to stay.
              </p>
            </div>
            {guides.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                  <div className="text-sm text-muted-foreground mb-4">No guides yet. Create your first one.</div>
                  <Button onClick={startNew}><Plus className="h-4 w-4 mr-1" /> New guide</Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {guides.map(g => (
                  <Card key={g.id}>
                    <CardContent className="pt-4 flex items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="font-medium truncate">{g.title}</span>
                          <Badge variant="secondary">{g.category}</Badge>
                          {g.isMemberOnly && <Badge variant="outline" className="text-amber-600">Members</Badge>}
                          {!g.isPublished && <Badge variant="outline" className="text-muted-foreground">Draft</Badge>}
                        </div>
                        <div className="text-xs text-muted-foreground flex items-center gap-3">
                          <span className="flex items-center gap-1"><Eye className="h-3 w-3" /> {g.viewCount}</span>
                          <span>/guides/{g.slug}</span>
                          <span>Updated {new Date(g.updatedAt).toLocaleDateString('en-ZA')}</span>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" onClick={() => startEdit(g)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => deleteGuide(g.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}

// ============================================================================
// AFFILIATE LINK HELPER (Multi-Partner)
// ============================================================================
// Accepts affiliate links from ANY partner (Amazon, Lulalend, Hostinger, etc.)
// For Amazon: auto-extracts ASIN + adds freedomwheels-20 tag
// For other partners: uses the pasted affiliate URL directly
// Generates 3 Markdown formats: text link, image link, full product block
// Uses useMemo for derived values to prevent INP issues

const PARTNER_OPTIONS = [
  { id: 'amazon', name: 'Amazon Associates', urlPrefix: 'https://www.amazon.com', placeholder: 'https://www.amazon.com/dp/B0XYZ12345', tag: 'freedomwheels-20' },
  { id: 'lulalend', name: 'Lulalend (Business Funding)', urlPrefix: 'https://www.lulalend.co.za', placeholder: 'https://www.lulalend.co.za/?a=sGfGBtmv', tag: null },
  { id: 'hostinger', name: 'Hostinger (Hosting)', urlPrefix: 'https://www.hostinger.com', placeholder: 'https://www.hostinger.com/affiliates?ref=freedomwheels', tag: null },
  { id: 'namecheap', name: 'Namecheap (Domains)', urlPrefix: 'https://www.namecheap.com', placeholder: 'https://www.namecheap.com/affiliates?ref=freedomwheels', tag: null },
  { id: 'canva', name: 'Canva (Design)', urlPrefix: 'https://www.canva.com', placeholder: 'https://www.canva.com/affiliates?ref=freedomwheels', tag: null },
  { id: 'convertkit', name: 'ConvertKit (Email)', urlPrefix: 'https://convertkit.com', placeholder: 'https://convertkit.com/affiliates?ref=freedomwheels', tag: null },
  { id: 'custom', name: 'Custom / Other', urlPrefix: '', placeholder: 'https://your-affiliate-link.com/?ref=yourcode', tag: null },
] as const

function extractAsin(url: string): string | null {
  const patterns = [
    /\/dp\/([A-Z0-9]{10})(?:[/?]|$)/i,
    /\/gp\/product\/([A-Z0-9]{10})(?:[/?]|$)/i,
    /\/exec\/obidos\/ASIN\/([A-Z0-9]{10})(?:[/?]|$)/i,
    /\/ASIN\/([A-Z0-9]{10})(?:[/?]|$)/i,
    /\/([A-Z0-9]{10})(?:[/?]|$)/i,
  ]
  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match && match[1] && match[1].length === 10) {
      return match[1]
    }
  }
  return null
}

function isValidImageUrl(url: string): boolean {
  if (!url) return false
  return (
    url.startsWith('https://m.media-amazon.com/images/I/') ||
    url.startsWith('https://images-na.ssl-images-amazon.com/') ||
    /\.(jpg|jpeg|png|webp|gif|svg)(\?|$)/i.test(url)
  )
}

function optimizeImageUrl(url: string): string {
  return url
    .replace(/\._AC_SL\d+_/, '._SL500_')
    .replace(/\._SL\d+_/, '._SL500_')
}

const AffiliateLinkHelper = memo(function AffiliateLinkHelper({ onInsert }: { onInsert: (markdown: string) => void }) {
  const [partnerId, setPartnerId] = useState<string>('amazon')
  const [rawUrl, setRawUrl] = useState('')
  const [productName, setProductName] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [copied, setCopied] = useState<string | null>(null)

  const partner = PARTNER_OPTIONS.find(p => p.id === partnerId)!

  // Memoize all derived values to prevent unnecessary re-computation (INP fix)
  const asin = useMemo(() => {
    if (partnerId !== 'amazon') return null
    return rawUrl.trim() ? extractAsin(rawUrl) : null
  }, [rawUrl, partnerId])

  const finalAffiliateUrl = useMemo(() => {
    if (partnerId === 'amazon' && asin) {
      return `https://www.amazon.com/dp/${asin}?tag=${partner.tag}`
    }
    return rawUrl.trim() || ''
  }, [partnerId, asin, rawUrl, partner.tag])

  const urlError = useMemo(() => {
    if (!rawUrl.trim()) return null
    if (partnerId === 'amazon' && !asin) {
      return 'Could not extract ASIN from URL. Make sure it\'s an Amazon product URL (e.g., https://www.amazon.com/dp/B0XYZ12345).'
    }
    return null
  }, [rawUrl, partnerId, asin])

  const imageError = useMemo(() => {
    if (!imageUrl.trim()) return null
    if (!isValidImageUrl(imageUrl)) {
      return 'This doesn\'t look like an image URL. It should end in .jpg/.png/.webp or be an Amazon image URL (m.media-amazon.com/images/I/...).'
    }
    return null
  }, [imageUrl])

  const optimizedImageUrl = useMemo(() => {
    if (!imageUrl.trim() || imageError) return ''
    return optimizeImageUrl(imageUrl)
  }, [imageUrl, imageError])

  const generated = useMemo(() => {
    if (!finalAffiliateUrl || urlError) return null

    const name = productName || (asin ? `Amazon product ${asin}` : partner.name)
    const img = optimizedImageUrl

    const textLink = `[${name}](${finalAffiliateUrl})`
    const imageLink = img
      ? `[![${name}](${img})](${finalAffiliateUrl})`
      : '(Add a valid image URL above to generate image link)'

    const isAmazon = partnerId === 'amazon'
    const fullBlock = `### ${name}
${img ? `\n[![${name}](${img})](${finalAffiliateUrl})\n` : ''}
${isAmazon ? `**ASIN:** ${asin}\n\n` : ''}**👉 [Check current price${isAmazon ? ' on Amazon' : ''} →](${finalAffiliateUrl})**`

    return { textLink, imageLink, fullBlock }
  }, [finalAffiliateUrl, urlError, productName, asin, partner.name, optimizedImageUrl, partnerId])

  const handleCopy = useCallback((text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(label)
      setTimeout(() => setCopied(null), 2000)
    })
  }, [])

  const handleInsert = useCallback((markdown: string, label: string) => {
    onInsert(markdown)
    setCopied(label + ' inserted!')
    setTimeout(() => setCopied(null), 2000)
  }, [onInsert])

  const openPartnerPage = useCallback(() => {
    const url = asin ? `https://www.amazon.com/dp/${asin}` : partner.urlPrefix || 'https://www.amazon.com'
    window.open(url, '_blank', 'noopener,noreferrer')
  }, [asin, partner.urlPrefix])

  return (
    <div className="border rounded-lg p-4 bg-muted/30">
      <div className="text-sm font-semibold mb-1 flex items-center gap-2">
        <Link2 className="h-4 w-4" /> Affiliate Link Helper
      </div>
      <p className="text-xs text-muted-foreground mb-3">
        Select a partner, paste your affiliate link, and generate ready-to-use Markdown. For Amazon, we auto-extract the ASIN and add your <code className="bg-muted px-1 rounded">freedomwheels-20</code> tag.
      </p>

      {/* Partner selector */}
      <div className="mb-3">
        <Label className="text-xs">Partner *</Label>
        <select
          value={partnerId}
          onChange={(e) => { setPartnerId(e.target.value); setRawUrl('') }}
          className="mt-1 w-full px-3 py-2 border rounded-md bg-background text-sm"
        >
          {PARTNER_OPTIONS.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>

      {/* Input fields */}
      <div className="space-y-2 mb-4">
        <div>
          <div className="flex items-center justify-between">
            <Label className="text-xs">
              {partnerId === 'amazon' ? 'Amazon product URL *' : 'Your affiliate URL *'}
            </Label>
            {partner.urlPrefix && (
              <button
                type="button"
                onClick={openPartnerPage}
                className="text-xs text-emerald-600 hover:underline inline-flex items-center gap-1"
              >
                <ExternalLink className="h-3 w-3" /> Open {partner.name.split(' ')[0]}
              </button>
            )}
          </div>
          <Input
            type="url"
            value={rawUrl}
            onChange={(e) => setRawUrl(e.target.value)}
            placeholder={partner.placeholder}
            className="mt-1"
          />
        </div>
        <div className="grid sm:grid-cols-2 gap-2">
          <div>
            <Label className="text-xs">Product/service name (optional)</Label>
            <Input
              type="text"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              placeholder="Lenovo IdeaPad 3"
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-xs">Image URL (optional)</Label>
            <Input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://... (right-click image → copy address)"
              className={`mt-1 ${imageError ? 'border-rose-400' : ''}`}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Right-click any image → &quot;Copy image address&quot; → paste here
            </p>
          </div>
        </div>

        {/* Quick instructions when ASIN is detected */}
        {asin && (
          <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded p-3 text-xs">
            <div className="font-medium text-emerald-700 dark:text-emerald-400 mb-1">✓ ASIN detected: {asin}</div>
            <div className="text-muted-foreground">
              To add an image: click <strong>&quot;Open Amazon&quot;</strong> above → right-click the main product photo → &quot;Copy image address&quot; → paste into the Image URL field.
            </div>
          </div>
        )}

        {/* Non-Amazon hint */}
        {partnerId !== 'amazon' && partnerId !== 'custom' && (
          <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded p-3 text-xs">
            <div className="font-medium text-blue-700 dark:text-blue-400 mb-1">💡 {partner.name}</div>
            <div className="text-muted-foreground">
              Paste your full affiliate URL (including your referral code) into the field above. The helper will generate Markdown with your link.
            </div>
          </div>
        )}
      </div>

      {urlError && (
        <div className="text-sm text-rose-600 bg-rose-50 dark:bg-rose-950/30 p-2 rounded mb-3">
          {urlError}
        </div>
      )}

      {imageError && (
        <div className="text-sm text-rose-600 bg-rose-50 dark:bg-rose-950/30 p-2 rounded mb-3">
          ⚠️ {imageError}
        </div>
      )}

      {/* Generated Markdown previews */}
      {generated && (
        <div className="space-y-3">
          {/* Text Link */}
          <div className="border rounded p-3 bg-background">
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs font-medium text-muted-foreground">Text link</div>
              <div className="flex gap-1">
                <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => handleCopy(generated.textLink, 'Text link copied')}>
                  {copied === 'Text link copied' ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                </Button>
                <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => handleInsert(generated.textLink, 'Text link')}>
                  Insert
                </Button>
              </div>
            </div>
            <pre className="text-xs font-mono whitespace-pre-wrap break-all bg-muted/50 p-2 rounded">{generated.textLink}</pre>
          </div>

          {/* Image Link */}
          <div className="border rounded p-3 bg-background">
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs font-medium text-muted-foreground">Image link (clickable image)</div>
              <div className="flex gap-1">
                {optimizedImageUrl && (
                  <>
                    <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => handleCopy(generated.imageLink, 'Image link copied')}>
                      {copied === 'Image link copied' ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    </Button>
                    <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => handleInsert(generated.imageLink, 'Image link')}>
                      Insert
                    </Button>
                  </>
                )}
              </div>
            </div>
            <pre className="text-xs font-mono whitespace-pre-wrap break-all bg-muted/50 p-2 rounded">{generated.imageLink}</pre>
            {!optimizedImageUrl && (
              <p className="text-xs text-muted-foreground mt-1">Add a valid image URL above to enable this format.</p>
            )}
          </div>

          {/* Full Block */}
          <div className="border rounded p-3 bg-background">
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs font-medium text-muted-foreground">Full product block (recommended)</div>
              <div className="flex gap-1">
                <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => handleCopy(generated.fullBlock, 'Full block copied')}>
                  {copied === 'Full block copied' ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                </Button>
                <Button size="sm" variant="default" className="h-7 text-xs" onClick={() => handleInsert(generated.fullBlock, 'Full block')}>
                  <Plus className="h-3 w-3 mr-1" /> Insert
                </Button>
              </div>
            </div>
            <pre className="text-xs font-mono whitespace-pre-wrap break-all bg-muted/50 p-2 rounded max-h-48 overflow-y-auto">{generated.fullBlock}</pre>
          </div>
        </div>
      )}

      {copied && copied.includes('inserted') && (
        <div className="mt-3 text-sm text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 p-2 rounded">
          ✓ {copied} — scroll up to see it in the content field.
        </div>
      )}
    </div>
  )
})
