'use client'

import { useFreedomStore } from '@/lib/freedom-store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Users,
  Brain,
  TrendingUp,
  Filter,
  ChevronDown,
  ChevronUp,
  Mail,
  Clock,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { useState } from 'react'

const pulseData = [
  { week: 'W1', conversions: 8, newLeads: 15 },
  { week: 'W2', conversions: 12, newLeads: 22 },
  { week: 'W3', conversions: 10, newLeads: 18 },
  { week: 'W4', conversions: 15, newLeads: 28 },
  { week: 'W5', conversions: 18, newLeads: 32 },
  { week: 'W6', conversions: 22, newLeads: 35 },
]

const scoreDistribution = [
  { range: '0-20', count: 3 },
  { range: '21-40', count: 7 },
  { range: '41-60', count: 12 },
  { range: '61-80', count: 18 },
  { range: '81-100', count: 8 },
]

export default function LeadIntelligenceView() {
  const { leads, updateLead } = useFreedomStore()
  const [sourceFilter, setSourceFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [expandedLead, setExpandedLead] = useState<string | null>(null)
  const [enrichingId, setEnrichingId] = useState<string | null>(null)
  const [enrichResult, setEnrichResult] = useState<Record<string, string>>({})

  const filteredLeads = leads.filter((lead) => {
    if (sourceFilter !== 'all' && lead.source !== sourceFilter) return false
    if (statusFilter !== 'all' && lead.status !== statusFilter) return false
    return true
  })

  const sources = [...new Set(leads.map((l) => l.source))]
  const statuses = [...new Set(leads.map((l) => l.status))]

  const handleEnrich = async (leadId: string, lead: typeof leads[0]) => {
    setEnrichingId(leadId)
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'enrich',
          data: { name: lead.name, email: lead.email, source: lead.source, score: lead.score },
        }),
      })
      const data = await res.json()
      setEnrichResult((prev) => ({ ...prev, [leadId]: data.result }))
    } catch {
      setEnrichResult((prev) => ({
        ...prev,
        [leadId]: 'Enrichment failed. Try again.',
      }))
    }
    setEnrichingId(null)
  }

  const scoreColor = (score: number) => {
    if (score >= 80) return 'text-fw-green'
    if (score >= 60) return 'text-fw-gold'
    return 'text-fw-red'
  }

  const statusColor = (status: string) => {
    switch (status) {
      case 'Hot':
        return 'border-fw-red/50 text-fw-red'
      case 'Warm':
        return 'border-fw-gold/50 text-fw-gold'
      case 'Cold':
        return 'border-fw-accent/50 text-fw-accent'
      default:
        return 'border-fw-border text-fw-dim'
    }
  }

  return (
    <div className="p-4 md:p-6 space-y-6 fw-scrollbar overflow-y-auto h-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-widest uppercase">
            Lead Intelligence
          </h2>
          <p className="text-fw-dim text-sm font-mono">
            {leads.length} leads tracked • {leads.filter((l) => l.status === 'Hot').length} hot
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={sourceFilter} onValueChange={setSourceFilter}>
            <SelectTrigger className="w-32 bg-fw-bg border-fw-border text-xs">
              <Filter className="w-3 h-3 mr-1" />
              <SelectValue placeholder="Source" />
            </SelectTrigger>
            <SelectContent className="bg-fw-surface border-fw-border">
              <SelectItem value="all">All Sources</SelectItem>
              {sources.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-32 bg-fw-bg border-fw-border text-xs">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="bg-fw-surface border-fw-border">
              <SelectItem value="all">All Status</SelectItem>
              {statuses.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-fw-surface border-fw-border">
          <CardHeader>
            <CardTitle className="text-xs font-mono tracking-widest uppercase text-fw-dim">
              Conversion Pulse
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={pulseData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#161b22" />
                  <XAxis dataKey="week" stroke="#94a3b8" fontSize={11} />
                  <YAxis stroke="#94a3b8" fontSize={11} />
                  <Tooltip
                    contentStyle={{
                      background: '#0a0e14',
                      border: '1px solid #161b22',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="conversions"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={{ fill: '#10b981', r: 3 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="newLeads"
                    stroke="#00f2ff"
                    strokeWidth={2}
                    dot={{ fill: '#00f2ff', r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-fw-surface border-fw-border">
          <CardHeader>
            <CardTitle className="text-xs font-mono tracking-widest uppercase text-fw-dim">
              Score Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={scoreDistribution}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#161b22" />
                  <XAxis dataKey="range" stroke="#94a3b8" fontSize={11} />
                  <YAxis stroke="#94a3b8" fontSize={11} />
                  <Tooltip
                    contentStyle={{
                      background: '#0a0e14',
                      border: '1px solid #161b22',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="count" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lead List */}
      <Card className="bg-fw-surface border-fw-border">
        <CardHeader>
          <CardTitle className="text-xs font-mono tracking-widest uppercase text-fw-dim flex items-center gap-2">
            <Users className="w-4 h-4" />
            Lead Database
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredLeads.map((lead) => (
              <div key={lead.id}>
                <button
                  onClick={() =>
                    setExpandedLead(expandedLead === lead.id ? null : lead.id)
                  }
                  className="w-full flex items-center gap-4 p-4 rounded-lg border border-fw-border bg-fw-bg hover:border-fw-accent/30 transition-colors"
                >
                  {/* Score Ring */}
                  <div className="relative w-12 h-12 flex-shrink-0">
                    <svg className="w-12 h-12 -rotate-90" viewBox="0 0 48 48">
                      <circle
                        cx="24"
                        cy="24"
                        r="20"
                        fill="none"
                        stroke="#161b22"
                        strokeWidth="3"
                      />
                      <circle
                        cx="24"
                        cy="24"
                        r="20"
                        fill="none"
                        stroke={
                          lead.score >= 80
                            ? '#10b981'
                            : lead.score >= 60
                            ? '#f59e0b'
                            : '#ef4444'
                        }
                        strokeWidth="3"
                        strokeDasharray={`${(lead.score / 100) * 125.6} 125.6`}
                        strokeLinecap="round"
                      />
                    </svg>
                    <span
                      className={`absolute inset-0 flex items-center justify-center text-xs font-mono font-bold ${scoreColor(
                        lead.score
                      )}`}
                    >
                      {lead.score}
                    </span>
                  </div>

                  <div className="flex-1 text-left min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold tracking-wider">
                        {lead.name}
                      </span>
                      <Badge
                        variant="outline"
                        className={`text-[9px] ${statusColor(lead.status)}`}
                      >
                        {lead.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Mail className="w-3 h-3 text-fw-dim" />
                      <span className="text-xs text-fw-dim font-mono truncate">
                        {lead.email}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className="text-[9px] border-fw-border text-fw-dim"
                    >
                      {lead.source}
                    </Badge>
                    {expandedLead === lead.id ? (
                      <ChevronUp className="w-4 h-4 text-fw-dim" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-fw-dim" />
                    )}
                  </div>
                </button>

                {expandedLead === lead.id && (
                  <div className="mt-2 ml-16 p-4 rounded-lg border border-fw-border/50 bg-fw-bg/50 space-y-4">
                    {/* Factors */}
                    <div>
                      <h4 className="text-xs font-mono tracking-widest uppercase text-fw-dim mb-2">
                        Scoring Factors
                      </h4>
                      <div className="flex flex-wrap gap-1.5">
                        {lead.factors.map((f) => (
                          <Badge
                            key={f}
                            variant="outline"
                            className="text-[10px] border-fw-accent/30 text-fw-accent"
                          >
                            {f}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Timeline */}
                    <div>
                      <h4 className="text-xs font-mono tracking-widest uppercase text-fw-dim mb-2">
                        Interaction Timeline
                      </h4>
                      <div className="space-y-2">
                        {lead.history.map((h, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-fw-accent flex-shrink-0" />
                            <span className="text-xs text-fw-dim">{h}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* AI Enrichment */}
                    <div>
                      <Button
                        onClick={() => handleEnrich(lead.id, lead)}
                        disabled={enrichingId === lead.id}
                        size="sm"
                        className="bg-fw-accent/10 text-fw-accent border border-fw-accent/30 hover:bg-fw-accent/20 text-xs"
                      >
                        {enrichingId === lead.id ? (
                          <span className="flex items-center gap-2">
                            <span className="w-3 h-3 border-2 border-fw-accent/50 border-t-fw-accent rounded-full animate-spin" />
                            Enriching...
                          </span>
                        ) : (
                          <span className="flex items-center gap-2">
                            <Brain className="w-3 h-3" />
                            AI Enrich
                          </span>
                        )}
                      </Button>
                      {enrichResult[lead.id] && (
                        <div className="mt-3 p-3 rounded-lg border border-fw-accent/20 bg-fw-accent/5 text-xs text-fw-dim leading-relaxed">
                          {enrichResult[lead.id].split('\n').map((line, i) => (
                            <p key={i}>{line}</p>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
