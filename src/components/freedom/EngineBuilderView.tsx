'use client'

import { useFreedomStore, type EngineNode } from '@/lib/freedom-store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Plus,
  Play,
  Save,
  Zap,
  Database,
  Send,
  Wifi,
  Trash2,
} from 'lucide-react'
import { useState, useCallback } from 'react'

const nodeCategories = [
  {
    name: 'Inputs',
    color: 'text-fw-accent',
    borderColor: 'border-fw-accent/30',
    bgColor: 'bg-fw-accent/10',
    nodes: [
      { type: 'input', label: 'RSS Feed' },
      { type: 'input', label: 'Web Hook' },
      { type: 'input', label: 'File Upload' },
      { type: 'input', label: 'API Call' },
      { type: 'input', label: 'Email Input' },
    ],
  },
  {
    name: 'Processing',
    color: 'text-fw-gold',
    borderColor: 'border-fw-gold/30',
    bgColor: 'bg-fw-gold/10',
    nodes: [
      { type: 'processing', label: 'AI Rewriter' },
      { type: 'processing', label: 'Data Filter' },
      { type: 'processing', label: 'Transform' },
      { type: 'processing', label: 'Classifier' },
      { type: 'processing', label: 'Scorer' },
    ],
  },
  {
    name: 'Outputs',
    color: 'text-fw-green',
    borderColor: 'border-fw-green/30',
    bgColor: 'bg-fw-green/10',
    nodes: [
      { type: 'output', label: 'Blog Post' },
      { type: 'output', label: 'Social Post' },
      { type: 'output', label: 'Email Send' },
      { type: 'output', label: 'Database Write' },
      { type: 'output', label: 'Notification' },
    ],
  },
  {
    name: 'Connectivity',
    color: 'text-fw-purple',
    borderColor: 'border-fw-purple/30',
    bgColor: 'bg-fw-purple/10',
    nodes: [
      { type: 'connectivity', label: 'Webhook Out' },
      { type: 'connectivity', label: 'API Push' },
      { type: 'connectivity', label: 'Slack Alert' },
      { type: 'connectivity', label: 'CRM Sync' },
      { type: 'connectivity', label: 'Zapier Bridge' },
    ],
  },
]

const typeIcons: Record<string, typeof Zap> = {
  input: Database,
  processing: Zap,
  output: Send,
  connectivity: Wifi,
}

const templates = [
  {
    name: 'AI Content Engine',
    desc: 'Auto-generate and publish content across platforms',
    nodes: ['RSS Feed', 'AI Rewriter', 'Blog Post', 'Social Post'],
  },
  {
    name: 'Lead Qualifier',
    desc: 'Score and route leads based on AI analysis',
    nodes: ['Web Hook', 'Scorer', 'CRM Sync', 'Notification'],
  },
  {
    name: 'Revenue Optimizer',
    desc: 'Monitor and adjust pricing for maximum yield',
    nodes: ['API Call', 'Classifier', 'Database Write', 'Slack Alert'],
  },
]

export default function EngineBuilderView() {
  const { engines, addEngine } = useFreedomStore()
  const [currentNodes, setCurrentNodes] = useState<EngineNode[]>([])
  const [selectedNode, setSelectedNode] = useState<string | null>(null)
  const [engineName, setEngineName] = useState('New Income Engine')

  const addNode = useCallback(
    (type: string, label: string) => {
      const id = `n_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
      const x = 100 + (currentNodes.length % 4) * 180
      const y = 80 + Math.floor(currentNodes.length / 4) * 140
      setCurrentNodes((prev) => [...prev, { id, type, label, x, y }])
    },
    [currentNodes.length]
  )

  const removeNode = useCallback((id: string) => {
    setCurrentNodes((prev) => prev.filter((n) => n.id !== id))
    setSelectedNode(null)
  }, [])

  const handleSave = () => {
    addEngine({
      id: `eng_${Date.now()}`,
      name: engineName,
      status: 'DRAFT',
      revenue: 0,
      performance: 'INITIATING',
      nodes: currentNodes,
      edges: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
    setCurrentNodes([])
    setEngineName('New Income Engine')
  }

  const handleDeploy = () => {
    addEngine({
      id: `eng_${Date.now()}`,
      name: engineName,
      status: 'ACTIVE',
      revenue: 0,
      performance: 'INITIATING',
      nodes: currentNodes,
      edges: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
    setCurrentNodes([])
    setEngineName('New Income Engine')
  }

  const applyTemplate = (template: (typeof templates)[0]) => {
    const newNodes: EngineNode[] = []
    template.nodes.forEach((label, i) => {
      const type =
        i === 0
          ? 'input'
          : i === template.nodes.length - 1
          ? 'output'
          : 'processing'
      newNodes.push({
        id: `n_t${Date.now()}_${i}`,
        type,
        label,
        x: 80 + i * 200,
        y: 150,
      })
    })
    setCurrentNodes(newNodes)
    setEngineName(template.name)
  }

  const typeColors: Record<string, string> = {
    input: 'border-fw-accent/50 text-fw-accent bg-fw-accent/10',
    processing: 'border-fw-gold/50 text-fw-gold bg-fw-gold/10',
    output: 'border-fw-green/50 text-fw-green bg-fw-green/10',
    connectivity: 'border-fw-purple/50 text-fw-purple bg-fw-purple/10',
  }

  return (
    <div className="flex h-full">
      {/* Left Sidebar - Node Categories */}
      <div className="w-64 border-r border-fw-border bg-fw-surface p-4 flex-shrink-0 hidden lg:block">
        <h3 className="text-xs font-mono tracking-widest uppercase text-fw-dim mb-4">
          Node Library
        </h3>
        <ScrollArea className="h-[calc(100vh-180px)]">
          <div className="space-y-6">
            {nodeCategories.map((cat) => (
              <div key={cat.name}>
                <h4
                  className={`text-xs font-bold tracking-widest uppercase mb-2 ${cat.color}`}
                >
                  {cat.name}
                </h4>
                <div className="space-y-1.5">
                  {cat.nodes.map((node) => {
                    const Icon = typeIcons[node.type] || Zap
                    return (
                      <button
                        key={node.label}
                        onClick={() => addNode(node.type, node.label)}
                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-xs border ${cat.borderColor} ${cat.bgColor} hover:opacity-80 transition-opacity`}
                      >
                        <Icon className="w-3 h-3" />
                        <span className="font-mono">{node.label}</span>
                        <Plus className="w-3 h-3 ml-auto" />
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Center Workspace */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Toolbar */}
        <div className="flex items-center gap-4 p-4 border-b border-fw-border bg-fw-surface">
          <input
            type="text"
            value={engineName}
            onChange={(e) => setEngineName(e.target.value)}
            className="bg-fw-bg border border-fw-border rounded px-3 py-1.5 text-sm font-mono text-fw-text flex-1 max-w-xs focus:border-fw-accent/50 outline-none"
          />
          <div className="flex items-center gap-2 ml-auto">
            <Dialog>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-fw-border text-fw-dim hover:text-fw-text"
                >
                  Templates
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-fw-surface border-fw-border">
                <DialogHeader>
                  <DialogTitle className="text-fw-text font-mono tracking-widest text-sm uppercase">
                    Engine Templates
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-3 mt-4">
                  {templates.map((t) => (
                    <button
                      key={t.name}
                      onClick={() => applyTemplate(t)}
                      className="w-full text-left p-4 rounded-lg border border-fw-border hover:border-fw-accent/30 bg-fw-bg transition-colors"
                    >
                      <p className="text-sm font-bold tracking-wider uppercase text-fw-text">
                        {t.name}
                      </p>
                      <p className="text-xs text-fw-dim mt-1">{t.desc}</p>
                      <div className="flex gap-1 mt-2">
                        {t.nodes.map((n) => (
                          <Badge
                            key={n}
                            variant="outline"
                            className="text-[10px] border-fw-accent/30 text-fw-accent"
                          >
                            {n}
                          </Badge>
                        ))}
                      </div>
                    </button>
                  ))}
                </div>
              </DialogContent>
            </Dialog>
            <Button
              onClick={handleSave}
              variant="outline"
              size="sm"
              className="border-fw-border text-fw-dim hover:text-fw-text"
            >
              <Save className="w-3 h-3 mr-1" />
              Save
            </Button>
            <Button
              onClick={handleDeploy}
              size="sm"
              className="bg-fw-accent/10 text-fw-accent border border-fw-accent/30 hover:bg-fw-accent/20"
            >
              <Play className="w-3 h-3 mr-1" />
              Deploy
            </Button>
          </div>
        </div>

        {/* Canvas */}
        <div className="flex-1 relative overflow-auto bg-fw-bg">
          {/* Grid background */}
          <div
            className="absolute inset-0 opacity-5"
            style={{
              backgroundImage:
                'linear-gradient(rgba(0,242,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(0,242,255,0.3) 1px, transparent 1px)',
              backgroundSize: '40px 40px',
            }}
          />

          {currentNodes.length === 0 ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <Zap className="w-12 h-12 text-fw-accent/20 mx-auto mb-4" />
                <p className="text-fw-dim text-sm font-mono tracking-wider">
                  ADD NODES FROM THE LIBRARY
                </p>
                <p className="text-fw-dim/50 text-xs mt-2">
                  Or select a template to get started
                </p>
              </div>
            </div>
          ) : (
            <div className="relative w-full h-full min-h-[500px]">
              {currentNodes.map((node) => {
                const Icon = typeIcons[node.type] || Zap
                return (
                  <div
                    key={node.id}
                    onClick={() =>
                      setSelectedNode(
                        selectedNode === node.id ? null : node.id
                      )
                    }
                    className={`absolute flex items-center gap-2 px-4 py-3 rounded-lg border cursor-pointer transition-all ${
                      typeColors[node.type]
                    } ${
                      selectedNode === node.id ? 'fw-glow ring-1 ring-fw-accent/50' : ''
                    }`}
                    style={{
                      left: node.x,
                      top: node.y,
                    }}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-xs font-mono font-bold">
                      {node.label}
                    </span>
                    {selectedNode === node.id && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          removeNode(node.id)
                        }}
                        className="ml-2 text-fw-red hover:text-red-400"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                )
              })}

              {/* SVG connections */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none">
                {currentNodes.slice(0, -1).map((node, i) => {
                  const next = currentNodes[i + 1]
                  return (
                    <line
                      key={`${node.id}-${next.id}`}
                      x1={node.x + 120}
                      y1={node.y + 20}
                      x2={next.x}
                      y2={next.y + 20}
                      stroke="#00f2ff"
                      strokeWidth={1}
                      strokeOpacity={0.3}
                      strokeDasharray="4 4"
                    />
                  )
                })}
              </svg>
            </div>
          )}
        </div>
      </div>

      {/* Right Panel - Existing Engines */}
      <div className="w-64 border-l border-fw-border bg-fw-surface p-4 flex-shrink-0 hidden xl:block">
        <h3 className="text-xs font-mono tracking-widest uppercase text-fw-dim mb-4">
          Existing Engines
        </h3>
        <ScrollArea className="h-[calc(100vh-180px)]">
          <div className="space-y-3">
            {engines.map((engine) => (
              <div
                key={engine.id}
                className="p-3 rounded-lg border border-fw-border bg-fw-bg"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-mono font-bold">
                    {engine.name}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className={`text-[9px] ${
                      engine.status === 'ACTIVE'
                        ? 'border-fw-green/50 text-fw-green'
                        : 'border-fw-gold/50 text-fw-gold'
                    }`}
                  >
                    {engine.status}
                  </Badge>
                  <span className="text-[10px] text-fw-dim font-mono">
                    ${engine.revenue.toLocaleString()}
                  </span>
                </div>
                <span className="text-[10px] text-fw-dim font-mono">
                  {engine.nodes.length} nodes
                </span>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>
    </div>
  )
}
