'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import {
  Workflow,
  Play,
  Pause,
  Plus,
  Settings,
  Zap,
  Webhook,
  ArrowRight,
  RefreshCw,
} from 'lucide-react'
import { useState } from 'react'

const workflows = [
  {
    id: 'wf1',
    name: 'Lead Nurture Sequence',
    status: 'ACTIVE',
    steps: 5,
    runs: 142,
    lastRun: '2 min ago',
  },
  {
    id: 'wf2',
    name: 'Content Distribution',
    status: 'ACTIVE',
    steps: 3,
    runs: 89,
    lastRun: '15 min ago',
  },
  {
    id: 'wf3',
    name: 'Revenue Collection',
    status: 'PAUSED',
    steps: 4,
    runs: 56,
    lastRun: '1 hour ago',
  },
  {
    id: 'wf4',
    name: 'Lead Scoring Pipeline',
    status: 'ACTIVE',
    steps: 6,
    runs: 203,
    lastRun: '5 min ago',
  },
]

const outboundSteps = [
  { id: 's1', name: 'Trigger: New Lead', type: 'trigger' },
  { id: 's2', name: 'Score Lead', type: 'process' },
  { id: 's3', name: 'Send Welcome Email', type: 'action' },
  { id: 's4', name: 'Wait 24h', type: 'delay' },
  { id: 's5', name: 'Check Engagement', type: 'condition' },
  { id: 's6', name: 'Route to Sales', type: 'action' },
]

const webhooks = [
  { id: 'wh1', url: '/webhooks/lead-capture', events: ['lead.created', 'lead.updated'], active: true },
  { id: 'wh2', url: '/webhooks/payment-received', events: ['payment.success'], active: true },
  { id: 'wh3', url: '/webhooks/engine-status', events: ['engine.started', 'engine.stopped'], active: false },
]

export default function AutomationHubView() {
  const [workflowStatuses, setWorkflowStatuses] = useState<
    Record<string, string>
  >(
    Object.fromEntries(workflows.map((w) => [w.id, w.status]))
  )

  const toggleWorkflow = (id: string) => {
    setWorkflowStatuses((prev) => ({
      ...prev,
      [id]: prev[id] === 'ACTIVE' ? 'PAUSED' : 'ACTIVE',
    }))
  }

  return (
    <div className="p-4 md:p-6 space-y-6 fw-scrollbar overflow-y-auto h-full">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-widest uppercase">
            Automation Hub
          </h2>
          <p className="text-fw-dim text-sm font-mono">
            Orchestrate your income engines and workflows
          </p>
        </div>
        <Button className="bg-fw-accent/10 text-fw-accent border border-fw-accent/30 hover:bg-fw-accent/20 font-mono tracking-wider">
          <Plus className="w-4 h-4 mr-2" />
          New Workflow
        </Button>
      </div>

      {/* Workflow List */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {workflows.map((wf) => (
          <Card
            key={wf.id}
            className="bg-fw-surface border-fw-border hover:border-fw-accent/30 transition-colors"
          >
            <CardContent className="pt-6">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-sm font-bold tracking-wider uppercase">
                    {wf.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge
                      variant="outline"
                      className={`text-[9px] ${
                        workflowStatuses[wf.id] === 'ACTIVE'
                          ? 'border-fw-green/50 text-fw-green'
                          : 'border-fw-gold/50 text-fw-gold'
                      }`}
                    >
                      {workflowStatuses[wf.id]}
                    </Badge>
                    <span className="text-[10px] text-fw-dim font-mono">
                      {wf.steps} steps • {wf.runs} runs
                    </span>
                  </div>
                </div>
                <Button
                  onClick={() => toggleWorkflow(wf.id)}
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                >
                  {workflowStatuses[wf.id] === 'ACTIVE' ? (
                    <Pause className="w-4 h-4 text-fw-gold" />
                  ) : (
                    <Play className="w-4 h-4 text-fw-green" />
                  )}
                </Button>
              </div>
              <div className="flex items-center gap-1 text-[10px] text-fw-dim font-mono">
                <RefreshCw className="w-3 h-3" />
                Last run: {wf.lastRun}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Visual Workflow Builder */}
      <Card className="bg-fw-surface border-fw-border">
        <CardHeader>
          <CardTitle className="text-xs font-mono tracking-widest uppercase text-fw-dim flex items-center gap-2">
            <Workflow className="w-4 h-4 text-fw-accent" />
            Outbound Pipeline: Lead Nurture Sequence
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 overflow-x-auto pb-4">
            {outboundSteps.map((step, i) => {
              const typeStyles: Record<string, string> = {
                trigger: 'border-fw-accent/50 text-fw-accent bg-fw-accent/10',
                process: 'border-fw-gold/50 text-fw-gold bg-fw-gold/10',
                action: 'border-fw-green/50 text-fw-green bg-fw-green/10',
                delay: 'border-fw-purple/50 text-fw-purple bg-fw-purple/10',
                condition: 'border-fw-red/50 text-fw-red bg-fw-red/10',
              }
              return (
                <div key={step.id} className="flex items-center flex-shrink-0">
                  <div
                    className={`flex items-center gap-2 px-4 py-3 rounded-lg border ${typeStyles[step.type] || ''}`}
                  >
                    <Zap className="w-3 h-3" />
                    <span className="text-xs font-mono font-bold whitespace-nowrap">
                      {step.name}
                    </span>
                  </div>
                  {i < outboundSteps.length - 1 && (
                    <ArrowRight className="w-4 h-4 text-fw-dim mx-1 flex-shrink-0" />
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Webhook Configuration */}
      <Card className="bg-fw-surface border-fw-border">
        <CardHeader>
          <CardTitle className="text-xs font-mono tracking-widest uppercase text-fw-dim flex items-center gap-2">
            <Webhook className="w-4 h-4 text-fw-gold" />
            Webhook Configuration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {webhooks.map((wh) => (
              <div
                key={wh.id}
                className="flex items-center justify-between p-3 rounded-lg border border-fw-border bg-fw-bg"
              >
                <div className="flex items-center gap-3">
                  <Webhook className="w-4 h-4 text-fw-gold" />
                  <div>
                    <p className="text-xs font-mono font-bold">{wh.url}</p>
                    <div className="flex gap-1 mt-1">
                      {wh.events.map((e) => (
                        <Badge
                          key={e}
                          variant="outline"
                          className="text-[9px] border-fw-accent/30 text-fw-accent"
                        >
                          {e}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={wh.active} />
                  <Settings className="w-4 h-4 text-fw-dim cursor-pointer hover:text-fw-accent" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
