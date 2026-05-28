'use client'

import { useFreedomStore } from '@/lib/freedom-store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  DollarSign,
  TrendingUp,
  ArrowUpRight,
  Shield,
  Lock,
  Coins,
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
import { useState } from 'react'

const wealthData = [
  { month: 'Sep', value: 5200 },
  { month: 'Oct', value: 8400 },
  { month: 'Nov', value: 12100 },
  { month: 'Dec', value: 15800 },
  { month: 'Jan', value: 19200 },
  { month: 'Feb', value: 22400 },
  { month: 'Mar', value: 24580 },
]

const assetIcons: Record<string, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  ZAR: 'R',
  USDT: '₮',
  BTC: '₿',
  ETH: 'Ξ',
  SOL: '◎',
}

export default function WalletView() {
  const { wallet } = useFreedomStore()
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [withdrawAsset, setWithdrawAsset] = useState('USD')

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
                  ${wallet.balance.toLocaleString()}
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

            <Dialog>
              <DialogTrigger asChild>
                <Button className="bg-fw-gold/10 text-fw-gold border border-fw-gold/30 hover:bg-fw-gold/20 font-mono tracking-wider">
                  <DollarSign className="w-4 h-4 mr-2" />
                  WITHDRAW
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-fw-surface border-fw-border">
                <DialogHeader>
                  <DialogTitle className="text-fw-text font-mono tracking-widest text-sm uppercase">
                    Withdraw Funds
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div>
                    <label className="text-xs font-mono tracking-widest uppercase text-fw-dim">
                      Amount
                    </label>
                    <input
                      type="number"
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full mt-1 bg-fw-bg border border-fw-border rounded px-3 py-2 text-fw-text font-mono focus:border-fw-gold/50 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-mono tracking-widest uppercase text-fw-dim">
                      Asset
                    </label>
                    <select
                      value={withdrawAsset}
                      onChange={(e) => setWithdrawAsset(e.target.value)}
                      className="w-full mt-1 bg-fw-bg border border-fw-border rounded px-3 py-2 text-fw-text font-mono focus:border-fw-gold/50 outline-none"
                    >
                      {wallet.assets
                        .filter((a) => a.type === 'fiat')
                        .map((a) => (
                          <option key={a.symbol} value={a.symbol}>
                            {a.name} ({assetIcons[a.symbol]}{a.amount.toLocaleString()})
                          </option>
                        ))}
                    </select>
                  </div>
                  <Button className="w-full bg-fw-gold/10 text-fw-gold border border-fw-gold/30 hover:bg-fw-gold/20 font-mono">
                    Confirm Withdrawal
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

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
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} />
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
              key={asset.symbol}
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
                    {asset.amount.toLocaleString()}
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

      {/* Transaction Audit Table */}
      <Card className="bg-fw-surface border-fw-border">
        <CardHeader>
          <CardTitle className="text-xs font-mono tracking-widest uppercase text-fw-dim">
            Transaction Audit Trail
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-xs font-mono">
              <thead>
                <tr className="border-b border-fw-border">
                  <th className="text-left py-2 px-3 text-fw-dim tracking-widest uppercase">
                    Date
                  </th>
                  <th className="text-left py-2 px-3 text-fw-dim tracking-widest uppercase">
                    Description
                  </th>
                  <th className="text-right py-2 px-3 text-fw-dim tracking-widest uppercase">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody>
                {wallet.transactions.map((tx) => (
                  <tr
                    key={tx.id}
                    className="border-b border-fw-border/50 hover:bg-fw-bg/50"
                  >
                    <td className="py-2 px-3 text-fw-dim">{tx.date}</td>
                    <td className="py-2 px-3">{tx.desc}</td>
                    <td
                      className={`py-2 px-3 text-right font-bold ${
                        tx.type === 'credit'
                          ? 'text-fw-green'
                          : 'text-fw-red'
                      }`}
                    >
                      {tx.type === 'credit' ? '+' : ''}${Math.abs(tx.amount).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

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
    </div>
  )
}
