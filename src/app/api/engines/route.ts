import { NextRequest, NextResponse } from 'next/server'

// Engine telemetry API — provides REST fallback when WebSocket is not available
// The real-time data comes from the WebSocket service on port 3003

interface EngineMetric {
  id: string
  name: string
  status: string
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

// Server-side engine state (fallback when WebSocket unavailable)
const engines: EngineMetric[] = [
  { id: 'content-syndicator', name: 'AI Content Syndicator', status: 'ACTIVE', type: 'content', color: '#00f2ff', icon: '📝', x: 20, y: 25, metrics: { throughput: 142, revenue: 4820.5, health: 98, latency: 45, uptime: 720, connections: 3 } },
  { id: 'lead-magnet', name: 'Lead Magnet Funnel', status: 'ACTIVE', type: 'leads', color: '#10b981', icon: '🧲', x: 50, y: 15, metrics: { throughput: 89, revenue: 3150.0, health: 95, latency: 120, uptime: 648, connections: 4 } },
  { id: 'crypto-arbitrage', name: 'Crypto Arbitrage Bot', status: 'PAUSED', type: 'trading', color: '#f59e0b', icon: '⚡', x: 80, y: 25, metrics: { throughput: 0, revenue: 1280.75, health: 72, latency: 8, uptime: 312, connections: 2 } },
  { id: 'traffic-engine', name: 'Traffic Engine', status: 'ACTIVE', type: 'traffic', color: '#a855f7', icon: '🌐', x: 20, y: 55, metrics: { throughput: 234, revenue: 2150.0, health: 91, latency: 67, uptime: 540, connections: 3 } },
  { id: 'wallet-engine', name: 'Wallet Engine', status: 'ACTIVE', type: 'finance', color: '#f59e0b', icon: '💰', x: 50, y: 50, metrics: { throughput: 56, revenue: 24580.0, health: 99, latency: 23, uptime: 888, connections: 6 } },
  { id: 'marketplace-engine', name: 'Marketplace Engine', status: 'ACTIVE', type: 'commerce', color: '#00f2ff', icon: '🏪', x: 80, y: 55, metrics: { throughput: 78, revenue: 1890.0, health: 94, latency: 89, uptime: 432, connections: 3 } },
  { id: 'ai-assistant', name: 'AI Assistant', status: 'ACTIVE', type: 'ai', color: '#10b981', icon: '🤖', x: 35, y: 80, metrics: { throughput: 312, revenue: 960.0, health: 97, latency: 340, uptime: 696, connections: 5 } },
  { id: 'referral-engine', name: 'Referral Engine', status: 'ACTIVE', type: 'growth', color: '#a855f7', icon: '🔗', x: 65, y: 80, metrics: { throughput: 34, revenue: 4320.0, health: 88, latency: 156, uptime: 504, connections: 3 } },
]

const interactions: EngineInteraction[] = [
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

// Fluctuate metrics for simulated real-time feel
function fluctuate() {
  for (const engine of engines) {
    if (engine.status !== 'ACTIVE') continue
    engine.metrics.throughput = Math.max(1, engine.metrics.throughput + Math.floor(Math.random() * 20) - 10)
    engine.metrics.revenue += Math.random() * 5
    engine.metrics.health = Math.min(100, Math.max(60, engine.metrics.health + (Math.random() * 4 - 2)))
    engine.metrics.latency = Math.max(5, engine.metrics.latency + Math.floor(Math.random() * 20) - 10)
  }
  for (const interaction of interactions) {
    interaction.dataFlow = Math.max(1, interaction.dataFlow + Math.floor(Math.random() * 6) - 3)
  }
}

// GET /api/engines — Fetch current engine state
export async function GET() {
  fluctuate()

  const totalRevenue = engines.reduce((s, e) => s + e.metrics.revenue, 0)
  const activeCount = engines.filter((e) => e.status === 'ACTIVE').length
  const totalThroughput = engines.reduce((s, e) => s + e.metrics.throughput, 0)
  const avgHealth = Math.round(engines.reduce((s, e) => s + e.metrics.health, 0) / engines.length)

  return NextResponse.json({
    engines,
    interactions,
    summary: {
      totalRevenue,
      activeCount,
      totalEngines: engines.length,
      totalThroughput,
      avgHealth,
      totalDataFlow: interactions.reduce((s, i) => s + i.dataFlow, 0),
    },
  })
}

// POST /api/engines — Control an engine (start/stop/pause/restart)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { engineId, action } = body as { engineId: string; action: 'start' | 'stop' | 'pause' | 'restart' }

    const engine = engines.find((e) => e.id === engineId)
    if (!engine) {
      return NextResponse.json({ error: 'Engine not found' }, { status: 404 })
    }

    switch (action) {
      case 'start':
        engine.status = 'ACTIVE'
        engine.metrics.health = 95
        engine.metrics.throughput = Math.floor(Math.random() * 50) + 50
        break
      case 'stop':
        engine.status = 'STOPPED'
        engine.metrics.throughput = 0
        engine.metrics.health = 0
        break
      case 'pause':
        engine.status = 'PAUSED'
        engine.metrics.throughput = Math.floor(engine.metrics.throughput * 0.1)
        break
      case 'restart':
        engine.status = 'STARTING'
        // Simulate startup delay
        setTimeout(() => {
          engine.status = 'ACTIVE'
          engine.metrics.health = 95
          engine.metrics.throughput = Math.floor(Math.random() * 50) + 50
        }, 2000)
        break
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      engine: {
        id: engine.id,
        name: engine.name,
        status: engine.status,
        metrics: engine.metrics,
      },
    })
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
}
