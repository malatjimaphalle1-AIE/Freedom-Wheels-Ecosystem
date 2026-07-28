'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowLeft, Users, Share2, TrendingUp, Target } from 'lucide-react'

interface MarketingData {
  summary: {
    totalMembers: number
    referralCodesIssued: number
    totalReferredUsers: number
    referralVisitsLast30Days: number
    convertedVisitsLast30Days: number
    conversionRate: string
  }
  topReferrers: Array<{
    id: string
    name: string
    referralCode: string | null
    referralCount: number
  }>
  utmBreakdown: Array<{ source: string; count: number }>
  shareBreakdown: Array<{ platform: string; count: number }>
}

export default function AdminMarketingPage() {
  const [apiKey, setApiKey] = useState('')
  const [authed, setAuthed] = useState(false)
  const [data, setData] = useState<MarketingData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Check if already authed via session
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
    if (authed) loadData()
  }, [authed])

  async function loadData() {
    setLoading(true); setError(null)
    try {
      const headers: Record<string, string> = {}
      if (apiKey) headers['X-Admin-Key'] = apiKey
      const res = await fetch('/api/admin/marketing', { headers })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error || 'Failed to load')
      setData(d)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  if (!authed) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <header className="border-b">
          <div className="container mx-auto px-4 h-16 flex items-center justify-between">
            <Link href="/admin" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-emerald-600 text-white font-bold text-sm">FW</div>
              <span className="font-semibold">Admin · Marketing</span>
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
              <CardDescription>Enter your ADMIN_API_KEY to view marketing analytics</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={(e) => { e.preventDefault(); if (apiKey) setAuthed(true) }} className="space-y-3">
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="ADMIN_API_KEY"
                  className="w-full px-3 py-2 border rounded-md bg-background text-sm"
                />
                <Button type="submit" className="w-full" disabled={!apiKey}>Authenticate</Button>
              </form>
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Loading marketing data…</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <div className="text-rose-600 mb-3">{error}</div>
            <Button onClick={loadData}>Retry</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!data) return null

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="border-b sticky top-0 bg-background/95 backdrop-blur z-40">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/admin" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-emerald-600 text-white font-bold text-sm">FW</div>
            <span className="font-semibold">Admin · Marketing</span>
          </Link>
          <Link href="/admin" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center">
            <ArrowLeft className="h-4 w-4 mr-1" /> Back to admin
          </Link>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-8 max-w-5xl">
        <div className="mb-6">
          <Badge variant="outline" className="mb-3">Marketing Analytics</Badge>
          <h1 className="text-2xl font-bold tracking-tight">Marketing dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Track referral performance, UTM sources, and social share activity.
          </p>
        </div>

        {/* Summary cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <Users className="h-6 w-6 text-emerald-600 mb-2" />
              <div className="text-xs text-muted-foreground">Total active members</div>
              <div className="text-2xl font-bold">{data.summary.totalMembers}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <Target className="h-6 w-6 text-emerald-600 mb-2" />
              <div className="text-xs text-muted-foreground">Referred members</div>
              <div className="text-2xl font-bold">{data.summary.totalReferredUsers}</div>
              <div className="text-xs text-muted-foreground mt-1">
                {data.summary.totalMembers > 0 ? `${Math.round(data.summary.totalReferredUsers / data.summary.totalMembers * 100)}% of total` : '—'}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <TrendingUp className="h-6 w-6 text-emerald-600 mb-2" />
              <div className="text-xs text-muted-foreground">Referral visits (30 days)</div>
              <div className="text-2xl font-bold">{data.summary.referralVisitsLast30Days}</div>
              <div className="text-xs text-muted-foreground mt-1">
                {data.summary.convertedVisitsLast30Days} converted ({data.summary.conversionRate})
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Top referrers */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Top referrers</CardTitle>
              <CardDescription>Members who have referred the most people</CardDescription>
            </CardHeader>
            <CardContent>
              {data.topReferrers.length === 0 ? (
                <div className="text-sm text-muted-foreground py-6 text-center">
                  No referrals yet. Members can share their referral link from /member.
                </div>
              ) : (
                <div className="space-y-2">
                  {data.topReferrers.map((r, i) => (
                    <div key={r.id} className="flex items-center justify-between py-2 border-b last:border-0">
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-full bg-emerald-600 text-white text-xs font-bold flex items-center justify-center">
                          {i + 1}
                        </div>
                        <div>
                          <div className="text-sm font-medium">{r.name}</div>
                          <div className="text-xs text-muted-foreground font-mono">{r.referralCode}</div>
                        </div>
                      </div>
                      <Badge variant="secondary">{r.referralCount} referred</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* UTM sources */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Signup sources (UTM)</CardTitle>
              <CardDescription>Where your members came from</CardDescription>
            </CardHeader>
            <CardContent>
              {data.utmBreakdown.length === 0 ? (
                <div className="text-sm text-muted-foreground py-6 text-center">
                  No UTM-tagged signups yet. Use UTM params in your marketing URLs:
                  <code className="block mt-2 text-xs bg-muted p-2 rounded">
                    ?utm_source=facebook&utm_campaign=launch
                  </code>
                </div>
              ) : (
                <div className="space-y-2">
                  {data.utmBreakdown.map(u => (
                    <div key={u.source} className="flex items-center justify-between py-2 border-b last:border-0">
                      <span className="text-sm font-medium">{u.source}</span>
                      <Badge variant="secondary">{u.count} members</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Share platforms */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Share2 className="h-4 w-4" /> Share platform activity
              </CardTitle>
              <CardDescription>Which share buttons members and visitors click most</CardDescription>
            </CardHeader>
            <CardContent>
              {data.shareBreakdown.length === 0 ? (
                <div className="text-sm text-muted-foreground py-6 text-center">
                  No shares tracked yet. Share buttons appear on the landing page, guides, and member dashboard.
                </div>
              ) : (
                <div className="space-y-2">
                  {data.shareBreakdown.map(s => (
                    <div key={s.platform} className="flex items-center justify-between py-2 border-b last:border-0">
                      <span className="text-sm font-medium capitalize">{s.platform}</span>
                      <Badge variant="secondary">{s.count} clicks</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Marketing tips */}
          <Card className="bg-muted/30">
            <CardHeader>
              <CardTitle className="text-lg">Marketing tips</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-3">
              <p><strong className="text-foreground">Share your guides:</strong> Each guide has share buttons at the bottom. Share them in SA freelancer Facebook/WhatsApp groups.</p>
              <p><strong className="text-foreground">Use UTM params:</strong> Tag your marketing URLs to see which channels drive signups:
                <code className="block mt-1 text-xs bg-muted p-2 rounded">
                  ?utm_source=facebook&utm_medium=social&utm_campaign=launch
                </code>
              </p>
              <p><strong className="text-foreground">Member referrals:</strong> Members have personal referral links at /member. Encourage them to share with friends.</p>
              <p><strong className="text-foreground">Compliance note:</strong> Referrals are tracked for analytics only — members do NOT earn commissions from referrals. Revenue share comes from external affiliate commissions only.</p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
