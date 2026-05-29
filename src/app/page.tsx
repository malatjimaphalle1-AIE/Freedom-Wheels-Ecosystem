'use client'

import { useFreedomStore, type ViewType } from '@/lib/freedom-store'
import { useAuth } from '@/components/freedom/AuthProvider'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  LayoutDashboard,
  Cpu,
  Users,
  Wallet,
  Store,
  Search as SearchIcon,
  TrendingUp,
  Globe,
  Workflow,
  Trophy,
  UserPlus,
  BookOpen,
  Settings,
  User,
  Bell,
  Menu,
  X,
  ChevronRight,
  Shield,
  Zap,
  LogOut,
  Crown,
  Loader2,
} from 'lucide-react'
import { useState } from 'react'

import LandingView from '@/components/freedom/LandingView'
import LoginView from '@/components/freedom/LoginView'
import DashboardView from '@/components/freedom/DashboardView'
import EngineBuilderView from '@/components/freedom/EngineBuilderView'
import LeadIntelligenceView from '@/components/freedom/LeadIntelligenceView'
import WalletView from '@/components/freedom/WalletView'
import MarketplaceView from '@/components/freedom/MarketplaceView'
import NicheAnalysisView from '@/components/freedom/NicheAnalysisView'
import TrafficEngineView from '@/components/freedom/TrafficEngineView'
import AutomationHubView from '@/components/freedom/AutomationHubView'
import LeaderboardView from '@/components/freedom/LeaderboardView'
import ReferralsView from '@/components/freedom/ReferralsView'
import KnowledgeBaseView from '@/components/freedom/KnowledgeBaseView'
import SettingsView from '@/components/freedom/SettingsView'
import ProfileView from '@/components/freedom/ProfileView'
import { signOutUser, isFirebaseConfigured } from '@/lib/firebase-auth'
import { localSignOut } from '@/lib/local-auth'

interface NavItem {
  view: ViewType
  label: string
  icon: typeof LayoutDashboard
  badge?: string
  founderOnly?: boolean
}

const navItems: NavItem[] = [
  { view: 'dashboard', label: 'Command Center', icon: LayoutDashboard, badge: '3' },
  { view: 'builder', label: 'Engine Builder', icon: Cpu },
  { view: 'leads', label: 'Lead Intelligence', icon: Users, badge: '5' },
  { view: 'wallet', label: 'Wallet', icon: Wallet },
  { view: 'marketplace', label: 'Marketplace', icon: Store },
  { view: 'analysis', label: 'Niche Analysis', icon: SearchIcon },
  { view: 'traffic', label: 'Traffic Engine', icon: Globe },
  { view: 'automation', label: 'Automation Hub', icon: Workflow },
  { view: 'leaderboard', label: 'Leaderboard', icon: Trophy },
  { view: 'referrals', label: 'Referrals', icon: UserPlus },
  { view: 'knowledge', label: 'Knowledge Base', icon: BookOpen },
  { view: 'settings', label: 'Settings', icon: Settings },
  { view: 'profile', label: 'Profile', icon: User },
]

const viewLabels: Record<ViewType, string> = {
  landing: 'Landing',
  login: 'Sign In',
  dashboard: 'Command Center',
  builder: 'Engine Builder',
  leads: 'Lead Intelligence',
  wallet: 'Wallet',
  marketplace: 'Marketplace',
  analysis: 'Niche Analysis',
  traffic: 'Traffic Engine',
  automation: 'Automation Hub',
  leaderboard: 'Leaderboard',
  referrals: 'Referrals',
  knowledge: 'Knowledge Base',
  settings: 'Settings',
  profile: 'Profile',
}

function ViewRenderer({ view }: { view: ViewType }) {
  switch (view) {
    case 'landing':
      return <LandingView />
    case 'login':
      return <LoginView />
    case 'dashboard':
      return <DashboardView />
    case 'builder':
      return <EngineBuilderView />
    case 'leads':
      return <LeadIntelligenceView />
    case 'wallet':
      return <WalletView />
    case 'marketplace':
      return <MarketplaceView />
    case 'analysis':
      return <NicheAnalysisView />
    case 'traffic':
      return <TrafficEngineView />
    case 'automation':
      return <AutomationHubView />
    case 'leaderboard':
      return <LeaderboardView />
    case 'referrals':
      return <ReferralsView />
    case 'knowledge':
      return <KnowledgeBaseView />
    case 'settings':
      return <SettingsView />
    case 'profile':
      return <ProfileView />
    default:
      return <DashboardView />
  }
}

export default function Home() {
  const {
    currentView,
    setCurrentView,
    notifications,
    markNotificationRead,
    sidebarOpen,
    setSidebarOpen,
  } = useFreedomStore()

  const { user, profile, loading, isAuthenticated, isFounderUser, isDemoMode, localUser, setLocalUser, mounted } = useAuth()

  const [searchQuery, setSearchQuery] = useState('')
  const [loggingOut, setLoggingOut] = useState(false)
  const unreadCount = notifications.filter((n) => !n.read).length

  const handleSignOut = async () => {
    setLoggingOut(true)
    try {
      if (isDemoMode) {
        localSignOut()
        setLocalUser(null)
      } else {
        await signOutUser()
      }
      setCurrentView('landing')
    } catch (error) {
      console.error('Error signing out:', error)
    } finally {
      setLoggingOut(false)
    }
  }

  // Loading state (also wait for client mount to avoid hydration mismatch)
  if (loading || !mounted) {
    return (
      <div className="flex h-screen bg-fw-bg items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-fw-accent/10 flex items-center justify-center fw-glow-strong animate-pulse">
            <Zap className="w-6 h-6 text-fw-accent" />
          </div>
          <div className="flex items-center gap-2">
            <Loader2 className="w-4 h-4 text-fw-accent animate-spin" />
            <span className="text-xs font-mono text-fw-dim tracking-widest uppercase">
              Initializing Ecosystem...
            </span>
          </div>
        </div>
      </div>
    )
  }

  // Landing view - full page, no sidebar
  if (currentView === 'landing') {
    return <LandingView />
  }

  // Login view - full page, no sidebar
  if (currentView === 'login') {
    return <LoginView />
  }

  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    return <LoginView />
  }

  // Get display info from Firebase profile
  const displayName = profile?.displayName || user?.displayName || user?.email?.split('@')[0] || 'User'
  const userInitials = displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
  const userPlan = profile?.plan || 'FREE'

  return (
    <div className="flex h-screen bg-fw-bg text-fw-text overflow-hidden">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? 'w-64' : 'w-0'
        } lg:w-64 flex-shrink-0 border-r border-fw-border bg-fw-surface transition-all duration-300 overflow-hidden flex flex-col relative z-20`}
      >
        {/* Sidebar Header */}
        <div className="p-4 flex items-center gap-3 border-b border-fw-border">
          <div className="w-8 h-8 rounded-lg bg-fw-accent/10 flex items-center justify-center flex-shrink-0">
            <Zap className="w-5 h-5 text-fw-accent" />
          </div>
          <div className="min-w-0">
            <h1 className="text-sm font-bold tracking-widest uppercase truncate">
              Freedom Wheels™
            </h1>
            <p className="text-[9px] text-fw-dim font-mono tracking-wider">
              ECOSYSTEM v2.0
            </p>
          </div>
        </div>

        {/* Navigation */}
        <ScrollArea className="flex-1 py-2">
          <nav className="px-2 space-y-0.5">
            {navItems.map((item) => {
              const isActive = currentView === item.view
              return (
                <button
                  key={item.view}
                  onClick={() => setCurrentView(item.view)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-mono tracking-wider uppercase transition-all ${
                    isActive
                      ? 'bg-fw-accent/10 text-fw-accent fw-glow'
                      : 'text-fw-dim hover:bg-fw-bg hover:text-fw-text'
                  }`}
                >
                  <item.icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-fw-accent' : ''}`} />
                  <span className="truncate">{item.label}</span>
                  {item.badge && (
                    <Badge
                      variant="outline"
                      className="ml-auto text-[9px] border-fw-accent/30 text-fw-accent flex-shrink-0"
                    >
                      {item.badge}
                    </Badge>
                  )}
                </button>
              )
            })}
          </nav>
        </ScrollArea>

        {/* System Status */}
        <div className="p-4 border-t border-fw-border">
          <div className="p-3 rounded-lg border border-fw-border bg-fw-bg">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-3 h-3 text-fw-green" />
              <span className="text-[10px] font-mono tracking-widest uppercase text-fw-green">
                System Operational
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-fw-green animate-pulse" />
              <span className="text-[9px] text-fw-dim font-mono">
                All engines synced • 99.9% uptime
              </span>
            </div>
          </div>

          {/* Sovereign Manifest */}
          <div className="mt-3 p-3 rounded-lg border border-fw-gold/20 bg-fw-gold/5">
            <p className="text-[9px] font-mono tracking-widest uppercase text-fw-gold mb-1">
              Sovereign Manifest
            </p>
            <p className="text-[9px] text-fw-dim font-mono leading-relaxed">
              &quot;Income that works without you is not a dream—it is an engineered reality.&quot;
            </p>
          </div>

          {/* Founder Status */}
          {isFounderUser && (
            <div className="mt-3 p-3 rounded-lg border border-fw-gold/30 bg-fw-gold/5">
              <div className="flex items-center gap-2">
                <Crown className="w-3 h-3 text-fw-gold" />
                <span className="text-[9px] font-mono tracking-widest uppercase text-fw-gold">
                  Sovereign Founder
                </span>
              </div>
              <p className="text-[9px] text-fw-dim font-mono mt-1">
                Unlimited access • All modules
              </p>
            </div>
          )}
        </div>
      </aside>

      {/* Main Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-16 border-b border-fw-border bg-fw-surface flex items-center gap-4 px-4 flex-shrink-0">
          {/* Mobile menu toggle */}
          <Button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            variant="ghost"
            size="sm"
            className="lg:hidden h-8 w-8 p-0 text-fw-dim hover:text-fw-text"
          >
            {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </Button>

          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-xs font-mono text-fw-dim">
            <span className="tracking-wider uppercase">Freedom Wheels</span>
            <ChevronRight className="w-3 h-3" />
            <span className="text-fw-text tracking-wider uppercase font-bold">
              {viewLabels[currentView]}
            </span>
          </div>

          {/* Search */}
          <div className="hidden md:flex items-center flex-1 max-w-md ml-6">
            <div className="relative w-full">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-fw-dim" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search ecosystem..."
                className="bg-fw-bg border-fw-border pl-9 h-8 text-xs font-mono focus:border-fw-accent/50 w-full"
              />
            </div>
          </div>

          <div className="ml-auto flex items-center gap-3">
            {/* Quick Stats */}
            <div className="hidden lg:flex items-center gap-4 mr-4">
              <div className="flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-fw-green" />
                <span className="text-xs font-mono text-fw-green">
                  ${((profile?.totalRevenue || 9200) / 1000).toFixed(1)}K
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-fw-accent" />
                <span className="text-xs font-mono text-fw-accent">{profile?.activeEngines || 3} Active</span>
              </div>
            </div>

            {/* Founder Badge in Header */}
            {isFounderUser && (
              <Badge className="hidden sm:flex items-center bg-fw-gold/10 text-fw-gold border border-fw-gold/30 text-[9px] animate-pulse">
                <Crown className="w-3 h-3 mr-1" />
                FOUNDER
              </Badge>
            )}

            {/* Notifications */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 relative text-fw-dim hover:text-fw-text"
                >
                  <Bell className="w-4 h-4" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-fw-red text-[9px] font-bold flex items-center justify-center text-white">
                      {unreadCount}
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-72 bg-fw-surface border-fw-border"
              >
                {notifications.map((notif) => (
                  <DropdownMenuItem
                    key={notif.id}
                    onClick={() => markNotificationRead(notif.id)}
                    className={`p-3 cursor-pointer ${
                      !notif.read ? 'bg-fw-accent/5' : ''
                    }`}
                  >
                    <div>
                      <p className="text-xs font-bold tracking-wider">
                        {notif.title}
                      </p>
                      <p className="text-[10px] text-fw-dim font-mono">
                        {notif.message}
                      </p>
                    </div>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* User Avatar with Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 pl-3 border-l border-fw-border cursor-pointer">
                  <Avatar className="w-8 h-8 border border-fw-accent/30">
                    {profile?.photoURL ? (
                      <AvatarImage src={profile.photoURL} alt={displayName} />
                    ) : null}
                    <AvatarFallback className="bg-fw-accent/10 text-fw-accent text-xs font-bold">
                      {userInitials || <User className="w-4 h-4" />}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden sm:block text-left">
                    <p className="text-xs font-bold tracking-wider">
                      {displayName}
                    </p>
                    <p className="text-[9px] text-fw-dim font-mono">
                      {userPlan} PLAN
                    </p>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-56 bg-fw-surface border-fw-border"
              >
                <div className="px-3 py-2">
                  <p className="text-sm font-bold tracking-wider">{displayName}</p>
                  <p className="text-xs text-fw-dim font-mono">{profile?.email}</p>
                  {isFounderUser && (
                    <Badge className="mt-1 bg-fw-gold/10 text-fw-gold border border-fw-gold/30 text-[9px]">
                      <Crown className="w-3 h-3 mr-1" />
                      SOVEREIGN FOUNDER
                    </Badge>
                  )}
                </div>
                <DropdownMenuSeparator className="bg-fw-border" />
                <DropdownMenuItem
                  onClick={() => setCurrentView('profile')}
                  className="cursor-pointer"
                >
                  <User className="w-4 h-4 mr-2" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setCurrentView('settings')}
                  className="cursor-pointer"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-fw-border" />
                <DropdownMenuItem
                  onClick={handleSignOut}
                  disabled={loggingOut}
                  className="cursor-pointer text-fw-red focus:text-fw-red"
                >
                  {loggingOut ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <LogOut className="w-4 h-4 mr-2" />
                  )}
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-hidden">
          <ViewRenderer view={currentView} />
        </main>
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-10"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  )
}
