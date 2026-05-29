'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Play,
  Pause,
  Square,
  RotateCw,
  Activity,
  Zap,
  TrendingUp,
  DollarSign,
  Clock,
  ArrowRight,
  Wifi,
  WifiOff,
  Loader2,
  Shield,
  Brain,
  Users,
  Globe,
  Store,
  Wallet,
  Share2,
  Cpu,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react'
import { useState, useEffect, useCallback, useRef } from 'react'
import { io, Socket } from 'socket.io-client'

// ─── Types matching the WebSocket service ──────────────────────────────
interface EngineMetric {
  id: string
  name: string
  status: 'ACTIVE' | 'PAUSED' | 'STARTING' | 'STOPPED'
  type: string
  color: string
  icon: string
  x: number
  y: number
  metrics: {
    throughput: number
    revenue: number
    health: number
    latency: number
    uptime: number
    connections: number
  }
}

interface EngineInteraction {
  from: string
  to: string
  label: string
  dataFlow: number
  lastEvent: string
  color: string
}

interface LiveEvent {
  id: string
  timestamp: number
  source: string
  target: string
  type: 'revenue' | 'lead' | 'referral' | 'traffic' | 'ai' | 'purchase' | 'system'
  message: string
  value?: number
}

// ─── Fallback data when WebSocket is not available ─────────────────────
const fallbackEngines: EngineMetric[] = [
  { id: 'content-syndicator', name: 'AI Content Syndicator', status: 'ACTIVE', type: 'content', color: '#00f2ff', icon: '📝', x: 20, y: 25, metrics: { throughput: 142, revenue: 4820.5, health: 98, latency: 45, uptime: 720, connections: 3 } },
  { id: 'lead-magnet', name: 'Lead Magnet Funnel', status: 'ACTIVE', type: 'leads', color: '#10b981', icon: '🧲', x: 50, y: 15, metrics: { throughput: 89, revenue: 3150.0, health: 95, latency: 120, uptime: 648, connections: 4 } },
  { id: 'crypto-arbitrage', name: 'Crypto Arbitrage Bot', status: 'PAUSED', type: 'trading', color: '#f59e0b', icon: '⚡', x: 80, y: 25, metrics: { throughput: 0, revenue: 1280.75, health: 72, latency: 8, uptime: 312, connections: 2 } },
  { id: 'traffic-engine', name: 'Traffic Engine', status: 'ACTIVE', type: 'traffic', color: '#a855f7', icon: '🌐', x: 20, y: 55, metrics: { throughput: 234, revenue: 2150.0, health: 91, latency: 67, uptime: 540, connections: 3 } },
  { id: 'wallet-engine', name: 'Wallet Engine', status: 'ACTIVE', type: 'finance', color: '#f59e0b', icon: '💰', x: 50, y: 50, metrics: { throughput: 56, revenue: 24580.0, health: 99, latency: 23, uptime: 888, connections: 6 } },
  { id: 'marketplace-engine', name: 'Marketplace Engine', status: 'ACTIVE', type: 'commerce', color: '#00f2ff', icon: '🏪', x: 80, y: 55, metrics: { throughput: 78, revenue: 1890.0, health: 94, latency: 89, uptime: 432, connections: 3 } },
  { id: 'ai-assistant', name: 'AI Assistant', status: 'ACTIVE', type: 'ai', color: '#10b981', icon: '🤖', x: 35, y: 80, metrics: { throughput: 312, revenue: 960.0, health: 97, latency: 340, uptime: 696, connections: 5 } },
  { id: 'referral-engine', name: 'Referral Engine', status: 'ACTIVE', type: 'growth', color: '#a855f7', icon: '🔗', x: 65, y: 80, metrics: { throughput: 34, revenue: 4320.0, health: 88, latency: 156, uptime: 504, connections: 3 } },
]

const fallbackInteractions: EngineInteraction[] = [
  { from: 'content-syndicator', to: 'lead-magnet', label: 'Content → Leads', dataFlow: 45, lastEvent: 'Blog post generated 12 leads', color: '#00f2ff' },
  { from: 'traffic-engine', to: 'lead-magnet', label: 'Traffic → Leads', dataFlow: 89, lastEvent: '230 visitors converted to leads', color: '#a855f7' },
  { from: 'lead-magnet', to: 'wallet-engine', label: 'Leads → Revenue', dataFlow: 23, lastEvent: 'Lead converted: $480 deposit', color: '#10b981' },
  { from: 'wallet-engine', to: 'marketplace-engine', label: 'Funds → Purchases', dataFlow: 12, lastEvent: 'Marketplace purchase: $149', color: '#f59e0b' },
  { from: 'marketplace-engine', to: 'ai-assistant', label: 'Products → AI', dataFlow: 8, lastEvent: 'AI optimizing product descriptions', color: '#00f2ff' },
  { from: 'ai-assistant', to: 'traffic-engine', label: 'AI → Strategy', dataFlow: 34, lastEvent: 'New content strategy deployed', color: '#10b981' },
  { from: 'ai-assistant', to: 'content-syndicator', label: 'AI → Content', dataFlow: 56, lastEvent: 'AI generated 3 articles', color: '#10b981' },
  { from: 'referral-engine', to: 'wallet-engine', label: 'Referrals → Rewards', dataFlow: 7, lastEvent: 'Referral bonus: $200', color: '#a855f7' },
  { from: 'crypto-arbitrage', to: 'wallet-engine', label: 'Trades → Profit', dataFlow: 5, lastEvent: 'Arbitrage profit: $45.20', color: '#f59e0b' },
  { from: 'traffic-engine', to: 'content-syndicator', label: 'Traffic → Content', dataFlow: 67, lastEvent: 'Content amplified to 4 platforms', color: '#a855f7' },
  { from: 'marketplace-engine', to: 'referral-engine', label: 'Purchase → Referral', dataFlow: 4, lastEvent: 'Post-purchase referral prompt sent', color: '#00f2ff' },
  { from: 'referral-engine', to: 'lead-magnet', label: 'Referrals → Leads', dataFlow: 15, lastEvent: 'Referred user became lead', color: '#a855f7' },
]

// ─── Helper: Simulate metric fluctuation for fallback mode ─────────────
function fluctuateFallback() {
  for (const engine of fallbackEngines) {
    if (engine.status !== 'ACTIVE') continue
    engine.metrics.throughput = Math.max(1, engine.metrics.throughput + Math.floor(Math.random() * 20) - 10)
    engine.metrics.revenue += Math.random() * 5
    engine.metrics.health = Math.min(100, Math.max(60, engine.metrics.health + (Math.random() * 4 - 2)))
    engine.metrics.latency = Math.max(5, engine.metrics.latency + Math.floor(Math.random() * 20) - 10)
  }
  for (const interaction of fallbackInteractions) {
    interaction.dataFlow = Math.max(1, interaction.dataFlow + Math.floor(Math.random() * 6) - 3)
  }
}

const fallbackEventMessages = [
  { source: 'content-syndicator', target: 'lead-magnet', type: 'lead' as const, message: 'Blog post generated 18 leads', value: 18 },
  { source: 'traffic-engine', target: 'lead-magnet', type: 'traffic' as const, message: '145 visitors from LinkedIn', value: 145 },
  { source: 'lead-magnet', target: 'wallet-engine', type: 'revenue' as const, message: 'Lead converted: $320 deposit', value: 320 },
  { source: 'wallet-engine', target: 'marketplace-engine', type: 'purchase' as const, message: 'Marketplace purchase: $99', value: 99 },
  { source: 'ai-assistant', target: 'traffic-engine', type: 'ai' as const, message: 'AI optimized 7 keywords', value: 7 },
  { source: 'referral-engine', target: 'wallet-engine', type: 'referral' as const, message: 'Referral bonus: $200', value: 200 },
  { source: 'ai-assistant', target: 'content-syndicator', type: 'ai' as const, message: 'AI generated 4 articles', value: 4 },
  { source: 'crypto-arbitrage', target: 'wallet-engine', type: 'revenue' as const, message: 'Arbitrage profit: $38.50', value: 38 },
  { source: 'marketplace-engine', target: 'referral-engine', type: 'referral' as const, message: '3 users shared referral codes', value: 3 },
  { source: 'traffic-engine', target: 'content-syndicator', type: 'traffic' as const, message: 'Content amplified to 5 platforms', value: 5 },
]

let fallbackEventCounter = 0

function generateFallbackEvent(): LiveEvent {
  const template = fallbackEventMessages[Math.floor(Math.random() * fallbackEventMessages.length)]
  return {
    id: `evt_fallback_${++fallbackEventCounter}_${Date.now()}`,
    timestamp: Date.now(),
    source: template.source,
    target: template.target,
    type: template.type,
    message: template.message,
    value: template.value,
  }
}

// ─── Event type config ─────────────────────────────────────────────────
const eventTypeConfig: Record<string, { color: string; icon: typeof Activity; label: string }> = {
  revenue: { color: 'text-fw-green', icon: DollarSign, label: 'Revenue' },
  lead: { color: 'text-fw-accent', icon: Users, label: 'Lead' },
  referral: { color: 'text-fw-purple', icon: Share2, label: 'Referral' },
  traffic: { color: 'text-fw-gold', icon: Globe, label: 'Traffic' },
  ai: { color: 'text-fw-green', icon: Brain, label: 'AI' },
  purchase: { color: 'text-fw-gold', icon: Store, label: 'Purchase' },
  system: { color: 'text-fw-dim', icon: Shield, label: 'System' },
}

const engineTypeIcons: Record<string, typeof Cpu> = {
  content: Cpu,
  leads: Users,
  trading: Zap,
  traffic: Globe,
  finance: Wallet,
  commerce: Store,
  ai: Brain,
  growth: Share2,
}

// ─── Status badge config ───────────────────────────────────────────────
const statusConfig: Record<string, { color: string; bg: string; border: string; label: string }> = {
  ACTIVE: { color: 'text-fw-green', bg: 'bg-fw-green/10', border: 'border-fw-green/30', label: 'ACTIVE' },
  PAUSED: { color: 'text-fw-gold', bg: 'bg-fw-gold/10', border: 'border-fw-gold/30', label: 'PAUSED' },
  STARTING: { color: 'text-fw-accent', bg: 'bg-fw-accent/10', border: 'border-fw-accent/30', label: 'STARTING' },
  STOPPED: { color: 'text-fw-red', bg: 'bg-fw-red/10', border: 'border-fw-red/30', label: 'STOPPED' },
}

export default function LiveEnginesView() {
  const [engines, setEngines] = useState<EngineMetric[]>(fallbackEngines)
  const [interactions, setInteractions] = useState<EngineInteraction[]>(fallbackInteractions)
  const [events, setEvents] = useState<LiveEvent[]>([])
  const [connected, setConnected] = useState(false)
  const [selectedEngine, setSelectedEngine] = useState<string | null>(null)
  const [pulseMap, setPulseMap] = useState<Record<string, number>>({})
  const socketRef = useRef<Socket | null>(null)
  const [totalRevenue, setTotalRevenue] = useState(0)
  const [activeCount, setActiveCount] = useState(0)

  // ─── WebSocket Connection ──────────────────────────────────────────
  useEffect(() => {
    let mounted = true

    try {
      const socket = io('/?XTransformPort=3003', {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 2000,
        timeout: 5000,
      })
      socketRef.current = socket

      socket.on('connect', () => {
        if (mounted) setConnected(true)
      })

      socket.on('disconnect', () => {
        if (mounted) setConnected(false)
      })

      socket.on('engines:state', (data: { engines: EngineMetric[]; interactions: EngineInteraction[] }) => {
        if (mounted) {
          setEngines(data.engines)
          setInteractions(data.interactions)
        }
      })

      socket.on('engines:metrics', (data: { engines: EngineMetric[]; interactions: EngineInteraction[] }) => {
        if (mounted) {
          setEngines(data.engines)
          setInteractions(data.interactions)
        }
      })

      socket.on('events:history', (data: LiveEvent[]) => {
        if (mounted) setEvents(data.slice(0, 50))
      })

      socket.on('events:new', (event: LiveEvent) => {
        if (mounted) {
          setEvents((prev) => [event, ...prev].slice(0, 50))
          // Pulse the interaction line
          setPulseMap((prev) => ({ ...prev, [`${event.source}->${event.target}`]: Date.now() }))
        }
      })

      socket.on('engine:status', (data: { engineId: string; status: string }) => {
        if (mounted) {
          setEngines((prev) =>
            prev.map((e) => (e.id === data.engineId ? { ...e, status: data.status as EngineMetric['status'] } : e))
          )
        }
      })

      socket.on('connect_error', () => {
        if (mounted) setConnected(false)
      })
    } catch {
      // Fallback mode - use simulated data
    }

    return () => {
      mounted = false
      socketRef.current?.disconnect()
    }
  }, [])

  // ─── Fallback simulation when not connected to WebSocket ───────────
  useEffect(() => {
    if (connected) return

    const interval = setInterval(() => {
      fluctuateFallback()
      setEngines([...fallbackEngines])
      setInteractions([...fallbackInteractions])

      // Generate 1-2 events
      const count = Math.floor(Math.random() * 2) + 1
      const newEvents: LiveEvent[] = []
      for (let i = 0; i < count; i++) {
        const event = generateFallbackEvent()
        newEvents.push(event)
        setPulseMap((prev) => ({ ...prev, [`${event.source}->${event.target}`]: Date.now() }))
      }
      setEvents((prev) => [...newEvents, ...prev].slice(0, 50))
    }, 3000)

    return () => clearInterval(interval)
  }, [connected])

  // ─── Compute aggregate stats ───────────────────────────────────────
  useEffect(() => {
    const total = engines.reduce((sum, e) => sum + e.metrics.revenue, 0)
    const active = engines.filter((e) => e.status === 'ACTIVE').length
    setTotalRevenue(total)
    setActiveCount(active)
  }, [engines])

  // ─── Clear old pulses ──────────────────────────────────────────────
  useEffect(() => {
    const interval = setInterval(() => {
      setPulseMap((prev) => {
        const now = Date.now()
        const cleaned: Record<string, number> = {}
        for (const [key, time] of Object.entries(prev)) {
          if (now - time < 5000) cleaned[key] = time
        }
        return cleaned
      })
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  // ─── Engine Control ────────────────────────────────────────────────
  const handleEngineControl = useCallback((engineId: string, action: 'start' | 'stop' | 'pause' | 'restart') => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('engine:control', { engineId, action })
    } else {
      // Fallback: update locally
      setEngines((prev) =>
        prev.map((e) => {
          if (e.id !== engineId) return e
          let newStatus = e.status
          switch (action) {
            case 'start': newStatus = 'ACTIVE'; break
            case 'stop': newStatus = 'STOPPED'; break
            case 'pause': newStatus = 'PAUSED'; break
            case 'restart': newStatus = 'STARTING'; break
          }
          return { ...e, status: newStatus as EngineMetric['status'] }
        })
      )
    }
  }, [])

  // ─── SVG Interaction Map Helpers ───────────────────────────────────
  const getEnginePos = useCallback((id: string) => {
    const engine = engines.find((e) => e.id === id)
    return engine ? { x: engine.x, y: engine.y } : { x: 50, y: 50 }
  }, [engines])

  const isPulsing = useCallback((from: string, to: string) => {
    const key = `${from}->${to}`
    const time = pulseMap[key]
    if (!time) return false
    return Date.now() - time < 3000
  }, [pulseMap])

  const selectedEngineData = engines.find((e) => e.id === selectedEngine)
  const relatedInteractions = selectedEngine
    ? interactions.filter((i) => i.from === selectedEngine || i.to === selectedEngine)
    : []

  return (
    <div className="p-4 md:p-6 space-y-6 fw-scrollbar overflow-y-auto h-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold tracking-widest uppercase">
              Live Active Engines
            </h2>
            <Badge className={`text-[9px] ${connected ? 'bg-fw-green/10 text-fw-green border border-fw-green/30' : 'bg-fw-gold/10 text-fw-gold border border-fw-gold/30'}`}>
              {connected ? (
                <><Wifi className="w-3 h-3 mr-1" /> LIVE</>
              ) : (
                <><WifiOff className="w-3 h-3 mr-1" /> SIMULATED</>
              )}
            </Badge>
          </div>
          <p className="text-fw-dim text-sm font-mono mt-1">
            Real-time cross-engine interaction & telemetry
          </p>
        </div>

        {/* Aggregate Stats */}
        <div className="flex items-center gap-4">
          <div className="text-center px-4 py-2 rounded-lg border border-fw-border bg-fw-surface">
            <p className="text-[9px] font-mono tracking-widest uppercase text-fw-dim">Total Revenue</p>
            <p className="text-lg font-bold font-mono text-fw-green">${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</p>
          </div>
          <div className="text-center px-4 py-2 rounded-lg border border-fw-border bg-fw-surface">
            <p className="text-[9px] font-mono tracking-widest uppercase text-fw-dim">Active</p>
            <p className="text-lg font-bold font-mono text-fw-accent">{activeCount}/{engines.length}</p>
          </div>
          <div className="text-center px-4 py-2 rounded-lg border border-fw-border bg-fw-surface">
            <p className="text-[9px] font-mono tracking-widest uppercase text-fw-dim">Data Flow</p>
            <p className="text-lg font-bold font-mono text-fw-gold">{interactions.reduce((s, i) => s + i.dataFlow, 0)} u/s</p>
          </div>
        </div>
      </div>

      {/* ── SVG Engine Interaction Map ──────────────────────────────── */}
      <Card className="bg-fw-surface border-fw-border relative overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-mono tracking-widest uppercase text-fw-dim flex items-center gap-2">
            <Activity className="w-4 h-4 text-fw-accent" />
            Cross-Engine Interaction Map
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative w-full" style={{ paddingBottom: '50%' }}>
            <svg
              viewBox="0 0 100 100"
              className="absolute inset-0 w-full h-full"
              preserveAspectRatio="xMidYMid meet"
            >
              {/* Background grid */}
              <defs>
                <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                  <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#161b22" strokeWidth="0.2" />
                </pattern>
                {/* Glow filter */}
                <filter id="glow">
                  <feGaussianBlur stdDeviation="0.5" result="coloredBlur" />
                  <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
                <filter id="glow-strong">
                  <feGaussianBlur stdDeviation="1" result="coloredBlur" />
                  <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
                {/* Pulse animation marker */}
                <marker id="arrow-active" markerWidth="4" markerHeight="4" refX="3" refY="2" orient="auto">
                  <path d="M0,0 L4,2 L0,4" fill="#00f2ff" />
                </marker>
              </defs>
              <rect width="100" height="100" fill="url(#grid)" />

              {/* Interaction Lines */}
              {interactions.map((interaction, idx) => {
                const from = getEnginePos(interaction.from)
                const to = getEnginePos(interaction.to)
                const pulsing = isPulsing(interaction.from, interaction.to)
                const midX = (from.x + to.x) / 2
                const midY = (from.y + to.y) / 2 - 3
                const opacity = pulsing ? 0.9 : 0.25
                const strokeWidth = pulsing ? 0.4 : 0.15

                return (
                  <g key={`interaction-${idx}`}>
                    {/* Line */}
                    <path
                      d={`M ${from.x} ${from.y} Q ${midX} ${midY} ${to.x} ${to.y}`}
                      fill="none"
                      stroke={interaction.color}
                      strokeWidth={strokeWidth}
                      opacity={opacity}
                      filter={pulsing ? 'url(#glow)' : undefined}
                    />
                    {/* Animated data particle when pulsing */}
                    {pulsing && (
                      <circle r="0.6" fill={interaction.color} filter="url(#glow-strong)">
                        <animateMotion
                          dur="1.5s"
                          repeatCount="1"
                          path={`M ${from.x} ${from.y} Q ${midX} ${midY} ${to.x} ${to.y}`}
                        />
                      </circle>
                    )}
                    {/* Data flow label at midpoint */}
                    <text
                      x={midX}
                      y={midY - 1.5}
                      textAnchor="middle"
                      fill={pulsing ? interaction.color : '#4a5568'}
                      fontSize="1.8"
                      fontFamily="monospace"
                      opacity={pulsing ? 1 : 0.5}
                    >
                      {interaction.dataFlow} u/s
                    </text>
                  </g>
                )
              })}

              {/* Engine Nodes */}
              {engines.map((engine) => {
                const isSelected = selectedEngine === engine.id
                const config = statusConfig[engine.status] || statusConfig.ACTIVE
                const nodeRadius = isSelected ? 5.5 : engine.metrics.connections > 4 ? 5 : 4
                const healthColor = engine.metrics.health >= 90 ? '#10b981' : engine.metrics.health >= 70 ? '#f59e0b' : '#ef4444'

                return (
                  <g
                    key={engine.id}
                    onClick={() => setSelectedEngine(isSelected ? null : engine.id)}
                    className="cursor-pointer"
                  >
                    {/* Selection ring */}
                    {isSelected && (
                      <circle
                        cx={engine.x}
                        cy={engine.y}
                        r={nodeRadius + 2}
                        fill="none"
                        stroke={engine.color}
                        strokeWidth="0.3"
                        opacity="0.6"
                      >
                        <animate
                          attributeName="r"
                          values={`${nodeRadius + 1.5};${nodeRadius + 3};${nodeRadius + 1.5}`}
                          dur="2s"
                          repeatCount="indefinite"
                        />
                        <animate
                          attributeName="opacity"
                          values="0.6;0.2;0.6"
                          dur="2s"
                          repeatCount="indefinite"
                        />
                      </circle>
                    )}

                    {/* Outer glow for active engines */}
                    {engine.status === 'ACTIVE' && (
                      <circle
                        cx={engine.x}
                        cy={engine.y}
                        r={nodeRadius + 0.5}
                        fill={engine.color}
                        opacity="0.08"
                      />
                    )}

                    {/* Main node circle */}
                    <circle
                      cx={engine.x}
                      cy={engine.y}
                      r={nodeRadius}
                      fill={engine.status === 'ACTIVE' ? engine.color : '#1a1e2e'}
                      stroke={engine.color}
                      strokeWidth="0.3"
                      opacity={engine.status === 'STOPPED' ? 0.4 : 1}
                    />

                    {/* Health indicator arc */}
                    {engine.status !== 'STOPPED' && (
                      <circle
                        cx={engine.x}
                        cy={engine.y}
                        r={nodeRadius + 1}
                        fill="none"
                        stroke={healthColor}
                        strokeWidth="0.4"
                        strokeDasharray={`${(engine.metrics.health / 100) * (2 * Math.PI * (nodeRadius + 1))} ${2 * Math.PI * (nodeRadius + 1)}`}
                        transform={`rotate(-90 ${engine.x} ${engine.y})`}
                        opacity="0.7"
                      />
                    )}

                    {/* Icon */}
                    <text
                      x={engine.x}
                      y={engine.y + 1.2}
                      textAnchor="middle"
                      fontSize="3.5"
                      opacity={engine.status === 'STOPPED' ? 0.3 : 1}
                    >
                      {engine.icon}
                    </text>

                    {/* Engine name label */}
                    <text
                      x={engine.x}
                      y={engine.y + nodeRadius + 3}
                      textAnchor="middle"
                      fill={isSelected ? engine.color : '#94a3b8'}
                      fontSize="2"
                      fontFamily="monospace"
                      fontWeight={isSelected ? 'bold' : 'normal'}
                    >
                      {engine.name.split(' ').slice(-1)[0]}
                    </text>

                    {/* Status indicator dot */}
                    <circle
                      cx={engine.x + nodeRadius - 0.5}
                      cy={engine.y - nodeRadius + 0.5}
                      r="0.8"
                      fill={config.color === 'text-fw-green' ? '#10b981' : config.color === 'text-fw-gold' ? '#f59e0b' : config.color === 'text-fw-accent' ? '#00f2ff' : '#ef4444'}
                    >
                      {engine.status === 'ACTIVE' && (
                        <animate
                          attributeName="opacity"
                          values="1;0.3;1"
                          dur="2s"
                          repeatCount="indefinite"
                        />
                      )}
                    </circle>

                    {/* Throughput label for active */}
                    {engine.status === 'ACTIVE' && (
                      <text
                        x={engine.x}
                        y={engine.y - nodeRadius - 1.5}
                        textAnchor="middle"
                        fill="#4a5568"
                        fontSize="1.5"
                        fontFamily="monospace"
                      >
                        {engine.metrics.throughput} rpm
                      </text>
                    )}
                  </g>
                )
              })}
            </svg>
          </div>
        </CardContent>
      </Card>

      {/* ── Two-Column: Engine Cards + Live Events ──────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Engine Status Cards */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-mono tracking-widest uppercase text-fw-dim">
              Engine Telemetry
            </h3>
            <div className="flex items-center gap-2">
              {connected ? (
                <Badge className="bg-fw-green/10 text-fw-green border border-fw-green/30 text-[9px]">
                  <Wifi className="w-3 h-3 mr-1" /> Real-Time
                </Badge>
              ) : (
                <Badge className="bg-fw-gold/10 text-fw-gold border border-fw-gold/30 text-[9px]">
                  <WifiOff className="w-3 h-3 mr-1" /> Simulated
                </Badge>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {engines.map((engine) => {
              const config = statusConfig[engine.status] || statusConfig.ACTIVE
              const isSelected = selectedEngine === engine.id
              const TypeIcon = engineTypeIcons[engine.type] || Cpu
              const healthPercent = Math.round(engine.metrics.health)

              return (
                <Card
                  key={engine.id}
                  className={`bg-fw-surface border-fw-border transition-all cursor-pointer hover:border-fw-accent/30 ${
                    isSelected ? 'border-fw-accent/50 ring-1 ring-fw-accent/20' : ''
                  }`}
                  onClick={() => setSelectedEngine(isSelected ? null : engine.id)}
                >
                  <CardContent className="p-4 space-y-3">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: `${engine.color}15` }}
                        >
                          <TypeIcon className="w-4 h-4" style={{ color: engine.color }} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold tracking-wider uppercase truncate">
                            {engine.name}
                          </p>
                          <p className="text-[9px] text-fw-dim font-mono">
                            {engine.type.toUpperCase()} ENGINE
                          </p>
                        </div>
                      </div>
                      <Badge
                        variant="outline"
                        className={`text-[9px] ${config.color} ${config.border} flex-shrink-0`}
                      >
                        {engine.status === 'STARTING' && <Loader2 className="w-3 h-3 mr-1 animate-spin" />}
                        {config.label}
                      </Badge>
                    </div>

                    {/* Health Bar */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-mono text-fw-dim tracking-widest uppercase">Health</span>
                        <span className="text-[9px] font-mono" style={{ color: healthPercent >= 90 ? '#10b981' : healthPercent >= 70 ? '#f59e0b' : '#ef4444' }}>
                          {healthPercent}%
                        </span>
                      </div>
                      <Progress
                        value={healthPercent}
                        className="h-1.5"
                      />
                    </div>

                    {/* Metrics Grid */}
                    <div className="grid grid-cols-3 gap-2">
                      <div className="p-2 rounded border border-fw-border bg-fw-bg text-center">
                        <p className="text-[8px] font-mono text-fw-dim tracking-widest uppercase">RPM</p>
                        <p className="text-xs font-bold font-mono" style={{ color: engine.color }}>
                          {engine.metrics.throughput}
                        </p>
                      </div>
                      <div className="p-2 rounded border border-fw-border bg-fw-bg text-center">
                        <p className="text-[8px] font-mono text-fw-dim tracking-widest uppercase">Revenue</p>
                        <p className="text-xs font-bold font-mono text-fw-green">
                          ${engine.metrics.revenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </p>
                      </div>
                      <div className="p-2 rounded border border-fw-border bg-fw-bg text-center">
                        <p className="text-[8px] font-mono text-fw-dim tracking-widest uppercase">Latency</p>
                        <p className="text-xs font-bold font-mono text-fw-gold">
                          {engine.metrics.latency}ms
                        </p>
                      </div>
                    </div>

                    {/* Controls */}
                    <div className="flex items-center gap-1.5 pt-1 border-t border-fw-border">
                      {engine.status !== 'ACTIVE' && (
                        <Button
                          onClick={(e) => { e.stopPropagation(); handleEngineControl(engine.id, 'start') }}
                          size="sm"
                          variant="ghost"
                          className="h-7 text-[10px] font-mono text-fw-green hover:text-fw-green hover:bg-fw-green/10 px-2"
                        >
                          <Play className="w-3 h-3 mr-1" /> Start
                        </Button>
                      )}
                      {engine.status === 'ACTIVE' && (
                        <Button
                          onClick={(e) => { e.stopPropagation(); handleEngineControl(engine.id, 'pause') }}
                          size="sm"
                          variant="ghost"
                          className="h-7 text-[10px] font-mono text-fw-gold hover:text-fw-gold hover:bg-fw-gold/10 px-2"
                        >
                          <Pause className="w-3 h-3 mr-1" /> Pause
                        </Button>
                      )}
                      {engine.status !== 'STOPPED' && (
                        <Button
                          onClick={(e) => { e.stopPropagation(); handleEngineControl(engine.id, 'stop') }}
                          size="sm"
                          variant="ghost"
                          className="h-7 text-[10px] font-mono text-fw-red hover:text-fw-red hover:bg-fw-red/10 px-2"
                        >
                          <Square className="w-3 h-3 mr-1" /> Stop
                        </Button>
                      )}
                      <Button
                        onClick={(e) => { e.stopPropagation(); handleEngineControl(engine.id, 'restart') }}
                        size="sm"
                        variant="ghost"
                        className="h-7 text-[10px] font-mono text-fw-accent hover:text-fw-accent hover:bg-fw-accent/10 px-2"
                      >
                        <RotateCw className="w-3 h-3 mr-1" /> Restart
                      </Button>
                      <div className="ml-auto flex items-center gap-1">
                        <Clock className="w-3 h-3 text-fw-dim" />
                        <span className="text-[9px] font-mono text-fw-dim">
                          {Math.round(engine.metrics.uptime)}h
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>

        {/* Live Event Feed */}
        <div className="space-y-4">
          <h3 className="text-xs font-mono tracking-widest uppercase text-fw-dim flex items-center gap-2">
            <Activity className="w-4 h-4 text-fw-accent" />
            Live Event Stream
            <div className="w-2 h-2 rounded-full bg-fw-green animate-pulse ml-auto" />
          </h3>

          <Card className="bg-fw-surface border-fw-border">
            <CardContent className="p-0">
              <div className="max-h-[600px] overflow-y-auto fw-scrollbar">
                {events.length === 0 ? (
                  <div className="p-8 text-center">
                    <Activity className="w-8 h-8 text-fw-dim/30 mx-auto mb-3" />
                    <p className="text-sm font-mono text-fw-dim">Waiting for events...</p>
                  </div>
                ) : (
                  <div className="divide-y divide-fw-border">
                    {events.map((event) => {
                      const typeConfig = eventTypeConfig[event.type] || eventTypeConfig.system
                      const TypeIcon = typeConfig.icon
                      const sourceEngine = engines.find((e) => e.id === event.source)
                      const targetEngine = engines.find((e) => e.id === event.target)
                      const timeAgo = Math.round((Date.now() - event.timestamp) / 1000)
                      const timeLabel = timeAgo < 60 ? `${timeAgo}s ago` : `${Math.round(timeAgo / 60)}m ago`

                      return (
                        <div key={event.id} className="p-3 hover:bg-fw-bg/50 transition-colors">
                          <div className="flex items-start gap-2">
                            <div className={`w-6 h-6 rounded flex items-center justify-center flex-shrink-0 ${typeConfig.color}`} style={{ backgroundColor: 'currentColor', opacity: 0.1 }}>
                              <TypeIcon className="w-3 h-3" style={{ color: 'currentColor' }} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1 mb-0.5">
                                <span className="text-[9px] font-mono font-bold tracking-widest uppercase" style={{ color: sourceEngine?.color }}>
                                  {sourceEngine?.name.split(' ').slice(-1)[0] || event.source}
                                </span>
                                <ArrowRight className="w-2.5 h-2.5 text-fw-dim" />
                                <span className="text-[9px] font-mono font-bold tracking-widest uppercase" style={{ color: targetEngine?.color }}>
                                  {targetEngine?.name.split(' ').slice(-1)[0] || event.target}
                                </span>
                              </div>
                              <p className="text-[11px] text-fw-text leading-relaxed">
                                {event.message}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-[8px] font-mono text-fw-dim">{timeLabel}</span>
                                <Badge variant="outline" className={`text-[8px] ${typeConfig.color}`}>
                                  {typeConfig.label}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ── Selected Engine Interaction Detail ──────────────────────── */}
      {selectedEngineData && (
        <Card className="bg-fw-surface border-fw-border">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs font-mono tracking-widest uppercase text-fw-dim flex items-center gap-2">
                <div className="w-3 h-3 rounded" style={{ backgroundColor: selectedEngineData.color }} />
                {selectedEngineData.name} — Interaction Detail
              </CardTitle>
              <Button
                onClick={() => setSelectedEngine(null)}
                variant="ghost"
                size="sm"
                className="text-fw-dim hover:text-fw-text h-6 px-2"
              >
                Close
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Outgoing */}
              <div>
                <h4 className="text-[10px] font-mono tracking-widest uppercase text-fw-dim mb-3 flex items-center gap-1">
                  <ArrowRight className="w-3 h-3 text-fw-green" /> Outgoing Data Flows
                </h4>
                <div className="space-y-2">
                  {relatedInteractions.filter((i) => i.from === selectedEngine).map((interaction, idx) => {
                    const targetEngine = engines.find((e) => e.id === interaction.to)
                    return (
                      <div key={idx} className="flex items-center gap-3 p-2 rounded border border-fw-border bg-fw-bg">
                        <ArrowRight className="w-3 h-3 flex-shrink-0" style={{ color: interaction.color }} />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold tracking-wider" style={{ color: targetEngine?.color }}>
                            → {targetEngine?.name || interaction.to}
                          </p>
                          <p className="text-[9px] text-fw-dim font-mono">{interaction.label}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-xs font-bold font-mono" style={{ color: interaction.color }}>
                            {interaction.dataFlow} u/s
                          </p>
                          <p className="text-[8px] text-fw-dim font-mono truncate max-w-[140px]">{interaction.lastEvent}</p>
                        </div>
                      </div>
                    )
                  })}
                  {relatedInteractions.filter((i) => i.from === selectedEngine).length === 0 && (
                    <p className="text-xs font-mono text-fw-dim p-3 text-center">No outgoing flows</p>
                  )}
                </div>
              </div>

              {/* Incoming */}
              <div>
                <h4 className="text-[10px] font-mono tracking-widest uppercase text-fw-dim mb-3 flex items-center gap-1">
                  <ArrowRight className="w-3 h-3 text-fw-accent rotate-180" /> Incoming Data Flows
                </h4>
                <div className="space-y-2">
                  {relatedInteractions.filter((i) => i.to === selectedEngine).map((interaction, idx) => {
                    const sourceEngine = engines.find((e) => e.id === interaction.from)
                    return (
                      <div key={idx} className="flex items-center gap-3 p-2 rounded border border-fw-border bg-fw-bg">
                        <ArrowRight className="w-3 h-3 flex-shrink-0 rotate-180" style={{ color: interaction.color }} />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold tracking-wider" style={{ color: sourceEngine?.color }}>
                            ← {sourceEngine?.name || interaction.from}
                          </p>
                          <p className="text-[9px] text-fw-dim font-mono">{interaction.label}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-xs font-bold font-mono" style={{ color: interaction.color }}>
                            {interaction.dataFlow} u/s
                          </p>
                          <p className="text-[8px] text-fw-dim font-mono truncate max-w-[140px]">{interaction.lastEvent}</p>
                        </div>
                      </div>
                    )
                  })}
                  {relatedInteractions.filter((i) => i.to === selectedEngine).length === 0 && (
                    <p className="text-xs font-mono text-fw-dim p-3 text-center">No incoming flows</p>
                  )}
                </div>
              </div>
            </div>

            {/* Engine Detail Metrics */}
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div className="p-3 rounded-lg border border-fw-border bg-fw-bg text-center">
                <p className="text-[8px] font-mono tracking-widest uppercase text-fw-dim">Throughput</p>
                <p className="text-sm font-bold font-mono" style={{ color: selectedEngineData.color }}>
                  {selectedEngineData.metrics.throughput} <span className="text-[9px] text-fw-dim">rpm</span>
                </p>
              </div>
              <div className="p-3 rounded-lg border border-fw-border bg-fw-bg text-center">
                <p className="text-[8px] font-mono tracking-widest uppercase text-fw-dim">Revenue</p>
                <p className="text-sm font-bold font-mono text-fw-green">
                  ${selectedEngineData.metrics.revenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </p>
              </div>
              <div className="p-3 rounded-lg border border-fw-border bg-fw-bg text-center">
                <p className="text-[8px] font-mono tracking-widest uppercase text-fw-dim">Health</p>
                <p className="text-sm font-bold font-mono" style={{ color: selectedEngineData.metrics.health >= 90 ? '#10b981' : selectedEngineData.metrics.health >= 70 ? '#f59e0b' : '#ef4444' }}>
                  {Math.round(selectedEngineData.metrics.health)}%
                </p>
              </div>
              <div className="p-3 rounded-lg border border-fw-border bg-fw-bg text-center">
                <p className="text-[8px] font-mono tracking-widest uppercase text-fw-dim">Latency</p>
                <p className="text-sm font-bold font-mono text-fw-gold">
                  {selectedEngineData.metrics.latency}ms
                </p>
              </div>
              <div className="p-3 rounded-lg border border-fw-border bg-fw-bg text-center">
                <p className="text-[8px] font-mono tracking-widest uppercase text-fw-dim">Uptime</p>
                <p className="text-sm font-bold font-mono text-fw-accent">
                  {Math.round(selectedEngineData.metrics.uptime)}h
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Interaction Chain Visualization ──────────────────────────── */}
      <Card className="bg-fw-surface border-fw-border">
        <CardHeader>
          <CardTitle className="text-xs font-mono tracking-widest uppercase text-fw-dim flex items-center gap-2">
            <Zap className="w-4 h-4 text-fw-gold" />
            Interaction Chain — How Engines Power Each Other
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Chain 1: Content → Leads → Revenue */}
            <div className="p-4 rounded-lg border border-fw-border bg-fw-bg space-y-3">
              <h4 className="text-[9px] font-mono tracking-widest uppercase text-fw-accent">Revenue Pipeline</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded bg-[#00f2ff]/10 flex items-center justify-center"><Cpu className="w-3 h-3 text-[#00f2ff]" /></div>
                  <span className="text-[10px] font-mono">Content Engine</span>
                  <ArrowRight className="w-3 h-3 text-fw-dim ml-auto" />
                </div>
                <div className="flex items-center gap-2 pl-4">
                  <div className="w-6 h-6 rounded bg-[#10b981]/10 flex items-center justify-center"><Users className="w-3 h-3 text-[#10b981]" /></div>
                  <span className="text-[10px] font-mono">Lead Magnet</span>
                  <ArrowRight className="w-3 h-3 text-fw-dim ml-auto" />
                </div>
                <div className="flex items-center gap-2 pl-8">
                  <div className="w-6 h-6 rounded bg-[#f59e0b]/10 flex items-center justify-center"><Wallet className="w-3 h-3 text-[#f59e0b]" /></div>
                  <span className="text-[10px] font-mono text-fw-green font-bold">$$ Revenue</span>
                </div>
              </div>
            </div>

            {/* Chain 2: AI → Traffic → Content */}
            <div className="p-4 rounded-lg border border-fw-border bg-fw-bg space-y-3">
              <h4 className="text-[9px] font-mono tracking-widest uppercase text-fw-green">Content Cycle</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded bg-[#10b981]/10 flex items-center justify-center"><Brain className="w-3 h-3 text-[#10b981]" /></div>
                  <span className="text-[10px] font-mono">AI Assistant</span>
                  <ArrowRight className="w-3 h-3 text-fw-dim ml-auto" />
                </div>
                <div className="flex items-center gap-2 pl-4">
                  <div className="w-6 h-6 rounded bg-[#a855f7]/10 flex items-center justify-center"><Globe className="w-3 h-3 text-[#a855f7]" /></div>
                  <span className="text-[10px] font-mono">Traffic Engine</span>
                  <ArrowRight className="w-3 h-3 text-fw-dim ml-auto" />
                </div>
                <div className="flex items-center gap-2 pl-8">
                  <div className="w-6 h-6 rounded bg-[#00f2ff]/10 flex items-center justify-center"><Cpu className="w-3 h-3 text-[#00f2ff]" /></div>
                  <span className="text-[10px] font-mono text-fw-accent">Content Gen</span>
                </div>
              </div>
            </div>

            {/* Chain 3: Wallet → Marketplace → Referrals */}
            <div className="p-4 rounded-lg border border-fw-border bg-fw-bg space-y-3">
              <h4 className="text-[9px] font-mono tracking-widest uppercase text-fw-gold">Growth Loop</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded bg-[#f59e0b]/10 flex items-center justify-center"><Wallet className="w-3 h-3 text-[#f59e0b]" /></div>
                  <span className="text-[10px] font-mono">Wallet</span>
                  <ArrowRight className="w-3 h-3 text-fw-dim ml-auto" />
                </div>
                <div className="flex items-center gap-2 pl-4">
                  <div className="w-6 h-6 rounded bg-[#00f2ff]/10 flex items-center justify-center"><Store className="w-3 h-3 text-[#00f2ff]" /></div>
                  <span className="text-[10px] font-mono">Marketplace</span>
                  <ArrowRight className="w-3 h-3 text-fw-dim ml-auto" />
                </div>
                <div className="flex items-center gap-2 pl-8">
                  <div className="w-6 h-6 rounded bg-[#a855f7]/10 flex items-center justify-center"><Share2 className="w-3 h-3 text-[#a855f7]" /></div>
                  <span className="text-[10px] font-mono text-fw-purple">Referrals</span>
                </div>
              </div>
            </div>

            {/* Chain 4: Arbitrage + Referrals → Wallet */}
            <div className="p-4 rounded-lg border border-fw-border bg-fw-bg space-y-3">
              <h4 className="text-[9px] font-mono tracking-widest uppercase text-fw-purple">Income Sources</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded bg-[#f59e0b]/10 flex items-center justify-center"><Zap className="w-3 h-3 text-[#f59e0b]" /></div>
                  <span className="text-[10px] font-mono">Arbitrage Bot</span>
                  <ArrowRight className="w-3 h-3 text-fw-dim ml-auto" />
                </div>
                <div className="flex items-center gap-2 pl-4">
                  <div className="w-6 h-6 rounded bg-[#a855f7]/10 flex items-center justify-center"><Share2 className="w-3 h-3 text-[#a855f7]" /></div>
                  <span className="text-[10px] font-mono">Referral Rewards</span>
                  <ArrowRight className="w-3 h-3 text-fw-dim ml-auto" />
                </div>
                <div className="flex items-center gap-2 pl-8">
                  <div className="w-6 h-6 rounded bg-[#f59e0b]/10 flex items-center justify-center"><Wallet className="w-3 h-3 text-[#f59e0b]" /></div>
                  <span className="text-[10px] font-mono text-fw-gold font-bold">$$ Deposits</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── System Health Overview ───────────────────────────────────── */}
      <Card className="bg-fw-surface border-fw-border">
        <CardHeader>
          <CardTitle className="text-xs font-mono tracking-widest uppercase text-fw-dim flex items-center gap-2">
            <Shield className="w-4 h-4 text-fw-green" />
            System Health Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-lg border border-fw-border bg-fw-bg text-center">
              <CheckCircle2 className="w-6 h-6 text-fw-green mx-auto mb-2" />
              <p className="text-lg font-bold font-mono">{activeCount}</p>
              <p className="text-[9px] font-mono text-fw-dim tracking-widest uppercase">Active Engines</p>
            </div>
            <div className="p-4 rounded-lg border border-fw-border bg-fw-bg text-center">
              <AlertTriangle className="w-6 h-6 text-fw-gold mx-auto mb-2" />
              <p className="text-lg font-bold font-mono">{engines.filter((e) => e.status === 'PAUSED').length}</p>
              <p className="text-[9px] font-mono text-fw-dim tracking-widest uppercase">Paused</p>
            </div>
            <div className="p-4 rounded-lg border border-fw-border bg-fw-bg text-center">
              <TrendingUp className="w-6 h-6 text-fw-green mx-auto mb-2" />
              <p className="text-lg font-bold font-mono">
                {Math.round(engines.reduce((s, e) => s + e.metrics.health, 0) / engines.length)}%
              </p>
              <p className="text-[9px] font-mono text-fw-dim tracking-widest uppercase">Avg Health</p>
            </div>
            <div className="p-4 rounded-lg border border-fw-border bg-fw-bg text-center">
              <Activity className="w-6 h-6 text-fw-accent mx-auto mb-2" />
              <p className="text-lg font-bold font-mono">
                {engines.reduce((s, e) => s + e.metrics.throughput, 0)}
              </p>
              <p className="text-[9px] font-mono text-fw-dim tracking-widest uppercase">Total RPM</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
