'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowLeft, ExternalLink, LogOut, Wallet, MousePointerClick, TrendingUp, Calendar } from 'lucide-react'
import Link from 'next/link'

interface DashboardData {
  user: {
    id: string
    email: string
    name: string | null
    tier: 'STARTER' | 'PRO' | 'ELITE'
    status: 'PENDING_PAYMENT' | 'ACTIVE' | 'PAST_DUE' | 'CANCELLED' | 'BANNED'
    createdAt: string
  }
  subscription: {
    id: string
    tier: 'STARTER' | 'PRO' | 'ELITE'
    amountCents: number
    currentPeriodStart: string
    currentPeriodEnd: string
    cancelAtPeriodEnd: boolean
  } | null
  distributions: Array<{
    id: string
    month: string
    amountCents: number
    tier: 'STARTER' | 'PRO' | 'ELITE'
    distributedAt: string
    poolTotalRevenueCents: number
    poolDistributableCents: number
  }>
  summary: {
    totalDistributedCents: number
    totalPaidOutCents: number
    pendingBalanceCents: number
    totalClicks: number
  }
  payoutRequests: Array<{
    id: string
    amountCents: number
    status: 'PENDING' | 'APPROVED' | 'PAID' | 'REJECTED'
    method: string | null
    requestedAt: string
    processedAt: string | null
    reference: string | null
  }>
  affiliatePartners: Array<{
    id: string
    name: string
    url: string
    affiliateUrl: string
    commissionRate: string
    category: string
    description: string
    clickCount: number
  }>
}

export default function MemberDashboardPage() {
  const [authState, setAuthState] = useState<'loading' | 'unauthenticated' | 'authenticated'>('loading')
  const [data, setData] = useState<DashboardData | null>(null)
  const [email, setEmail] = useState('')
  const [magicLinkStatus, setMagicLinkStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [magicLinkError, setMagicLinkError] = useState<string | null>(null)
  const [magicToken, setMagicToken] = useState('')
  const [verifyStatus, setVerifyStatus] = useState<'idle' | 'verifying' | 'error'>('idle')
  const [verifyError, setVerifyError] = useState<string | null>(null)
  const [payoutAmount, setPayoutAmount] = useState('')
  const [payoutMethod, setPayoutMethod] = useState<'bank_transfer' | 'payfast_wallet'>('bank_transfer')
  const [payoutStatus, setPayoutStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const [payoutError, setPayoutError] = useState<string | null>(null)
  const [cancelMessage, setCancelMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Check auth on mount, and read ?token= from URL (magic link click)
  useEffect(() => {
    const url = new URL(window.location.href)
    const tokenFromUrl = url.searchParams.get('token')
    if (tokenFromUrl) {
      setMagicToken(tokenFromUrl)
      // Auto-verify
      verifyToken(tokenFromUrl)
      // Clean URL
      window.history.replaceState({}, '', '/member')
    } else {
      checkAuth()
    }
  }, [])

  async function checkAuth() {
    try {
      const res = await fetch('/api/auth/me')
      if (res.ok) {
        setAuthState('authenticated')
        await loadDashboard()
      } else {
        setAuthState('unauthenticated')
      }
    } catch {
      setAuthState('unauthenticated')
    }
  }

  async function loadDashboard() {
    try {
      const res = await fetch('/api/member/dashboard')
      if (!res.ok) throw new Error('Failed to load dashboard')
      const d = await res.json()
      setData(d)
    } catch (err) {
      console.error('Dashboard load error:', err)
    }
  }

  async function sendMagicLink() {
    setMagicLinkStatus('sending')
    setMagicLinkError(null)
    try {
      const res = await fetch('/api/auth/magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to send magic link')
      setMagicLinkStatus('sent')
      // In dev mode, token is returned in response — pre-fill it
      if (data.token) {
        setMagicToken(data.token)
      }
    } catch (err) {
      setMagicLinkStatus('error')
      setMagicLinkError(err instanceof Error ? err.message : 'Unknown error')
    }
  }

  async function verifyToken(token: string) {
    setVerifyStatus('verifying')
    setVerifyError(null)
    try {
      const res = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Verification failed')
      setVerifyStatus('idle')
      setMagicToken('')
      setAuthState('authenticated')
      await loadDashboard()
    } catch (err) {
      setVerifyStatus('error')
      setVerifyError(err instanceof Error ? err.message : 'Unknown error')
    }
  }

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    setAuthState('unauthenticated')
    setData(null)
  }

  async function handleCancelSubscription() {
    setCancelMessage(null)
    try {
      const res = await fetch('/api/member/cancel-subscription', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to cancel subscription')

      const periodEnd = new Date(data.periodEnd).toLocaleDateString('en-ZA')
      const payfastNote = data.payfastApiResult?.ok === false
        ? ' (Note: PayFast API cancellation pending — founder will confirm manually.)'
        : ''
      setCancelMessage({
        type: 'success',
        text: `Subscription cancelled. Access continues until ${periodEnd}.${payfastNote}`,
      })
      await loadDashboard()
    } catch (err) {
      setCancelMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to cancel subscription',
      })
    }
  }

  async function handleAffiliateClick(partnerId: string, affiliateUrl: string) {
    // Fire click tracking (don't await — open link immediately)
    fetch('/api/member/click', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ partnerId }),
    }).catch(() => {})
    window.open(affiliateUrl, '_blank', 'noopener,noreferrer')
    // Refresh dashboard to update click count
    setTimeout(() => loadDashboard(), 500)
  }

  async function requestPayout() {
    setPayoutStatus('submitting')
    setPayoutError(null)
    try {
      const amountRand = parseFloat(payoutAmount)
      if (isNaN(amountRand) || amountRand < 10) {
        throw new Error('Minimum payout is R10.00')
      }
      const amountCents = Math.round(amountRand * 100)
      const res = await fetch('/api/member/payout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amountCents, method: payoutMethod }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Payout request failed')
      setPayoutStatus('success')
      setPayoutAmount('')
      await loadDashboard()
    } catch (err) {
      setPayoutStatus('error')
      setPayoutError(err instanceof Error ? err.message : 'Unknown error')
    }
  }

  if (authState === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Loading…</div>
      </div>
    )
  }

  if (authState === 'unauthenticated') {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <header className="border-b">
          <div className="container mx-auto px-4 h-16 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-emerald-600 text-white font-bold text-sm">FW</div>
              <span className="font-semibold">Freedom Wheels</span>
            </Link>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/"><ArrowLeft className="h-4 w-4 mr-1" /> Back to site</Link>
            </Button>
          </div>
        </header>

        <main className="flex-1 flex items-center justify-center px-4 py-12">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Member Login</CardTitle>
              <CardDescription>
                Enter your subscriber email. We&apos;ll send you a magic link to log in.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email address</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="jane@example.com"
                  disabled={magicLinkStatus === 'sending' || magicLinkStatus === 'sent'}
                />
              </div>

              {magicLinkStatus === 'error' && (
                <div className="text-sm text-rose-600 bg-rose-50 dark:bg-rose-950/30 p-3 rounded">
                  {magicLinkError}
                </div>
              )}

              {magicLinkStatus === 'sent' ? (
                <div className="space-y-3">
                  <div className="text-sm bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 p-3 rounded">
                    ✓ Magic link generated. Check your email (or use the token below in dev mode).
                  </div>
                  {magicToken && (
                    <>
                      <div className="space-y-2">
                        <Label>Dev mode: paste token to verify</Label>
                        <Input
                          value={magicToken}
                          onChange={(e) => setMagicToken(e.target.value)}
                          placeholder="Paste token"
                        />
                        <Button
                          className="w-full"
                          onClick={() => verifyToken(magicToken)}
                          disabled={verifyStatus === 'verifying' || !magicToken}
                        >
                          {verifyStatus === 'verifying' ? 'Verifying…' : 'Verify & Log In'}
                        </Button>
                      </div>
                      {verifyError && (
                        <div className="text-sm text-rose-600">{verifyError}</div>
                      )}
                    </>
                  )}
                  <Button variant="outline" className="w-full" onClick={() => setMagicLinkStatus('idle')}>
                    Use a different email
                  </Button>
                </div>
              ) : (
                <Button
                  className="w-full"
                  onClick={sendMagicLink}
                  disabled={magicLinkStatus === 'sending' || !email}
                >
                  {magicLinkStatus === 'sending' ? 'Sending…' : 'Send Magic Link'}
                </Button>
              )}

              <div className="text-xs text-muted-foreground text-center">
                Don&apos;t have an account?{' '}
                <Link href="/#pricing" className="text-emerald-600 hover:underline">
                  Subscribe here
                </Link>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

  // Authenticated view
  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Loading dashboard…</div>
      </div>
    )
  }

  const tierLabel = { STARTER: 'Starter', PRO: 'Pro', ELITE: 'Elite' }[data.user.tier]
  const statusColor = {
    ACTIVE: 'bg-emerald-100 text-emerald-700',
    PAST_DUE: 'bg-amber-100 text-amber-700',
    PENDING_PAYMENT: 'bg-gray-100 text-gray-700',
    CANCELLED: 'bg-rose-100 text-rose-700',
    BANNED: 'bg-rose-100 text-rose-700',
  }[data.user.status]

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="border-b sticky top-0 bg-background/95 backdrop-blur z-40">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-emerald-600 text-white font-bold text-sm">FW</div>
            <span className="font-semibold">Freedom Wheels · Member</span>
          </Link>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground hidden sm:inline">{data.user.email}</span>
            <Button variant="ghost" size="sm" onClick={logout}>
              <LogOut className="h-4 w-4 mr-1" /> Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-8">
        {/* Welcome card */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-sm text-muted-foreground">Welcome back</div>
                <div className="text-2xl font-bold">{data.user.name || data.user.email}</div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className={statusColor}>
                  {data.user.status.replace('_', ' ')}
                </Badge>
                <Badge variant="secondary">{tierLabel} member</Badge>
                {data.subscription && (
                  <Badge variant="outline">
                    {data.subscription.cancelAtPeriodEnd
                      ? `Ends ${new Date(data.subscription.currentPeriodEnd).toLocaleDateString('en-ZA')}`
                      : `Renews ${new Date(data.subscription.currentPeriodEnd).toLocaleDateString('en-ZA')}`}
                  </Badge>
                )}
                {data.subscription && !data.subscription.cancelAtPeriodEnd && (
                  <Button size="sm" variant="outline" onClick={() => {
                    if (confirm('Cancel your subscription? Access continues until the end of the current billing period, then expires. No further charges.')) {
                      handleCancelSubscription()
                    }
                  }}>
                    Cancel subscription
                  </Button>
                )}
              </div>
            </div>
            {cancelMessage && (
              <div className={`mt-3 text-sm p-2 rounded ${cancelMessage.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                {cancelMessage.text}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Summary cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <SummaryCard
            icon={<Wallet className="h-5 w-5 text-emerald-600" />}
            label="Pending balance"
            value={`R${(data.summary.pendingBalanceCents / 100).toFixed(2)}`}
            sub="Available to withdraw"
          />
          <SummaryCard
            icon={<TrendingUp className="h-5 w-5 text-emerald-600" />}
            label="Lifetime distributions"
            value={`R${(data.summary.totalDistributedCents / 100).toFixed(2)}`}
            sub={`${data.distributions.length} months`}
          />
          <SummaryCard
            icon={<MousePointerClick className="h-5 w-5 text-emerald-600" />}
            label="Affiliate clicks"
            value={String(data.summary.totalClicks)}
            sub="All-time"
          />
          <SummaryCard
            icon={<Calendar className="h-5 w-5 text-emerald-600" />}
            label="Member since"
            value={new Date(data.user.createdAt).toLocaleDateString('en-ZA')}
            sub={`${Math.floor((Date.now() - new Date(data.user.createdAt).getTime()) / (1000 * 60 * 60 * 24))} days`}
          />
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Distributions history */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Revenue share history</CardTitle>
              <CardDescription>Your monthly distributions from the affiliate revenue pool</CardDescription>
            </CardHeader>
            <CardContent>
              {data.distributions.length === 0 ? (
                <div className="text-sm text-muted-foreground py-6 text-center">
                  No distributions yet. Your first distribution will appear after the next monthly cycle.
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {data.distributions.map(d => (
                    <div key={d.id} className="flex items-center justify-between py-2 border-b last:border-0">
                      <div>
                        <div className="font-medium text-sm">{d.month}</div>
                        <div className="text-xs text-muted-foreground">
                          Pool: R{(d.poolTotalRevenueCents / 100).toFixed(2)} · {d.tier} tier share
                        </div>
                      </div>
                      <div className="font-mono font-semibold text-emerald-600">
                        +R{(d.amountCents / 100).toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Payout request */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Request a payout</CardTitle>
              <CardDescription>Withdraw your pending balance to your bank or PayFast wallet</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-sm bg-muted/50 p-3 rounded">
                Pending balance: <strong className="text-emerald-600">R{(data.summary.pendingBalanceCents / 100).toFixed(2)}</strong>
              </div>

              <div className="space-y-2">
                <Label htmlFor="payout-amount">Amount (ZAR)</Label>
                <Input
                  id="payout-amount"
                  type="number"
                  step="0.01"
                  min="10"
                  value={payoutAmount}
                  onChange={(e) => setPayoutAmount(e.target.value)}
                  placeholder="e.g. 50.00"
                  disabled={payoutStatus === 'submitting'}
                />
              </div>

              <div className="space-y-2">
                <Label>Method</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={payoutMethod === 'bank_transfer' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPayoutMethod('bank_transfer')}
                  >
                    Bank transfer
                  </Button>
                  <Button
                    type="button"
                    variant={payoutMethod === 'payfast_wallet' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPayoutMethod('payfast_wallet')}
                  >
                    PayFast wallet
                  </Button>
                </div>
              </div>

              {payoutStatus === 'error' && (
                <div className="text-sm text-rose-600 bg-rose-50 dark:bg-rose-950/30 p-2 rounded">
                  {payoutError}
                </div>
              )}
              {payoutStatus === 'success' && (
                <div className="text-sm text-emerald-700 bg-emerald-50 dark:bg-emerald-950/30 p-2 rounded">
                  ✓ Payout request submitted. You&apos;ll be contacted within 7–14 business days.
                </div>
              )}

              <Button
                className="w-full"
                onClick={requestPayout}
                disabled={payoutStatus === 'submitting' || data.summary.pendingBalanceCents < 1000}
              >
                {payoutStatus === 'submitting' ? 'Submitting…' : 'Request Payout'}
              </Button>

              {data.summary.pendingBalanceCents < 1000 && (
                <div className="text-xs text-muted-foreground text-center">
                  Minimum payout is R10.00
                </div>
              )}

              {data.payoutRequests.length > 0 && (
                <div className="mt-4 pt-4 border-t">
                  <div className="text-xs font-medium text-muted-foreground mb-2">Recent payout requests</div>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {data.payoutRequests.slice(0, 5).map(p => (
                      <div key={p.id} className="flex justify-between text-xs">
                        <span>R{(p.amountCents / 100).toFixed(2)} · {p.method}</span>
                        <span className="text-muted-foreground">{p.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Affiliate partners */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg">Affiliate partners</CardTitle>
            <CardDescription>
              Click through to our partners. We earn a commission on your purchases — that&apos;s what funds your revenue share.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {data.affiliatePartners.map(p => (
                <Card key={p.id} className="border-dashed">
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <div className="font-medium text-sm">{p.name}</div>
                        <Badge variant="secondary" className="text-xs mt-1">{p.category}</Badge>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {p.clickCount} click{p.clickCount === 1 ? '' : 's'}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{p.description}</p>
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full"
                      onClick={() => handleAffiliateClick(p.id, p.affiliateUrl)}
                    >
                      Visit partner <ExternalLink className="h-3 w-3 ml-1" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>

      <footer className="border-t mt-auto">
        <div className="container mx-auto px-4 py-4 text-xs text-muted-foreground text-center">
          Freedom Wheels · <Link href="/" className="hover:text-foreground">Back to home</Link> ·{' '}
          <Link href="/transparency" className="hover:text-foreground">Transparency reports</Link>
        </div>
      </footer>
    </div>
  )
}

function SummaryCard({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub: string }) {
  return (
    <Card>
      <CardContent className="pt-5">
        <div className="flex items-center gap-2 mb-2">
          {icon}
          <span className="text-xs text-muted-foreground">{label}</span>
        </div>
        <div className="text-xl font-bold">{value}</div>
        <div className="text-xs text-muted-foreground mt-1">{sub}</div>
      </CardContent>
    </Card>
  )
}
