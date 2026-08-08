'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { ArrowLeft, Plus, Edit, Trash2, Star, Save, ExternalLink } from 'lucide-react'

interface Product {
  id: string
  productName: string
  asin: string | null
  affiliateUrl: string
  imageUrl: string | null
  description: string
  originalPrice: string | null
  dealPrice: string | null
  whyWeLikeIt: string | null
  category: string | null
  isActive: boolean
  scheduledAt: string | null
  createdAt: string
  updatedAt: string
}

export default function AdminProductsPage() {
  const [apiKey, setApiKey] = useState('')
  const [authed, setAuthed] = useState(false)
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Product | null>(null)

  // Form state
  const [productName, setProductName] = useState('')
  const [asin, setAsin] = useState('')
  const [affiliateUrl, setAffiliateUrl] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [description, setDescription] = useState('')
  const [originalPrice, setOriginalPrice] = useState('')
  const [dealPrice, setDealPrice] = useState('')
  const [whyWeLikeIt, setWhyWeLikeIt] = useState('')
  const [category, setCategory] = useState('')
  const [isActive, setIsActive] = useState(false)
  const [scheduledAt, setScheduledAt] = useState('')

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(d => {
        if (d.authenticated && d.user?.isAdmin) {
          setAuthed(true)
        }
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (authed) loadProducts()
  }, [authed])

  async function loadProducts() {
    setLoading(true); setError(null)
    try {
      const headers: Record<string, string> = {}
      if (apiKey) headers['X-Admin-Key'] = apiKey
      const res = await fetch('/api/admin/product-of-the-day', { headers })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to load')
      setProducts(data.products || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  function startNew() {
    setEditing(null)
    setProductName(''); setAsin(''); setAffiliateUrl(''); setImageUrl('')
    setDescription(''); setOriginalPrice(''); setDealPrice(''); setWhyWeLikeIt('')
    setCategory(''); setIsActive(false); setScheduledAt('')
    setShowForm(true)
  }

  function startEdit(p: Product) {
    setEditing(p)
    setProductName(p.productName)
    setAsin(p.asin || '')
    setAffiliateUrl(p.affiliateUrl)
    setImageUrl(p.imageUrl || '')
    setDescription(p.description)
    setOriginalPrice(p.originalPrice || '')
    setDealPrice(p.dealPrice || '')
    setWhyWeLikeIt(p.whyWeLikeIt || '')
    setCategory(p.category || '')
    setIsActive(p.isActive)
    setScheduledAt(p.scheduledAt ? new Date(p.scheduledAt).toISOString().slice(0, 16) : '')
    setShowForm(true)
  }

  async function saveProduct() {
    setLoading(true); setError(null)
    try {
      const payload = {
        productName, asin: asin || undefined, affiliateUrl, imageUrl: imageUrl || undefined,
        description, originalPrice: originalPrice || undefined, dealPrice: dealPrice || undefined,
        whyWeLikeIt: whyWeLikeIt || undefined, category: category || undefined, isActive,
        scheduledAt: scheduledAt ? new Date(scheduledAt).toISOString() : null,
      }
      const url = editing ? `/api/admin/product-of-the-day/${editing.id}` : '/api/admin/product-of-the-day'
      const method = editing ? 'PATCH' : 'POST'
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (apiKey) headers['X-Admin-Key'] = apiKey
      const res = await fetch(url, { method, headers, body: JSON.stringify(payload) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Save failed')
      setShowForm(false)
      await loadProducts()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  async function deleteProduct(id: string) {
    if (!confirm('Delete this product? This cannot be undone.')) return
    const headers: Record<string, string> = {}
    if (apiKey) headers['X-Admin-Key'] = apiKey
    const res = await fetch(`/api/admin/product-of-the-day/${id}`, {
      method: 'DELETE', headers
    })
    if (res.ok) loadProducts()
    else setError('Delete failed')
  }

  async function activateProduct(id: string) {
    setLoading(true); setError(null)
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (apiKey) headers['X-Admin-Key'] = apiKey
      const res = await fetch(`/api/admin/product-of-the-day/${id}`, {
        method: 'PATCH', headers, body: JSON.stringify({ isActive: true })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to activate')
      await loadProducts()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  function autoFillAffiliateUrl() {
    if (asin) {
      setAffiliateUrl(`https://www.amazon.com/dp/${asin}?tag=freedomwheels-20`)
    }
  }

  if (!authed) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <header className="border-b">
          <div className="container mx-auto px-4 h-16 flex items-center justify-between">
            <Link href="/admin" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-emerald-600 text-white font-bold text-sm">FW</div>
              <span className="font-semibold">Admin · Products</span>
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
              <CardDescription>Enter your ADMIN_API_KEY to manage products</CardDescription>
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
            <span className="font-semibold">Admin · Product of the Day</span>
          </Link>
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={startNew}>
              <Plus className="h-4 w-4 mr-1" /> New product
            </Button>
            <Button size="sm" variant="ghost" asChild>
              <Link href="/admin"><ArrowLeft className="h-4 w-4 mr-1" /> Back</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-8 max-w-4xl">
        {error && (
          <Card className="mb-4 border-rose-300">
            <CardContent className="pt-4 text-sm text-rose-700">{error}</CardContent>
          </Card>
        )}

        {showForm ? (
          <Card>
            <CardHeader>
              <CardTitle>{editing ? 'Edit product' : 'New product of the day'}</CardTitle>
              <CardDescription>
                Only one product can be active at a time. Activating this one will deactivate all others.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <Label>Product name *</Label>
                  <Input value={productName} onChange={(e) => setProductName(e.target.value)} placeholder="Lenovo IdeaPad 3 (Ryzen 5)" />
                </div>
                <div>
                  <Label>Category (optional)</Label>
                  <Input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Laptops" />
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <Label>Amazon ASIN (optional)</Label>
                  <Input value={asin} onChange={(e) => setAsin(e.target.value)} placeholder="B0H99MHP7T" onBlur={autoFillAffiliateUrl} />
                  <p className="text-xs text-muted-foreground mt-1">Tab out of this field to auto-generate the affiliate URL</p>
                </div>
                <div>
                  <Label>Affiliate URL *</Label>
                  <Input value={affiliateUrl} onChange={(e) => setAffiliateUrl(e.target.value)} placeholder="https://www.amazon.com/dp/B0H99MHP7T?tag=freedomwheels-20" />
                </div>
              </div>
              <div>
                <Label>Image URL (optional)</Label>
                <Input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://m.media-amazon.com/images/I/..." />
                <p className="text-xs text-muted-foreground mt-1">Right-click product image on Amazon → &quot;Copy image address&quot;</p>
              </div>
              <div>
                <Label>Description * (1-2 sentence pitch)</Label>
                <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} placeholder="The best all-rounder laptop for SA freelancers. Handles VS Code, Figma, and dozens of browser tabs." />
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <Label>Original price (optional)</Label>
                  <Input value={originalPrice} onChange={(e) => setOriginalPrice(e.target.value)} placeholder="R13,999" />
                </div>
                <div>
                  <Label>Deal price (optional)</Label>
                  <Input value={dealPrice} onChange={(e) => setDealPrice(e.target.value)} placeholder="R11,499" />
                </div>
              </div>
              <div>
                <Label>Why we like it (optional, longer explanation)</Label>
                <Textarea value={whyWeLikeIt} onChange={(e) => setWhyWeLikeIt(e.target.value)} rows={3} placeholder="Ryzen 5 handles anything you throw at it, battery lasts 6+ hours, and the build quality is better than the price suggests." />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
                <span>Set as active Product of the Day (deactivates all others)</span>
              </label>
              <div>
                <Label>Schedule for later (optional)</Label>
                <Input
                  type="datetime-local"
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Set a date/time for this product to auto-activate. The cron job checks hourly and activates scheduled products automatically.
                </p>
              </div>
              <div className="flex gap-2 pt-2">
                <Button onClick={saveProduct} disabled={loading || !productName || !affiliateUrl || !description}>
                  <Save className="h-4 w-4 mr-1" /> {loading ? 'Saving…' : 'Save product'}
                </Button>
                <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="mb-6">
              <h1 className="text-2xl font-bold tracking-tight">Product of the Day ({products.length})</h1>
              <p className="text-sm text-muted-foreground mt-1">
                The active product appears on the landing page. Only one can be active at a time.
              </p>
            </div>
            {products.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Star className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                  <div className="text-sm text-muted-foreground mb-4">No products yet. Create your first one.</div>
                  <Button onClick={startNew}><Plus className="h-4 w-4 mr-1" /> New product</Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {products.map(p => (
                  <Card key={p.id} className={p.isActive ? 'border-emerald-400 shadow-md' : ''}>
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="font-medium truncate">{p.productName}</span>
                            {p.isActive && (
                              <Badge className="bg-emerald-600 text-white text-xs">
                                <Star className="h-3 w-3 mr-1" /> Active
                              </Badge>
                            )}
                            {p.category && <Badge variant="secondary" className="text-xs">{p.category}</Badge>}
                            {p.dealPrice && <Badge variant="outline" className="text-xs">{p.dealPrice}</Badge>}
                          </div>
                          <div className="text-xs text-muted-foreground line-clamp-2 mb-2">{p.description}</div>
                          <div className="flex items-center gap-3 text-xs">
                            <a href={p.affiliateUrl} target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:underline inline-flex items-center">
                              View on Amazon <ExternalLink className="h-3 w-3 ml-1" />
                            </a>
                            <span>Created {new Date(p.createdAt).toLocaleDateString('en-ZA')}</span>
                          </div>
                        </div>
                        <div className="flex gap-1 flex-shrink-0">
                          {!p.isActive && (
                            <Button size="sm" variant="outline" onClick={() => activateProduct(p.id)} disabled={loading}>
                              <Star className="h-3 w-3 mr-1" /> Activate
                            </Button>
                          )}
                          <Button size="sm" variant="ghost" onClick={() => startEdit(p)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => deleteProduct(p.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
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
