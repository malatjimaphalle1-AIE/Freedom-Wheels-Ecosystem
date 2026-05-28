'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Key,
  Shield,
  Bell,
  Settings,
  Eye,
  EyeOff,
  Globe,
  Palette,
} from 'lucide-react'
import { useState } from 'react'

export default function SettingsView() {
  const [showApiKey, setShowApiKey] = useState(false)
  const [geminiKey, setGeminiKey] = useState('sk-ge***********************************3xK')
  const [wiseKey, setWiseKey] = useState('sk-wi***********************************7pQ')
  const [notifications, setNotifications] = useState({
    revenue: true,
    engines: true,
    leads: true,
    system: false,
    marketing: false,
  })

  return (
    <div className="p-4 md:p-6 space-y-6 fw-scrollbar overflow-y-auto h-full">
      <div>
        <h2 className="text-xl font-bold tracking-widest uppercase">
          Settings
        </h2>
        <p className="text-fw-dim text-sm font-mono">
          Configure your ecosystem infrastructure
        </p>
      </div>

      {/* API Keys */}
      <Card className="bg-fw-surface border-fw-border">
        <CardHeader>
          <CardTitle className="text-xs font-mono tracking-widest uppercase text-fw-dim flex items-center gap-2">
            <Key className="w-4 h-4 text-fw-gold" />
            API Key Management
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-xs font-mono tracking-widest uppercase text-fw-dim flex items-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full bg-fw-accent" />
              Gemini API Key
            </label>
            <div className="flex items-center gap-2">
              <Input
                type={showApiKey ? 'text' : 'password'}
                value={geminiKey}
                onChange={(e) => setGeminiKey(e.target.value)}
                className="bg-fw-bg border-fw-border font-mono text-sm"
              />
              <Button
                onClick={() => setShowApiKey(!showApiKey)}
                variant="ghost"
                size="sm"
                className="h-9 w-9 p-0"
              >
                {showApiKey ? (
                  <EyeOff className="w-4 h-4 text-fw-dim" />
                ) : (
                  <Eye className="w-4 h-4 text-fw-dim" />
                )}
              </Button>
            </div>
            <p className="text-[10px] text-fw-dim font-mono mt-1">
              Used for AI content generation and analysis
            </p>
          </div>
          <Separator className="bg-fw-border" />
          <div>
            <label className="text-xs font-mono tracking-widest uppercase text-fw-dim flex items-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full bg-fw-green" />
              Wise API Key
            </label>
            <div className="flex items-center gap-2">
              <Input
                type={showApiKey ? 'text' : 'password'}
                value={wiseKey}
                onChange={(e) => setWiseKey(e.target.value)}
                className="bg-fw-bg border-fw-border font-mono text-sm"
              />
              <Button
                onClick={() => setShowApiKey(!showApiKey)}
                variant="ghost"
                size="sm"
                className="h-9 w-9 p-0"
              >
                {showApiKey ? (
                  <EyeOff className="w-4 h-4 text-fw-dim" />
                ) : (
                  <Eye className="w-4 h-4 text-fw-dim" />
                )}
              </Button>
            </div>
            <p className="text-[10px] text-fw-dim font-mono mt-1">
              Used for multi-currency wallet operations
            </p>
          </div>
          <Button className="bg-fw-accent/10 text-fw-accent border border-fw-accent/30 hover:bg-fw-accent/20 font-mono tracking-wider">
            <Key className="w-3 h-3 mr-2" />
            Save API Keys
          </Button>
        </CardContent>
      </Card>

      {/* Profile Settings */}
      <Card className="bg-fw-surface border-fw-border">
        <CardHeader>
          <CardTitle className="text-xs font-mono tracking-widest uppercase text-fw-dim flex items-center gap-2">
            <Settings className="w-4 h-4 text-fw-accent" />
            Profile Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-mono tracking-widest uppercase text-fw-dim mb-2 block">
                Display Name
              </label>
              <Input
                defaultValue="Marcus Freedom"
                className="bg-fw-bg border-fw-border font-mono text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-mono tracking-widest uppercase text-fw-dim mb-2 block">
                Email
              </label>
              <Input
                defaultValue="marcus@freedomwheels.io"
                className="bg-fw-bg border-fw-border font-mono text-sm"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-mono tracking-widest uppercase text-fw-dim mb-2 block">
              Bio
            </label>
            <textarea
              defaultValue="Building sovereign income infrastructure. Freedom Wheels Founder."
              className="w-full bg-fw-bg border border-fw-border rounded px-3 py-2 text-fw-text font-mono text-sm min-h-20 focus:border-fw-accent/50 outline-none resize-none"
            />
          </div>
          <Button className="bg-fw-accent/10 text-fw-accent border border-fw-accent/30 hover:bg-fw-accent/20 font-mono tracking-wider">
            Save Profile
          </Button>
        </CardContent>
      </Card>

      {/* Notification Preferences */}
      <Card className="bg-fw-surface border-fw-border">
        <CardHeader>
          <CardTitle className="text-xs font-mono tracking-widest uppercase text-fw-dim flex items-center gap-2">
            <Bell className="w-4 h-4 text-fw-gold" />
            Notification Preferences
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(notifications).map(([key, value]) => (
              <div
                key={key}
                className="flex items-center justify-between p-3 rounded-lg border border-fw-border bg-fw-bg"
              >
                <div>
                  <p className="text-sm font-bold tracking-wider uppercase">
                    {key} Alerts
                  </p>
                  <p className="text-[10px] text-fw-dim font-mono">
                    {key === 'revenue' && 'Get notified when revenue is received'}
                    {key === 'engines' && 'Alerts for engine status changes'}
                    {key === 'leads' && 'New lead and conversion alerts'}
                    {key === 'system' && 'System maintenance and updates'}
                    {key === 'marketing' && 'Promotional and feature announcements'}
                  </p>
                </div>
                <Switch
                  checked={value}
                  onCheckedChange={(checked) =>
                    setNotifications((prev) => ({ ...prev, [key]: checked }))
                  }
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* System Configuration */}
      <Card className="bg-fw-surface border-fw-border">
        <CardHeader>
          <CardTitle className="text-xs font-mono tracking-widest uppercase text-fw-dim flex items-center gap-2">
            <Shield className="w-4 h-4 text-fw-green" />
            System Configuration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-lg border border-fw-border bg-fw-bg">
              <div className="flex items-center gap-2 mb-2">
                <Globe className="w-4 h-4 text-fw-accent" />
                <span className="text-xs font-mono tracking-widest uppercase text-fw-dim">
                  Region
                </span>
              </div>
              <Badge variant="outline" className="text-[10px] border-fw-accent/30 text-fw-accent">
                Global (Multi-Region)
              </Badge>
            </div>
            <div className="p-4 rounded-lg border border-fw-border bg-fw-bg">
              <div className="flex items-center gap-2 mb-2">
                <Palette className="w-4 h-4 text-fw-purple" />
                <span className="text-xs font-mono tracking-widest uppercase text-fw-dim">
                  Theme
                </span>
              </div>
              <Badge variant="outline" className="text-[10px] border-fw-purple/30 text-fw-purple">
                Cyberpunk Dark
              </Badge>
            </div>
            <div className="p-4 rounded-lg border border-fw-border bg-fw-bg">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="w-4 h-4 text-fw-green" />
                <span className="text-xs font-mono tracking-widest uppercase text-fw-dim">
                  2FA Status
                </span>
              </div>
              <Badge variant="outline" className="text-[10px] border-fw-green/50 text-fw-green">
                ENABLED
              </Badge>
            </div>
            <div className="p-4 rounded-lg border border-fw-border bg-fw-bg">
              <div className="flex items-center gap-2 mb-2">
                <Key className="w-4 h-4 text-fw-gold" />
                <span className="text-xs font-mono tracking-widest uppercase text-fw-dim">
                  Encryption
                </span>
              </div>
              <Badge variant="outline" className="text-[10px] border-fw-gold/30 text-fw-gold">
                AES-256-GCM
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
