import { create } from 'zustand'

export type ViewType =
  | 'landing'
  | 'dashboard'
  | 'builder'
  | 'leads'
  | 'wallet'
  | 'marketplace'
  | 'analysis'
  | 'traffic'
  | 'automation'
  | 'leaderboard'
  | 'referrals'
  | 'knowledge'
  | 'settings'
  | 'profile'

export interface EngineNode {
  id: string
  type: string
  label: string
  x: number
  y: number
}

export interface EngineEdge {
  from: string
  to: string
}

export interface Engine {
  id: string
  name: string
  status: string
  revenue: number
  performance: string
  nodes: EngineNode[]
  edges: EngineEdge[]
  userId?: string | null
  createdAt: string
  updatedAt: string
}

export interface Lead {
  id: string
  name: string
  email: string
  status: string
  score: number
  source: string
  factors: string[]
  history: string[]
  userId?: string | null
  createdAt: string
  updatedAt: string
}

export interface ActivityLog {
  id: string
  title: string
  desc: string
  type: string
  userId?: string | null
  createdAt: string
}

export interface Notification {
  id: string
  title: string
  message: string
  read: boolean
  createdAt: string
}

export interface User {
  id: string
  name: string
  email: string
  avatar: string
  plan: string
  joinDate: string
}

export interface WalletData {
  balance: number
  pending: number
  withdrawn: number
  currency: string
  assets: { name: string; amount: number; symbol: string; type: string }[]
  transactions: { id: string; type: string; amount: number; desc: string; date: string }[]
}

interface FreedomStore {
  currentView: ViewType
  engines: Engine[]
  leads: Lead[]
  logs: ActivityLog[]
  notifications: Notification[]
  user: User
  wallet: WalletData
  sidebarOpen: boolean

  setCurrentView: (view: ViewType) => void
  setSidebarOpen: (open: boolean) => void
  addEngine: (engine: Engine) => void
  updateEngine: (id: string, data: Partial<Engine>) => void
  removeEngine: (id: string) => void
  addLead: (lead: Lead) => void
  updateLead: (id: string, data: Partial<Lead>) => void
  removeLead: (id: string) => void
  addLog: (log: ActivityLog) => void
  addNotification: (notification: Notification) => void
  markNotificationRead: (id: string) => void
  updateWallet: (data: Partial<WalletData>) => void
}

const mockUser: User = {
  id: 'usr_001',
  name: 'Marcus Freedom',
  email: 'marcus@freedomwheels.io',
  avatar: '',
  plan: 'SOVEREIGN',
  joinDate: '2025-01-15',
}

const mockEngines: Engine[] = [
  {
    id: 'eng_001',
    name: 'AI Content Syndicator',
    status: 'ACTIVE',
    revenue: 4820.5,
    performance: 'OPTIMAL',
    nodes: [
      { id: 'n1', type: 'input', label: 'RSS Feed', x: 80, y: 120 },
      { id: 'n2', type: 'processing', label: 'AI Rewriter', x: 280, y: 120 },
      { id: 'n3', type: 'output', label: 'Blog Post', x: 480, y: 80 },
      { id: 'n4', type: 'output', label: 'Social Post', x: 480, y: 160 },
    ],
    edges: [
      { from: 'n1', to: 'n2' },
      { from: 'n2', to: 'n3' },
      { from: 'n2', to: 'n4' },
    ],
    createdAt: '2025-02-01T10:00:00Z',
    updatedAt: '2025-03-01T10:00:00Z',
  },
  {
    id: 'eng_002',
    name: 'Lead Magnet Funnel',
    status: 'ACTIVE',
    revenue: 3150.0,
    performance: 'OPTIMAL',
    nodes: [
      { id: 'n1', type: 'input', label: 'Web Traffic', x: 80, y: 120 },
      { id: 'n2', type: 'processing', label: 'Lead Capture', x: 280, y: 120 },
      { id: 'n3', type: 'output', label: 'Email Sequence', x: 480, y: 120 },
    ],
    edges: [
      { from: 'n1', to: 'n2' },
      { from: 'n2', to: 'n3' },
    ],
    createdAt: '2025-02-15T10:00:00Z',
    updatedAt: '2025-03-01T10:00:00Z',
  },
  {
    id: 'eng_003',
    name: 'Crypto Arbitrage Bot',
    status: 'PAUSED',
    revenue: 1280.75,
    performance: 'DEGRADED',
    nodes: [
      { id: 'n1', type: 'input', label: 'Market Data', x: 80, y: 120 },
      { id: 'n2', type: 'processing', label: 'Spread Analysis', x: 280, y: 120 },
      { id: 'n3', type: 'output', label: 'Trade Exec', x: 480, y: 120 },
    ],
    edges: [
      { from: 'n1', to: 'n2' },
      { from: 'n2', to: 'n3' },
    ],
    createdAt: '2025-03-01T10:00:00Z',
    updatedAt: '2025-03-10T10:00:00Z',
  },
]

const mockLeads: Lead[] = [
  {
    id: 'lead_001',
    name: 'Sarah Chen',
    email: 'sarah@techcorp.io',
    status: 'Hot',
    score: 92,
    source: 'LinkedIn',
    factors: ['High engagement', 'Budget confirmed', 'Decision maker'],
    history: ['Contacted via LinkedIn', 'Demo scheduled', 'Follow-up sent'],
    createdAt: '2025-02-20T10:00:00Z',
    updatedAt: '2025-03-01T10:00:00Z',
  },
  {
    id: 'lead_002',
    name: 'James Okonkwo',
    email: 'james@venture.ng',
    status: 'Warm',
    score: 74,
    source: 'Referral',
    factors: ['Referred by existing client', 'Active in community'],
    history: ['Referral received', 'Initial call completed'],
    createdAt: '2025-02-25T10:00:00Z',
    updatedAt: '2025-03-01T10:00:00Z',
  },
  {
    id: 'lead_003',
    name: 'Elena Vasquez',
    email: 'elena@startup.mx',
    status: 'Cold',
    score: 35,
    source: 'Website',
    factors: ['Low engagement', 'No budget confirmed'],
    history: ['Downloaded lead magnet'],
    createdAt: '2025-03-01T10:00:00Z',
    updatedAt: '2025-03-01T10:00:00Z',
  },
  {
    id: 'lead_004',
    name: 'David Kim',
    email: 'david@enterprise.kr',
    status: 'Hot',
    score: 88,
    source: 'Conference',
    factors: ['Enterprise budget', 'Urgent need', 'Multiple stakeholders'],
    history: ['Met at conference', 'Product demo done', 'Proposal sent'],
    createdAt: '2025-02-18T10:00:00Z',
    updatedAt: '2025-03-02T10:00:00Z',
  },
  {
    id: 'lead_005',
    name: 'Amara Osei',
    email: 'amara@digital.gh',
    status: 'Warm',
    score: 65,
    source: 'Twitter',
    factors: ['Social influence', 'Content creator'],
    history: ['Followed on Twitter', 'DM conversation', 'Call scheduled'],
    createdAt: '2025-02-22T10:00:00Z',
    updatedAt: '2025-03-01T10:00:00Z',
  },
]

const mockLogs: ActivityLog[] = [
  { id: 'log_001', title: 'Engine Deployed', desc: 'AI Content Syndicator is now live', type: 'engine', createdAt: '2025-03-01T14:30:00Z' },
  { id: 'log_002', title: 'Lead Converted', desc: 'Sarah Chen moved to Hot status', type: 'lead', createdAt: '2025-03-01T13:15:00Z' },
  { id: 'log_003', title: 'Revenue Received', desc: '$1,240.00 from Content Syndicator', type: 'revenue', createdAt: '2025-03-01T12:00:00Z' },
  { id: 'log_004', title: 'System Update', desc: 'Traffic Engine v2.1 deployed', type: 'system', createdAt: '2025-03-01T10:45:00Z' },
  { id: 'log_005', title: 'New Referral', desc: 'Marcus referred James Okonkwo', type: 'referral', createdAt: '2025-03-01T09:30:00Z' },
]

const mockNotifications: Notification[] = [
  { id: 'notif_001', title: 'Engine Alert', message: 'Crypto Arbitrage Bot performance degraded', read: false, createdAt: '2025-03-01T14:00:00Z' },
  { id: 'notif_002', title: 'New Lead', message: 'Amara Osei signed up via Twitter', read: false, createdAt: '2025-03-01T13:00:00Z' },
  { id: 'notif_003', title: 'Payout Complete', message: '$2,500 withdrawn to Wise USD', read: true, createdAt: '2025-02-28T16:00:00Z' },
]

const mockWallet: WalletData = {
  balance: 24580.5,
  pending: 3240.0,
  withdrawn: 18200.0,
  currency: 'USD',
  assets: [
    { name: 'Wise USD', amount: 12450.0, symbol: 'USD', type: 'fiat' },
    { name: 'Wise EUR', amount: 3200.0, symbol: 'EUR', type: 'fiat' },
    { name: 'Wise GBP', amount: 1850.0, symbol: 'GBP', type: 'fiat' },
    { name: 'Wise ZAR', amount: 5200.0, symbol: 'ZAR', type: 'fiat' },
    { name: 'USDT', amount: 3500.0, symbol: 'USDT', type: 'crypto' },
    { name: 'Bitcoin', amount: 0.015, symbol: 'BTC', type: 'crypto' },
    { name: 'Ethereum', amount: 0.45, symbol: 'ETH', type: 'crypto' },
    { name: 'Solana', amount: 12.5, symbol: 'SOL', type: 'crypto' },
  ],
  transactions: [
    { id: 'tx_001', type: 'credit', amount: 2480.0, desc: 'Content Syndicator Revenue', date: '2025-03-01' },
    { id: 'tx_002', type: 'credit', amount: 1560.0, desc: 'Lead Magnet Revenue', date: '2025-02-28' },
    { id: 'tx_003', type: 'debit', amount: -2500.0, desc: 'Withdrawal to Wise USD', date: '2025-02-28' },
    { id: 'tx_004', type: 'credit', amount: 780.0, desc: 'Referral Bonus', date: '2025-02-27' },
    { id: 'tx_005', type: 'credit', amount: 1240.0, desc: 'Arbitrage Bot Profit', date: '2025-02-26' },
  ],
}

export const useFreedomStore = create<FreedomStore>((set) => ({
  currentView: 'landing',
  engines: mockEngines,
  leads: mockLeads,
  logs: mockLogs,
  notifications: mockNotifications,
  user: mockUser,
  wallet: mockWallet,
  sidebarOpen: true,

  setCurrentView: (view) => set({ currentView: view }),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  addEngine: (engine) => set((state) => ({ engines: [...state.engines, engine] })),
  updateEngine: (id, data) =>
    set((state) => ({
      engines: state.engines.map((e) => (e.id === id ? { ...e, ...data } : e)),
    })),
  removeEngine: (id) => set((state) => ({ engines: state.engines.filter((e) => e.id !== id) })),
  addLead: (lead) => set((state) => ({ leads: [...state.leads, lead] })),
  updateLead: (id, data) =>
    set((state) => ({
      leads: state.leads.map((l) => (l.id === id ? { ...l, ...data } : l)),
    })),
  removeLead: (id) => set((state) => ({ leads: state.leads.filter((l) => l.id !== id) })),
  addLog: (log) => set((state) => ({ logs: [log, ...state.logs] })),
  addNotification: (notification) =>
    set((state) => ({ notifications: [notification, ...state.notifications] })),
  markNotificationRead: (id) =>
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      ),
    })),
  updateWallet: (data) => set((state) => ({ wallet: { ...state.wallet, ...data } })),
}))
