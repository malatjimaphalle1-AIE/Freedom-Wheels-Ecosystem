'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import {
  Copy,
  Check,
  Share2,
  Users,
  Gift,
  TrendingUp,
  MessageCircle,
  Twitter,
  Facebook,
  Linkedin,
  Send,
  Mail,
  Link as LinkIcon,
  X,
  ExternalLink,
} from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { useEngineBus } from '@/lib/engine-bus'

const referralCode = 'FW-MAPHALLE-2025'
const referralLink = 'https://freedomwheels.io/r/FW-MAPHALLE-2025'
const shareMessage = `🚀 Join Freedom Wheels™ Ecosystem — Build sovereign income that works without you!\n\nUse my referral code: ${referralCode}\n\nStart your journey →`

const referralStats = {
  totalReferred: 24,
  activeReferred: 18,
  earnedFromReferrals: 4320,
  pendingRewards: 480,
}

const referralHistory = [
  { name: 'James Okonkwo', date: '2025-02-25', reward: '$200', status: 'PAID' },
  { name: 'Amara Osei', date: '2025-02-22', reward: '$200', status: 'PAID' },
  { name: 'Liam Nascimento', date: '2025-03-01', reward: '$200', status: 'PENDING' },
  { name: 'Priya Sharma', date: '2025-03-01', reward: '$80', status: 'PENDING' },
  { name: 'Chen Wei', date: '2025-01-15', reward: '$200', status: 'PAID' },
  { name: 'Anna Petrov', date: '2025-01-10', reward: '$200', status: 'PAID' },
]

const rewardTiers = [
  { tier: 'Bronze', referrals: 5, reward: '$50/referral', color: 'text-amber-700 border-amber-700/30' },
  { tier: 'Silver', referrals: 15, reward: '$100/referral', color: 'text-gray-400 border-gray-400/30' },
  { tier: 'Gold', referrals: 30, reward: '$200/referral', color: 'text-fw-gold border-fw-gold/30' },
  { tier: 'Sovereign', referrals: 50, reward: '$500/referral', color: 'text-fw-accent border-fw-accent/30' },
]

interface SocialPlatform {
  name: string
  icon: typeof MessageCircle
  color: string
  hoverBg: string
  shareUrl: string
}

function getSocialPlatforms(link: string, message: string): SocialPlatform[] {
  const encodedUrl = encodeURIComponent(link)
  const encodedText = encodeURIComponent(message)

  return [
    {
      name: 'WhatsApp',
      icon: MessageCircle,
      color: 'text-green-400',
      hoverBg: 'hover:bg-green-500/10',
      shareUrl: `https://api.whatsapp.com/send?text=${encodedText}%0A%0A${encodedUrl}`,
    },
    {
      name: 'X (Twitter)',
      icon: Twitter,
      color: 'text-sky-400',
      hoverBg: 'hover:bg-sky-500/10',
      shareUrl: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`,
    },
    {
      name: 'Facebook',
      icon: Facebook,
      color: 'text-blue-400',
      hoverBg: 'hover:bg-blue-500/10',
      shareUrl: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedText}`,
    },
    {
      name: 'LinkedIn',
      icon: Linkedin,
      color: 'text-blue-300',
      hoverBg: 'hover:bg-blue-400/10',
      shareUrl: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    },
    {
      name: 'Telegram',
      icon: Send,
      color: 'text-sky-300',
      hoverBg: 'hover:bg-sky-400/10',
      shareUrl: `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`,
    },
    {
      name: 'Email',
      icon: Mail,
      color: 'text-amber-400',
      hoverBg: 'hover:bg-amber-500/10',
      shareUrl: `mailto:?subject=${encodeURIComponent('Join Freedom Wheels™ Ecosystem')}&body=${encodedText}%0A%0A${encodedUrl}`,
    },
  ]
}

export default function ReferralsView() {
  const [copied, setCopied] = useState(false)
  const [linkCopied, setLinkCopied] = useState(false)
  const [shareMenuOpen, setShareMenuOpen] = useState(false)
  const [shareSuccess, setShareSuccess] = useState<string | null>(null)
  const shareMenuRef = useRef<HTMLDivElement>(null)
  const shareButtonRef = useRef<HTMLButtonElement>(null)
  const { dispatch } = useEngineBus()

  const platforms = getSocialPlatforms(referralLink, shareMessage)

  // Close share menu on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        shareMenuRef.current &&
        !shareMenuRef.current.contains(e.target as Node) &&
        shareButtonRef.current &&
        !shareButtonRef.current.contains(e.target as Node)
      ) {
        setShareMenuOpen(false)
      }
    }
    if (shareMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [shareMenuOpen])

  // Close on Escape
  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') setShareMenuOpen(false)
    }
    if (shareMenuOpen) {
      document.addEventListener('keydown', handleEscape)
    }
    return () => document.removeEventListener('keydown', handleEscape)
  }, [shareMenuOpen])

  const handleCopyCode = () => {
    navigator.clipboard.writeText(referralCode).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
    dispatch({ source: 'referral-engine', type: 'referral:code_generated', target: 'traffic-engine', payload: { code: referralCode }, meta: {} })
  }

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralLink).then(() => {
      setLinkCopied(true)
      setTimeout(() => setLinkCopied(false), 2000)
    })
    dispatch({ source: 'referral-engine', type: 'referral:link_copied', target: 'traffic-engine', payload: { link: referralLink }, meta: {} })
  }

  const handleSocialShare = (platform: SocialPlatform) => {
    dispatch({
      source: 'referral-engine',
      type: 'referral:shared',
      target: ['traffic-engine', 'wallet-engine'],
      payload: { platform: platform.name, code: referralCode, link: referralLink },
      meta: {},
    })

    // Show success feedback
    setShareSuccess(platform.name)
    setTimeout(() => setShareSuccess(null), 2500)

    // Open share URL in new tab
    window.open(platform.shareUrl, '_blank', 'noopener,noreferrer,width=600,height=500')
    setShareMenuOpen(false)
  }

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Freedom Wheels™ Ecosystem',
          text: shareMessage,
          url: referralLink,
        })
        dispatch({
          source: 'referral-engine',
          type: 'referral:shared',
          target: ['traffic-engine', 'wallet-engine'],
          payload: { platform: 'Native Share', code: referralCode, link: referralLink },
          meta: {},
        })
        setShareSuccess('Native Share')
        setTimeout(() => setShareSuccess(null), 2500)
      } catch {
        // User cancelled or error — do nothing
      }
    }
  }

  return (
    <div className="p-4 md:p-6 space-y-6 fw-scrollbar overflow-y-auto h-full">
      <div>
        <h2 className="text-xl font-bold tracking-widest uppercase">
          Referral Network
        </h2>
        <p className="text-fw-dim text-sm font-mono">
          Grow your network and earn rewards
        </p>
      </div>

      {/* Referral Code & Share */}
      <Card className="bg-fw-surface border-fw-border relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-fw-accent/5 rounded-full blur-[60px]" />
        <CardContent className="relative z-10 pt-8">
          <div className="text-center">
            <p className="text-xs font-mono tracking-widest uppercase text-fw-dim mb-3">
              Your Referral Code
            </p>
            <div className="inline-flex items-center gap-3 px-6 py-3 rounded-lg border border-fw-accent/30 bg-fw-accent/5">
              <span className="text-2xl font-bold font-mono text-fw-accent tracking-widest">
                {referralCode}
              </span>
              <Button
                onClick={handleCopyCode}
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-fw-accent hover:text-fw-text"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>

            {/* Referral Link */}
            <div className="mt-4 max-w-sm mx-auto">
              <div className="flex items-center gap-2">
                <Input
                  value={referralLink}
                  readOnly
                  className="bg-fw-bg border-fw-border text-xs font-mono text-fw-dim h-8 select-all"
                  onClick={(e) => (e.target as HTMLInputElement).select()}
                />
                <Button
                  onClick={handleCopyLink}
                  variant="outline"
                  size="sm"
                  className="h-8 px-3 border-fw-accent/30 text-fw-accent hover:bg-fw-accent/10 flex-shrink-0"
                >
                  {linkCopied ? <Check className="w-3 h-3" /> : <LinkIcon className="w-3 h-3" />}
                </Button>
              </div>
            </div>

            {/* Share Success Toast */}
            {shareSuccess && (
              <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-fw-green/10 border border-fw-green/30 text-fw-green text-[10px] font-mono tracking-widest uppercase animate-in fade-in slide-in-from-bottom-2 duration-300">
                <Check className="w-3 h-3" />
                Shared via {shareSuccess}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-center gap-3 mt-4">
              {/* Share Link Button with Dropdown */}
              <div className="relative">
                <Button
                  ref={shareButtonRef}
                  variant="outline"
                  size="sm"
                  className="border-fw-accent/30 text-fw-accent hover:bg-fw-accent/10"
                  onClick={() => {
                    setShareMenuOpen(!shareMenuOpen)
                    dispatch({ source: 'referral-engine', type: 'referral:share_initiated', target: 'traffic-engine', payload: { code: referralCode }, meta: {} })
                  }}
                >
                  <Share2 className="w-3 h-3 mr-2" />
                  Share Link
                  <ChevronDownIcon className="w-3 h-3 ml-1" />
                </Button>

                {/* Social Platforms Dropdown */}
                {shareMenuOpen && (
                  <div
                    ref={shareMenuRef}
                    className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-72 bg-fw-surface border border-fw-border rounded-xl shadow-2xl shadow-black/40 z-50 animate-in fade-in slide-in-from-top-2 duration-200"
                  >
                    <div className="p-3 border-b border-fw-border">
                      <p className="text-xs font-bold tracking-widest uppercase text-fw-text">
                        Share to Platform
                      </p>
                      <p className="text-[10px] text-fw-dim font-mono mt-0.5">
                        Spread the word &amp; earn rewards
                      </p>
                    </div>
                    <div className="p-2 space-y-0.5 max-h-80 overflow-y-auto">
                      {platforms.map((platform) => (
                        <button
                          key={platform.name}
                          onClick={() => handleSocialShare(platform)}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all ${platform.hoverBg} group`}
                        >
                          <div className={`w-8 h-8 rounded-lg bg-fw-bg flex items-center justify-center flex-shrink-0 ${platform.color} group-hover:scale-110 transition-transform`}>
                            <platform.icon className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold tracking-wider text-fw-text">
                              {platform.name}
                            </p>
                            <p className="text-[10px] text-fw-dim font-mono truncate">
                              Share via {platform.name}
                            </p>
                          </div>
                          <ExternalLink className="w-3 h-3 text-fw-dim ml-auto flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                      ))}
                    </div>
                    <Separator className="bg-fw-border" />
                    <div className="p-2">
                      {/* Native Share (mobile) */}
                      {typeof navigator !== 'undefined' && navigator.share && (
                        <button
                          onClick={handleNativeShare}
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left hover:bg-fw-accent/10 transition-all group"
                        >
                          <div className="w-8 h-8 rounded-lg bg-fw-accent/10 flex items-center justify-center flex-shrink-0 text-fw-accent group-hover:scale-110 transition-transform">
                            <Share2 className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-xs font-bold tracking-wider text-fw-accent">
                              More Options
                            </p>
                            <p className="text-[10px] text-fw-dim font-mono">
                              Use device share sheet
                            </p>
                          </div>
                        </button>
                      )}
                      {/* Copy Link */}
                      <button
                        onClick={() => {
                          handleCopyLink()
                          setShareMenuOpen(false)
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left hover:bg-fw-bg transition-all group"
                      >
                        <div className="w-8 h-8 rounded-lg bg-fw-bg flex items-center justify-center flex-shrink-0 text-fw-dim group-hover:scale-110 transition-transform">
                          {linkCopied ? <Check className="w-4 h-4 text-fw-green" /> : <LinkIcon className="w-4 h-4" />}
                        </div>
                        <div>
                          <p className="text-xs font-bold tracking-wider text-fw-text">
                            {linkCopied ? 'Link Copied!' : 'Copy Link'}
                          </p>
                          <p className="text-[10px] text-fw-dim font-mono truncate">
                            {referralLink}
                          </p>
                        </div>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Invite Email Button */}
              <Button
                variant="outline"
                size="sm"
                className="border-fw-border text-fw-dim hover:text-fw-text"
                onClick={() => {
                  const subject = encodeURIComponent('Join Freedom Wheels™ Ecosystem')
                  const body = encodeURIComponent(`${shareMessage}\n\n${referralLink}`)
                  window.open(`mailto:?subject=${subject}&body=${body}`, '_self')
                  dispatch({ source: 'referral-engine', type: 'referral:invite_sent', target: ['traffic-engine', 'wallet-engine'], payload: { referralCode }, meta: {} })
                }}
              >
                <Mail className="w-3 h-3 mr-2" />
                Invite Email
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Share Platforms - Always visible for mobile */}
      <Card className="bg-fw-surface border-fw-border lg:hidden">
        <CardHeader className="pb-3">
          <CardTitle className="text-xs font-mono tracking-widest uppercase text-fw-dim">
            Quick Share
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-2">
            {platforms.map((platform) => (
              <button
                key={platform.name}
                onClick={() => handleSocialShare(platform)}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border border-fw-border/50 bg-fw-bg hover:bg-fw-bg/80 transition-all active:scale-95`}
              >
                <platform.icon className={`w-5 h-5 ${platform.color}`} />
                <span className="text-[10px] font-mono text-fw-dim tracking-wider">
                  {platform.name}
                </span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="bg-fw-surface border-fw-border">
          <CardContent className="pt-6 text-center">
            <Users className="w-5 h-5 text-fw-accent mx-auto mb-2" />
            <p className="text-2xl font-bold font-mono">
              {referralStats.totalReferred}
            </p>
            <p className="text-[10px] text-fw-dim font-mono tracking-widest uppercase">
              Total Referred
            </p>
          </CardContent>
        </Card>
        <Card className="bg-fw-surface border-fw-border">
          <CardContent className="pt-6 text-center">
            <TrendingUp className="w-5 h-5 text-fw-green mx-auto mb-2" />
            <p className="text-2xl font-bold font-mono">
              {referralStats.activeReferred}
            </p>
            <p className="text-[10px] text-fw-dim font-mono tracking-widest uppercase">
              Active
            </p>
          </CardContent>
        </Card>
        <Card className="bg-fw-surface border-fw-border">
          <CardContent className="pt-6 text-center">
            <Gift className="w-5 h-5 text-fw-gold mx-auto mb-2" />
            <p className="text-2xl font-bold font-mono text-fw-gold">
              ${referralStats.earnedFromReferrals.toLocaleString()}
            </p>
            <p className="text-[10px] text-fw-dim font-mono tracking-widest uppercase">
              Earned
            </p>
          </CardContent>
        </Card>
        <Card className="bg-fw-surface border-fw-border">
          <CardContent className="pt-6 text-center">
            <Gift className="w-5 h-5 text-fw-purple mx-auto mb-2" />
            <p className="text-2xl font-bold font-mono text-fw-purple">
              ${referralStats.pendingRewards}
            </p>
            <p className="text-[10px] text-fw-dim font-mono tracking-widest uppercase">
              Pending
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Reward Tiers */}
      <Card className="bg-fw-surface border-fw-border">
        <CardHeader>
          <CardTitle className="text-xs font-mono tracking-widest uppercase text-fw-dim">
            Reward Tiers
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {rewardTiers.map((tier) => (
              <div
                key={tier.tier}
                className={`p-4 rounded-lg border ${tier.color} bg-fw-bg text-center`}
              >
                <h4 className="text-sm font-bold tracking-widest uppercase">
                  {tier.tier}
                </h4>
                <p className="text-xs text-fw-dim font-mono mt-1">
                  {tier.referrals}+ referrals
                </p>
                <p className="text-lg font-bold font-mono mt-2">
                  {tier.reward}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Reward History */}
      <Card className="bg-fw-surface border-fw-border">
        <CardHeader>
          <CardTitle className="text-xs font-mono tracking-widest uppercase text-fw-dim">
            Reward History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {referralHistory.map((r, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-3 rounded-lg border border-fw-border/50 bg-fw-bg"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-fw-accent/10 flex items-center justify-center">
                    <Users className="w-4 h-4 text-fw-accent" />
                  </div>
                  <div>
                    <p className="text-xs font-bold tracking-wider">
                      {r.name}
                    </p>
                    <p className="text-[10px] text-fw-dim font-mono">
                      {r.date}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold font-mono text-fw-gold">
                    {r.reward}
                  </span>
                  <Badge
                    variant="outline"
                    className={`text-[9px] ${
                      r.status === 'PAID'
                        ? 'border-fw-green/50 text-fw-green'
                        : 'border-fw-gold/50 text-fw-gold'
                    }`}
                  >
                    {r.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

/* Small inline chevron icon for the Share Link dropdown */
function ChevronDownIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="12" height="12" viewBox="0 0 12 12" fill="none">
      <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
