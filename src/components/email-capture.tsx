'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Mail, Check, Loader2 } from 'lucide-react'

export function EmailCapture() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      setError('Please enter a valid email address')
      setStatus('error')
      return
    }

    setStatus('loading')
    setError(null)

    try {
      // Read UTM cookies if available
      const utmSource = document.cookie.match(/fwe_utm_source=([^;]+)/)?.[1]
      const utmCampaign = document.cookie.match(/fwe_utm_campaign=([^;]+)/)?.[1]

      const res = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          source: 'landing_page',
          utmSource,
          utmCampaign,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to subscribe')

      setStatus('success')
      setEmail('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to subscribe')
      setStatus('error')
    }
  }

  if (status === 'success') {
    return (
      <div className="flex items-center gap-2 text-emerald-600">
        <Check className="h-5 w-5" />
        <span className="font-medium">Subscribed! Check your inbox for confirmation.</span>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2 max-w-md">
      <div className="relative flex-1">
        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="email"
          value={email}
          onChange={(e) => { setEmail(e.target.value); setStatus('idle'); setError(null) }}
          placeholder="your@email.com"
          disabled={status === 'loading'}
          className="pl-9"
        />
      </div>
      <Button type="submit" disabled={status === 'loading' || !email}>
        {status === 'loading' ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Get notified'}
      </Button>
      {error && <p className="text-xs text-rose-600 sm:absolute sm:mt-12">{error}</p>}
    </form>
  )
}
