'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, useInView } from 'framer-motion'
import { useFreedomStore } from '@/lib/freedom-store'
import { useAuth } from '@/components/freedom/AuthProvider'
import {
  Zap,
  Shield,
  TrendingUp,
  Globe,
  ArrowRight,
  ChevronRight,
} from 'lucide-react'

const problems = [
  {
    icon: Zap,
    title: 'Income Stops When You Stop',
    desc: 'Trading time for money is a trap. Break the cycle with automated systems that earn while you sleep.',
  },
  {
    icon: Shield,
    title: 'Platform Dependency',
    desc: 'Your business lives on rented land. One algorithm change and your income vanishes overnight.',
  },
  {
    icon: TrendingUp,
    title: 'Scattered Systems',
    desc: 'Dozens of tools, zero integration. Your data is fragmented across platforms you don\'t control.',
  },
  {
    icon: Globe,
    title: 'No Sovereign Strategy',
    desc: 'Without a unified command center, you\'re reacting instead of building an empire.',
  },
]

const steps = [
  {
    num: '01',
    title: 'DEPLOY INCOME ENGINES',
    desc: 'AI-powered automation systems that generate revenue across multiple channels simultaneously.',
  },
  {
    num: '02',
    title: 'INTELLIGENT LEAD CAPTURE',
    desc: 'Self-enriching lead intelligence that scores, nurtures, and converts without manual effort.',
  },
  {
    num: '03',
    title: 'MULTI-ASSET WEALTH ENGINE',
    desc: 'Diversified income across fiat, crypto, and digital assets with real-time optimization.',
  },
]

const stats = [
  { value: 2.4, suffix: 'M+', prefix: '$', label: 'Total Revenue Generated' },
  { value: 8420, suffix: '+', prefix: '', label: 'Active Income Engines' },
  { value: 1200, suffix: '+', prefix: '', label: 'Sovereign Entrepreneurs' },
  { value: 99.9, suffix: '%', prefix: '', label: 'Uptime Guarantee' },
]

const features = [
  {
    emoji: '🤖',
    title: 'AI-Powered Engines',
    desc: 'Autonomous income generation that runs 24/7 without manual intervention.',
  },
  {
    emoji: '🎯',
    title: 'Intelligent Lead Scoring',
    desc: 'AI-driven prospect prioritization so you close hotter leads faster.',
  },
  {
    emoji: '💰',
    title: 'Multi-Asset Wallet',
    desc: 'Fiat + crypto in one place. Manage all your revenue streams seamlessly.',
  },
  {
    emoji: '🌐',
    title: 'Traffic Engine',
    desc: 'AI content creation + multi-platform distribution on autopilot.',
  },
  {
    emoji: '⚡',
    title: 'Automation Hub',
    desc: 'Chain engines into compound systems that multiply your output.',
  },
  {
    emoji: '🔐',
    title: 'Sovereign Infrastructure',
    desc: 'Your data, your rules, no gatekeepers. Full ownership, always.',
  },
]

const testimonials = [
  {
    quote: 'Freedom Wheels replaced my entire tech stack. Three engines now generate $8K/month while I sleep.',
    name: 'Sarah Chen',
    role: 'Digital Strategist',
  },
  {
    quote: 'The AI lead scoring alone paid for my subscription in the first week. Hot leads convert 4x better.',
    name: 'David Kim',
    role: 'Enterprise Consultant',
  },
  {
    quote: 'Sovereign infrastructure means nobody can deplatform my income. That\'s worth everything.',
    name: 'Amara Osei',
    role: 'Founder & CEO',
  },
]

function AnimatedCounter({
  value,
  prefix,
  suffix,
  duration = 2,
}: {
  value: number
  prefix: string
  suffix: string
  duration?: number
}) {
  const ref = useRef<HTMLSpanElement>(null)
  const isInView = useInView(ref, { once: true })
  const [display, setDisplay] = useState('0')

  useEffect(() => {
    if (!isInView) return

    const startTime = performance.now()
    const isDecimal = value % 1 !== 0

    const animate = (now: number) => {
      const elapsed = (now - startTime) / 1000
      const progress = Math.min(elapsed / duration, 1)
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      const current = eased * value

      if (isDecimal) {
        setDisplay(current.toFixed(1))
      } else {
        setDisplay(Math.floor(current).toLocaleString())
      }

      if (progress < 1) {
        requestAnimationFrame(animate)
      }
    }

    requestAnimationFrame(animate)
  }, [isInView, value, duration])

  return (
    <span ref={ref} className="tabular-nums">
      {prefix}
      {display}
      {suffix}
    </span>
  )
}

export default function LandingView() {
  const setCurrentView = useFreedomStore((s) => s.setCurrentView)
  const { isAuthenticated, mounted } = useAuth()

  const handleEnterEcosystem = () => {
    if (isAuthenticated) {
      setCurrentView('dashboard')
    } else {
      setCurrentView('login')
    }
  }

  // Use a stable value during SSR to prevent hydration mismatch
  // After mounting, use the real auth state
  const authenticated = mounted ? isAuthenticated : false

  return (
    <div className="min-h-screen bg-fw-bg text-fw-text">
      {/* Hero */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-4 overflow-hidden">
        {/* Background grid effect */}
        <div className="absolute inset-0 opacity-10">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                'linear-gradient(rgba(0,242,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,242,255,0.1) 1px, transparent 1px)',
              backgroundSize: '60px 60px',
            }}
          />
        </div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-fw-accent/5 blur-[120px]" />

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative z-10 text-center max-w-4xl mx-auto"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 mb-8 rounded-full border border-fw-accent/30 bg-fw-accent/5 text-fw-accent text-xs font-mono tracking-widest uppercase"
          >
            <span className="w-2 h-2 rounded-full bg-fw-accent animate-pulse" />
            Sovereign Income Infrastructure
          </motion.div>

          <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold tracking-tighter leading-[0.95] mb-6">
            BUILD INCOME THAT
            <br />
            <span className="text-fw-accent fw-text-glow">WORKS WITHOUT YOU</span>
          </h1>

          <p className="text-fw-dim text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
            The AI-powered ecosystem that deploys autonomous income engines,
            captures intelligent leads, and builds multi-asset wealth — all on
            your sovereign infrastructure.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={handleEnterEcosystem}
              className="group flex items-center gap-2 px-8 py-4 bg-fw-accent text-fw-bg font-bold text-sm tracking-widest uppercase rounded-lg fw-glow-strong hover:scale-105 transition-transform"
            >
              {authenticated ? 'Launch Your First Income Engine' : 'Sign In to Get Started'}
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={handleEnterEcosystem}
              className="flex items-center gap-2 px-8 py-4 border border-fw-border text-fw-text font-bold text-sm tracking-widest uppercase rounded-lg hover:border-fw-accent/50 transition-colors"
            >
              Command Center
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-fw-dim"
        >
          <span className="text-xs tracking-widest uppercase">Scroll</span>
          <div className="w-px h-8 bg-gradient-to-b from-fw-accent/50 to-transparent" />
        </motion.div>
      </section>

      {/* Problem Section */}
      <section className="py-24 px-4 bg-fw-surface">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-5xl font-bold tracking-tighter mb-4">
              THE <span className="text-fw-red">PROBLEM</span> IS CLEAR
            </h2>
            <p className="text-fw-dim text-lg max-w-2xl mx-auto">
              The old playbook is broken. Here&apos;s why most never achieve financial sovereignty.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {problems.map((p, i) => (
              <motion.div
                key={p.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="fw-card p-6 hover:border-fw-red/30 transition-colors"
              >
                <p.icon className="w-8 h-8 text-fw-red mb-4" />
                <h3 className="text-sm font-bold tracking-widest uppercase mb-2">
                  {p.title}
                </h3>
                <p className="text-fw-dim text-sm leading-relaxed">{p.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Solution Section */}
      <section className="py-24 px-4 bg-fw-bg">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-5xl font-bold tracking-tighter mb-4">
              THE <span className="text-fw-accent fw-text-glow">SOLUTION</span>
            </h2>
            <p className="text-fw-dim text-lg max-w-2xl mx-auto">
              Three steps to sovereign income. No gatekeepers. No permission required.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((s, i) => (
              <motion.div
                key={s.num}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="relative fw-card p-8 hover:border-fw-accent/30 transition-colors group"
              >
                <span className="text-5xl font-bold text-fw-accent/20 group-hover:text-fw-accent/40 transition-colors font-mono">
                  {s.num}
                </span>
                <h3 className="text-lg font-bold tracking-widest uppercase mt-4 mb-3">
                  {s.title}
                </h3>
                <p className="text-fw-dim text-sm leading-relaxed">{s.desc}</p>
                {i < 2 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 text-fw-accent/30">
                    <ArrowRight className="w-8 h-8" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof / Stats Section */}
      <section className="py-24 px-4 bg-fw-surface">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-5xl font-bold tracking-tighter mb-4">
              BUILT FOR <span className="text-fw-green">SCALE</span>
            </h2>
            <p className="text-fw-dim text-lg max-w-2xl mx-auto">
              Real numbers from real entrepreneurs running sovereign income systems.
            </p>
          </motion.div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="fw-card p-6 text-center hover:border-fw-green/30 transition-colors"
              >
                <div className="text-3xl md:text-4xl font-bold font-mono text-fw-green fw-text-glow mb-2">
                  <AnimatedCounter
                    value={stat.value}
                    prefix={stat.prefix}
                    suffix={stat.suffix}
                  />
                </div>
                <p className="text-fw-dim text-xs tracking-widest uppercase">
                  {stat.label}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid Section */}
      <section className="py-24 px-4 bg-fw-bg">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-5xl font-bold tracking-tighter mb-4">
              ECOSYSTEM <span className="text-fw-purple">FEATURES</span>
            </h2>
            <p className="text-fw-dim text-lg max-w-2xl mx-auto">
              Every tool you need to build, automate, and scale sovereign income — in one unified platform.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="fw-card p-6 hover:border-fw-purple/30 transition-colors group"
              >
                <div className="text-3xl mb-4">{f.emoji}</div>
                <h3 className="text-sm font-bold tracking-widest uppercase mb-2 group-hover:text-fw-purple transition-colors">
                  {f.title}
                </h3>
                <p className="text-fw-dim text-sm leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonial Section */}
      <section className="py-24 px-4 bg-fw-surface">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-5xl font-bold tracking-tighter mb-4">
              WHAT SOVEREIGN <span className="text-fw-gold">BUILDERS</span> SAY
            </h2>
            <p className="text-fw-dim text-lg max-w-2xl mx-auto">
              Entrepreneurs who stopped asking permission and started building empires.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="fw-card p-6 hover:border-fw-gold/30 transition-colors flex flex-col"
              >
                <div className="text-fw-gold text-2xl mb-4">&ldquo;</div>
                <p className="text-fw-text text-sm leading-relaxed flex-1 mb-6">
                  {t.quote}
                </p>
                <div className="border-t border-fw-border pt-4">
                  <p className="text-sm font-bold tracking-widest uppercase">
                    {t.name}
                  </p>
                  <p className="text-fw-dim text-xs tracking-widest uppercase mt-1">
                    {t.role}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4 bg-fw-surface relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-fw-gold/5 blur-[100px]" />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative z-10 text-center max-w-3xl mx-auto"
        >
          <h2 className="text-3xl md:text-5xl font-bold tracking-tighter mb-6">
            YOUR SOVEREIGN{' '}
            <span className="text-fw-gold fw-text-glow-gold">FUTURE</span>{' '}
            STARTS NOW
          </h2>
          <p className="text-fw-dim text-lg mb-10 max-w-xl mx-auto">
            Join thousands of entrepreneurs who have already deployed their
            Freedom Wheels income engines.
          </p>
          <button
            onClick={handleEnterEcosystem}
            className="group flex items-center gap-2 px-10 py-5 bg-fw-gold text-fw-bg font-bold text-sm tracking-widest uppercase rounded-lg fw-glow-gold hover:scale-105 transition-transform mx-auto"
          >
            {authenticated ? 'Enter the Ecosystem' : 'Join the Ecosystem'}
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 bg-fw-bg border-t border-fw-border">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-fw-dim text-xs tracking-widest uppercase">
          <span>Freedom Wheels™ Ecosystem v2.0</span>
          <span>Sovereign Infrastructure • No Gatekeepers • Infinite Scale</span>
        </div>
      </footer>
    </div>
  )
}
