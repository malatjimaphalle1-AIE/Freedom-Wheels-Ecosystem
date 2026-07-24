'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { ArrowLeft, Key, Play, FileText, Plus } from 'lucide-react'

export default function AdminPage() {
  const [apiKey, setApiKey] = useState('')
  const [authed, setAuthed] = useState(false)
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<unknown>(null)
  const [error, setError] = useState<string | null>(null)

  // Distribution form
  const [distMonth, setDistMonth] = useState('')

  // Transparency form
  const [transparencyMonth, setTransparencyMonth] = useState('')

  // Commission form
  const [commissionPartner, setCommissionPartner] = useState('Amazon Associates')
  const [commissionAmount, setCommissionAmount] = useState('')
  const [commissionSource, setCommissionSource] = useState('')

  async function callAdmin(endpoint: string, body: unknown) {
    setBusy(true)
    setError(null)
    setResult(null)
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Key': apiKey,
        },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`)
      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setBusy(false)
    }
  }

  function handleAuth(e: React.FormEvent) {
    e.preventDefault()
    if (apiKey) setAuthed(true)
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="border-b sticky top-0 bg-background/95 backdrop-blur z-40">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-emerald-600 text-white font-bold text-sm">FW</div>
            <span className="font-semibold">Freedom Wheels · Admin</span>
          </Link>
          <Link href="/" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center">
            <ArrowLeft className="h-4 w-4 mr-1" /> Back to site
          </Link>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-8 max-w-3xl">
        <div className="mb-6">
          <Badge variant="outline" className="mb-3">Admin · Founder Only</Badge>
          <h1 className="text-2xl font-bold tracking-tight mb-2">Operations dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Run monthly distributions, publish transparency reports, and record external affiliate commissions.
            Requires <code className="bg-muted px-1.5 py-0.5 rounded text-xs">ADMIN_API_KEY</code> env var.
          </p>
          <div className="mt-4 flex flex-wrap gap-2 text-sm">
            <Link href="/admin/guides" className="inline-flex items-center gap-1 px-3 py-1 rounded border hover:bg-muted">
              <FileText className="h-4 w-4" /> Manage buying guides
            </Link>
          </div>
        </div>

        {!authed ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Key className="h-4 w-4" /> Admin authentication
              </CardTitle>
              <CardDescription>Enter your ADMIN_API_KEY to continue</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAuth} className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="admin-key">Admin API key</Label>
                  <Input
                    id="admin-key"
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="Your ADMIN_API_KEY value"
                  />
                </div>
                <Button type="submit" disabled={!apiKey} className="w-full">
                  Authenticate
                </Button>
              </form>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Play className="h-4 w-4" /> Run monthly distribution
                </CardTitle>
                <CardDescription>
                  Calculates the revenue share pool for a month and distributes it across active members.
                  Defaults to previous month. Idempotent — safe to re-run if not yet distributed.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="dist-month">Month (YYYY-MM, optional)</Label>
                  <Input
                    id="dist-month"
                    type="text"
                    value={distMonth}
                    onChange={(e) => setDistMonth(e.target.value)}
                    placeholder="e.g. 2026-06 (leave empty for previous month)"
                  />
                </div>
                <Button
                  onClick={() => callAdmin('/api/admin/distribute', distMonth ? { month: distMonth } : {})}
                  disabled={busy}
                >
                  Run distribution
                </Button>
              </CardContent>
            </Card>

            {/* Transparency report */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-4 w-4" /> Publish transparency report
                </CardTitle>
                <CardDescription>
                  Publishes the public report at /transparency for the given month. Distribution must be run first.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="transparency-month">Month (YYYY-MM, optional)</Label>
                  <Input
                    id="transparency-month"
                    type="text"
                    value={transparencyMonth}
                    onChange={(e) => setTransparencyMonth(e.target.value)}
                    placeholder="e.g. 2026-06 (leave empty for previous month)"
                  />
                </div>
                <Button
                  variant="outline"
                  onClick={() => callAdmin('/api/admin/transparency', transparencyMonth ? { month: transparencyMonth } : {})}
                  disabled={busy}
                >
                  Publish report
                </Button>
                <Button
                  variant="ghost"
                  className="w-full text-xs"
                  onClick={() => callAdmin('/api/admin/notify-distributions', transparencyMonth ? { month: transparencyMonth } : {})}
                  disabled={busy}
                >
                  Send distribution notification emails to members
                </Button>
              </CardContent>
            </Card>

            {/* Record commission */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Plus className="h-4 w-4" /> Record affiliate commission
                </CardTitle>
                <CardDescription>
                  Records an external affiliate commission received by the platform. Use this when partners report payouts.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid sm:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="commission-partner">Partner</Label>
                    <Input
                      id="commission-partner"
                      type="text"
                      value={commissionPartner}
                      onChange={(e) => setCommissionPartner(e.target.value)}
                      placeholder="Amazon Associates"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="commission-amount">Amount in ZAR (R)</Label>
                    <Input
                      id="commission-amount"
                      type="number"
                      step="0.01"
                      value={commissionAmount}
                      onChange={(e) => setCommissionAmount(e.target.value)}
                      placeholder="e.g. 125.50"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="commission-source">Source reference (optional)</Label>
                  <Input
                    id="commission-source"
                    type="text"
                    value={commissionSource}
                    onChange={(e) => setCommissionSource(e.target.value)}
                    placeholder="e.g. Amazon Associates June 2026 payout, order ID XYZ"
                  />
                </div>
                <Button
                  variant="outline"
                  onClick={() => {
                    const amount = parseFloat(commissionAmount)
                    if (isNaN(amount) || amount <= 0) {
                      setError('Invalid amount')
                      return
                    }
                    callAdmin('/api/admin/record-commission', {
                      partnerName: commissionPartner,
                      amountCents: Math.round(amount * 100),
                      sourceRef: commissionSource || undefined,
                    })
                  }}
                  disabled={busy}
                >
                  Record commission
                </Button>
              </CardContent>
            </Card>

            {/* Result display */}
            {error && (
              <Card className="border-rose-300 dark:border-rose-800">
                <CardContent className="pt-6">
                  <div className="text-sm text-rose-700 dark:text-rose-400 font-medium mb-1">Error</div>
                  <pre className="text-xs whitespace-pre-wrap">{error}</pre>
                </CardContent>
              </Card>
            )}

            {result && (
              <Card className="border-emerald-300 dark:border-emerald-800">
                <CardContent className="pt-6">
                  <div className="text-sm text-emerald-700 dark:text-emerald-400 font-medium mb-2">Result</div>
                  <pre className="text-xs whitespace-pre-wrap bg-muted/50 p-3 rounded max-h-96 overflow-y-auto">
                    {JSON.stringify(result, null, 2)}
                  </pre>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </main>

      <footer className="border-t mt-auto">
        <div className="container mx-auto px-4 py-4 text-xs text-muted-foreground text-center">
          Admin access restricted to founder. All actions are logged.
        </div>
      </footer>
    </div>
  )
}
