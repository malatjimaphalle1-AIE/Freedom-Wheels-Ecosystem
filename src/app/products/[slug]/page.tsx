'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { ArrowLeft, Check, Download, Loader2, Lock, Sparkles } from 'lucide-react'

interface Product {
  id: string
  slug: string
  title: string
  subtitle: string | null
  description: string
  longDescription: string | null
  coverImageUrl: string | null
  priceCents: number
  compareAtCents: number | null
  tier: string
  isFeatured: boolean
  features: string | null
}

export default function ProductSalesPage({ params }: { params: { slug: string } }) {
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [downloadToken, setDownloadToken] = useState<string | null>(null)
  const [downloadData, setDownloadData] = useState<{ productTitle: string; pdfUrl: string | null; bonusUrl: string | null; downloadsRemaining: number } | null>(null)

  useEffect(() => {
    // Check for ?token= in URL (after PayFast success redirect)
    const url = new URL(window.location.href)
    const token = url.searchParams.get('token')
    if (token) {
      setDownloadToken(token)
      verifyAndDownload(token)
    }
  }, [])

  useEffect(() => {
    fetch(`/api/digital-products/${params.slug}`)
      .then(r => r.json())
      .then(data => {
        if (data.product) setProduct(data.product)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [params.slug])

  async function verifyAndDownload(token: string) {
    try {
      const res = await fetch(`/api/download/${token}`)
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Download failed')
      } else {
        setDownloadData(data)
      }
    } catch {
      setError('Failed to verify download. Please try again or contact support.')
    }
  }

  async function handleCheckout() {
    setError(null)
    if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      setError('Please enter a valid email address')
      return
    }
    setCheckoutLoading(true)
    try {
      const res = await fetch('/api/payfast/digital-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: product?.id, email, name }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Checkout failed')
      window.location.href = data.redirectUrl
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Checkout failed')
    } finally {
      setCheckoutLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    )
  }

  // Download success view
  if (downloadToken && downloadData) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <header className="border-b">
          <div className="container mx-auto px-4 h-16 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-emerald-600 text-white font-bold text-sm">FW</div>
              <span className="font-semibold">Freedom Wheels</span>
            </Link>
          </div>
        </header>
        <main className="flex-1 flex items-center justify-center px-4">
          <Card className="max-w-lg w-full border-emerald-300 shadow-lg">
            <CardContent className="pt-8 text-center space-y-4">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
                <Check className="h-8 w-8 text-emerald-600" />
              </div>
              <h1 className="text-2xl font-bold">Payment Successful!</h1>
              <p className="text-muted-foreground">
                Thank you for purchasing <strong>{downloadData.productTitle}</strong>.
                Your download is ready.
              </p>

              {downloadData.pdfUrl && (
                <Button asChild size="lg" className="w-full">
                  <a href={downloadData.pdfUrl} download target="_blank" rel="noopener noreferrer">
                    <Download className="h-4 w-4 mr-2" /> Download PDF
                  </a>
                </Button>
              )}

              {downloadData.bonusUrl && (
                <Button asChild variant="outline" size="lg" className="w-full">
                  <a href={downloadData.bonusUrl} download target="_blank" rel="noopener noreferrer">
                    <Download className="h-4 w-4 mr-2" /> Download Bonus Templates
                  </a>
                </Button>
              )}

              <p className="text-xs text-muted-foreground">
                {downloadData.downloadsRemaining > 0
                  ? `${downloadData.downloadsRemaining} downloads remaining.`
                  : 'No more downloads available — save your file.'}
              </p>

              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground mb-2">
                  Discover more tools and resources:
                </p>
                <Button asChild variant="link">
                  <Link href="/">Explore Freedom Wheels →</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

  if (downloadToken && error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center space-y-4">
            <h1 className="text-xl font-bold text-rose-600">Download Error</h1>
            <p className="text-sm text-muted-foreground">{error}</p>
            <p className="text-xs text-muted-foreground">
              If your payment was successful, please wait 2-3 minutes and try the link again.
              Contact maphalle@freedomwheels.online if the problem persists.
            </p>
            <Button asChild>
              <Link href="/">Return to Freedom Wheels</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground mb-4">Product not found.</p>
            <Button asChild><Link href="/">Back to home</Link></Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const features = product.features ? product.features.split(',').map(f => f.trim()) : []
  const price = (product.priceCents / 100).toFixed(0)
  const compareAt = product.compareAtCents ? (product.compareAtCents / 100).toFixed(0) : null

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="border-b sticky top-0 bg-background/95 backdrop-blur z-40">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-emerald-600 text-white font-bold text-sm">FW</div>
            <span className="font-semibold">Freedom Wheels</span>
          </Link>
          <Link href="/" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center">
            <ArrowLeft className="h-4 w-4 mr-1" /> Back to home
          </Link>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-12 max-w-4xl">
        <div className="grid md:grid-cols-2 gap-8 items-start">
          {/* Left: Product info */}
          <div className="space-y-4">
            {product.isFeatured && (
              <Badge className="bg-emerald-600 text-white">
                <Sparkles className="h-3 w-3 mr-1" /> Featured Product
              </Badge>
            )}

            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">{product.title}</h1>

            {product.subtitle && (
              <p className="text-lg text-muted-foreground">{product.subtitle}</p>
            )}

            <div className="prose prose-sm max-w-none">
              <p className="text-muted-foreground leading-relaxed">{product.description}</p>
            </div>

            {features.length > 0 && (
              <div className="space-y-2 pt-4">
                <h3 className="font-semibold text-sm">What's included:</h3>
                <ul className="space-y-1">
                  {features.map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {product.coverImageUrl && (
              <div className="aspect-[3/4] rounded-lg overflow-hidden bg-muted mt-4">
                <img src={product.coverImageUrl} alt={product.title} className="w-full h-full object-cover" />
              </div>
            )}
          </div>

          {/* Right: Purchase card */}
          <div className="md:sticky md:top-24">
            <Card className="border-emerald-200 shadow-lg">
              <CardHeader className="text-center pb-2">
                <div className="flex items-baseline justify-center gap-2">
                  <span className="text-4xl font-bold text-emerald-600">R{price}</span>
                  {compareAt && (
                    <span className="text-lg text-muted-foreground line-through">R{compareAt}</span>
                  )}
                </div>
                {compareAt && (
                  <Badge className="bg-rose-500 text-white text-xs mx-auto">
                    Save R{(parseInt(compareAt) - parseInt(price))}
                  </Badge>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Checkout form */}
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="name">Your name (optional)</Label>
                    <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane Mokoena" />
                  </div>
                  <div>
                    <Label htmlFor="email">Email address *</Label>
                    <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="jane@example.com" />
                    <p className="text-xs text-muted-foreground mt-1">
                      Your download link will be sent here.
                    </p>
                  </div>

                  {error && (
                    <div className="text-sm text-rose-600 bg-rose-50 dark:bg-rose-950/30 p-2 rounded">
                      {error}
                    </div>
                  )}

                  <Button
                    onClick={handleCheckout}
                    disabled={checkoutLoading || !email}
                    size="lg"
                    className="w-full"
                  >
                    {checkoutLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Redirecting to PayFast…
                      </>
                    ) : (
                      <>
                        <Lock className="h-4 w-4 mr-2" />
                        Buy Now — R{price}
                      </>
                    )}
                  </Button>
                </div>

                <div className="space-y-2 pt-3 border-t">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Lock className="h-3 w-3" /> Secure checkout via PayFast
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Download className="h-3 w-3" /> Instant download after payment
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Check className="h-3 w-3" /> 7-day money-back guarantee
                  </div>
                </div>

                <p className="text-xs text-muted-foreground text-center pt-2">
                  This is a digital product. No shipping. Download immediately after payment.
                </p>
              </CardContent>
            </Card>

            {/* Disclosure */}
            <p className="text-xs text-muted-foreground text-center mt-4 px-4">
              By purchasing, you agree to our{' '}
              <Link href="/" className="underline">Terms of Service</Link>.
              This product is educational, not a guarantee of business success.
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
