// ─── Cross-Engine Event Bus ─────────────────────────────────────────────
// A Zustand-powered event bus that enables real-time communication between
// all Freedom Wheels™ engines. Any module can dispatch events and subscribe
// to events from other engines.

import { create } from 'zustand'

// ─── Types ──────────────────────────────────────────────────────────────

export type EngineId =
  | 'auth-engine'
  | 'wallet-engine'
  | 'marketplace-engine'
  | 'ai-engine'
  | 'referral-engine'
  | 'leaderboard-engine'
  | 'traffic-engine'
  | 'content-engine'

export type EngineEventType =
  | 'auth:login'
  | 'auth:logout'
  | 'auth:signup'
  | 'wallet:deposit'
  | 'wallet:withdraw'
  | 'wallet:balance_update'
  | 'wallet:transaction'
  | 'marketplace:add_to_cart'
  | 'marketplace:purchase'
  | 'marketplace:checkout'
  | 'ai:query'
  | 'ai:response'
  | 'ai:insight'
  | 'referral:code_generated'
  | 'referral:signup'
  | 'referral:reward'
  | 'leaderboard:rank_update'
  | 'leaderboard:achievement'
  | 'traffic:visit'
  | 'traffic:conversion'
  | 'content:published'
  | 'content:syndicated'
  | 'engine:start'
  | 'engine:stop'
  | 'engine:pause'
  | 'engine:restart'
  | 'engine:health_alert'
  | 'system:notification'

export interface EngineEvent {
  id: string
  timestamp: number
  source: EngineId
  target?: EngineId | EngineId[]
  type: EngineEventType
  payload: Record<string, unknown>
  // Visual metadata for the Live Engines view
  meta: {
    color: string
    icon: string
    label: string
    category: 'revenue' | 'lead' | 'referral' | 'traffic' | 'ai' | 'purchase' | 'system' | 'auth'
    value?: number
  }
}

export interface EngineState {
  id: EngineId
  name: string
  status: 'ACTIVE' | 'PAUSED' | 'STARTING' | 'STOPPED'
  color: string
  icon: string
  health: number
  uptime: number
  lastEvent?: string
  metrics: {
    throughput: number
    revenue: number
    latency: number
    connections: number
  }
}

export interface EngineConnection {
  from: EngineId
  to: EngineId
  label: string
  dataFlow: number
  lastEvent: string
  color: string
}

// ─── Engine Registry ────────────────────────────────────────────────────

const ENGINE_REGISTRY: Record<EngineId, Omit<EngineState, 'lastEvent' | 'metrics'>> = {
  'auth-engine': { id: 'auth-engine', name: 'Auth Engine', status: 'ACTIVE', color: '#00f2ff', icon: '🔐', health: 99, uptime: 720 },
  'wallet-engine': { id: 'wallet-engine', name: 'Wallet Engine', status: 'ACTIVE', color: '#f59e0b', icon: '💰', health: 99, uptime: 888 },
  'marketplace-engine': { id: 'marketplace-engine', name: 'Marketplace Engine', status: 'ACTIVE', color: '#00f2ff', icon: '🏪', health: 94, uptime: 432 },
  'ai-engine': { id: 'ai-engine', name: 'AI Assistant', status: 'ACTIVE', color: '#10b981', icon: '🤖', health: 97, uptime: 696 },
  'referral-engine': { id: 'referral-engine', name: 'Referral Engine', status: 'ACTIVE', color: '#a855f7', icon: '🔗', health: 88, uptime: 504 },
  'leaderboard-engine': { id: 'leaderboard-engine', name: 'Leaderboard Engine', status: 'ACTIVE', color: '#f59e0b', icon: '🏆', health: 96, uptime: 600 },
  'traffic-engine': { id: 'traffic-engine', name: 'Traffic Engine', status: 'ACTIVE', color: '#a855f7', icon: '🌐', health: 91, uptime: 540 },
  'content-engine': { id: 'content-engine', name: 'Content Engine', status: 'ACTIVE', color: '#00f2ff', icon: '📝', health: 98, uptime: 720 },
}

const INITIAL_METRICS: Record<EngineId, EngineState['metrics']> = {
  'auth-engine': { throughput: 12, revenue: 0, latency: 45, connections: 7 },
  'wallet-engine': { throughput: 56, revenue: 24580, latency: 23, connections: 6 },
  'marketplace-engine': { throughput: 78, revenue: 1890, latency: 89, connections: 5 },
  'ai-engine': { throughput: 312, revenue: 960, latency: 340, connections: 5 },
  'referral-engine': { throughput: 34, revenue: 4320, latency: 156, connections: 4 },
  'leaderboard-engine': { throughput: 28, revenue: 0, latency: 34, connections: 3 },
  'traffic-engine': { throughput: 234, revenue: 2150, latency: 67, connections: 4 },
  'content-engine': { throughput: 142, revenue: 4820, latency: 45, connections: 3 },
}

// ─── Cross-Engine Connections (who talks to whom) ───────────────────────

export const ENGINE_CONNECTIONS: EngineConnection[] = [
  { from: 'auth-engine', to: 'wallet-engine', label: 'Auth → Wallet', dataFlow: 12, lastEvent: 'Login triggered wallet load', color: '#00f2ff' },
  { from: 'auth-engine', to: 'marketplace-engine', label: 'Auth → Market', dataFlow: 8, lastEvent: 'User session started', color: '#00f2ff' },
  { from: 'auth-engine', to: 'leaderboard-engine', label: 'Auth → Leaderboard', dataFlow: 5, lastEvent: 'Profile loaded for ranking', color: '#00f2ff' },
  { from: 'wallet-engine', to: 'marketplace-engine', label: 'Wallet → Purchase', dataFlow: 12, lastEvent: 'Marketplace purchase: $149', color: '#f59e0b' },
  { from: 'wallet-engine', to: 'referral-engine', label: 'Wallet → Rewards', dataFlow: 7, lastEvent: 'Referral bonus credited: $200', color: '#f59e0b' },
  { from: 'marketplace-engine', to: 'ai-engine', label: 'Market → AI', dataFlow: 8, lastEvent: 'AI optimizing product listing', color: '#00f2ff' },
  { from: 'marketplace-engine', to: 'referral-engine', label: 'Market → Referral', dataFlow: 4, lastEvent: 'Post-purchase referral sent', color: '#00f2ff' },
  { from: 'marketplace-engine', to: 'wallet-engine', label: 'Market → Revenue', dataFlow: 15, lastEvent: 'Checkout completed: $249', color: '#00f2ff' },
  { from: 'ai-engine', to: 'traffic-engine', label: 'AI → Strategy', dataFlow: 34, lastEvent: 'Content strategy deployed', color: '#10b981' },
  { from: 'ai-engine', to: 'content-engine', label: 'AI → Content', dataFlow: 56, lastEvent: 'AI generated 3 articles', color: '#10b981' },
  { from: 'ai-engine', to: 'marketplace-engine', label: 'AI → Optimization', dataFlow: 12, lastEvent: 'Pricing optimized for 8 products', color: '#10b981' },
  { from: 'referral-engine', to: 'wallet-engine', label: 'Referral → Rewards', dataFlow: 7, lastEvent: 'Referral bonus: $200', color: '#a855f7' },
  { from: 'referral-engine', to: 'leaderboard-engine', label: 'Referral → Rank', dataFlow: 3, lastEvent: 'Referral count updated on board', color: '#a855f7' },
  { from: 'referral-engine', to: 'traffic-engine', label: 'Referral → Traffic', dataFlow: 15, lastEvent: 'Referral link brought 45 visitors', color: '#a855f7' },
  { from: 'leaderboard-engine', to: 'referral-engine', label: 'Rank → Motivation', dataFlow: 5, lastEvent: 'Rank change triggered referral push', color: '#f59e0b' },
  { from: 'traffic-engine', to: 'content-engine', label: 'Traffic → Content', dataFlow: 67, lastEvent: 'Content amplified to 5 platforms', color: '#a855f7' },
  { from: 'traffic-engine', to: 'marketplace-engine', label: 'Traffic → Market', dataFlow: 23, lastEvent: '156 visitors browsed marketplace', color: '#a855f7' },
  { from: 'content-engine', to: 'traffic-engine', label: 'Content → Distribution', dataFlow: 45, lastEvent: 'Blog shared to 4 platforms', color: '#00f2ff' },
  { from: 'content-engine', to: 'ai-engine', label: 'Content → Feedback', dataFlow: 28, lastEvent: 'Performance data sent to AI', color: '#00f2ff' },
]

// ─── Event type → visual metadata mapping ───────────────────────────────

const EVENT_META: Record<string, EngineEvent['meta']> = {
  'auth:login': { color: '#00f2ff', icon: '🔐', label: 'Login', category: 'auth' },
  'auth:logout': { color: '#00f2ff', icon: '🔐', label: 'Logout', category: 'auth' },
  'auth:signup': { color: '#00f2ff', icon: '🔐', label: 'Signup', category: 'auth' },
  'wallet:deposit': { color: '#10b981', icon: '💰', label: 'Deposit', category: 'revenue' },
  'wallet:withdraw': { color: '#f59e0b', icon: '💸', label: 'Withdraw', category: 'revenue' },
  'wallet:balance_update': { color: '#f59e0b', icon: '💰', label: 'Balance Update', category: 'revenue' },
  'wallet:transaction': { color: '#f59e0b', icon: '💳', label: 'Transaction', category: 'revenue' },
  'marketplace:add_to_cart': { color: '#00f2ff', icon: '🛒', label: 'Add to Cart', category: 'purchase' },
  'marketplace:purchase': { color: '#10b981', icon: '✅', label: 'Purchase', category: 'purchase' },
  'marketplace:checkout': { color: '#10b981', icon: '🛍️', label: 'Checkout', category: 'purchase' },
  'ai:query': { color: '#a855f7', icon: '🤖', label: 'AI Query', category: 'ai' },
  'ai:response': { color: '#a855f7', icon: '🤖', label: 'AI Response', category: 'ai' },
  'ai:insight': { color: '#10b981', icon: '💡', label: 'AI Insight', category: 'ai' },
  'referral:code_generated': { color: '#a855f7', icon: '🔗', label: 'Referral Code', category: 'referral' },
  'referral:signup': { color: '#10b981', icon: '👋', label: 'Referral Signup', category: 'referral' },
  'referral:reward': { color: '#f59e0b', icon: '🎁', label: 'Referral Reward', category: 'referral' },
  'leaderboard:rank_update': { color: '#f59e0b', icon: '🏆', label: 'Rank Update', category: 'system' },
  'leaderboard:achievement': { color: '#f59e0b', icon: '⭐', label: 'Achievement', category: 'system' },
  'traffic:visit': { color: '#a855f7', icon: '🌐', label: 'Visit', category: 'traffic' },
  'traffic:conversion': { color: '#10b981', icon: '📈', label: 'Conversion', category: 'traffic' },
  'content:published': { color: '#00f2ff', icon: '📝', label: 'Published', category: 'ai' },
  'content:syndicated': { color: '#00f2ff', icon: '📡', label: 'Syndicated', category: 'traffic' },
  'engine:start': { color: '#10b981', icon: '▶️', label: 'Engine Start', category: 'system' },
  'engine:stop': { color: '#ef4444', icon: '⏹️', label: 'Engine Stop', category: 'system' },
  'engine:pause': { color: '#f59e0b', icon: '⏸️', label: 'Engine Pause', category: 'system' },
  'engine:restart': { color: '#00f2ff', icon: '🔄', label: 'Engine Restart', category: 'system' },
  'engine:health_alert': { color: '#ef4444', icon: '⚠️', label: 'Health Alert', category: 'system' },
  'system:notification': { color: '#94a3b8', icon: '🔔', label: 'Notification', category: 'system' },
}

// ─── Auto-reaction rules (cross-engine triggers) ────────────────────────
// When an event is dispatched, these rules fire follow-up events automatically

interface ReactionRule {
  trigger: EngineEventType
  source?: EngineId
  produces: {
    type: EngineEventType
    source: EngineId
    target?: EngineId
    label: string
    payloadFactory: (original: EngineEvent) => Record<string, unknown>
  }[]
}

const REACTION_RULES: ReactionRule[] = [
  // Auth login → triggers wallet load + marketplace session
  {
    trigger: 'auth:login',
    produces: [
      {
        type: 'wallet:balance_update',
        source: 'wallet-engine',
        target: 'auth-engine',
        label: 'Wallet loaded after login',
        payloadFactory: (e) => ({ userId: e.payload.userId, triggeredBy: 'auth:login' }),
      },
      {
        type: 'leaderboard:rank_update',
        source: 'leaderboard-engine',
        target: 'auth-engine',
        label: 'Rank fetched after login',
        payloadFactory: (e) => ({ userId: e.payload.userId, triggeredBy: 'auth:login' }),
      },
    ],
  },
  // Marketplace purchase → triggers wallet debit + referral check
  {
    trigger: 'marketplace:purchase',
    produces: [
      {
        type: 'wallet:transaction',
        source: 'wallet-engine',
        target: 'marketplace-engine',
        label: 'Purchase debited from wallet',
        payloadFactory: (e) => ({ amount: e.payload.amount, type: 'debit', triggeredBy: 'marketplace:purchase' }),
      },
      {
        type: 'referral:reward',
        source: 'referral-engine',
        target: 'marketplace-engine',
        label: 'Referral check after purchase',
        payloadFactory: (e) => ({ purchaseAmount: e.payload.amount, triggeredBy: 'marketplace:purchase' }),
      },
    ],
  },
  // Marketplace add to cart → AI can optimize recommendations
  {
    trigger: 'marketplace:add_to_cart',
    produces: [
      {
        type: 'ai:query',
        source: 'ai-engine',
        target: 'marketplace-engine',
        label: 'AI optimizing cart recommendations',
        payloadFactory: (e) => ({ itemId: e.payload.itemId, triggeredBy: 'marketplace:add_to_cart' }),
      },
    ],
  },
  // Wallet deposit → leaderboard rank update
  {
    trigger: 'wallet:deposit',
    produces: [
      {
        type: 'leaderboard:rank_update',
        source: 'leaderboard-engine',
        target: 'wallet-engine',
        label: 'Rank updated after deposit',
        payloadFactory: (e) => ({ amount: e.payload.amount, triggeredBy: 'wallet:deposit' }),
      },
    ],
  },
  // Referral signup → traffic bump + wallet reward
  {
    trigger: 'referral:signup',
    produces: [
      {
        type: 'traffic:conversion',
        source: 'traffic-engine',
        target: 'referral-engine',
        label: 'Referral link converted to traffic',
        payloadFactory: (e) => ({ source: 'referral', triggeredBy: 'referral:signup' }),
      },
    ],
  },
  // Referral reward → wallet credit
  {
    trigger: 'referral:reward',
    produces: [
      {
        type: 'wallet:deposit',
        source: 'wallet-engine',
        target: 'referral-engine',
        label: 'Referral reward deposited',
        payloadFactory: (e) => ({ amount: e.payload.amount || 50, triggeredBy: 'referral:reward' }),
      },
    ],
  },
  // AI insight → content generation
  {
    trigger: 'ai:insight',
    produces: [
      {
        type: 'content:published',
        source: 'content-engine',
        target: 'ai-engine',
        label: 'AI insight generated content',
        payloadFactory: (e) => ({ topic: e.payload.topic, triggeredBy: 'ai:insight' }),
      },
    ],
  },
  // Content published → traffic distribution
  {
    trigger: 'content:published',
    produces: [
      {
        type: 'traffic:visit',
        source: 'traffic-engine',
        target: 'content-engine',
        label: 'Content distributed to traffic channels',
        payloadFactory: (e) => ({ contentId: e.payload.contentId, triggeredBy: 'content:published' }),
      },
    ],
  },
  // Traffic conversion → lead magnet → marketplace
  {
    trigger: 'traffic:conversion',
    produces: [
      {
        type: 'marketplace:add_to_cart',
        source: 'marketplace-engine',
        target: 'traffic-engine',
        label: 'Converted visitor browsed marketplace',
        payloadFactory: (e) => ({ source: e.payload.source, triggeredBy: 'traffic:conversion' }),
      },
    ],
  },
]

// ─── Event counter ──────────────────────────────────────────────────────

let eventCounter = 0

function generateEventId(): string {
  return `evt_${++eventCounter}_${Date.now()}`
}

// ─── Store ──────────────────────────────────────────────────────────────

interface EngineBusStore {
  // Engine states
  engines: Record<EngineId, EngineState>
  connections: EngineConnection[]
  // Event stream
  events: EngineEvent[]
  // Pulse map for visual animations: "from->to" -> timestamp
  pulses: Record<string, number>

  // Actions
  dispatch: (event: Omit<EngineEvent, 'id' | 'timestamp' | 'meta'> & { meta?: Partial<EngineEvent['meta']> }) => void
  setEngineStatus: (id: EngineId, status: EngineState['status']) => void
  updateEngineMetrics: (id: EngineId, metrics: Partial<EngineState['metrics']>) => void
  updateConnectionFlow: (from: EngineId, to: EngineId, dataFlow: number) => void
  clearOldPulses: () => void
  getEngineState: (id: EngineId) => EngineState | undefined
  getConnectedEngines: (id: EngineId) => EngineId[]
}

function buildInitialEngines(): Record<EngineId, EngineState> {
  const result = {} as Record<EngineId, EngineState>
  for (const [id, base] of Object.entries(ENGINE_REGISTRY)) {
    result[id as EngineId] = {
      ...base,
      metrics: INITIAL_METRICS[id as EngineId],
    }
  }
  return result
}

export const useEngineBus = create<EngineBusStore>((set, get) => ({
  engines: buildInitialEngines(),
  connections: [...ENGINE_CONNECTIONS],
  events: [],
  pulses: {},

  dispatch: (eventInput) => {
    const meta = {
      ...EVENT_META[eventInput.type] || { color: '#94a3b8', icon: '🔔', label: 'Event', category: 'system' as const },
      ...eventInput.meta,
    }

    const event: EngineEvent = {
      id: generateEventId(),
      timestamp: Date.now(),
      source: eventInput.source,
      target: eventInput.target,
      type: eventInput.type,
      payload: eventInput.payload,
      meta,
    }

    // Add pulse for visual animation
    const targetIds = event.target
      ? Array.isArray(event.target) ? event.target : [event.target]
      : []

    const newPulses: Record<string, number> = {}
    for (const targetId of targetIds) {
      newPulses[`${event.source}->${targetId}`] = Date.now()
    }

    set((state) => ({
      events: [event, ...state.events].slice(0, 100),
      pulses: { ...state.pulses, ...newPulses },
    }))

    // Update the source engine's lastEvent
    set((state) => ({
      engines: {
        ...state.engines,
        [event.source]: {
          ...state.engines[event.source],
          lastEvent: meta.label,
        },
      },
    }))

    // Update connections that match this event path
    set((state) => ({
      connections: state.connections.map((conn) => {
        for (const targetId of targetIds) {
          if (conn.from === event.source && conn.to === targetId) {
            return { ...conn, lastEvent: meta.label, dataFlow: conn.dataFlow + 1 }
          }
        }
        return conn
      }),
    }))

    // Fire reaction rules (cross-engine triggers)
    for (const rule of REACTION_RULES) {
      if (rule.trigger === eventInput.type) {
        if (rule.source && rule.source !== eventInput.source) continue

        for (const product of rule.produces) {
          // Delay reactions slightly for visual effect and to avoid infinite loops
          setTimeout(() => {
            const reactionEvent: Omit<EngineEvent, 'id' | 'timestamp' | 'meta'> & { meta?: Partial<EngineEvent['meta']> } = {
              source: product.source,
              target: product.target,
              type: product.type,
              payload: product.payloadFactory(event),
              meta: undefined, // will use default from EVENT_META
            }
            get().dispatch(reactionEvent)
          }, 300 + Math.random() * 700)
        }
      }
    }
  },

  setEngineStatus: (id, status) => {
    set((state) => ({
      engines: {
        ...state.engines,
        [id]: {
          ...state.engines[id],
          status,
          health: status === 'ACTIVE' ? 95 : status === 'STOPPED' ? 0 : state.engines[id].health,
          metrics: {
            ...state.engines[id].metrics,
            throughput: status === 'ACTIVE' ? Math.floor(Math.random() * 50) + 50 : status === 'STOPPED' ? 0 : state.engines[id].metrics.throughput,
          },
        },
      },
    }))
  },

  updateEngineMetrics: (id, metrics) => {
    set((state) => ({
      engines: {
        ...state.engines,
        [id]: {
          ...state.engines[id],
          metrics: { ...state.engines[id].metrics, ...metrics },
        },
      },
    }))
  },

  updateConnectionFlow: (from, to, dataFlow) => {
    set((state) => ({
      connections: state.connections.map((conn) =>
        conn.from === from && conn.to === to ? { ...conn, dataFlow } : conn
      ),
    }))
  },

  clearOldPulses: () => {
    const now = Date.now()
    set((state) => {
      const cleaned: Record<string, number> = {}
      for (const [key, time] of Object.entries(state.pulses)) {
        if (now - time < 5000) cleaned[key] = time
      }
      return { pulses: cleaned }
    })
  },

  getEngineState: (id) => get().engines[id],

  getConnectedEngines: (id) => {
    const state = get()
    const connected = new Set<EngineId>()
    for (const conn of state.connections) {
      if (conn.from === id) connected.add(conn.to)
      if (conn.to === id) connected.add(conn.from)
    }
    return Array.from(connected)
  },
}))
