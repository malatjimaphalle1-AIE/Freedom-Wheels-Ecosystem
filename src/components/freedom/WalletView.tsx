'use client'

import { useAuth } from '@/components/freedom/AuthProvider'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DollarSign,
  TrendingUp,
  ArrowUpRight,
  Shield,
  Lock,
  Coins,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowDownLeft,
  Banknote,
  Wallet as WalletIcon,
  RefreshCw,
  ExternalLink,
} from 'lucide-react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { useState, useEffect, useCallback } from 'react'

// Types matching Prisma models
interface WalletAsset {
  id: string
  name: string
  symbol: string
  amount: number
  type: string
}

interface Transaction {
  id: string
  type: string
  amount: number
  description: string
  status: string
  userEmail: string
  createdAt: string
}

interface WithdrawalRequest {
  id: string
  amount: number
  assetSymbol: string
  status: string
  destinationType: string
  destinationInfo: string
  notes: string
  processedAt: string | null
  createdAt: string
}

interface WalletData {
  id: string
  email: string
  balance: number
  pending: number
  withdrawn: number
  currency: string
  assets: WalletAsset[]
  transactions: Transaction[]
  withdrawals: WithdrawalRequest[]
}

const assetIcons: Record<string, string> = {
  USD: '$',
  EUR: '\u20ac',
  GBP: '\u00a3',
  ZAR: 'R',
  USDT: '\u212e',
  BTC: '\u20bf',
  ETH: '\u039e',
  SOL: '\u25ce',
}

const statusConfig: Record<string, { color: string; icon: typeof Clock; label: string }> = {
  pending: { color: 'text-yellow-400 border-yellow-400/30 bg-yellow-400/10', icon: Clock, label: 'Pending' },
  processing: { color: 'text-blue-400 border-blue-400/30 bg-blue-400/10', icon: Loader2, label: 'Processing' },
  completed: { color: 'text-fw-green border-fw-green/30 bg-fw-green/10', icon: CheckCircle2, label: 'Completed' },
  failed: { color: 'text-fw-red border-fw-red/30 bg-fw-red/10', icon: XCircle, label: 'Failed' },
  cancelled: { color: 'text-fw-dim border-fw-border bg-fw-bg', icon: XCircle, label: 'Cancelled' },
}

type WithdrawStep = 'select' | 'destination' | 'confirm' | 'processing' | 'success' | 'error'

interface BankDetails {
  bankName: string
  accountHolder: string
  accountNumber: string
  routingNumber: string
}

interface CryptoDetails {
  walletAddress: string
  network: string
}

export default function WalletView() {
  const { user, localUser, isDemoMode } = useAuth()
  const email = user?.email || localUser?.email || ''

  const [wallet, setWallet] = useState<WalletData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Withdraw dialog state
  const [withdrawOpen, setWithdrawOpen] = useState(false)
  const [withdrawStep, setWithdrawStep] = useState<WithdrawStep>('select')
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [withdrawAsset, setWithdrawAsset] = useState('USD')
  const [destinationType, setDestinationType] = useState<'bank' | 'crypto'>('bank')
  const [bankDetails, setBankDetails] = useState<BankDetails>({
    bankName: '',
    accountHolder: '',
    accountNumber: '',
    routingNumber: '',
  })
  const [cryptoDetails, setCryptoDetails] = useState<CryptoDetails>({
    walletAddress: '',
    network: '',
  })
  const [withdrawNotes, setWithdrawNotes] = useState('')
  const [withdrawError, setWithdrawError] = useState('')
  const [createdWithdrawal, setCreatedWithdrawal] = useState<WithdrawalRequest | null>(null)

  // Cancel withdrawal state
  const [cancellingId, setCancellingId] = useState<string | null>(null)

  // Fetch wallet data
  const fetchWallet = useCallback(async () => {
    if (!email) return
    try {
      setLoading(true)
      setError(null)
      const res = await fetch(`/api/wallet?email=${encodeURIComponent(email)}`)
      if (!res.ok) throw new Error('Failed to load wallet')
      const data = await res.json()
      setWallet(data.wallet)
    } catch (err) {
      console.error('Wallet fetch error:', err)
      setError('Failed to load wallet data')
    } finally {
      setLoading(false)
    }
  }, [email])

  useEffect(() => {
    fetchWallet()
  }, [fetchWallet])

  // Wealth chart data from transactions
  const wealthData = wallet
    ? (() => {
        const txs = [...wallet.transactions].reverse()
        let running = 0
        return txs.map((tx, i) => {
          running += tx.amount
          return {
            date: new Date(tx.createdAt).toLocaleDateString('en', { month: 'short', day: 'numeric' }),
            value: wallet.balance - running + tx.amount > 0 ? wallet.balance - running + tx.amount : running,
          }
        }).slice(-7)
      })()
    : [
        { date: 'Sep', value: 5200 },
        { date: 'Oct', value: 8400 },
        { date: 'Nov', value: 12100 },
        { date: 'Dec', value: 15800 },
        { date: 'Jan', value: 19200 },
        { date: 'Feb', value: 22400 },
        { date: 'Mar', value: 24580 },
      ]

  // Selected asset for withdrawal
  const selectedAsset = wallet?.assets.find((a) => a.symbol === withdrawAsset)
  const withdrawAmountNum = parseFloat(withdrawAmount) || 0

  // Validate withdrawal
  const getValidationError = (): string | null => {
    if (!withdrawAmountNum || withdrawAmountNum <= 0) return 'Enter a valid amount'
    if (withdrawAmountNum < 10) return 'Minimum withdrawal is $10'
    if (!selectedAsset) return 'Select an asset'
    if (selectedAsset.type === 'fiat') {
      if (withdrawAmountNum > (wallet?.balance || 0)) return 'Insufficient balance'
    } else {
      if (withdrawAmountNum > (selectedAsset?.amount || 0)) return `Insufficient ${withdrawAsset} balance`
    }
    return null
  }

  // Validate destination
  const getDestinationError = (): string | null => {
    if (destinationType === 'bank') {
      if (!bankDetails.bankName.trim()) return 'Bank name is required'
      if (!bankDetails.accountHolder.trim()) return 'Account holder name is required'
      if (!bankDetails.accountNumber.trim()) return 'Account number is required'
      if (!bankDetails.routingNumber.trim()) return 'Routing number is required'
    } else {
      if (!cryptoDetails.walletAddress.trim()) return 'Wallet address is required'
      if (!cryptoDetails.network.trim()) return 'Network is required'
    }
    return null
  }

  // Handle withdrawal submission
  const handleWithdraw = async () => {
    if (!email || !selectedAsset) return

    setWithdrawStep('processing')
    setWithdrawError('')

    try {
      const destinationInfo = destinationType === 'bank'
        ? bankDetails
        : cryptoDetails

      const res = await fetch('/api/wallet/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          amount: withdrawAmountNum,
          assetSymbol: withdrawAsset,
          destinationType,
          destinationInfo,
          notes: withdrawNotes,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Withdrawal failed')
      }

      setCreatedWithdrawal(data.withdrawal)
      setWithdrawStep('success')

      // Auto-complete the withdrawal after 3 seconds (simulate processing)
      setTimeout(async () => {
        try {
          await fetch('/api/wallet/withdraw', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              withdrawalId: data.withdrawal.id,
              status: 'completed',
            }),
          })
          // Refresh wallet data
          fetchWallet()
        } catch (e) {
          console.error('Auto-complete error:', e)
        }
      }, 3000)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Withdrawal failed'
      setWithdrawError(message)
      setWithdrawStep('error')
    }
  }

  // Handle cancel withdrawal
  const handleCancelWithdrawal = async (withdrawalId: string) => {
    setCancellingId(withdrawalId)
    try {
      const res = await fetch('/api/wallet/withdraw', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          withdrawalId,
          status: 'cancelled',
        }),
      })

      if (res.ok) {
        fetchWallet()
      }
    } catch (err) {
      console.error('Cancel withdrawal error:', err)
    } finally {
      setCancellingId(null)
    }
  }

  // Reset withdraw dialog
  const resetWithdrawDialog = () => {
    setWithdrawStep('select')
    setWithdrawAmount('')
    setWithdrawAsset('USD')
    setDestinationType('bank')
    setBankDetails({ bankName: '', accountHolder: '', accountNumber: '', routingNumber: '' })
    setCryptoDetails({ walletAddress: '', network: '' })
    setWithdrawNotes('')
    setWithdrawError('')
    setCreatedWithdrawal(null)
  }

  // Loading state
  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-fw-gold animate-spin" />
          <span className="text-xs font-mono tracking-widest uppercase text-fw-dim">
            Loading Wallet...
          </span>
        </div>
      </div>
    )
  }

  // Error state
  if (error || !wallet) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <Card className="bg-fw-surface border-fw-border max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <AlertTriangle className="w-10 h-10 text-fw-red mx-auto mb-3" />
            <p className="text-sm font-mono text-fw-text mb-4">{error || 'Wallet not found'}</p>
            <Button
              onClick={fetchWallet}
              className="bg-fw-gold/10 text-fw-gold border border-fw-gold/30 hover:bg-fw-gold/20 font-mono"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const fiatAssets = wallet.assets.filter((a) => a.type === 'fiat')
  const cryptoAssets = wallet.assets.filter((a) => a.type === 'crypto')

  return (
    <div className="p-4 md:p-6 space-y-6 fw-scrollbar overflow-y-auto h-full">
      {/* Balance Card */}
      <Card className="bg-fw-surface border-fw-border relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-fw-gold/5 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2" />
        <CardContent className="relative z-10 pt-8 pb-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <p className="text-xs font-mono tracking-widest uppercase text-fw-dim mb-2">
                Total Liquid Balance
              </p>
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-bold font-mono text-fw-text">
                  ${wallet.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span className="text-sm text-fw-dim font-mono">
                  {wallet.currency}
                </span>
              </div>
              <div className="flex items-center gap-4 mt-3">
                <div className="flex items-center gap-1">
                  <TrendingUp className="w-3 h-3 text-fw-green" />
                  <span className="text-xs text-fw-green font-mono">
                    +${wallet.pending.toLocaleString()} pending
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <ArrowUpRight className="w-3 h-3 text-fw-dim" />
                  <span className="text-xs text-fw-dim font-mono">
                    ${wallet.withdrawn.toLocaleString()} withdrawn
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button
                onClick={fetchWallet}
                variant="ghost"
                size="sm"
                className="h-8 text-fw-dim hover:text-fw-text"
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
              <Button
                onClick={() => {
                  resetWithdrawDialog()
                  setWithdrawOpen(true)
                }}
                className="bg-fw-gold/10 text-fw-gold border border-fw-gold/30 hover:bg-fw-gold/20 font-mono tracking-wider"
              >
                <DollarSign className="w-4 h-4 mr-2" />
                WITHDRAW
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs: Portfolio / Transactions / Withdrawals */}
      <Tabs defaultValue="portfolio" className="space-y-4">
        <TabsList className="bg-fw-bg border border-fw-border">
          <TabsTrigger value="portfolio" className="text-xs font-mono tracking-wider data-[state=active]:bg-fw-surface">
            Portfolio
          </TabsTrigger>
          <TabsTrigger value="transactions" className="text-xs font-mono tracking-wider data-[state=active]:bg-fw-surface">
            Transactions
          </TabsTrigger>
          <TabsTrigger value="withdrawals" className="text-xs font-mono tracking-wider data-[state=active]:bg-fw-surface">
            Withdrawals
          </TabsTrigger>
        </TabsList>

        {/* Portfolio Tab */}
        <TabsContent value="portfolio" className="space-y-6">
          {/* Wealth Growth Chart */}
          <Card className="bg-fw-surface border-fw-border">
            <CardHeader>
              <CardTitle className="text-xs font-mono tracking-widest uppercase text-fw-dim">
                Wealth Growth Trajectory
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={wealthData}>
                    <defs>
                      <linearGradient id="colorWealth" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#161b22" />
                    <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} />
                    <YAxis stroke="#94a3b8" fontSize={11} />
                    <Tooltip
                      contentStyle={{
                        background: '#0a0e14',
                        border: '1px solid #161b22',
                        borderRadius: '8px',
                        fontSize: '12px',
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke="#f59e0b"
                      fill="url(#colorWealth)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Asset Grid */}
          <div>
            <h3 className="text-xs font-mono tracking-widest uppercase text-fw-dim mb-4">
              Multi-Asset Portfolio
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {wallet.assets.map((asset) => (
                <Card
                  key={asset.id}
                  className="bg-fw-surface border-fw-border hover:border-fw-accent/30 transition-colors"
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-mono tracking-widest text-fw-dim">
                        {asset.symbol}
                      </span>
                      <Badge
                        variant="outline"
                        className={`text-[9px] ${
                          asset.type === 'crypto'
                            ? 'border-fw-purple/50 text-fw-purple'
                            : 'border-fw-accent/50 text-fw-accent'
                        }`}
                      >
                        {asset.type}
                      </Badge>
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-lg font-bold font-mono">
                        {asset.type === 'crypto' ? '' : '$'}
                        {asset.amount.toLocaleString(undefined, { minimumFractionDigits: asset.type === 'crypto' ? 3 : 2, maximumFractionDigits: asset.type === 'crypto' ? 6 : 2 })}
                      </span>
                    </div>
                    <p className="text-[10px] text-fw-dim font-mono mt-0.5">
                      {asset.name}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Security Protocol */}
          <Card className="bg-fw-surface border-fw-border">
            <CardHeader className="flex flex-row items-center gap-2">
              <Shield className="w-4 h-4 text-fw-green" />
              <CardTitle className="text-xs font-mono tracking-widest uppercase text-fw-dim">
                Security Protocol
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="flex items-center gap-3 p-3 rounded-lg border border-fw-border bg-fw-bg">
                  <Lock className="w-5 h-5 text-fw-green" />
                  <div>
                    <p className="text-xs font-bold tracking-wider uppercase">
                      End-to-End Encrypted
                    </p>
                    <p className="text-[10px] text-fw-dim">AES-256-GCM</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg border border-fw-border bg-fw-bg">
                  <Shield className="w-5 h-5 text-fw-accent" />
                  <div>
                    <p className="text-xs font-bold tracking-wider uppercase">
                      Multi-Factor Auth
                    </p>
                    <p className="text-[10px] text-fw-dim">Hardware + Biometric</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg border border-fw-border bg-fw-bg">
                  <Coins className="w-5 h-5 text-fw-gold" />
                  <div>
                    <p className="text-xs font-bold tracking-wider uppercase">
                      Cold Storage
                    </p>
                    <p className="text-[10px] text-fw-dim">90% assets offline</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Transactions Tab */}
        <TabsContent value="transactions">
          <Card className="bg-fw-surface border-fw-border">
            <CardHeader>
              <CardTitle className="text-xs font-mono tracking-widest uppercase text-fw-dim">
                Transaction Audit Trail
              </CardTitle>
            </CardHeader>
            <CardContent>
              {wallet.transactions.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-sm font-mono text-fw-dim">No transactions yet</p>
                </div>
              ) : (
                <div className="overflow-x-auto max-h-96 overflow-y-auto fw-scrollbar">
                  <table className="w-full text-xs font-mono">
                    <thead className="sticky top-0 bg-fw-surface">
                      <tr className="border-b border-fw-border">
                        <th className="text-left py-2 px-3 text-fw-dim tracking-widest uppercase">Date</th>
                        <th className="text-left py-2 px-3 text-fw-dim tracking-widest uppercase">Description</th>
                        <th className="text-left py-2 px-3 text-fw-dim tracking-widest uppercase">Status</th>
                        <th className="text-right py-2 px-3 text-fw-dim tracking-widest uppercase">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {wallet.transactions.map((tx) => (
                        <tr
                          key={tx.id}
                          className="border-b border-fw-border/50 hover:bg-fw-bg/50"
                        >
                          <td className="py-2 px-3 text-fw-dim whitespace-nowrap">
                            {new Date(tx.createdAt).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </td>
                          <td className="py-2 px-3">
                            <div className="flex items-center gap-2">
                              {tx.type === 'credit' ? (
                                <ArrowDownLeft className="w-3 h-3 text-fw-green flex-shrink-0" />
                              ) : (
                                <ArrowUpRight className="w-3 h-3 text-fw-red flex-shrink-0" />
                              )}
                              {tx.description}
                            </div>
                          </td>
                          <td className="py-2 px-3">
                            <Badge
                              variant="outline"
                              className={`text-[9px] ${
                                tx.status === 'completed'
                                  ? 'border-fw-green/30 text-fw-green'
                                  : tx.status === 'pending'
                                  ? 'border-yellow-400/30 text-yellow-400'
                                  : 'border-fw-red/30 text-fw-red'
                              }`}
                            >
                              {tx.status}
                            </Badge>
                          </td>
                          <td
                            className={`py-2 px-3 text-right font-bold ${
                              tx.type === 'credit' ? 'text-fw-green' : 'text-fw-red'
                            }`}
                          >
                            {tx.type === 'credit' ? '+' : ''}${Math.abs(tx.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Withdrawals Tab */}
        <TabsContent value="withdrawals">
          <Card className="bg-fw-surface border-fw-border">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-xs font-mono tracking-widest uppercase text-fw-dim">
                Withdrawal History
              </CardTitle>
              <Button
                onClick={() => {
                  resetWithdrawDialog()
                  setWithdrawOpen(true)
                }}
                size="sm"
                className="bg-fw-gold/10 text-fw-gold border border-fw-gold/30 hover:bg-fw-gold/20 font-mono text-xs"
              >
                <DollarSign className="w-3 h-3 mr-1" />
                New Withdrawal
              </Button>
            </CardHeader>
            <CardContent>
              {wallet.withdrawals.length === 0 ? (
                <div className="text-center py-8">
                  <WalletIcon className="w-10 h-10 text-fw-dim mx-auto mb-3 opacity-30" />
                  <p className="text-sm font-mono text-fw-dim">No withdrawal requests yet</p>
                  <p className="text-xs text-fw-dim mt-1">Click &quot;New Withdrawal&quot; to get started</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto fw-scrollbar">
                  {wallet.withdrawals.map((wd) => {
                    const config = statusConfig[wd.status] || statusConfig.pending
                    const StatusIcon = config.icon
                    const destInfo = (() => {
                      try { return JSON.parse(wd.destinationInfo) } catch { return {} }
                    })()

                    return (
                      <div
                        key={wd.id}
                        className="p-4 rounded-lg border border-fw-border bg-fw-bg/50 space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <StatusIcon className={`w-4 h-4 ${config.color.split(' ')[0]} ${wd.status === 'processing' ? 'animate-spin' : ''}`} />
                            <span className="text-sm font-bold font-mono">
                              {wd.assetSymbol} {wd.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          </div>
                          <Badge
                            variant="outline"
                            className={`text-[9px] ${config.color}`}
                          >
                            {config.label}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-fw-dim">
                          <div>
                            <span className="uppercase tracking-widest">Destination:</span>{' '}
                            {wd.destinationType === 'bank'
                              ? (destInfo as Record<string, string>)?.bankName || 'Bank Account'
                              : (destInfo as Record<string, string>)?.network || 'Crypto Wallet'}
                          </div>
                          <div>
                            <span className="uppercase tracking-widest">Date:</span>{' '}
                            {new Date(wd.createdAt).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </div>
                        </div>
                        {wd.status === 'processing' && (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Progress value={66} className="h-1.5 flex-1" />
                              <span className="text-[9px] font-mono text-fw-dim">Processing</span>
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              disabled={cancellingId === wd.id}
                              onClick={() => handleCancelWithdrawal(wd.id)}
                              className="text-fw-red hover:text-fw-red hover:bg-fw-red/10 text-[10px] font-mono h-7"
                            >
                              {cancellingId === wd.id ? (
                                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                              ) : (
                                <XCircle className="w-3 h-3 mr-1" />
                              )}
                              Cancel & Refund
                            </Button>
                          </div>
                        )}
                        {wd.processedAt && (
                          <p className="text-[9px] font-mono text-fw-dim">
                            Processed: {new Date(wd.processedAt).toLocaleString()}
                          </p>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Withdraw Dialog */}
      <Dialog
        open={withdrawOpen}
        onOpenChange={(open) => {
          if (!open) resetWithdrawDialog()
          setWithdrawOpen(open)
        }}
      >
        <DialogContent className="bg-fw-surface border-fw-border max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-fw-text font-mono tracking-widest text-sm uppercase flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-fw-gold" />
              {withdrawStep === 'select' && 'Withdraw Funds — Step 1'}
              {withdrawStep === 'destination' && 'Withdraw Funds — Step 2'}
              {withdrawStep === 'confirm' && 'Confirm Withdrawal'}
              {withdrawStep === 'processing' && 'Processing Withdrawal...'}
              {withdrawStep === 'success' && 'Withdrawal Submitted'}
              {withdrawStep === 'error' && 'Withdrawal Failed'}
            </DialogTitle>
          </DialogHeader>

          {/* Step 1: Select Asset & Amount */}
          {withdrawStep === 'select' && (
            <div className="space-y-5 mt-4">
              {/* Available balance banner */}
              <div className="p-3 rounded-lg border border-fw-border bg-fw-bg">
                <p className="text-[10px] font-mono tracking-widest uppercase text-fw-dim mb-1">
                  Available Balance
                </p>
                <p className="text-xl font-bold font-mono text-fw-gold">
                  ${wallet.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>

              {/* Asset selection */}
              <div>
                <Label className="text-xs font-mono tracking-widest uppercase text-fw-dim">
                  Select Asset
                </Label>
                <Select value={withdrawAsset} onValueChange={setWithdrawAsset}>
                  <SelectTrigger className="w-full mt-1 bg-fw-bg border-fw-border text-fw-text font-mono">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-fw-surface border-fw-border">
                    {wallet.assets.map((asset) => (
                      <SelectItem key={asset.id} value={asset.symbol} className="font-mono">
                        {assetIcons[asset.symbol]} {asset.name} ({asset.type === 'crypto' ? '' : '$'}{asset.amount.toLocaleString()})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Amount input */}
              <div>
                <Label className="text-xs font-mono tracking-widest uppercase text-fw-dim">
                  Amount
                </Label>
                <div className="relative mt-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-fw-dim font-mono">
                    {selectedAsset?.type === 'crypto' ? withdrawAsset : '$'}
                  </span>
                  <Input
                    type="number"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    placeholder="0.00"
                    min={0}
                    step="0.01"
                    className="bg-fw-bg border-fw-border text-fw-text font-mono pl-10 focus:border-fw-gold/50"
                  />
                </div>
                {withdrawAmountNum > 0 && (
                  <div className="flex items-center justify-between mt-1">
                    <p className={`text-[10px] font-mono ${getValidationError() ? 'text-fw-red' : 'text-fw-green'}`}>
                      {getValidationError() || 'Amount is valid'}
                    </p>
                    {selectedAsset?.type === 'fiat' && (
                      <button
                        onClick={() => setWithdrawAmount(wallet.balance.toString())}
                        className="text-[10px] font-mono text-fw-gold hover:text-fw-gold/80"
                      >
                        Max: ${wallet.balance.toLocaleString()}
                      </button>
                    )}
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button
                  variant="ghost"
                  onClick={() => setWithdrawOpen(false)}
                  className="text-fw-dim font-mono"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    if (getValidationError()) return
                    setWithdrawStep('destination')
                  }}
                  disabled={!!getValidationError()}
                  className="bg-fw-gold/10 text-fw-gold border border-fw-gold/30 hover:bg-fw-gold/20 font-mono"
                >
                  Continue
                  <ArrowUpRight className="w-4 h-4 ml-1" />
                </Button>
              </DialogFooter>
            </div>
          )}

          {/* Step 2: Destination Details */}
          {withdrawStep === 'destination' && (
            <div className="space-y-5 mt-4">
              {/* Destination type toggle */}
              <div>
                <Label className="text-xs font-mono tracking-widest uppercase text-fw-dim">
                  Withdrawal Method
                </Label>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <button
                    onClick={() => setDestinationType('bank')}
                    className={`p-3 rounded-lg border text-xs font-mono tracking-wider flex items-center gap-2 transition-colors ${
                      destinationType === 'bank'
                        ? 'border-fw-gold/50 bg-fw-gold/10 text-fw-gold'
                        : 'border-fw-border bg-fw-bg text-fw-dim hover:border-fw-gold/30'
                    }`}
                  >
                    <Banknote className="w-4 h-4" />
                    Bank Transfer
                  </button>
                  <button
                    onClick={() => setDestinationType('crypto')}
                    className={`p-3 rounded-lg border text-xs font-mono tracking-wider flex items-center gap-2 transition-colors ${
                      destinationType === 'crypto'
                        ? 'border-fw-gold/50 bg-fw-gold/10 text-fw-gold'
                        : 'border-fw-border bg-fw-bg text-fw-dim hover:border-fw-gold/30'
                    }`}
                  >
                    <Coins className="w-4 h-4" />
                    Crypto Wallet
                  </button>
                </div>
              </div>

              {/* Bank details form */}
              {destinationType === 'bank' && (
                <div className="space-y-3">
                  <div>
                    <Label className="text-xs font-mono tracking-widest uppercase text-fw-dim">
                      Bank Name
                    </Label>
                    <Input
                      value={bankDetails.bankName}
                      onChange={(e) => setBankDetails({ ...bankDetails, bankName: e.target.value })}
                      placeholder="e.g. FNB, Standard Bank, Capitec"
                      className="bg-fw-bg border-fw-border text-fw-text font-mono mt-1 focus:border-fw-gold/50"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-mono tracking-widest uppercase text-fw-dim">
                      Account Holder Name
                    </Label>
                    <Input
                      value={bankDetails.accountHolder}
                      onChange={(e) => setBankDetails({ ...bankDetails, accountHolder: e.target.value })}
                      placeholder="Full name as on account"
                      className="bg-fw-bg border-fw-border text-fw-text font-mono mt-1 focus:border-fw-gold/50"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs font-mono tracking-widest uppercase text-fw-dim">
                        Account Number
                      </Label>
                      <Input
                        value={bankDetails.accountNumber}
                        onChange={(e) => setBankDetails({ ...bankDetails, accountNumber: e.target.value })}
                        placeholder="0000000000"
                        className="bg-fw-bg border-fw-border text-fw-text font-mono mt-1 focus:border-fw-gold/50"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-mono tracking-widest uppercase text-fw-dim">
                        Routing / Branch Code
                      </Label>
                      <Input
                        value={bankDetails.routingNumber}
                        onChange={(e) => setBankDetails({ ...bankDetails, routingNumber: e.target.value })}
                        placeholder="000000"
                        className="bg-fw-bg border-fw-border text-fw-text font-mono mt-1 focus:border-fw-gold/50"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Crypto destination form */}
              {destinationType === 'crypto' && (
                <div className="space-y-3">
                  <div>
                    <Label className="text-xs font-mono tracking-widest uppercase text-fw-dim">
                      Wallet Address
                    </Label>
                    <Input
                      value={cryptoDetails.walletAddress}
                      onChange={(e) => setCryptoDetails({ ...cryptoDetails, walletAddress: e.target.value })}
                      placeholder="0x... or wallet address"
                      className="bg-fw-bg border-fw-border text-fw-text font-mono mt-1 focus:border-fw-gold/50"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-mono tracking-widest uppercase text-fw-dim">
                      Network
                    </Label>
                    <Select value={cryptoDetails.network} onValueChange={(v) => setCryptoDetails({ ...cryptoDetails, network: v })}>
                      <SelectTrigger className="bg-fw-bg border-fw-border text-fw-text font-mono mt-1">
                        <SelectValue placeholder="Select network" />
                      </SelectTrigger>
                      <SelectContent className="bg-fw-surface border-fw-border">
                        <SelectItem value="Ethereum (ERC-20)" className="font-mono">Ethereum (ERC-20)</SelectItem>
                        <SelectItem value="Bitcoin" className="font-mono">Bitcoin</SelectItem>
                        <SelectItem value="Solana" className="font-mono">Solana</SelectItem>
                        <SelectItem value="Tron (TRC-20)" className="font-mono">Tron (TRC-20)</SelectItem>
                        <SelectItem value="BSC (BEP-20)" className="font-mono">BSC (BEP-20)</SelectItem>
                        <SelectItem value="Polygon" className="font-mono">Polygon</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {/* Notes */}
              <div>
                <Label className="text-xs font-mono tracking-widest uppercase text-fw-dim">
                  Notes (optional)
                </Label>
                <Input
                  value={withdrawNotes}
                  onChange={(e) => setWithdrawNotes(e.target.value)}
                  placeholder="Internal reference note"
                  className="bg-fw-bg border-fw-border text-fw-text font-mono mt-1 focus:border-fw-gold/50"
                />
              </div>

              <DialogFooter>
                <Button
                  variant="ghost"
                  onClick={() => setWithdrawStep('select')}
                  className="text-fw-dim font-mono"
                >
                  Back
                </Button>
                <Button
                  onClick={() => {
                    if (getDestinationError()) return
                    setWithdrawStep('confirm')
                  }}
                  disabled={!!getDestinationError()}
                  className="bg-fw-gold/10 text-fw-gold border border-fw-gold/30 hover:bg-fw-gold/20 font-mono"
                >
                  Review
                  <ExternalLink className="w-4 h-4 ml-1" />
                </Button>
              </DialogFooter>
            </div>
          )}

          {/* Step 3: Confirm */}
          {withdrawStep === 'confirm' && (
            <div className="space-y-5 mt-4">
              <div className="p-4 rounded-lg border border-fw-gold/20 bg-fw-gold/5 space-y-3">
                <p className="text-[10px] font-mono tracking-widest uppercase text-fw-gold">
                  Withdrawal Summary
                </p>
                <div className="space-y-2 text-xs font-mono">
                  <div className="flex justify-between">
                    <span className="text-fw-dim">Amount</span>
                    <span className="text-fw-text font-bold">
                      {selectedAsset?.type === 'crypto' ? '' : '$'}{withdrawAmountNum.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {withdrawAsset}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-fw-dim">Asset</span>
                    <span className="text-fw-text">{selectedAsset?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-fw-dim">Method</span>
                    <span className="text-fw-text capitalize">{destinationType === 'bank' ? 'Bank Transfer' : 'Crypto Wallet'}</span>
                  </div>
                  {destinationType === 'bank' && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-fw-dim">Bank</span>
                        <span className="text-fw-text">{bankDetails.bankName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-fw-dim">Account</span>
                        <span className="text-fw-text">****{bankDetails.accountNumber.slice(-4)}</span>
                      </div>
                    </>
                  )}
                  {destinationType === 'crypto' && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-fw-dim">Network</span>
                        <span className="text-fw-text">{cryptoDetails.network}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-fw-dim">Wallet</span>
                        <span className="text-fw-text truncate max-w-[180px]">{cryptoDetails.walletAddress}</span>
                      </div>
                    </>
                  )}
                  <div className="border-t border-fw-border pt-2 flex justify-between">
                    <span className="text-fw-dim">Remaining Balance</span>
                    <span className="text-fw-green font-bold">
                      ${selectedAsset?.type === 'fiat'
                        ? (wallet.balance - withdrawAmountNum).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                        : wallet.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                      }
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-2 p-3 rounded-lg border border-yellow-500/20 bg-yellow-500/5">
                <AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                <p className="text-[10px] font-mono text-yellow-500/90">
                  Please verify all details carefully. Withdrawals to bank accounts typically process within 1-3 business days. Crypto withdrawals may take up to 30 minutes.
                </p>
              </div>

              <DialogFooter>
                <Button
                  variant="ghost"
                  onClick={() => setWithdrawStep('destination')}
                  className="text-fw-dim font-mono"
                >
                  Back
                </Button>
                <Button
                  onClick={handleWithdraw}
                  className="bg-fw-gold text-fw-bg hover:bg-fw-gold/90 font-mono tracking-wider"
                >
                  Confirm Withdrawal
                  <DollarSign className="w-4 h-4 ml-1" />
                </Button>
              </DialogFooter>
            </div>
          )}

          {/* Processing */}
          {withdrawStep === 'processing' && (
            <div className="py-8 text-center space-y-4">
              <Loader2 className="w-10 h-10 text-fw-gold animate-spin mx-auto" />
              <p className="text-sm font-mono text-fw-text tracking-wider">
                Processing your withdrawal...
              </p>
              <p className="text-xs font-mono text-fw-dim">
                Please wait while we process your {withdrawAsset} withdrawal
              </p>
            </div>
          )}

          {/* Success */}
          {withdrawStep === 'success' && createdWithdrawal && (
            <div className="py-6 text-center space-y-4">
              <div className="w-14 h-14 rounded-full bg-fw-green/10 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8 text-fw-green" />
              </div>
              <div>
                <p className="text-sm font-mono text-fw-text tracking-wider font-bold">
                  Withdrawal Submitted
                </p>
                <p className="text-xs font-mono text-fw-dim mt-1">
                  Your withdrawal of {selectedAsset?.type === 'crypto' ? '' : '$'}{withdrawAmountNum.toLocaleString()} {withdrawAsset} has been submitted and is being processed.
                </p>
              </div>
              <div className="p-3 rounded-lg border border-fw-border bg-fw-bg text-[10px] font-mono text-fw-dim text-left">
                <div className="flex justify-between mb-1">
                  <span>Reference ID</span>
                  <span className="text-fw-text">{createdWithdrawal.id.slice(0, 16)}...</span>
                </div>
                <div className="flex justify-between mb-1">
                  <span>Status</span>
                  <span className="text-blue-400">Processing</span>
                </div>
                <div className="flex justify-between">
                  <span>Submitted</span>
                  <span>{new Date(createdWithdrawal.createdAt).toLocaleString()}</span>
                </div>
              </div>
              <Button
                onClick={() => {
                  setWithdrawOpen(false)
                  resetWithdrawDialog()
                  fetchWallet()
                }}
                className="bg-fw-gold/10 text-fw-gold border border-fw-gold/30 hover:bg-fw-gold/20 font-mono"
              >
                Done
              </Button>
            </div>
          )}

          {/* Error */}
          {withdrawStep === 'error' && (
            <div className="py-6 text-center space-y-4">
              <div className="w-14 h-14 rounded-full bg-fw-red/10 flex items-center justify-center mx-auto">
                <XCircle className="w-8 h-8 text-fw-red" />
              </div>
              <div>
                <p className="text-sm font-mono text-fw-text tracking-wider font-bold">
                  Withdrawal Failed
                </p>
                <p className="text-xs font-mono text-fw-red mt-1">{withdrawError}</p>
              </div>
              <div className="flex items-center gap-3 justify-center">
                <Button
                  variant="ghost"
                  onClick={() => {
                    setWithdrawOpen(false)
                    resetWithdrawDialog()
                    fetchWallet()
                  }}
                  className="text-fw-dim font-mono"
                >
                  Close
                </Button>
                <Button
                  onClick={() => setWithdrawStep('confirm')}
                  className="bg-fw-gold/10 text-fw-gold border border-fw-gold/30 hover:bg-fw-gold/20 font-mono"
                >
                  Try Again
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
