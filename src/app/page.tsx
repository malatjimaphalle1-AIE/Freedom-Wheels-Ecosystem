'use client'

import { useState, useEffect, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Check, ExternalLink, Menu, X, ShieldCheck, TrendingUp, Users, BookOpen, HeartHandshake, Lock, ArrowRight } from 'lucide-react'
import { TERMS_OF_SERVICE, PRIVACY_POLICY, REFUND_POLICY } from '@/lib/legal-content'
import { SocialShare } from '@/components/social-share'

type Tier = 'STARTER' | 'PRO' | 'ELITE'

interface AffiliatePartner {
  id: string
  name: string
  url: string
  affiliateUrl: string
  commissionRate: string
  category: string
  description: string
}

export default function Home() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [legalModal, setLegalModal] = useState<null | 'terms' | 'privacy' | 'refund'>(null)
  const [selectedTier, setSelectedTier] = useState<Tier>('PRO')
  const [checkoutEmail, setCheckoutEmail] = useState('')
  const [checkoutName, setCheckoutName] = useState('')
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [checkoutError, setCheckoutError] = useState<string | null>(null)
  const [partners, setPartners] = useState<AffiliatePartner[]>([])

  useEffect(() => {
    fetch('/api/affiliates')
      .then(r => r.json())
      .then(data => setPartners(data.partners || []))
      .catch(() => {})
  }, [])

  const tierDetails = useMemo(() => ({
    STARTER: {
      name: 'Starter',
      price: 99,
      tagline: 'For someone just exploring online income',
      sharePct: 10,
      features: [
        'Access to all member-only buying guides and tool reviews',
        'Member-only pricing on 12+ software tools (Canva, Notion, Hostinger, more)',
        'Private community access (read-only)',
        '10% share of monthly affiliate revenue pool',
        'Cancel anytime — no lock-in',
      ],
      notIncluded: [
        'Community posting privileges',
        'Monthly group calls',
        'Strategy sessions',
      ],
      cta: 'Start Starter',
    },
    PRO: {
      name: 'Pro',
      price: 299,
      tagline: 'For the active side-hustler — most popular',
      sharePct: 25,
      features: [
        'Everything in Starter',
        'Full community participation (posts, DMs, weekly office hours)',
        'Monthly group call with founder (60 min, Q&A)',
        'Early access to new guides and partnerships',
        '25% share of monthly affiliate revenue pool',
        'Cancel anytime — no lock-in',
      ],
      notIncluded: [
        '1:1 strategy calls',
      ],
      cta: 'Go Pro',
    },
    ELITE: {
      name: 'Elite',
      price: 499,
      tagline: 'For the serious operator building real revenue',
      sharePct: 50,
      features: [
        'Everything in Pro',
        '1:1 monthly strategy call with founder (30 min)',
        'Direct input on next partnerships and content',
        'Member-only product discounts (negotiated separately)',
        '50% share of monthly affiliate revenue pool',
        'Cancel anytime — no lock-in',
      ],
      notIncluded: [],
      cta: 'Join Elite',
    },
  } as const), [])

  async function handleCheckout() {
    setCheckoutError(null)
    if (!checkoutEmail || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(checkoutEmail)) {
      setCheckoutError('Please enter a valid email address.')
      return
    }
    if (!checkoutName.trim()) {
      setCheckoutError('Please enter your name.')
      return
    }

    setCheckoutLoading(true)
    try {
      const res = await fetch('/api/payfast/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tier: selectedTier,
          email: checkoutEmail,
          name: checkoutName.trim(),
        }),
      })
      const data = await res.json()
      if (!res.ok || !data.redirectUrl) {
        throw new Error(data.error || 'Failed to start checkout. Please try again.')
      }
      // Redirect to PayFast
      window.location.href = data.redirectUrl
    } catch (err: unknown) {
      setCheckoutError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setCheckoutLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Nav
        mobileNavOpen={mobileNavOpen}
        setMobileNavOpen={setMobileNavOpen}
        onLegalClick={setLegalModal}
      />

      <main className="flex-1">
        <Hero />
        <ProblemSection />
        <SolutionSection />
        <HowItWorks />
        <PricingSection
          tierDetails={tierDetails}
          selectedTier={selectedTier}
          setSelectedTier={setSelectedTier}
          checkoutEmail={checkoutEmail}
          setCheckoutEmail={setCheckoutEmail}
          checkoutName={checkoutName}
          setCheckoutName={setCheckoutName}
          checkoutLoading={checkoutLoading}
          checkoutError={checkoutError}
          onCheckout={handleCheckout}
        />
        <TransparencySection />
        <AffiliatePartners partners={partners} />
        <FaqSection />
        <FounderSection />
        <FinalCta onLegalClick={setLegalModal} />
      </main>

      <Footer onLegalClick={setLegalModal} />

      <LegalModal
        open={legalModal !== null}
        type={legalModal}
        onOpenChange={(open) => !open && setLegalModal(null)}
      />
    </div>
  )
}

// ============================================================================
// NAV
// ============================================================================
function Nav({
  mobileNavOpen,
  setMobileNavOpen,
  onLegalClick,
}: {
  mobileNavOpen: boolean
  setMobileNavOpen: (open: boolean) => void
  onLegalClick: (modal: 'terms' | 'privacy' | 'refund') => void
}) {
  const navLinks = [
    { label: 'How It Works', href: '#how-it-works' },
    { label: 'Pricing', href: '#pricing' },
    { label: 'Guides', href: '/guides' },
    { label: 'Transparency', href: '/transparency' },
    { label: 'Partners', href: '#partners' },
    { label: 'FAQ', href: '#faq' },
  ]

  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <a href="#" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-emerald-600 text-white font-bold">
            FW
          </div>
          <span className="font-semibold tracking-tight">Freedom Wheels</span>
        </a>

        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map(link => (
            <a key={link.href} href={link.href} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild>
            <a href="/member">Member Login</a>
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onLegalClick('terms')}>
            Legal
          </Button>
          <Button size="sm" asChild>
            <a href="#pricing">Become a Member</a>
          </Button>
        </div>

        <button
          className="md:hidden p-2"
          onClick={() => setMobileNavOpen(!mobileNavOpen)}
          aria-label="Toggle navigation"
        >
          {mobileNavOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {mobileNavOpen && (
        <div className="md:hidden border-t bg-background">
          <nav className="container mx-auto px-4 py-3 flex flex-col gap-2">
            {navLinks.map(link => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-muted-foreground hover:text-foreground py-2"
                onClick={() => setMobileNavOpen(false)}
              >
                {link.label}
              </a>
            ))}
            <Button size="sm" variant="outline" asChild className="mt-2">
              <a href="/member" onClick={() => setMobileNavOpen(false)}>Member Login</a>
            </Button>
            <Button size="sm" asChild className="mt-2">
              <a href="#pricing" onClick={() => setMobileNavOpen(false)}>Become a Member</a>
            </Button>
          </nav>
        </div>
      )}
    </header>
  )
}

// ============================================================================
// HERO
// ============================================================================
function Hero() {
  return (
    <section className="relative overflow-hidden border-b">
      <div className="container mx-auto px-4 py-20 md:py-28">
        <div className="max-w-3xl">
          <Badge variant="secondary" className="mb-4">
            <ShieldCheck className="mr-1.5 h-3 w-3" />
            Subscription · Revenue Share · Not an Investment
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight leading-tight mb-6">
            Tools, resources, and community for{' '}
            <span className="text-emerald-600">South African entrepreneurs.</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-8 leading-relaxed">
            Freedom Wheels is a membership platform that curates the software, books, and equipment
            freelancers and side-hustlers actually need — with a revenue share paid back to active members
            from our external affiliate commissions.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button size="lg" asChild>
              <a href="#pricing">
                Become a Member
                <ArrowRight className="ml-2 h-4 w-4" />
              </a>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <a href="#how-it-works">See how it works</a>
            </Button>
          </div>

          <div className="mt-10 flex flex-wrap gap-x-8 gap-y-3 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-emerald-600" /> No lock-in · Cancel anytime
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-emerald-600" /> 7-day money-back guarantee
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-emerald-600" /> Real external affiliate revenue
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ============================================================================
// PROBLEM SECTION
// ============================================================================
function ProblemSection() {
  const pains = [
    {
      title: 'Scattered tools, scattered costs',
      body: 'South African freelancers waste thousands of Rand a year on software they don\'t use, courses they never finish, and equipment that doesn\'t fit their workflow. There\'s no curated path — just an endless marketplace and a million YouTube tutorials.',
    },
    {
      title: 'No leverage on your spend',
      body: 'When you buy a laptop, a course, or a SaaS subscription, you pay retail. The platform earns the affiliate commission. You earn nothing back. Your spending generates revenue for everyone except you.',
    },
    {
      title: 'Communities that don\'t pay',
      body: 'Most online communities are free to join and worthless to be in. The ones that charge give you a Discord invite and disappear. There\'s no accountability, no shared upside, no reason to stay beyond month one.',
    },
  ]

  return (
    <section className="border-b">
      <div className="container mx-auto px-4 py-16 md:py-24">
        <div className="max-w-2xl mb-12">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
            Building an online income is harder than it should be.
          </h2>
          <p className="text-muted-foreground">
            Three problems we kept seeing again and again in the South African freelancer and side-hustler community.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {pains.map((p, i) => (
            <Card key={i} className="border-l-4 border-l-rose-500">
              <CardHeader>
                <CardTitle className="text-xl">{p.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">{p.body}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}

// ============================================================================
// SOLUTION SECTION
// ============================================================================
function SolutionSection() {
  return (
    <section className="border-b bg-muted/30">
      <div className="container mx-auto px-4 py-16 md:py-24">
        <div className="max-w-3xl mx-auto text-center mb-12">
          <Badge variant="outline" className="mb-4">The Idea</Badge>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-6">
            What if your membership paid you back?
          </h2>
        </div>
        <div className="max-w-3xl mx-auto space-y-6 text-lg leading-relaxed">
          <p>
            Freedom Wheels negotiates affiliate partnerships with the tools, retailers, and learning platforms our members already use.
            When members buy through our curated links, we earn a commission. We pass a portion of that commission back to members
            as a monthly revenue share — proportional to their membership tier.
          </p>
          <p>
            The bigger our membership, the more we negotiate. The more we negotiate, the more we earn. The more we earn, the more we share.
            Everyone\'s incentives point the same direction.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mt-12 max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <Users className="h-8 w-8 text-emerald-600 mb-2" />
              <CardTitle className="text-lg">Members subscribe</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Pick a tier, get access to tools, content, and community. Subscription funds operations.</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <TrendingUp className="h-8 w-8 text-emerald-600 mb-2" />
              <CardTitle className="text-lg">We earn affiliate revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">External partners — Amazon, Hostinger, Namecheap, Canva, ConvertKit — pay us commissions when members buy.</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <HeartHandshake className="h-8 w-8 text-emerald-600 mb-2" />
              <CardTitle className="text-lg">We share it back</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Each month, distributable revenue is split across active members, proportional to tier.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
}

// ============================================================================
// HOW IT WORKS
// ============================================================================
function HowItWorks() {
  const steps = [
    {
      num: '01',
      title: 'Choose your membership',
      body: 'Pick Starter, Pro, or Elite based on how much you want to spend on tools and resources each month, and how large a revenue share you want to qualify for.',
    },
    {
      num: '02',
      title: 'Use the curated tools and resources',
      body: 'Get access to member-only buying guides, tool reviews, software discounts, and a private community of South African entrepreneurs. Buy the products you actually need through our affiliate links.',
    },
    {
      num: '03',
      title: 'Receive your monthly revenue share',
      body: 'Each month, we total up the affiliate commissions we\'ve earned, set aside a portion for operations and growth, and distribute the rest to active members proportional to tier. Starter gets 10% of the pool, Pro gets 25%, Elite gets 50% — split across all members in your tier.',
    },
  ]

  return (
    <section id="how-it-works" className="border-b">
      <div className="container mx-auto px-4 py-16 md:py-24">
        <div className="max-w-2xl mb-12">
          <Badge variant="outline" className="mb-3">How It Works</Badge>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Three steps. That\'s it.</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step, i) => (
            <div key={i} className="relative">
              <div className="text-5xl font-bold text-emerald-600/20 mb-4">{step.num}</div>
              <h3 className="text-xl font-semibold mb-3">{step.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{step.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ============================================================================
// PRICING
// ============================================================================
function PricingSection({
  tierDetails,
  selectedTier,
  setSelectedTier,
  checkoutEmail,
  setCheckoutEmail,
  checkoutName,
  setCheckoutName,
  checkoutLoading,
  checkoutError,
  onCheckout,
}: {
  tierDetails: Record<Tier, {
    name: string
    price: number
    tagline: string
    sharePct: number
    features: string[]
    notIncluded: string[]
    cta: string
  }>
  selectedTier: Tier
  setSelectedTier: (t: Tier) => void
  checkoutEmail: string
  setCheckoutEmail: (v: string) => void
  checkoutName: string
  setCheckoutName: (v: string) => void
  checkoutLoading: boolean
  checkoutError: string | null
  onCheckout: () => void
}) {
  return (
    <section id="pricing" className="border-b bg-muted/30">
      <div className="container mx-auto px-4 py-16 md:py-24">
        <div className="max-w-2xl mx-auto text-center mb-12">
          <Badge variant="outline" className="mb-3">Pricing</Badge>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">
            Simple, honest subscriptions.
          </h2>
          <p className="text-muted-foreground">
            Pick a tier. Cancel anytime. 7-day money-back guarantee on your first month.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {(Object.keys(tierDetails) as Tier[]).map(tier => {
            const t = tierDetails[tier]
            const isSelected = selectedTier === tier
            const isPopular = tier === 'PRO'
            return (
              <Card
                key={tier}
                className={`relative cursor-pointer transition-all ${
                  isSelected ? 'ring-2 ring-emerald-600 shadow-lg' : 'hover:shadow-md'
                } ${isPopular ? 'md:-translate-y-2' : ''}`}
                onClick={() => setSelectedTier(tier)}
              >
                {isPopular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-emerald-600">Most Popular</Badge>
                  </div>
                )}
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    {t.name}
                    {isSelected && <Check className="h-5 w-5 text-emerald-600" />}
                  </CardTitle>
                  <CardDescription>{t.tagline}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mb-4">
                    <span className="text-4xl font-bold">R{t.price}</span>
                    <span className="text-muted-foreground">/month</span>
                  </div>
                  <div className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-md border border-emerald-200 dark:border-emerald-800">
                    <div className="text-xs text-emerald-700 dark:text-emerald-400 font-medium mb-1">
                      Revenue share
                    </div>
                    <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">
                      {t.sharePct}% of pool
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Split pro-rata across all {t.name} members
                    </div>
                  </div>
                  <ul className="space-y-2 text-sm">
                    {t.features.map((f, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <Check className="h-4 w-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                        <span>{f}</span>
                      </li>
                    ))}
                    {t.notIncluded.map((f, i) => (
                      <li key={i} className="flex items-start gap-2 text-muted-foreground/60">
                        <X className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button
                    className="w-full"
                    variant={isSelected ? 'default' : 'outline'}
                    onClick={(e) => {
                      e.stopPropagation()
                      setSelectedTier(tier)
                      document.getElementById('checkout-form')?.scrollIntoView({ behavior: 'smooth' })
                    }}
                  >
                    {t.cta}
                  </Button>
                </CardFooter>
              </Card>
            )
          })}
        </div>

        {/* Checkout form */}
        <div id="checkout-form" className="max-w-md mx-auto mt-12 p-6 border rounded-lg bg-background">
          <h3 className="text-lg font-semibold mb-1">Start your {tierDetails[selectedTier].name} membership</h3>
          <p className="text-sm text-muted-foreground mb-4">
            R{tierDetails[selectedTier].price}/month · Cancel anytime · 7-day money-back guarantee
          </p>

          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium mb-1 block">Your name</label>
              <input
                type="text"
                value={checkoutName}
                onChange={(e) => setCheckoutName(e.target.value)}
                placeholder="Jane Mokoena"
                className="w-full px-3 py-2 border rounded-md bg-background text-sm"
                disabled={checkoutLoading}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Email address</label>
              <input
                type="email"
                value={checkoutEmail}
                onChange={(e) => setCheckoutEmail(e.target.value)}
                placeholder="jane@example.com"
                className="w-full px-3 py-2 border rounded-md bg-background text-sm"
                disabled={checkoutLoading}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Use a different email than your PayFast merchant account (if you have one).
              </p>
            </div>

            {checkoutError && (
              <div className="text-sm text-rose-600 bg-rose-50 dark:bg-rose-950/30 p-2 rounded">
                {checkoutError}
              </div>
            )}

            <Button
              className="w-full"
              size="lg"
              onClick={onCheckout}
              disabled={checkoutLoading}
            >
              {checkoutLoading ? 'Redirecting to PayFast…' : `Continue to PayFast — R${tierDetails[selectedTier].price}`}
            </Button>

            <p className="text-xs text-muted-foreground text-center">
              You\'ll be redirected to PayFast\'s secure checkout. We never see your card details.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

// ============================================================================
// TRANSPARENCY SECTION
// ============================================================================
function TransparencySection() {
  return (
    <section id="transparency" className="border-b">
      <div className="container mx-auto px-4 py-16 md:py-24">
        <div className="max-w-3xl mx-auto">
          <Badge variant="outline" className="mb-3">Transparency</Badge>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-6">
            How the revenue share actually works.
          </h2>

          <div className="space-y-6 text-lg leading-relaxed">
            <p>
              We want to be transparent about what the revenue share is, and what it isn\'t.
            </p>

            <Card className="border-emerald-200 dark:border-emerald-800">
              <CardHeader>
                <CardTitle className="text-emerald-700 dark:text-emerald-400 text-lg flex items-center gap-2">
                  <Check className="h-5 w-5" /> What it is
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p>
                  A monthly distribution of <strong>net affiliate commissions</strong> earned by Freedom Wheels
                  through our partnerships with Amazon Associates, Hostinger, Namecheap, Canva, ConvertKit, and others.
                  When members buy products they were already going to buy — through our links — we earn a commission.
                  After platform costs, the remainder is split across active members proportional to tier.
                </p>
              </CardContent>
            </Card>

            <Card className="border-rose-200 dark:border-rose-800">
              <CardHeader>
                <CardTitle className="text-rose-700 dark:text-rose-400 text-lg flex items-center gap-2">
                  <X className="h-5 w-5" /> What it isn\'t
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p>
                  It is <strong>not</strong> a guaranteed return. It is <strong>not</strong> interest on your subscription.
                  It is <strong>not</strong> an investment. The amount distributed each month depends entirely on how much
                  commission we actually earn. In months where affiliate revenue is low, distributions will be low. In months
                  where it\'s high, distributions will be high. We will publish a monthly revenue report so members can see
                  exactly what was earned and how it was distributed.
                </p>
                <p className="mt-3 font-semibold">
                  We will never promise a specific percentage return. Any platform that does is lying to you.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Revenue pool split (every month)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <PoolBar label="Starter members" pct={10} color="bg-sky-500" />
                  <PoolBar label="Pro members" pct={25} color="bg-emerald-500" />
                  <PoolBar label="Elite members" pct={50} color="bg-violet-500" />
                  <PoolBar label="Platform growth reserve" pct={15} color="bg-muted-foreground" />
                </div>
                <p className="text-xs text-muted-foreground mt-4">
                  Within each tier, the share is split pro-rata across all active members in that tier.
                  Example: 100 Pro members share 25% of the pool — each gets 0.25%.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  )
}

function PoolBar({ label, pct, color }: { label: string; pct: number; color: string }) {
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span>{label}</span>
        <span className="font-mono">{pct}%</span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div className={`h-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

// ============================================================================
// AFFILIATE PARTNERS
// ============================================================================
function AffiliatePartners({ partners }: { partners: AffiliatePartner[] }) {
  return (
    <section id="partners" className="border-b bg-muted/30">
      <div className="container mx-auto px-4 py-16 md:py-24">
        <div className="max-w-2xl mb-12">
          <Badge variant="outline" className="mb-3">Affiliate Partners</Badge>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">
            Where the affiliate revenue comes from.
          </h2>
          <p className="text-muted-foreground">
            We partner with established platforms that pay us real commissions when members buy.
            The full partner list is public. Monthly revenue breakdowns are published in our transparency reports.
          </p>
        </div>

        {partners.length === 0 ? (
          <div className="text-sm text-muted-foreground">Loading partners…</div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {partners.map(p => (
              <Card key={p.id}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-lg">{p.name}</CardTitle>
                    <Badge variant="secondary">{p.category}</Badge>
                  </div>
                  <CardDescription>{p.commissionRate}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground leading-relaxed">{p.description}</p>
                </CardContent>
                <CardFooter>
                  <a
                    href={p.url}
                    target="_blank"
                    rel="noopener noreferrer nofollow sponsored"
                    className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
                  >
                    Visit partner <ExternalLink className="h-3 w-3" />
                  </a>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

// ============================================================================
// FAQ
// ============================================================================
function FaqSection() {
  const faqs = [
    {
      q: 'Is this an investment scheme?',
      a: 'No. You\'re paying a monthly subscription for access to tools, content, and community. As a bonus, we share a portion of our external affiliate revenue with members. The revenue share is a perk of membership, not a return on investment. We never promise specific returns.',
    },
    {
      q: 'How much will I earn from the revenue share?',
      a: 'It depends entirely on how much affiliate revenue we collect in a given month, how many members are in your tier, and what tier you\'re in. We publish monthly revenue reports so you can see exactly what was earned and distributed. We do not promise specific amounts.',
    },
    {
      q: 'What if I want to cancel?',
      a: 'Cancel anytime from your dashboard. Your subscription stops at the end of the current billing cycle. No lock-in, no cancellation fees. Your first month is also covered by a 7-day money-back guarantee.',
    },
    {
      q: 'Where does the affiliate revenue come from?',
      a: 'External partners — Amazon Associates, Hostinger, Namecheap, Canva, ConvertKit, and others listed above. We earn commissions when members buy products through our affiliate links. The full partner list and monthly revenue breakdown are public.',
    },
    {
      q: 'Is this a pyramid scheme?',
      a: 'No. A pyramid scheme pays existing members from new member subscriptions. We don\'t. Member subscriptions fund the platform\'s operations and content. Revenue share distributions come from external affiliate commissions — money paid to us by third parties, not by other members.',
    },
    {
      q: 'Can I get a refund?',
      a: 'Yes. We offer a 7-day full refund on your first month\'s subscription, no questions asked. After that, you can cancel anytime and your subscription stops at the end of the billing cycle. Full details in our Refund Policy.',
    },
    {
      q: 'Why is this not an MoR like DodoPayments or Paddle?',
      a: 'We currently process payments directly via PayFast (a South African payment processor). For international users we plan to add a Merchant of Record in the future. Either way, the subscription model itself — external affiliate revenue shared with members — is the same.',
    },
    {
      q: 'Who is behind Freedom Wheels?',
      a: 'Maphalle Malatji, a South African software developer. Reachable directly at maphalle@freedomwheels.online. The codebase is open source. The legal pages are accessible from the footer.',
    },
  ]

  return (
    <section id="faq" className="border-b">
      <div className="container mx-auto px-4 py-16 md:py-24">
        <div className="max-w-2xl mb-12">
          <Badge variant="outline" className="mb-3">FAQ</Badge>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Questions, answered.</h2>
        </div>
        <div className="max-w-3xl">
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, i) => (
              <AccordionItem key={i} value={`item-${i}`}>
                <AccordionTrigger className="text-left">{faq.q}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  )
}

// ============================================================================
// FOUNDER
// ============================================================================
function FounderSection() {
  return (
    <section className="border-b">
      <div className="container mx-auto px-4 py-16 md:py-24">
        <div className="max-w-3xl mx-auto">
          <Badge variant="outline" className="mb-3">About</Badge>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-6">
            Built by a South African entrepreneur, for South African entrepreneurs.
          </h2>
          <div className="space-y-4 text-lg leading-relaxed text-muted-foreground">
            <p>
              Freedom Wheels was founded by <strong className="text-foreground">Maphalle Malatji</strong>,
              a South African software developer who spent years watching local freelancers and side-hustlers
              struggle with the same problems: scattered tools, no leverage on spend, and communities that
              took more than they gave.
            </p>
            <p>
              Freedom Wheels is built on a simple principle: when members spend money on tools they need,
              the platform should share the upside. Not as an investment scheme. Not as a get-rich-quick pitch.
              As a straightforward subscription business with a real revenue model and a fair split with members.
            </p>
          </div>

          <div className="mt-8 grid sm:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <BookOpen className="h-6 w-6 text-emerald-600 mb-2" />
                <div className="font-medium">Open source</div>
                <div className="text-sm text-muted-foreground">Public codebase on GitHub</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <Lock className="h-6 w-6 text-emerald-600 mb-2" />
                <div className="font-medium">Direct contact</div>
                <div className="text-sm text-muted-foreground">maphalle@freedomwheels.online</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <ShieldCheck className="h-6 w-6 text-emerald-600 mb-2" />
                <div className="font-medium">POPIA + FIC compliant</div>
                <div className="text-sm text-muted-foreground">SA-law registered</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  )
}

// ============================================================================
// FINAL CTA
// ============================================================================
function FinalCta({ onLegalClick }: { onLegalClick: (m: 'terms' | 'privacy' | 'refund') => void }) {
  return (
    <section className="bg-emerald-600 text-white">
      <div className="container mx-auto px-4 py-16 md:py-24 text-center">
        <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">
          Stop paying retail. Start earning back.
        </h2>
        <p className="text-emerald-50 text-lg mb-8 max-w-xl mx-auto">
          Memberships start at R99/month. Cancel anytime. 7-day money-back guarantee.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center mb-8">
          <Button size="lg" variant="secondary" asChild>
            <a href="#pricing">Become a Member</a>
          </Button>
          <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10" onClick={() => onLegalClick('terms')}>
            Read the Terms
          </Button>
        </div>
        <div className="flex justify-center">
          <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm inline-block">
            <div className="text-emerald-50 text-sm mb-2 font-medium">Share Freedom Wheels:</div>
            <SocialShareWhite
              url="https://www.freedomwheels.online"
              text="Tools, resources, and revenue share for South African entrepreneurs. Not an investment — a real subscription business."
              page="landing"
            />
          </div>
        </div>
      </div>
    </section>
  )
}

// ============================================================================
// FOOTER
// ============================================================================
function Footer({ onLegalClick }: { onLegalClick: (m: 'terms' | 'privacy' | 'refund') => void }) {
  return (
    <footer className="border-t bg-muted/30 mt-auto">
      <div className="container mx-auto px-4 py-10">
        <div className="grid md:grid-cols-5 gap-8">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-3">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-emerald-600 text-white text-xs font-bold">
                FW
              </div>
              <span className="font-semibold">Freedom Wheels</span>
            </div>
            <p className="text-sm text-muted-foreground max-w-md">
              Tools, resources, and community for South African entrepreneurs.
              A subscription platform with a fair revenue share — not an investment, not a pyramid.
            </p>
          </div>

          <div>
            <div className="text-sm font-semibold mb-3">Legal</div>
            <ul className="space-y-2 text-sm">
              <li>
                <button onClick={() => onLegalClick('terms')} className="text-muted-foreground hover:text-foreground">
                  Terms of Service
                </button>
              </li>
              <li>
                <button onClick={() => onLegalClick('privacy')} className="text-muted-foreground hover:text-foreground">
                  Privacy Policy
                </button>
              </li>
              <li>
                <button onClick={() => onLegalClick('refund')} className="text-muted-foreground hover:text-foreground">
                  Refund Policy
                </button>
              </li>
            </ul>
          </div>

          <div>
            <div className="text-sm font-semibold mb-3">Account</div>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="/member" className="hover:text-foreground">Member Login</a></li>
              <li><a href="/guides" className="hover:text-foreground">Buying Guides</a></li>
              <li><a href="/transparency" className="hover:text-foreground">Transparency Reports</a></li>
              <li><a href="/admin" className="hover:text-foreground">Admin (founder only)</a></li>
            </ul>
          </div>

          <div>
            <div className="text-sm font-semibold mb-3">Contact</div>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>maphalle@freedomwheels.online</li>
              <li>Founder: Maphalle Malatji</li>
              <li>South Africa</li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t flex flex-col md:flex-row gap-3 justify-between text-xs text-muted-foreground">
          <div>© {new Date().getFullYear()} Freedom Wheels. All rights reserved.</div>
          <div>
            Built in South Africa · Powered by PayFast · POPIA + FIC compliant
          </div>
        </div>
      </div>
    </footer>
  )
}

// ============================================================================
// LEGAL MODAL
// ============================================================================
function LegalModal({
  open,
  type,
  onOpenChange,
}: {
  open: boolean
  type: null | 'terms' | 'privacy' | 'refund'
  onOpenChange: (open: boolean) => void
}) {
  const content = type === 'terms' ? TERMS_OF_SERVICE
    : type === 'privacy' ? PRIVACY_POLICY
    : type === 'refund' ? REFUND_POLICY
    : ''

  const title = type === 'terms' ? 'Terms of Service'
    : type === 'privacy' ? 'Privacy Policy'
    : type === 'refund' ? 'Refund Policy'
    : ''

  // Strip the leading H1 from the markdown since the dialog already has a title
  const body = content.replace(/^# .+\n+/, '')

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Last updated: July 24, 2026. This document is binding for all Freedom Wheels members.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="flex-1 -mx-6 px-6">
          <MarkdownRenderer md={body} />
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}

// ============================================================================
// MINIMAL MARKDOWN RENDERER (h2, h3, p, ul, li, table)
// ============================================================================
function MarkdownRenderer({ md }: { md: string }) {
  const lines = md.split('\n')
  const blocks: React.ReactNode[] = []
  let i = 0
  let key = 0

  while (i < lines.length) {
    const line = lines[i]

    // Skip empty
    if (!line || !line.trim()) {
      i++
      continue
    }

    // H2
    if (line.startsWith('## ')) {
      blocks.push(<h2 key={key++} className="text-lg font-semibold mt-5 mb-2">{line.slice(3)}</h2>)
      i++
      continue
    }

    // H3
    if (line.startsWith('### ')) {
      blocks.push(<h3 key={key++} className="text-base font-semibold mt-4 mb-2">{line.slice(4)}</h3>)
      i++
      continue
    }

    // Unordered list
    if (line.startsWith('- ')) {
      const items: string[] = []
      while (i < lines.length && lines[i].startsWith('- ')) {
        items.push(lines[i].slice(2))
        i++
      }
      blocks.push(
        <ul key={key++} className="list-disc pl-5 my-2 space-y-1 text-sm">
          {items.map((it, j) => <li key={j}>{renderInline(it)}</li>)}
        </ul>
      )
      continue
    }

    // Ordered list
    if (/^\d+\.\s/.test(line)) {
      const items: string[] = []
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\.\s/, ''))
        i++
      }
      blocks.push(
        <ol key={key++} className="list-decimal pl-5 my-2 space-y-1 text-sm">
          {items.map((it, j) => <li key={j}>{renderInline(it)}</li>)}
        </ol>
      )
      continue
    }

    // Table (basic — header row + separator + body rows)
    if (line.includes('|') && i + 1 < lines.length && /^\|[\s-:|]+\|$/.test(lines[i + 1].trim())) {
      const header = line.split('|').map(s => s.trim()).filter(Boolean)
      i += 2 // skip header and separator
      const rows: string[][] = []
      while (i < lines.length && lines[i].includes('|')) {
        rows.push(lines[i].split('|').map(s => s.trim()).filter(Boolean))
        i++
      }
      blocks.push(
        <div key={key++} className="my-3 overflow-x-auto">
          <table className="w-full text-sm border">
            <thead>
              <tr className="border-b bg-muted/50">
                {header.map((h, j) => <th key={j} className="text-left p-2 font-medium">{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, j) => (
                <tr key={j} className="border-b">
                  {r.map((c, k) => <td key={k} className="p-2">{renderInline(c)}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )
      continue
    }

    // Paragraph
    blocks.push(<p key={key++} className="text-sm leading-relaxed my-2">{renderInline(line)}</p>)
    i++
  }

  return <div className="prose-sm">{blocks}</div>
}

function renderInline(text: string): React.ReactNode {
  // Bold: **text**
  const parts = text.split(/(\*\*[^*]+\*\*)/g)
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i}>{part.slice(2, -2)}</strong>
    }
    return part
  })
}

// White-themed share component for the FinalCta section (on emerald background)
function SocialShareWhite({ url, text, page }: { url: string; text: string; page: string }) {
  return (
    <div className="[&_button]:border-white/30 [&_button]:text-white [&_button]:hover:bg-white/20">
      <SocialShare url={url} text={text} page={page} variant="inline" />
    </div>
  )
}
