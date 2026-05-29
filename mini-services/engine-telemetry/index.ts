import { Server } from 'socket.io'
import { createServer } from 'http'

const PORT = 3003

// ─── Engine Definitions ───────────────────────────────────────────────
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
    throughput: number       // requests/min
    revenue: number          // $ amount
    health: number           // 0-100%
    latency: number          // ms
    uptime: number           // hours
    connections: number      // active connections to other engines
  }
}

// ─── Cross-Engine Interaction Definitions ──────────────────────────────
interface EngineInteraction {
  from: string
  to: string
  label: string
  dataFlow: number   // data units per tick
  lastEvent: string
  color: string
}

// ─── Live Event ───────────────────────────────────────────────────────
interface LiveEvent {
  id: string
  timestamp: number
  source: string
  target: string
  type: 'revenue' | 'lead' | 'referral' | 'traffic' | 'ai' | 'purchase' | 'system'
  message: string
  value?: number
}

// ─── Engine State ─────────────────────────────────────────────────────
const engines: EngineMetric[] = [
  {
    id: 'content-syndicator',
    name: 'AI Content Syndicator',
    status: 'ACTIVE',
    type: 'content',
    color: '#00f2ff',
    icon: '📝',
    x: 20, y: 25,
    metrics: { throughput: 142, revenue: 4820.5, health: 98, latency: 45, uptime: 720, connections: 3 }
  },
  {
    id: 'lead-magnet',
    name: 'Lead Magnet Funnel',
    status: 'ACTIVE',
    type: 'leads',
    color: '#10b981',
    icon: '🧲',
    x: 50, y: 15,
    metrics: { throughput: 89, revenue: 3150.0, health: 95, latency: 120, uptime: 648, connections: 4 }
  },
  {
    id: 'crypto-arbitrage',
    name: 'Crypto Arbitrage Bot',
    status: 'PAUSED',
    type: 'trading',
    color: '#f59e0b',
    icon: '⚡',
    x: 80, y: 25,
    metrics: { throughput: 0, revenue: 1280.75, health: 72, latency: 8, uptime: 312, connections: 2 }
  },
  {
    id: 'traffic-engine',
    name: 'Traffic Engine',
    status: 'ACTIVE',
    type: 'traffic',
    color: '#a855f7',
    icon: '🌐',
    x: 20, y: 55,
    metrics: { throughput: 234, revenue: 2150.0, health: 91, latency: 67, uptime: 540, connections: 3 }
  },
  {
    id: 'wallet-engine',
    name: 'Wallet Engine',
    status: 'ACTIVE',
    type: 'finance',
    color: '#f59e0b',
    icon: '💰',
    x: 50, y: 50,
    metrics: { throughput: 56, revenue: 24580.0, health: 99, latency: 23, uptime: 888, connections: 6 }
  },
  {
    id: 'marketplace-engine',
    name: 'Marketplace Engine',
    status: 'ACTIVE',
    type: 'commerce',
    color: '#00f2ff',
    icon: '🏪',
    x: 80, y: 55,
    metrics: { throughput: 78, revenue: 1890.0, health: 94, latency: 89, uptime: 432, connections: 3 }
  },
  {
    id: 'ai-assistant',
    name: 'AI Assistant',
    status: 'ACTIVE',
    type: 'ai',
    color: '#10b981',
    icon: '🤖',
    x: 35, y: 80,
    metrics: { throughput: 312, revenue: 960.0, health: 97, latency: 340, uptime: 696, connections: 5 }
  },
  {
    id: 'referral-engine',
    name: 'Referral Engine',
    status: 'ACTIVE',
    type: 'growth',
    color: '#a855f7',
    icon: '🔗',
    x: 65, y: 80,
    metrics: { throughput: 34, revenue: 4320.0, health: 88, latency: 156, uptime: 504, connections: 3 }
  },
]

const interactions: EngineInteraction[] = [
  { from: 'content-syndicator', to: 'lead-magnet', label: 'Content → Leads', dataFlow: 45, lastEvent: 'Blog post generated 12 leads', color: '#00f2ff' },
  { from: 'traffic-engine', to: 'lead-magnet', label: 'Traffic → Leads', dataFlow: 89, lastEvent: '230 visitors converted to leads', color: '#a855f7' },
  { from: 'lead-magnet', to: 'wallet-engine', label: 'Leads → Revenue', dataFlow: 23, lastEvent: 'Lead converted: $480 deposit', color: '#10b981' },
  { from: 'wallet-engine', to: 'marketplace-engine', label: 'Funds → Purchases', dataFlow: 12, lastEvent: 'Marketplace purchase: $149', color: '#f59e0b' },
  { from: 'marketplace-engine', to: 'ai-assistant', label: 'Products → AI Optimize', dataFlow: 8, lastEvent: 'AI optimizing product descriptions', color: '#00f2ff' },
  { from: 'ai-assistant', to: 'traffic-engine', label: 'AI → Content Strategy', dataFlow: 34, lastEvent: 'New content strategy deployed', color: '#10b981' },
  { from: 'ai-assistant', to: 'content-syndicator', label: 'AI → Content Gen', dataFlow: 56, lastEvent: 'AI generated 3 articles', color: '#10b981' },
  { from: 'referral-engine', to: 'wallet-engine', label: 'Referrals → Rewards', dataFlow: 7, lastEvent: 'Referral bonus: $200', color: '#a855f7' },
  { from: 'crypto-arbitrage', to: 'wallet-engine', label: 'Trades → Profit', dataFlow: 5, lastEvent: 'Arbitrage profit: $45.20', color: '#f59e0b' },
  { from: 'traffic-engine', to: 'content-syndicator', label: 'Traffic → Content', dataFlow: 67, lastEvent: 'Content amplified to 4 platforms', color: '#a855f7' },
  { from: 'marketplace-engine', to: 'referral-engine', label: 'Purchases → Referrals', dataFlow: 4, lastEvent: 'Post-purchase referral prompt sent', color: '#00f2ff' },
  { from: 'referral-engine', to: 'lead-magnet', label: 'Referrals → New Leads', dataFlow: 15, lastEvent: 'Referred user became lead', color: '#a855f7' },
]

// ─── Event Generator ──────────────────────────────────────────────────
const eventTemplates: { source: string; target: string; type: LiveEvent['type']; messages: string[]; valueRange: [number, number] }[] = [
  { source: 'content-syndicator', target: 'lead-magnet', type: 'lead', messages: ['Blog post generated %d leads', 'AI article attracted %d signups', 'Content syndication: %d new leads'], valueRange: [5, 25] },
  { source: 'traffic-engine', target: 'lead-magnet', type: 'traffic', messages: ['%d visitors from LinkedIn', 'SEO traffic spike: %d clicks', 'Social traffic: %d visitors'], valueRange: [50, 300] },
  { source: 'lead-magnet', target: 'wallet-engine', type: 'revenue', messages: ['Lead converted: $%d', 'Enterprise deal closed: $%d', 'Hot lead purchase: $%d'], valueRange: [80, 500] },
  { source: 'wallet-engine', target: 'marketplace-engine', type: 'purchase', messages: ['Marketplace purchase: $%d', 'Engine Pro bought: $%d', 'Plugin acquired: $%d'], valueRange: [49, 199] },
  { source: 'ai-assistant', target: 'traffic-engine', type: 'ai', messages: ['AI optimized %d keywords', 'Content strategy updated', 'SEO score improved +%d'], valueRange: [3, 15] },
  { source: 'ai-assistant', target: 'content-syndicator', type: 'ai', messages: ['AI generated %d articles', 'Content calendar updated', '%d social posts scheduled'], valueRange: [1, 8] },
  { source: 'referral-engine', target: 'wallet-engine', type: 'referral', messages: ['Referral bonus: $%d', 'Gold tier reward: $%d', 'New referral paid: $%d'], valueRange: [50, 200] },
  { source: 'crypto-arbitrage', target: 'wallet-engine', type: 'revenue', messages: ['Arbitrage profit: $%d', 'Spread captured: $%d', 'Trade executed: +$%d'], valueRange: [10, 80] },
  { source: 'marketplace-engine', target: 'referral-engine', type: 'referral', messages: ['Post-purchase referral sent', '%d users shared referral code', 'Referral link clicked %d times'], valueRange: [1, 10] },
  { source: 'referral-engine', target: 'lead-magnet', type: 'lead', messages: ['Referred user became lead', '%d referred leads today', 'Referral conversion: %d signups'], valueRange: [1, 8] },
]

let eventCounter = 0
const liveEvents: LiveEvent[] = []

function generateEvent(): LiveEvent {
  const template = eventTemplates[Math.floor(Math.random() * eventTemplates.length)]
  const value = Math.floor(Math.random() * (template.valueRange[1] - template.valueRange[0])) + template.valueRange[0]
  const messageTemplate = template.messages[Math.floor(Math.random() * template.messages.length)]
  const message = messageTemplate.replace('%d', value.toString())

  const event: LiveEvent = {
    id: `evt_${++eventCounter}_${Date.now()}`,
    timestamp: Date.now(),
    source: template.source,
    target: template.target,
    type: template.type,
    message,
    value,
  }

  liveEvents.unshift(event)
  if (liveEvents.length > 100) liveEvents.pop()

  return event
}

// ─── Metric Fluctuation ───────────────────────────────────────────────
function fluctuateMetrics() {
  for (const engine of engines) {
    if (engine.status !== 'ACTIVE') continue

    engine.metrics.throughput = Math.max(1, engine.metrics.throughput + Math.floor(Math.random() * 20) - 10)
    engine.metrics.revenue += Math.random() * 5
    engine.metrics.health = Math.min(100, Math.max(60, engine.metrics.health + (Math.random() * 4 - 2)))
    engine.metrics.latency = Math.max(5, engine.metrics.latency + Math.floor(Math.random() * 20) - 10)
    engine.metrics.uptime += 0.001

    // Update interaction data flows
    for (const interaction of interactions) {
      if (interaction.from === engine.id || interaction.to === engine.id) {
        interaction.dataFlow = Math.max(1, interaction.dataFlow + Math.floor(Math.random() * 6) - 3)
      }
    }
  }
}

// ─── HTTP + Socket.IO Server ──────────────────────────────────────────
const httpServer = createServer()
const io = new Server(httpServer, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
  path: '/',
})

io.on('connection', (socket) => {
  console.log(`[Engine Telemetry] Client connected: ${socket.id}`)

  // Send initial state
  socket.emit('engines:state', { engines, interactions })
  socket.emit('events:history', liveEvents.slice(0, 50))

  // Engine control commands
  socket.on('engine:control', (data: { engineId: string; action: 'start' | 'stop' | 'pause' | 'restart' }) => {
    const engine = engines.find((e) => e.id === data.engineId)
    if (!engine) return

    switch (data.action) {
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
        setTimeout(() => {
          engine.status = 'ACTIVE'
          engine.metrics.health = 95
          engine.metrics.throughput = Math.floor(Math.random() * 50) + 50
          io.emit('engines:state', { engines, interactions })
          io.emit('engine:status', { engineId: engine.id, status: engine.status })
        }, 2000)
        break
    }

    const controlEvent: LiveEvent = {
      id: `evt_${++eventCounter}_${Date.now()}`,
      timestamp: Date.now(),
      source: data.engineId,
      target: 'system',
      type: 'system',
      message: `${engine.name} ${data.action === 'start' ? 'started' : data.action === 'stop' ? 'stopped' : data.action === 'pause' ? 'paused' : 'restarting'}`,
    }
    liveEvents.unshift(controlEvent)
    if (liveEvents.length > 100) liveEvents.pop()

    io.emit('engines:state', { engines, interactions })
    io.emit('engine:status', { engineId: engine.id, status: engine.status })
    io.emit('events:new', controlEvent)
  })

  // Request manual event
  socket.on('events:trigger', (data: { source: string; target: string; type: string; message: string }) => {
    const event: LiveEvent = {
      id: `evt_${++eventCounter}_${Date.now()}`,
      timestamp: Date.now(),
      source: data.source,
      target: data.target,
      type: data.type as LiveEvent['type'],
      message: data.message,
    }
    liveEvents.unshift(event)
    if (liveEvents.length > 100) liveEvents.pop()
    io.emit('events:new', event)
  })

  socket.on('disconnect', () => {
    console.log(`[Engine Telemetry] Client disconnected: ${socket.id}`)
  })
})

// ─── Telemetry Broadcast Loop ─────────────────────────────────────────
setInterval(() => {
  fluctuateMetrics()

  // Generate 1-3 random events per tick
  const eventCount = Math.floor(Math.random() * 3) + 1
  for (let i = 0; i < eventCount; i++) {
    const event = generateEvent()
    io.emit('events:new', event)
  }

  io.emit('engines:metrics', { engines, interactions })
}, 3000)

// ─── Start Server ─────────────────────────────────────────────────────
httpServer.listen(PORT, () => {
  console.log(`[Engine Telemetry] WebSocket server running on port ${PORT}`)
})
