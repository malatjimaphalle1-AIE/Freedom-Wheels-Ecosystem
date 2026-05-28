'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { useAuth } from '@/components/freedom/AuthProvider'
import { updateUserProfile, uploadProfilePhoto, changeUserPassword } from '@/lib/firebase-auth'
import { useToast } from '@/hooks/use-toast'
import {
  Key,
  Shield,
  Bell,
  Settings,
  Eye,
  EyeOff,
  Globe,
  Palette,
  User,
  Camera,
  Loader2,
  Save,
  Lock,
  Crown,
  Upload,
  Phone,
  MapPin,
} from 'lucide-react'
import { useState, useRef, useEffect } from 'react'

export default function SettingsView() {
  const { profile, isFounderUser, refreshProfile } = useAuth()
  const { toast } = useToast()
  const photoInputRef = useRef<HTMLInputElement>(null)

  const [showApiKey, setShowApiKey] = useState(false)
  const [saving, setSaving] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)

  // Profile fields
  const [displayName, setDisplayName] = useState(profile?.displayName || '')
  const [phone, setPhone] = useState(profile?.phone || '')
  const [location, setLocation] = useState(profile?.location || '')
  const [website, setWebsite] = useState(profile?.website || '')
  const [bio, setBio] = useState(profile?.bio || '')

  // API keys
  const [geminiKey, setGeminiKey] = useState(profile?.apiKeys.gemini || '')
  const [wiseKey, setWiseKey] = useState(profile?.apiKeys.wise || '')

  // Notifications
  const [notifications, setNotifications] = useState({
    revenue: profile?.notifications.revenue ?? true,
    engines: profile?.notifications.engines ?? true,
    leads: profile?.notifications.leads ?? true,
    system: profile?.notifications.system ?? false,
    marketing: profile?.notifications.marketing ?? false,
  })

  // Password change
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [changingPassword, setChangingPassword] = useState(false)

  // Sync profile changes to local state
  useEffect(() => {
    if (profile) {
      setDisplayName(profile.displayName)
      setPhone(profile.phone)
      setLocation(profile.location)
      setWebsite(profile.website)
      setBio(profile.bio)
      setGeminiKey(profile.apiKeys.gemini)
      setWiseKey(profile.apiKeys.wise)
      setNotifications(profile.notifications)
    }
  }, [profile])

  if (!profile) return null

  const handleSaveProfile = async () => {
    setSaving(true)
    try {
      await updateUserProfile(profile.uid, {
        displayName,
        phone,
        location,
        website,
        bio,
      })
      await refreshProfile()
      toast({
        title: 'Profile Updated',
        description: 'Your profile settings have been saved',
      })
    } catch (error) {
      console.error('Error saving profile:', error)
      toast({
        title: 'Save Failed',
        description: 'Failed to save profile. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  const handleSaveApiKeys = async () => {
    setSaving(true)
    try {
      await updateUserProfile(profile.uid, {
        apiKeys: { gemini: geminiKey, wise: wiseKey },
      })
      await refreshProfile()
      toast({
        title: 'API Keys Saved',
        description: 'Your API keys have been updated securely',
      })
    } catch (error) {
      console.error('Error saving API keys:', error)
      toast({
        title: 'Save Failed',
        description: 'Failed to save API keys. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  const handleSaveNotifications = async () => {
    setSaving(true)
    try {
      await updateUserProfile(profile.uid, { notifications })
      await refreshProfile()
      toast({
        title: 'Notifications Updated',
        description: 'Your notification preferences have been saved',
      })
    } catch (error) {
      console.error('Error saving notifications:', error)
      toast({
        title: 'Save Failed',
        description: 'Failed to save notification preferences.',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      toast({ title: 'File Too Large', description: 'Photo must be under 5MB', variant: 'destructive' })
      return
    }

    setUploadingPhoto(true)
    try {
      await uploadProfilePhoto(profile.uid, file)
      await refreshProfile()
      toast({ title: 'Photo Updated', description: 'Profile photo updated successfully' })
    } catch (error) {
      console.error('Error uploading photo:', error)
      toast({ title: 'Upload Failed', description: 'Failed to upload photo.', variant: 'destructive' })
    } finally {
      setUploadingPhoto(false)
    }
  }

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast({ title: 'Password Mismatch', description: 'New passwords do not match', variant: 'destructive' })
      return
    }
    if (newPassword.length < 6) {
      toast({ title: 'Weak Password', description: 'Password must be at least 6 characters', variant: 'destructive' })
      return
    }

    setChangingPassword(true)
    try {
      await changeUserPassword(oldPassword, newPassword)
      setOldPassword('')
      setNewPassword('')
      setConfirmPassword('')
      toast({ title: 'Password Changed', description: 'Your password has been updated successfully' })
    } catch (error) {
      console.error('Error changing password:', error)
      toast({ title: 'Change Failed', description: 'Failed to change password. Verify your current password.', variant: 'destructive' })
    } finally {
      setChangingPassword(false)
    }
  }

  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <div className="p-4 md:p-6 space-y-6 fw-scrollbar overflow-y-auto h-full">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-widest uppercase">
            Settings
          </h2>
          <p className="text-fw-dim text-sm font-mono">
            Configure your ecosystem infrastructure
          </p>
        </div>
        {isFounderUser && (
          <Badge className="bg-fw-gold/10 text-fw-gold border border-fw-gold/30 text-xs">
            <Crown className="w-3 h-3 mr-1" />
            FOUNDER ACCESS
          </Badge>
        )}
      </div>

      {/* Profile Photo & Basic Info */}
      <Card className="bg-fw-surface border-fw-border">
        <CardHeader>
          <CardTitle className="text-xs font-mono tracking-widest uppercase text-fw-dim flex items-center gap-2">
            <User className="w-4 h-4 text-fw-accent" />
            Profile Photo & Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Photo Upload */}
          <div className="flex items-center gap-4">
            <div className="relative group">
              <Avatar className="w-20 h-20 border-2 border-fw-accent/30">
                {profile.photoURL ? (
                  <AvatarImage src={profile.photoURL} alt={displayName} />
                ) : null}
                <AvatarFallback className="bg-fw-accent/10 text-fw-accent text-lg font-bold">
                  {initials || <User className="w-8 h-8" />}
                </AvatarFallback>
              </Avatar>
              <button
                onClick={() => photoInputRef.current?.click()}
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
                ref={photoInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
              />
            </div>
            <div>
              <p className="text-sm font-bold tracking-wider uppercase">{displayName}</p>
              <p className="text-xs text-fw-dim font-mono">{profile.email}</p>
              <Button
                onClick={() => photoInputRef.current?.click()}
                variant="outline"
                size="sm"
                className="mt-2 h-7 text-[10px] border-fw-border text-fw-dim hover:text-fw-text"
              >
                <Upload className="w-3 h-3 mr-1" />
                Change Photo
              </Button>
            </div>
          </div>

          <Separator className="bg-fw-border" />

          {/* Profile Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-mono tracking-widest uppercase text-fw-dim mb-2 block">
                Display Name
              </label>
              <Input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="bg-fw-bg border-fw-border font-mono text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-mono tracking-widest uppercase text-fw-dim mb-2 block">
                Email (read-only)
              </label>
              <Input
                value={profile.email}
                disabled
                className="bg-fw-bg border-fw-border font-mono text-sm text-fw-dim"
              />
            </div>
            <div>
              <label className="text-xs font-mono tracking-widest uppercase text-fw-dim mb-2 flex items-center gap-1">
                <Phone className="w-3 h-3" />
                Phone
              </label>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+27 XX XXX XXXX"
                className="bg-fw-bg border-fw-border font-mono text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-mono tracking-widest uppercase text-fw-dim mb-2 flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                Location
              </label>
              <Input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Johannesburg, South Africa"
                className="bg-fw-bg border-fw-border font-mono text-sm"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-mono tracking-widest uppercase text-fw-dim mb-2 flex items-center gap-1">
                <Globe className="w-3 h-3" />
                Website
              </label>
              <Input
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://freedomwheels.io"
                className="bg-fw-bg border-fw-border font-mono text-sm"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-mono tracking-widest uppercase text-fw-dim mb-2 block">
                Bio
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full bg-fw-bg border border-fw-border rounded px-3 py-2 text-fw-text font-mono text-sm min-h-20 focus:border-fw-accent/50 outline-none resize-none"
                maxLength={500}
              />
              <p className="text-[10px] text-fw-dim font-mono mt-1">{bio.length}/500 characters</p>
            </div>
          </div>
          <Button
            onClick={handleSaveProfile}
            disabled={saving}
            className="bg-fw-accent/10 text-fw-accent border border-fw-accent/30 hover:bg-fw-accent/20 font-mono tracking-wider"
          >
            {saving ? <Loader2 className="w-3 h-3 mr-2 animate-spin" /> : <Save className="w-3 h-3 mr-2" />}
            Save Profile
          </Button>
        </CardContent>
      </Card>

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
          <Button
            onClick={handleSaveApiKeys}
            disabled={saving}
            className="bg-fw-accent/10 text-fw-accent border border-fw-accent/30 hover:bg-fw-accent/20 font-mono tracking-wider"
          >
            {saving ? <Loader2 className="w-3 h-3 mr-2 animate-spin" /> : <Key className="w-3 h-3 mr-2" />}
            Save API Keys
          </Button>
        </CardContent>
      </Card>

      {/* Change Password */}
      <Card className="bg-fw-surface border-fw-border">
        <CardHeader>
          <CardTitle className="text-xs font-mono tracking-widest uppercase text-fw-dim flex items-center gap-2">
            <Lock className="w-4 h-4 text-fw-red" />
            Change Password
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-xs font-mono tracking-widest uppercase text-fw-dim mb-2 block">
              Current Password
            </label>
            <Input
              type="password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              className="bg-fw-bg border-fw-border font-mono text-sm"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-mono tracking-widest uppercase text-fw-dim mb-2 block">
                New Password
              </label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="bg-fw-bg border-fw-border font-mono text-sm"
                minLength={6}
              />
            </div>
            <div>
              <label className="text-xs font-mono tracking-widest uppercase text-fw-dim mb-2 block">
                Confirm New Password
              </label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="bg-fw-bg border-fw-border font-mono text-sm"
                minLength={6}
              />
            </div>
          </div>
          <Button
            onClick={handleChangePassword}
            disabled={changingPassword || !oldPassword || !newPassword || !confirmPassword}
            className="bg-fw-red/10 text-fw-red border border-fw-red/30 hover:bg-fw-red/20 font-mono tracking-wider"
          >
            {changingPassword ? <Loader2 className="w-3 h-3 mr-2 animate-spin" /> : <Lock className="w-3 h-3 mr-2" />}
            Change Password
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
          <Button
            onClick={handleSaveNotifications}
            disabled={saving}
            className="mt-4 bg-fw-accent/10 text-fw-accent border border-fw-accent/30 hover:bg-fw-accent/20 font-mono tracking-wider"
          >
            {saving ? <Loader2 className="w-3 h-3 mr-2 animate-spin" /> : <Save className="w-3 h-3 mr-2" />}
            Save Notifications
          </Button>
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
                {profile.region || 'Global (Multi-Region)'}
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
                {profile.theme || 'Cyberpunk Dark'}
              </Badge>
            </div>
            <div className="p-4 rounded-lg border border-fw-border bg-fw-bg">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="w-4 h-4 text-fw-green" />
                <span className="text-xs font-mono tracking-widest uppercase text-fw-dim">
                  2FA Status
                </span>
              </div>
              <Badge
                variant="outline"
                className={`text-[10px] ${
                  profile.twoFactorEnabled
                    ? 'border-fw-green/50 text-fw-green'
                    : 'border-fw-red/50 text-fw-red'
                }`}
              >
                {profile.twoFactorEnabled ? 'ENABLED' : 'DISABLED'}
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
            <div className="p-4 rounded-lg border border-fw-border bg-fw-bg">
              <div className="flex items-center gap-2 mb-2">
                <User className="w-4 h-4 text-fw-accent" />
                <span className="text-xs font-mono tracking-widest uppercase text-fw-dim">
                  Role
                </span>
              </div>
              <Badge
                variant="outline"
                className={`text-[10px] ${
                  isFounderUser
                    ? 'border-fw-gold/50 text-fw-gold'
                    : 'border-fw-accent/30 text-fw-accent'
                }`}
              >
                {profile.role}
              </Badge>
            </div>
            <div className="p-4 rounded-lg border border-fw-border bg-fw-bg">
              <div className="flex items-center gap-2 mb-2">
                <Settings className="w-4 h-4 text-fw-dim" />
                <span className="text-xs font-mono tracking-widest uppercase text-fw-dim">
                  Account ID
                </span>
              </div>
              <p className="text-[10px] font-mono text-fw-dim truncate">{profile.uid}</p>
            </div>
          </div>

          {/* Founder Status */}
          {isFounderUser && (
            <div className="mt-4 p-4 rounded-lg border border-fw-gold/30 bg-fw-gold/5">
              <div className="flex items-center gap-2 mb-2">
                <Crown className="w-4 h-4 text-fw-gold" />
                <span className="text-xs font-mono tracking-widest uppercase text-fw-gold">
                  Sovereign Founder Access
                </span>
              </div>
              <p className="text-[10px] text-fw-dim font-mono">
                You have unlimited access to all ecosystem features, modules, and administrative functions.
                No restrictions apply to your account.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
