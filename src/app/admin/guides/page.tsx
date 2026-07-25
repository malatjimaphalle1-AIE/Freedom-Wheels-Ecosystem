'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { ArrowLeft, Plus, Edit, Trash2, Eye, FileText, Save } from 'lucide-react'

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
    // Need to fetch full guide for content
    fetch(`/api/guides/${g.slug}`)
      .then(r => r.json())
      .then(data => {
        setTitle(data.guide.title || g.title)
        setSlug(data.guide.slug || g.slug)
        setExcerpt(data.guide.excerpt || g.excerpt)
        setContentMarkdown(data.guide.content || '')
        setCategory(data.guide.category || g.category)
        setTags(data.guide.tags || '')
        setCoverImageUrl(data.guide.coverImageUrl || '')
        setIsMemberOnly(data.guide.isMemberOnly ?? false)
        setIsPublished(data.guide.isPublished ?? false)
        setSelectedPartnerIds((data.partners || []).map((p: { id: string }) => p.id))
        setShowForm(true)
        loadPartners()
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
