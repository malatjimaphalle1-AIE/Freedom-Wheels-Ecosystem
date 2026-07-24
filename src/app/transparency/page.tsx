import { db } from '@/lib/db'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { ArrowLeft, TrendingUp, Users, Wallet } from 'lucide-react'

export const dynamic = 'force-dynamic'

// Public transparency page — shows all published monthly reports.
// Data is read server-side and rendered as static HTML for SEO + speed.

export default async function TransparencyPage() {
  const reports = await db.transparencyReport.findMany({
    orderBy: { month: 'desc' },
    take: 24, // last 2 years
  })

  // Aggregate totals across all reported months
  const totals = reports.reduce(
    (acc, r) => {
      acc.totalRevenue += r.totalRevenueCents
      acc.totalDistributed += r.totalDistributedCents
      acc.totalPlatform += r.platformShareCents
      return acc
    },
    { totalRevenue: 0, totalDistributed: 0, totalPlatform: 0 }
  )

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="border-b sticky top-0 bg-background/95 backdrop-blur z-40">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-emerald-600 text-white font-bold text-sm">FW</div>
            <span className="font-semibold">Freedom Wheels · Transparency</span>
          </Link>
          <Link href="/" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center">
            <ArrowLeft className="h-4 w-4 mr-1" /> Back to home
          </Link>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-12 max-w-5xl">
        <div className="mb-10">
          <Badge variant="outline" className="mb-3">Transparency Reports</Badge>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">
            Where the money comes from, where it goes.
          </h1>
          <p className="text-muted-foreground max-w-2xl">
            Every month we publish a full breakdown of affiliate revenue earned, platform share retained,
            and distributions paid to members. This is the single source of truth for the revenue share model.
          </p>
        </div>

        {/* All-time totals */}
        <div className="grid sm:grid-cols-3 gap-4 mb-10">
          <Card>
            <CardContent className="pt-6">
              <TrendingUp className="h-6 w-6 text-emerald-600 mb-2" />
              <div className="text-xs text-muted-foreground">Total affiliate revenue</div>
              <div className="text-2xl font-bold">R{(totals.totalRevenue / 100).toFixed(2)}</div>
              <div className="text-xs text-muted-foreground mt-1">Across {reports.length} months</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <Wallet className="h-6 w-6 text-emerald-600 mb-2" />
              <div className="text-xs text-muted-foreground">Total distributed to members</div>
              <div className="text-2xl font-bold">R{(totals.totalDistributed / 100).toFixed(2)}</div>
              <div className="text-xs text-muted-foreground mt-1">
                {totals.totalRevenue > 0 ? Math.round((totals.totalDistributed / totals.totalRevenue) * 100) : 0}% of revenue
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <Users className="h-6 w-6 text-emerald-600 mb-2" />
              <div className="text-xs text-muted-foreground">Platform share retained</div>
              <div className="text-2xl font-bold">R{(totals.totalPlatform / 100).toFixed(2)}</div>
              <div className="text-xs text-muted-foreground mt-1">For operations + growth reserve</div>
            </CardContent>
          </Card>
        </div>

        {/* Monthly reports */}
        {reports.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <div className="text-muted-foreground">
                No transparency reports published yet.
                <br />
                The first report will appear here after the first monthly distribution is run.
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">Monthly breakdown</h2>
            {reports.map(report => {
              const partnerBreakdown: Record<string, number> = JSON.parse(report.partnerBreakdown || '{}')
              const sortedPartners = Object.entries(partnerBreakdown).sort(([, a], [, b]) => b - a)
              const topPartner = sortedPartners[0]?.[0]

              return (
                <Card key={report.id} id={report.month}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{formatMonth(report.month)}</CardTitle>
                      <Badge variant="outline">Published {new Date(report.publishedAt).toLocaleDateString('en-ZA')}</Badge>
                    </div>
                    <CardDescription>
                      {report.totalMembers} members · {report.newMembers} new · {report.churnedMembers} churned
                      {topPartner && ` · top partner: ${topPartner}`}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid sm:grid-cols-4 gap-4 mb-4">
                      <Stat label="Total revenue" value={`R${(report.totalRevenueCents / 100).toFixed(2)}`} />
                      <Stat label="Distributed" value={`R${(report.totalDistributedCents / 100).toFixed(2)}`} accent="emerald" />
                      <Stat label="Platform share" value={`R${(report.platformShareCents / 100).toFixed(2)}`} />
                      <Stat label="Distributable" value={`R${(report.distributableCents / 100).toFixed(2)}`} />
                    </div>

                    {sortedPartners.length > 0 && (
                      <div>
                        <div className="text-xs font-medium text-muted-foreground mb-2">Revenue by partner</div>
                        <div className="space-y-1.5">
                          {sortedPartners.map(([name, amount]) => {
                            const pct = report.totalRevenueCents > 0 ? (amount / report.totalRevenueCents) * 100 : 0
                            return (
                              <div key={name} className="flex items-center gap-3 text-sm">
                                <div className="w-32 truncate">{name}</div>
                                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                                  <div className="h-full bg-emerald-500" style={{ width: `${pct}%` }} />
                                </div>
                                <div className="w-20 text-right font-mono text-xs">R{(amount / 100).toFixed(2)}</div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}

                    {report.notes && (
                      <div className="mt-4 text-sm text-muted-foreground italic border-l-2 pl-3">
                        {report.notes}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}

        {/* Methodology */}
        <Card className="mt-10 bg-muted/30">
          <CardHeader>
            <CardTitle className="text-lg">How these numbers are calculated</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2 leading-relaxed">
            <p>
              <strong className="text-foreground">Total revenue</strong> is the sum of all affiliate commissions
              recorded by the platform in a given calendar month. Commissions are recorded when affiliate partners
              (Amazon Associates, Hostinger, Namecheap, Canva, ConvertKit, etc.) report payouts to us.
            </p>
            <p>
              <strong className="text-foreground">Platform share</strong> is 15% of total revenue, retained for operations
              and a growth reserve. <strong className="text-foreground">Distributable</strong> is total revenue minus platform share.
            </p>
            <p>
              The distributable amount is split across active members by tier: Starter shares 10%, Pro shares 25%,
              Elite shares 50% — each tier&apos;s share is split pro-rata across all active members in that tier.
              <strong className="text-foreground"> Distributed</strong> is the total paid out to members that month.
            </p>
            <p>
              We never promise specific returns. In months where affiliate revenue is low, distributions will be low.
              These reports are the public record of actual revenue and distributions.
            </p>
          </CardContent>
        </Card>
      </main>

      <footer className="border-t mt-auto">
        <div className="container mx-auto px-4 py-4 text-xs text-muted-foreground text-center">
          Freedom Wheels · <Link href="/" className="hover:text-foreground">Home</Link> ·{' '}
          <Link href="/member" className="hover:text-foreground">Member dashboard</Link>
        </div>
      </footer>
    </div>
  )
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: 'emerald' }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={`text-lg font-semibold ${accent === 'emerald' ? 'text-emerald-600' : ''}`}>{value}</div>
    </div>
  )
}

function formatMonth(month: string): string {
  // "2026-06" → "June 2026"
  const [year, monthNum] = month.split('-')
  const date = new Date(parseInt(year), parseInt(monthNum) - 1, 1)
  return date.toLocaleDateString('en-ZA', { month: 'long', year: 'numeric' })
}
