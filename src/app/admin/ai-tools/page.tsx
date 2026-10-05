'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { ArrowLeft, Plus, Edit, Trash2, Star, Save, Cpu } from 'lucide-react'

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
  isPublished: boolean
  displayOrder: number
}

const SUBCATEGORIES = [
  'Text-to-Image', 'Image-to-Image', 'Image Editing', 'Product Photography',
  'Marketing Creatives', 'Social Media', 'Branding', 'Characters & Avatars',
  'Presentations', 'Storyboards',
]

const PRICING_OPTIONS = ['Free', 'Freemium', 'Paid', 'Free Trial']

export default function AdminAiToolsPage() {
  const [apiKey, setApiKey] = useState('')
  const [authed, setAuthed] = useState(false)
  const [tools, setTools] = useState<AiTool[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<AiTool | null>(null)

  // Form state
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [longDescription, setLongDescription] = useState('')
  const [url, setUrl] = useState('')
  const [affiliateUrl, setAffiliateUrl] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [category, setCategory] = useState('AI Creative')
  const [subcategory, setSubcategory] = useState('Text-to-Image')
  const [pricing, setPricing] = useState('Freemium')
  const [features, setFeatures] = useState('')
  const [rating, setRating] = useState(4)
  const [isFeatured, setIsFeatured] = useState(false)
  const [isPublished, setIsPublished] = useState(true)
  const [displayOrder, setDisplayOrder] = useState(100)

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(d => { if (d.authenticated && d.user?.isAdmin) setAuthed(true) })
      .catch(() => {})
  }, [])

  useEffect(() => { if (authed) loadTools() }, [authed])

  async function loadTools() {
    setLoading(true)
    try {
      const headers: Record<string, string> = {}
      if (apiKey) headers['X-Admin-Key'] = apiKey
      const res = await fetch('/api/admin/ai-tools', { headers })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to load')
      setTools(data.tools || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally { setLoading(false) }
  }

  function startNew() {
    setEditing(null)
    setName(''); setDescription(''); setLongDescription(''); setUrl('')
    setAffiliateUrl(''); setImageUrl(''); setCategory('AI Creative')
    setSubcategory('Text-to-Image'); setPricing('Freemium')
    setFeatures(''); setRating(4); setIsFeatured(false)
    setIsPublished(true); setDisplayOrder(100)
    setShowForm(true)
  }

  function startEdit(t: AiTool) {
    setEditing(t)
    setName(t.name); setDescription(t.description)
    setLongDescription(t.longDescription || ''); setUrl(t.url)
    setAffiliateUrl(t.affiliateUrl || ''); setImageUrl(t.imageUrl || '')
    setCategory(t.category); setSubcategory(t.subcategory)
    setPricing(t.pricing); setFeatures(t.features || '')
    setRating(t.rating); setIsFeatured(t.isFeatured)
    setIsPublished(t.isPublished); setDisplayOrder(t.displayOrder)
    setShowForm(true)
  }

  async function saveTool() {
    setLoading(true); setError(null)
    try {
      const payload = { name, description, longDescription: longDescription || null, url,
        affiliateUrl: affiliateUrl || null, imageUrl: imageUrl || null,
        category, subcategory, pricing, features: features || null,
        rating: Number(rating), isFeatured, isPublished, displayOrder: Number(displayOrder) }
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (apiKey) headers['X-Admin-Key'] = apiKey
      const u = editing ? `/api/admin/ai-tools/${editing.id}` : '/api/admin/ai-tools'
      const res = await fetch(u, { method: editing ? 'PATCH' : 'POST', headers, body: JSON.stringify(payload) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Save failed')
      setShowForm(false)
      await loadTools()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally { setLoading(false) }
  }

  async function deleteTool(id: string) {
    if (!confirm('Delete this AI tool?')) return
    const headers: Record<string, string> = {}
    if (apiKey) headers['X-Admin-Key'] = apiKey
    const res = await fetch(`/api/admin/ai-tools/${id}`, { method: 'DELETE', headers })
    if (res.ok) loadTools()
  }

  if (!authed) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <header className="border-b">
          <div className="container mx-auto px-4 h-16 flex items-center justify-between">
            <Link href="/admin" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-emerald-600 text-white font-bold text-sm">FW</div>
              <span className="font-semibold">Admin · AI Tools</span>
            </Link>
            <Link href="/admin" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center">
              <ArrowLeft className="h-4 w-4 mr-1" /> Back to admin
            </Link>
          </div>
        </header>
        <main className="flex-1 flex items-center justify-center px-4">
          <Card className="w-full max-w-md">
            <CardHeader><CardTitle>Admin authentication</CardTitle></CardHeader>
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
            <span className="font-semibold">Admin · AI Tools ({tools.length})</span>
          </Link>
          <div className="flex gap-2">
            <Button size="sm" onClick={startNew}><Plus className="h-4 w-4 mr-1" /> New tool</Button>
            <Button size="sm" variant="ghost" asChild>
              <Link href="/admin"><ArrowLeft className="h-4 w-4 mr-1" /> Back</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-8 max-w-4xl">
        {error && <Card className="mb-4 border-rose-300"><CardContent className="pt-4 text-sm text-rose-700">{error}</CardContent></Card>}

        {showForm ? (
          <Card>
            <CardHeader><CardTitle>{editing ? 'Edit AI tool' : 'New AI tool'}</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="grid sm:grid-cols-2 gap-3">
                <div><Label>Tool name *</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Midjourney" /></div>
                <div><Label>URL *</Label><Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…" /></div>
              </div>
              <div><Label>Short description *</Label><Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} /></div>
              <div><Label>Long description (optional)</Label><Textarea value={longDescription} onChange={(e) => setLongDescription(e.target.value)} rows={3} /></div>
              <div className="grid sm:grid-cols-2 gap-3">
                <div><Label>Affiliate URL (optional)</Label><Input value={affiliateUrl} onChange={(e) => setAffiliateUrl(e.target.value)} placeholder="https://…?ref=…" /></div>
                <div><Label>Image URL (optional)</Label><Input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://…" /></div>
              </div>
              <div className="grid sm:grid-cols-3 gap-3">
                <div>
                  <Label>Category</Label><Input value={category} onChange={(e) => setCategory(e.target.value)} className="mt-1" />
                </div>
                <div>
                  <Label>Subcategory</Label>
                  <select value={subcategory} onChange={(e) => setSubcategory(e.target.value)} className="mt-1 w-full px-3 py-2 border rounded-md bg-background text-sm">
                    {SUBCATEGORIES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <Label>Pricing</Label>
                  <select value={pricing} onChange={(e) => setPricing(e.target.value)} className="mt-1 w-full px-3 py-2 border rounded-md bg-background text-sm">
                    {PRICING_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid sm:grid-cols-3 gap-3">
                <div><Label>Features (comma-separated)</Label><Input value={features} onChange={(e) => setFeatures(e.target.value)} placeholder="text-to-image, API, free" /></div>
                <div><Label>Rating (1-5)</Label><Input type="number" min={1} max={5} value={rating} onChange={(e) => setRating(Number(e.target.value))} /></div>
                <div><Label>Display order</Label><Input type="number" value={displayOrder} onChange={(e) => setDisplayOrder(Number(e.target.value))} /></div>
              </div>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={isFeatured} onChange={(e) => setIsFeatured(e.target.checked)} /> Featured</label>
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={isPublished} onChange={(e) => setIsPublished(e.target.checked)} /> Published</label>
              </div>
              <div className="flex gap-2 pt-2">
                <Button onClick={saveTool} disabled={loading || !name || !description || !url}><Save className="h-4 w-4 mr-1" /> Save</Button>
                <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {tools.map(t => (
              <Card key={t.id} className={t.isFeatured ? 'border-emerald-300' : ''}>
                <CardContent className="pt-4 flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-medium">{t.name}</span>
                      {t.isFeatured && <Badge className="bg-amber-500 text-white text-xs"><Star className="h-3 w-3 mr-1" /> Featured</Badge>}
                      <Badge variant="secondary" className="text-xs">{t.subcategory}</Badge>
                      <Badge variant="outline" className="text-xs">{t.pricing}</Badge>
                      {!t.isPublished && <Badge variant="outline" className="text-xs text-muted-foreground">Draft</Badge>}
                    </div>
                    <div className="text-xs text-muted-foreground line-clamp-1">{t.description}</div>
                  </div>
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" onClick={() => startEdit(t)}><Edit className="h-4 w-4" /></Button>
                    <Button size="sm" variant="ghost" onClick={() => deleteTool(t.id)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
