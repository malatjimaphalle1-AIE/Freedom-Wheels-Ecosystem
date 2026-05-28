'use client'

import { motion } from 'framer-motion'
import { useFreedomStore } from '@/lib/freedom-store'
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

export default function LandingView() {
  const setCurrentView = useFreedomStore((s) => s.setCurrentView)

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
              onClick={() => setCurrentView('dashboard')}
              className="group flex items-center gap-2 px-8 py-4 bg-fw-accent text-fw-bg font-bold text-sm tracking-widest uppercase rounded-lg fw-glow-strong hover:scale-105 transition-transform"
            >
              Launch Your First Income Engine
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={() => setCurrentView('dashboard')}
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
            onClick={() => setCurrentView('dashboard')}
            className="group flex items-center gap-2 px-10 py-5 bg-fw-gold text-fw-bg font-bold text-sm tracking-widest uppercase rounded-lg fw-glow-gold hover:scale-105 transition-transform mx-auto"
          >
            Enter the Ecosystem
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
