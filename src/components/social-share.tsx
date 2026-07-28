'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { MessageCircle, Facebook, Twitter, Linkedin, Send, Mail, Copy, Check, Share2 } from 'lucide-react'

interface SocialShareProps {
  url: string
  text: string
  page: string // 'landing' | 'guide' | 'member_dashboard' | etc.
  userId?: string // for tracking who shared
  variant?: 'inline' | 'compact' | 'full'
  className?: string
}

const PLATFORMS = [
  { id: 'whatsapp', name: 'WhatsApp', icon: MessageCircle, color: 'hover:bg-emerald-500 hover:text-white' },
  { id: 'facebook', name: 'Facebook', icon: Facebook, color: 'hover:bg-blue-600 hover:text-white' },
  { id: 'twitter', name: 'X (Twitter)', icon: Twitter, color: 'hover:bg-gray-900 hover:text-white' },
  { id: 'linkedin', name: 'LinkedIn', icon: Linkedin, color: 'hover:bg-blue-700 hover:text-white' },
  { id: 'telegram', name: 'Telegram', icon: Send, color: 'hover:bg-sky-500 hover:text-white' },
  { id: 'email', name: 'Email', icon: Mail, color: 'hover:bg-gray-600 hover:text-white' },
] as const

export function SocialShare({ url, text, page, userId, variant = 'inline', className = '' }: SocialShareProps) {
  const [copied, setCopied] = useState(false)

  async function trackShare(platform: string) {
    // Fire-and-forget — don't block the share action
    try {
      await fetch('/api/marketing/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform, urlShared: url, page, userId }),
      })
    } catch {
      // ignore tracking errors
    }
  }

  function handleShare(platform: string) {
    const shareUrls: Record<string, string> = {
      whatsapp: `https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(text)}`,
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
      telegram: `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
      email: `mailto:?subject=${encodeURIComponent(text)}&body=${encodeURIComponent(text + '\n\n' + url)}`,
    }

    trackShare(platform)

    if (platform === 'email') {
      window.location.assign(shareUrls.email)
    } else {
      window.open(shareUrls[platform], '_blank', 'noopener,noreferrer,width=600,height=500')
    }
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      trackShare('copy')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // fallback: select text
      const textarea = document.createElement('textarea')
      textarea.value = url
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      setCopied(true)
      trackShare('copy')
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (variant === 'compact') {
    return (
      <div className={`flex items-center gap-1 ${className}`}>
        {PLATFORMS.slice(0, 4).map(p => {
          const Icon = p.icon
          return (
            <button
              key={p.id}
              onClick={() => handleShare(p.id)}
              className={`p-2 rounded-md border transition-colors ${p.color}`}
              aria-label={`Share on ${p.name}`}
              title={`Share on ${p.name}`}
            >
              <Icon className="h-4 w-4" />
            </button>
          )
        })}
        <button
          onClick={handleCopy}
          className="p-2 rounded-md border hover:bg-muted transition-colors"
          aria-label="Copy link"
          title="Copy link"
        >
          {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
        </button>
      </div>
    )
  }

  if (variant === 'full') {
    return (
      <div className={`space-y-3 ${className}`}>
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <Share2 className="h-4 w-4" />
          Share this page
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {PLATFORMS.map(p => {
            const Icon = p.icon
            return (
              <button
                key={p.id}
                onClick={() => handleShare(p.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-md border text-sm transition-colors ${p.color}`}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{p.name}</span>
              </button>
            )
          })}
          <button
            onClick={handleCopy}
            className="flex items-center gap-2 px-3 py-2 rounded-md border text-sm hover:bg-muted transition-colors"
          >
            {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
            <span className="hidden sm:inline">{copied ? 'Copied!' : 'Copy'}</span>
          </button>
        </div>
        <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-md">
          <input
            type="text"
            value={url}
            readOnly
            className="flex-1 bg-transparent text-xs font-mono outline-none"
            onClick={(e) => (e.target as HTMLInputElement).select()}
          />
          <Button size="sm" variant="ghost" onClick={handleCopy}>
            {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
          </Button>
        </div>
      </div>
    )
  }

  // inline (default)
  return (
    <div className={`flex items-center gap-2 flex-wrap ${className}`}>
      <span className="text-xs text-muted-foreground mr-1">Share:</span>
      {PLATFORMS.map(p => {
        const Icon = p.icon
        return (
          <button
            key={p.id}
            onClick={() => handleShare(p.id)}
            className={`p-1.5 rounded border transition-colors ${p.color}`}
            aria-label={`Share on ${p.name}`}
            title={p.name}
          >
            <Icon className="h-3.5 w-3.5" />
          </button>
        )
      })}
      <button
        onClick={handleCopy}
        className="p-1.5 rounded border hover:bg-muted transition-colors"
        aria-label="Copy link"
        title="Copy link"
      >
        {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
      </button>
    </div>
  )
}
