'use client'

import { useAuth } from '@/components/freedom/AuthProvider'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import {
  User,
  Trophy,
  Star,
  Shield,
  TrendingUp,
  Users,
  Coins,
  Award,
  Crown,
  Camera,
  Upload,
  Loader2,
  Edit3,
  Check,
  X,
  Mail,
  Phone,
  MapPin,
  Globe,
  Zap,
} from 'lucide-react'
import { useState, useRef } from 'react'
import { uploadProfilePhoto, updateUserProfile } from '@/lib/firebase-auth'
import { localUploadProfilePhoto, localUpdateProfile } from '@/lib/local-auth'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'

const achievements = [
  { name: 'First Engine', desc: 'Deploy your first income engine', earned: true, icon: '🚀' },
  { name: 'Revenue Milestone', desc: 'Earn $1,000 in a single month', earned: true, icon: '💰' },
  { name: 'Lead Master', desc: 'Convert 10 leads to clients', earned: true, icon: '🎯' },
  { name: 'Network Builder', desc: 'Refer 10 users to the platform', earned: true, icon: '🌐' },
  { name: 'Sovereign Operator', desc: 'Earn $10,000 cumulative revenue', earned: true, icon: '👑' },
  { name: 'Automation Expert', desc: 'Run 5 active workflows simultaneously', earned: false, icon: '⚡' },
  { name: 'Multi-Asset Master', desc: 'Hold assets in 5+ currencies', earned: true, icon: '💎' },
  { name: 'Content King', desc: 'Generate 100 pieces of AI content', earned: false, icon: '📝' },
]

const cryptoBalances = [
  { symbol: 'BTC', name: 'Bitcoin', amount: 0.015, value: '$1,245', change: '+2.4%' },
  { symbol: 'ETH', name: 'Ethereum', amount: 0.45, value: '$1,620', change: '+1.8%' },
  { symbol: 'SOL', name: 'Solana', amount: 12.5, value: '$1,875', change: '+5.2%' },
  { symbol: 'USDT', name: 'Tether', amount: 3500, value: '$3,500', change: '0.0%' },
]

export default function ProfileView() {
  const { profile, isFounderUser, isDemoMode, refreshProfile } = useAuth()
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [editingBio, setEditingBio] = useState(false)
  const [bioText, setBioText] = useState(profile?.bio || '')
  const [savingBio, setSavingBio] = useState(false)

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !profile) return

    // Validate file
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'File Too Large',
        description: 'Profile photo must be under 5MB',
        variant: 'destructive',
      })
      return
    }

    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid File',
        description: 'Please upload an image file',
        variant: 'destructive',
      })
      return
    }

    setUploadingPhoto(true)
    try {
      if (isDemoMode) {
        await localUploadProfilePhoto(profile.uid, file)
        await refreshProfile()
      } else {
        await uploadProfilePhoto(profile.uid, file)
        await refreshProfile()
      }
      toast({
        title: 'Photo Updated',
        description: 'Your profile photo has been updated successfully',
      })
    } catch (error) {
      console.error('Error uploading photo:', error)
      toast({
        title: 'Upload Failed',
        description: 'Failed to upload profile photo. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setUploadingPhoto(false)
    }
  }

  const handleSaveBio = async () => {
    if (!profile) return
    setSavingBio(true)
    try {
      if (isDemoMode) {
        localUpdateProfile(profile.uid, { bio: bioText })
        await refreshProfile()
      } else {
        await updateUserProfile(profile.uid, { bio: bioText })
        await refreshProfile()
      }
      setEditingBio(false)
      toast({
        title: 'Bio Updated',
        description: 'Your bio has been saved successfully',
      })
    } catch (error) {
      console.error('Error saving bio:', error)
      toast({
        title: 'Save Failed',
        description: 'Failed to update bio. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setSavingBio(false)
    }
  }

  const displayName = profile?.displayName || 'New User'
  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <div className="p-4 md:p-6 space-y-6 fw-scrollbar overflow-y-auto h-full">
      {/* Profile Header */}
      <Card className="bg-fw-surface border-fw-border relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-r from-fw-accent/10 via-fw-gold/10 to-fw-purple/10" />
        <CardContent className="relative z-10 pt-12">
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
            {/* Avatar with upload */}
            <div className="relative group">
              <Avatar className="w-20 h-20 border-2 border-fw-accent/30">
                {profile?.photoURL ? (
                  <AvatarImage src={profile.photoURL} alt={displayName} />
                ) : null}
                <AvatarFallback className="bg-fw-accent/10 text-fw-accent text-xl font-bold">
                  {initials || <User className="w-10 h-10" />}
                </AvatarFallback>
              </Avatar>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingPhoto}
                className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              >
                {uploadingPhoto ? (
                  <Loader2 className="w-5 h-5 text-white animate-spin" />
                ) : (
                  <Camera className="w-5 h-5 text-white" />
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
              />
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-2xl font-bold tracking-wider uppercase">
                  {displayName}
                </h2>
                {isFounderUser && (
                  <Badge className="bg-fw-gold/10 text-fw-gold border border-fw-gold/30 text-xs animate-pulse">
                    <Crown className="w-3 h-3 mr-1" />
                    FOUNDER
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <Mail className="w-3 h-3 text-fw-dim" />
                <p className="text-fw-dim text-sm font-mono">{profile?.email}</p>
              </div>
              {profile?.phone && (
                <div className="flex items-center gap-2 mt-1">
                  <Phone className="w-3 h-3 text-fw-dim" />
                  <p className="text-fw-dim text-sm font-mono">{profile.phone}</p>
                </div>
              )}
              {profile?.location && (
                <div className="flex items-center gap-2 mt-1">
                  <MapPin className="w-3 h-3 text-fw-dim" />
                  <p className="text-fw-dim text-sm font-mono">{profile.location}</p>
                </div>
              )}
              {profile?.website && (
                <div className="flex items-center gap-2 mt-1">
                  <Globe className="w-3 h-3 text-fw-dim" />
                  <p className="text-fw-accent text-sm font-mono">{profile.website}</p>
                </div>
              )}
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <Badge className={`${
                  isFounderUser
                    ? 'bg-fw-gold/10 text-fw-gold border border-fw-gold/30'
                    : 'bg-fw-accent/10 text-fw-accent border border-fw-accent/30'
                } text-xs`}>
                  {isFounderUser ? (
                    <Crown className="w-3 h-3 mr-1" />
                  ) : (
                    <Zap className="w-3 h-3 mr-1" />
                  )}
                  {profile?.plan || 'FREE'} PLAN
                </Badge>
                {isFounderUser && profile?.founderTitle && (
                  <Badge className="bg-fw-accent/10 text-fw-accent border border-fw-accent/30 text-xs">
                    <Shield className="w-3 h-3 mr-1" />
                    {profile.founderTitle}
                  </Badge>
                )}
                <span className="text-[10px] text-fw-dim font-mono">
                  Member since {profile?.joinDate}
                </span>
              </div>
            </div>
          </div>

          {/* Bio Section */}
          <div className="mt-4 p-4 rounded-lg border border-fw-border bg-fw-bg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono tracking-widest uppercase text-fw-dim">
                Bio
              </span>
              {!editingBio ? (
                <Button
                  onClick={() => {
                    setBioText(profile?.bio || '')
                    setEditingBio(true)
                  }}
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-fw-dim hover:text-fw-text"
                >
                  <Edit3 className="w-3 h-3 mr-1" />
                  <span className="text-[10px]">Edit</span>
                </Button>
              ) : (
                <div className="flex gap-1">
                  <Button
                    onClick={handleSaveBio}
                    disabled={savingBio}
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-fw-green hover:text-fw-green"
                  >
                    {savingBio ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Check className="w-3 h-3" />
                    )}
                  </Button>
                  <Button
                    onClick={() => setEditingBio(false)}
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-fw-red hover:text-fw-red"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              )}
            </div>
            {editingBio ? (
              <textarea
                value={bioText}
                onChange={(e) => setBioText(e.target.value)}
                className="w-full bg-fw-surface border border-fw-border rounded px-3 py-2 text-fw-text font-mono text-sm min-h-20 focus:border-fw-accent/50 outline-none resize-none"
                maxLength={500}
              />
            ) : (
              <p className="text-sm text-fw-dim font-mono leading-relaxed">
                {profile?.bio || 'No bio yet. Click edit to add your bio.'}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Founder Status Card */}
      {isFounderUser && (
        <Card className="bg-gradient-to-r from-fw-gold/5 via-fw-accent/5 to-fw-purple/5 border-fw-gold/30 relative overflow-hidden">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-fw-gold/10 flex items-center justify-center fw-glow-gold">
                <Crown className="w-7 h-7 text-fw-gold" />
              </div>
              <div>
                <h3 className="text-lg font-bold tracking-wider uppercase text-fw-gold">
                  Sovereign Founder Access
                </h3>
                <p className="text-sm text-fw-dim font-mono">
                  Unlimited & full functionality across all ecosystem modules
                </p>
              </div>
              <Badge className="ml-auto bg-fw-gold/10 text-fw-gold border border-fw-gold/30 text-xs animate-pulse">
                UNLIMITED
              </Badge>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
              {[
                'All Engines',
                'All Leads',
                'All Markets',
                'Full Admin',
                'Priority Support',
                'Custom Workflows',
                'API Access',
                'White Label',
              ].map((perm) => (
                <div
                  key={perm}
                  className="flex items-center gap-2 p-2 rounded border border-fw-gold/20 bg-fw-gold/5"
                >
                  <Check size={12} className="text-fw-gold flex-shrink-0" />
                  <span className="text-[10px] text-fw-gold font-mono tracking-wider uppercase">
                    {perm}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* User Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="bg-fw-surface border-fw-border">
          <CardContent className="pt-6 text-center">
            <TrendingUp className="w-5 h-5 text-fw-green mx-auto mb-2" />
            <p className="text-xl font-bold font-mono">
              ${((profile?.totalRevenue || 0) / 1000).toFixed(1)}K
            </p>
            <p className="text-[10px] text-fw-dim font-mono tracking-widest uppercase">
              Total Revenue
            </p>
          </CardContent>
        </Card>
        <Card className="bg-fw-surface border-fw-border">
          <CardContent className="pt-6 text-center">
            <Trophy className="w-5 h-5 text-fw-gold mx-auto mb-2" />
            <p className="text-xl font-bold font-mono">{profile?.activeEngines || 0}</p>
            <p className="text-[10px] text-fw-dim font-mono tracking-widest uppercase">
              Active Engines
            </p>
          </CardContent>
        </Card>
        <Card className="bg-fw-surface border-fw-border">
          <CardContent className="pt-6 text-center">
            <Users className="w-5 h-5 text-fw-accent mx-auto mb-2" />
            <p className="text-xl font-bold font-mono">{profile?.referrals || 0}</p>
            <p className="text-[10px] text-fw-dim font-mono tracking-widest uppercase">
              Referrals
            </p>
          </CardContent>
        </Card>
        <Card className="bg-fw-surface border-fw-border">
          <CardContent className="pt-6 text-center">
            <Star className="w-5 h-5 text-fw-purple mx-auto mb-2" />
            <p className="text-xl font-bold font-mono">#{profile?.leaderboardRank || 999}</p>
            <p className="text-[10px] text-fw-dim font-mono tracking-widest uppercase">
              Leaderboard
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Achievements */}
      <Card className="bg-fw-surface border-fw-border">
        <CardHeader>
          <CardTitle className="text-xs font-mono tracking-widest uppercase text-fw-dim flex items-center gap-2">
            <Award className="w-4 h-4 text-fw-gold" />
            Achievement Badges
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-fw-dim font-mono">
              {achievements.filter((a) => a.earned).length}/{achievements.length} earned
            </span>
            <span className="text-xs text-fw-gold font-mono">
              {Math.round(
                (achievements.filter((a) => a.earned).length / achievements.length) * 100
              )}%
            </span>
          </div>
          <Progress
            value={
              (achievements.filter((a) => a.earned).length / achievements.length) * 100
            }
            className="mb-4 h-2 bg-fw-bg"
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {achievements.map((ach) => (
              <div
                key={ach.name}
                className={`flex items-center gap-3 p-3 rounded-lg border ${
                  ach.earned
                    ? 'border-fw-gold/30 bg-fw-gold/5'
                    : 'border-fw-border bg-fw-bg opacity-50'
                }`}
              >
                <span className="text-2xl">{ach.icon}</span>
                <div>
                  <p className="text-xs font-bold tracking-wider uppercase">
                    {ach.name}
                  </p>
                  <p className="text-[10px] text-fw-dim font-mono">{ach.desc}</p>
                </div>
                {ach.earned && <CheckMark />}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Crypto Balances */}
      <Card className="bg-fw-surface border-fw-border">
        <CardHeader>
          <CardTitle className="text-xs font-mono tracking-widest uppercase text-fw-dim flex items-center gap-2">
            <Coins className="w-4 h-4 text-fw-gold" />
            Crypto Balances
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {cryptoBalances.map((crypto) => (
              <div
                key={crypto.symbol}
                className="flex items-center justify-between p-3 rounded-lg border border-fw-border bg-fw-bg"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-fw-gold/10 flex items-center justify-center">
                    <Coins className="w-5 h-5 text-fw-gold" />
                  </div>
                  <div>
                    <p className="text-sm font-bold tracking-wider uppercase">
                      {crypto.name}
                    </p>
                    <p className="text-[10px] text-fw-dim font-mono">
                      {crypto.amount} {crypto.symbol}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold font-mono">{crypto.value}</p>
                  <p
                    className={`text-[10px] font-mono ${
                      crypto.change.startsWith('+')
                        ? 'text-fw-green'
                        : 'text-fw-dim'
                    }`}
                  >
                    {crypto.change}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Referral Network */}
      <Card className="bg-fw-surface border-fw-border">
        <CardHeader>
          <CardTitle className="text-xs font-mono tracking-widest uppercase text-fw-dim flex items-center gap-2">
            <Shield className="w-4 h-4 text-fw-accent" />
            Referral Network
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 p-4 rounded-lg border border-fw-accent/20 bg-fw-accent/5">
            <div className="w-12 h-12 rounded-full bg-fw-accent/10 flex items-center justify-center">
              <Users className="w-6 h-6 text-fw-accent" />
            </div>
            <div>
              <p className="text-lg font-bold font-mono">{profile?.referrals || 0} Active Referrals</p>
              <p className="text-xs text-fw-dim font-mono">
                ${((profile?.referrals || 0) * 180).toLocaleString()} earned from referral network
              </p>
            </div>
            <Badge className="ml-auto bg-fw-gold/10 text-fw-gold border border-fw-gold/30">
              GOLD TIER
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function CheckMark() {
  return (
    <div className="ml-auto w-5 h-5 rounded-full bg-fw-green/20 flex items-center justify-center flex-shrink-0">
      <svg className="w-3 h-3 text-fw-green" viewBox="0 0 12 12" fill="none">
        <path d="M2 6L5 9L10 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  )
}
