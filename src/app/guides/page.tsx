import { db } from '@/lib/db'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { ArrowLeft, Lock, Eye, Calendar } from 'lucide-react'

export const dynamic = 'force-dynamic'

// Public guides listing page
export default async function GuidesPage() {
  const guides = await db.guide.findMany({
    where: { isPublished: true },
    orderBy: { publishedAt: 'desc' },
    select: {
      id: true,
      slug: true,
      title: true,
      excerpt: true,
      coverImageUrl: true,
      category: true,
      tags: true,
      isMemberOnly: true,
      publishedAt: true,
      viewCount: true,
    },
  })

  // Get categories for filter chips
  const categories = Array.from(new Set(guides.map(g => g.category))).sort()

  // Group guides by category
  const grouped = categories.map(cat => ({
    category: cat,
    guides: guides.filter(g => g.category === cat)
  }))

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="border-b sticky top-0 bg-background/95 backdrop-blur z-40">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-emerald-600 text-white font-bold text-sm">FW</div>
            <span className="font-semibold">Freedom Wheels · Guides</span>
          </Link>
          <Link href="/" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center">
            <ArrowLeft className="h-4 w-4 mr-1" /> Back to home
          </Link>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-12 max-w-6xl">
        <div className="mb-10">
          <Badge variant="outline" className="mb-3">Buying Guides</Badge>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">
            Honest reviews and recommendations for SA entrepreneurs.
          </h1>
          <p className="text-muted-foreground max-w-2xl">
            Buying guides for laptops, books, software, and equipment. Click through to our affiliate partners when you buy — that&apos;s what funds your revenue share.
          </p>
        </div>

        {guides.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <div className="text-muted-foreground mb-4">
                No guides published yet.
              </div>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                The founder is working on the first buying guides. Check back soon — or{' '}
                <Link href="/#pricing" className="text-emerald-600 hover:underline">subscribe now</Link>
                {' '}to be notified when new content drops.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-10">
            {grouped.map(group => (
              <section key={group.category}>
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  {group.category}
                  <Badge variant="secondary">{group.guides.length}</Badge>
                </h2>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {group.guides.map(g => (
                    <Link key={g.id} href={`/guides/${g.slug}`}>
                      <Card className="h-full hover:shadow-md transition-shadow cursor-pointer">
                        {g.coverImageUrl && (
                          <div className="aspect-video w-full bg-muted rounded-t-lg overflow-hidden">
                            <img
                              src={g.coverImageUrl}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        <CardHeader>
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <CardTitle className="text-base leading-tight">{g.title}</CardTitle>
                            {g.isMemberOnly && (
                              <Lock className="h-4 w-4 text-amber-500 flex-shrink-0" />
                            )}
                          </div>
                          <CardDescription className="line-clamp-2">{g.excerpt}</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <div className="flex items-center gap-3">
                              <span className="flex items-center gap-1">
                                <Eye className="h-3 w-3" /> {g.viewCount}
                              </span>
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {g.publishedAt ? new Date(g.publishedAt).toLocaleDateString('en-ZA', { month: 'short', day: 'numeric' }) : '—'}
                              </span>
                            </div>
                            {g.isMemberOnly && (
                              <Badge variant="outline" className="text-xs">Members only</Badge>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
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
