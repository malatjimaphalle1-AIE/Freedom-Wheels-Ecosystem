'use client'

import { useState, useTransition } from 'react'
import { useEngineBus } from '@/lib/engine-bus'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/components/freedom/AuthProvider'
import { useFreedomStore } from '@/lib/freedom-store'
import {
  signInWithEmail,
  signUpWithEmail,
  signInWithGoogle,
  resetPassword,
  isFirebaseConfigured,
} from '@/lib/firebase-auth'
import {
  localSignIn,
  localSignUp,
  localSignOut,
  localResetPassword,
  type LocalUser,
} from '@/lib/local-auth'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import {
  Zap,
  Mail,
  Lock,
  User,
  ArrowRight,
  Eye,
  EyeOff,
  AlertCircle,
  Loader2,
  Shield,
  Crown,
  Wifi,
  WifiOff,
  Info,
  ClipboardPaste,
  CheckCircle2,
  XCircle,
  Flame,
} from 'lucide-react'

type AuthMode = 'login' | 'signup' | 'reset'

// Parse Firebase config from paste — handles both JSON and JS object formats
function parseFirebaseConfig(input: string): Record<string, string> | null {
  const trimmed = input.trim()

  // Try direct JSON parse first
  try {
    const parsed = JSON.parse(trimmed)
    if (parsed.apiKey && parsed.projectId) return parsed
  } catch {
    // Not JSON, try JS object format
  }

  // Try to extract JS object: const firebaseConfig = { ... } or var firebaseConfig = { ... }
  try {
    // Remove variable declaration
    let cleaned = trimmed
      .replace(/^(const|let|var)\s+\w+\s*=\s*/, '')
      .replace(/;\s*$/, '')
      .trim()

    // Convert unquoted keys to quoted keys: apiKey: -> "apiKey":
    cleaned = cleaned.replace(/(\w+)\s*:/g, '"$1":')

    // Handle single-quoted values -> double-quoted
    cleaned = cleaned.replace(/'([^']*)'/g, '"$1"')

    const parsed = JSON.parse(cleaned)
    if (parsed.apiKey && parsed.projectId) return parsed
  } catch {
    // Still not parseable
  }

  // Try key-value extraction line by line
  try {
    const result: Record<string, string> = {}
    const lines = trimmed.split('\n')
    for (const line of lines) {
      const match = line.match(/(\w+)\s*:\s*["']([^"']+)["']/)
      if (match) {
        result[match[1]] = match[2]
      }
    }
    if (result.apiKey && result.projectId) return result
  } catch {
    // Fallback failed
  }

  return null
}

export default function LoginView() {
  const [mode, setMode] = useState<AuthMode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [resetSent, setResetSent] = useState(false)

  // Firebase config paster state
  const [showConfigPaster, setShowConfigPaster] = useState(false)
  const [configInput, setConfigInput] = useState('')
  const [configStatus, setConfigStatus] = useState<'idle' | 'parsing' | 'valid' | 'invalid' | 'saving' | 'saved' | 'error'>('idle')
  const [configError, setConfigError] = useState('')
  const [parsedPreview, setParsedPreview] = useState<Record<string, string> | null>(null)
  const [isPending, startTransition] = useTransition()

  const setCurrentView = useFreedomStore((s) => s.setCurrentView)
  const { isDemoMode, setLocalUser } = useAuth()
  const { dispatch } = useEngineBus()

  const handleConfigInput = (value: string) => {
    setConfigInput(value)
    setConfigStatus('idle')
    setParsedPreview(null)
    setConfigError('')

    if (value.trim().length > 20) {
      const parsed = parseFirebaseConfig(value)
      if (parsed) {
        setParsedPreview(parsed)
        setConfigStatus('valid')
      } else if (value.trim().length > 50) {
        setConfigStatus('invalid')
        setConfigError('Could not parse Firebase config. Make sure you copied the full config object from Firebase Console.')
      }
    }
  }

  const handleSaveConfig = async () => {
    if (!parsedPreview) return

    setConfigStatus('saving')
    try {
      const res = await fetch('/api/firebase-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config: parsedPreview }),
      })
      const data = await res.json()

      if (res.ok && data.success) {
        setConfigStatus('saved')
        // Auto-reload after a brief delay so the user sees the success message
        setTimeout(() => {
          window.location.reload()
        }, 2000)
      } else {
        setConfigStatus('error')
        setConfigError(data.error || 'Failed to save configuration')
      }
    } catch {
      setConfigStatus('error')
      setConfigError('Network error. Please try again.')
    }
  }

  const handlePasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText()
      handleConfigInput(text)
    } catch {
      setConfigError('Could not read clipboard. Please paste manually with Ctrl+V / Cmd+V.')
    }
  }

  // Navigate to a view using startTransition to avoid blocking the main thread
  // This yields to the browser before the heavy re-render, improving INP
  const navigateTo = (view: Parameters<typeof setCurrentView>[0]) => {
    startTransition(() => {
      setCurrentView(view)
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (isDemoMode) {
        // Local Demo Mode
        if (mode === 'login') {
          const result = localSignIn(email, password)
          if (result.error) {
            setError(result.error)
          } else if (result.user) {
            setLocalUser(result.user)
            // Dispatch engine bus event for login
            dispatch({ source: 'auth-engine', type: 'auth:login', target: ['wallet-engine', 'leaderboard-engine'], payload: { userId: result.user.id, email: result.user.email }, meta: {} })
            setLoading(false)
            navigateTo('dashboard')
            return
          }
        } else if (mode === 'signup') {
          if (!displayName.trim()) {
            setError('Display name is required')
            setLoading(false)
            return
          }
          const result = localSignUp(email, password, displayName)
          if (result.error) {
            setError(result.error)
          } else if (result.user) {
            setLocalUser(result.user)
            // Dispatch engine bus event for signup
            dispatch({ source: 'auth-engine', type: 'auth:signup', target: ['wallet-engine', 'leaderboard-engine', 'referral-engine'], payload: { userId: result.user.id, email: result.user.email }, meta: {} })
            setLoading(false)
            navigateTo('dashboard')
            return
          }
        } else if (mode === 'reset') {
          const result = localResetPassword(email)
          if (result.error) {
            setError(result.error)
          } else {
            setResetSent(true)
          }
        }
      } else {
        // Firebase Live Mode
        if (mode === 'login') {
          await signInWithEmail(email, password)
          // Dispatch engine bus event for login
          dispatch({ source: 'auth-engine', type: 'auth:login', target: ['wallet-engine', 'leaderboard-engine'], payload: { userId: email, email }, meta: {} })
          setLoading(false)
          navigateTo('dashboard')
          return
        } else if (mode === 'signup') {
          if (!displayName.trim()) {
            setError('Display name is required')
            setLoading(false)
            return
          }
          await signUpWithEmail(email, password)
          // Dispatch engine bus event for signup
          dispatch({ source: 'auth-engine', type: 'auth:signup', target: ['wallet-engine', 'leaderboard-engine', 'referral-engine'], payload: { userId: email, email }, meta: {} })
          setLoading(false)
          navigateTo('dashboard')
          return
        } else if (mode === 'reset') {
          await resetPassword(email)
          setResetSent(true)
        }
      }
    } catch (err: unknown) {
      const firebaseError = err as { code?: string; message?: string }
      const code = firebaseError.code || ''
      switch (code) {
        case 'auth/user-not-found':
          setError('No account found with this email')
          break
        case 'auth/wrong-password':
          setError('Incorrect password')
          break
        case 'auth/email-already-in-use':
          setError('An account with this email already exists')
          break
        case 'auth/weak-password':
          setError('Password must be at least 6 characters')
          break
        case 'auth/invalid-email':
          setError('Invalid email address')
          break
        case 'auth/invalid-credential':
          setError('Invalid email or password')
          break
        case 'auth/too-many-requests':
          setError('Too many attempts. Please try again later.')
          break
        case 'auth/api-key-not-valid':
          setError('Firebase API key is invalid. Please check your configuration.')
          break
        default:
          setError(firebaseError.message || 'Authentication failed. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    if (isDemoMode) {
      setError('Google Sign-In requires Firebase configuration. Use the config paster below.')
      return
    }
    setError('')
    setLoading(true)
    try {
      await signInWithGoogle()
      setLoading(false)
      navigateTo('dashboard')
    } catch (err: unknown) {
      const firebaseError = err as { message?: string }
      setError(firebaseError.message || 'Google sign-in failed')
    } finally {
      setLoading(false)
    }
  }

  const handleDemoFounderLogin = () => {
    const founderEmail = 'malatjimaphalle1@gmail.com'
    const founderPassword = 'Freedom2025!'
    const result = localSignIn(founderEmail, founderPassword)
    if (result.user) {
      setLocalUser(result.user)
      navigateTo('dashboard')
    }
  }

  return (
    <div className="min-h-screen bg-fw-bg text-fw-text flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden flex-col items-center justify-center p-12">
        {/* Background effects */}
        <div className="absolute inset-0 opacity-10">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                'linear-gradient(rgba(0,242,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,242,255,0.1) 1px, transparent 1px)',
              backgroundSize: '60px 60px',
            }}
          />
        </div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-fw-accent/5 blur-[120px]" />

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative z-10 text-center"
        >
          <div className="w-16 h-16 rounded-2xl bg-fw-accent/10 flex items-center justify-center mx-auto mb-8 fw-glow-strong">
            <Zap className="w-8 h-8 text-fw-accent" />
          </div>

          <h1 className="text-4xl font-bold tracking-tighter mb-4">
            FREEDOM WHEELS
            <span className="text-fw-accent fw-text-glow">™</span>
          </h1>
          <p className="text-fw-dim text-lg mb-8 max-w-md mx-auto leading-relaxed">
            AI-Powered Ecosystem for Sovereign Income Infrastructure
          </p>

          <div className="space-y-4 text-left max-w-sm mx-auto">
            {[
              { icon: '🚀', text: 'Deploy autonomous income engines' },
              { icon: '🎯', text: 'AI-powered lead intelligence' },
              { icon: '💰', text: 'Multi-asset wealth generation' },
              { icon: '🔐', text: 'Sovereign infrastructure, no gatekeepers' },
            ].map((item) => (
              <div
                key={item.text}
                className="flex items-center gap-3 p-3 rounded-lg border border-fw-border bg-fw-surface/50"
              >
                <span className="text-xl">{item.icon}</span>
                <span className="text-sm text-fw-dim font-mono">{item.text}</span>
              </div>
            ))}
          </div>

          {/* Connection Mode Indicator */}
          <div className={`mt-6 p-3 rounded-lg border max-w-sm mx-auto ${
            isDemoMode
              ? 'border-fw-gold/30 bg-fw-gold/5'
              : 'border-fw-green/30 bg-fw-green/5'
          }`}>
            <div className="flex items-center gap-2 justify-center">
              {isDemoMode ? (
                <WifiOff className="w-3.5 h-3.5 text-fw-gold" />
              ) : (
                <Wifi className="w-3.5 h-3.5 text-fw-green" />
              )}
              <span className={`text-[10px] font-mono tracking-widest uppercase ${
                isDemoMode ? 'text-fw-gold' : 'text-fw-green'
              }`}>
                {isDemoMode ? 'Demo Mode — Local Auth' : 'Live Mode — Firebase Connected'}
              </span>
            </div>
          </div>

          <div className="mt-4 p-4 rounded-lg border border-fw-gold/20 bg-fw-gold/5 max-w-sm mx-auto">
            <p className="text-[10px] font-mono tracking-widest uppercase text-fw-gold mb-1">
              Sovereign Manifest
            </p>
            <p className="text-xs text-fw-dim font-mono leading-relaxed">
              &quot;Income that works without you is not a dream — it is an engineered reality.&quot;
            </p>
          </div>
        </motion.div>
      </div>

      {/* Right Panel - Auth Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-fw-accent/10 flex items-center justify-center">
              <Zap className="w-5 h-5 text-fw-accent" />
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-widest uppercase">Freedom Wheels™</h1>
              <p className="text-[9px] text-fw-dim font-mono tracking-wider">ECOSYSTEM v2.0</p>
            </div>
          </div>

          {/* Demo Mode Banner */}
          {isDemoMode && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 rounded-lg border border-fw-gold/30 bg-fw-gold/5"
            >
              <div className="flex items-start gap-3">
                <WifiOff className="w-4 h-4 text-fw-gold flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold tracking-wider uppercase text-fw-gold">
                    Demo Mode Active
                  </p>
                  <p className="text-[10px] text-fw-dim font-mono mt-1 leading-relaxed">
                    Firebase credentials not configured. Using local authentication.
                    Data is stored in your browser only.
                  </p>
                </div>
              </div>
              {/* Quick Founder Login */}
              <button
                type="button"
                onClick={handleDemoFounderLogin}
                className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-fw-gold/10 border border-fw-gold/30 text-fw-gold text-xs font-mono tracking-wider uppercase hover:bg-fw-gold/20 transition-colors"
              >
                <Crown className="w-3.5 h-3.5" />
                Quick Login — Founder Access
              </button>
              <p className="text-[9px] text-fw-dim font-mono mt-2 text-center">
                Founder: malatjimaphalle1@gmail.com • Password: Freedom2025!
              </p>
            </motion.div>
          )}

          <AnimatePresence mode="wait">
            <motion.div
              key={mode}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              {/* Header */}
              <div className="mb-8">
                <h2 className="text-2xl font-bold tracking-wider uppercase">
                  {mode === 'login' && 'Welcome Back'}
                  {mode === 'signup' && 'Join the Ecosystem'}
                  {mode === 'reset' && 'Reset Password'}
                </h2>
                <p className="text-fw-dim text-sm font-mono mt-2">
                  {mode === 'login' && 'Sign in to access your command center'}
                  {mode === 'signup' && 'Create your account and start building sovereign income'}
                  {mode === 'reset' && 'Enter your email to receive a reset link'}
                </p>
              </div>

              {/* Error Message */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 p-3 rounded-lg border border-fw-red/30 bg-fw-red/5 mb-6"
                >
                  <AlertCircle className="w-4 h-4 text-fw-red flex-shrink-0" />
                  <p className="text-xs text-fw-red font-mono">{error}</p>
                </motion.div>
              )}

              {/* Reset Sent Message */}
              {resetSent && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 p-3 rounded-lg border border-fw-green/30 bg-fw-green/5 mb-6"
                >
                  <Shield className="w-4 h-4 text-fw-green flex-shrink-0" />
                  <div>
                    <p className="text-xs text-fw-green font-mono">
                      {isDemoMode
                        ? 'Password reset simulated (demo mode).'
                        : `Password reset link sent to ${email}. Check your inbox.`
                      }
                    </p>
                  </div>
                </motion.div>
              )}

              {/* Google Sign-In — only show in Firebase mode */}
              {!isDemoMode && mode !== 'reset' && (
                <>
                  <Button
                    type="button"
                    onClick={handleGoogleSignIn}
                    disabled={loading || isPending}
                    variant="outline"
                    className="w-full h-11 border-fw-border bg-fw-surface hover:bg-fw-bg text-fw-text font-mono tracking-wider text-sm mb-4"
                  >
                    <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                      <path
                        fill="currentColor"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="currentColor"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    Continue with Google
                  </Button>

                  <div className="flex items-center gap-4 mb-4">
                    <Separator className="bg-fw-border flex-1" />
                    <span className="text-[10px] text-fw-dim font-mono tracking-widest uppercase">
                      or
                    </span>
                    <Separator className="bg-fw-border flex-1" />
                  </div>
                </>
              )}

              {/* Auth Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {mode === 'signup' && (
                  <div>
                    <label className="text-xs font-mono tracking-widest uppercase text-fw-dim mb-2 block">
                      Display Name
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-fw-dim" />
                      <Input
                        type="text"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder="Enter your name"
                        className="bg-fw-bg border-fw-border pl-10 h-11 text-sm font-mono focus:border-fw-accent/50"
                        required
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-xs font-mono tracking-widest uppercase text-fw-dim mb-2 block">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-fw-dim" />
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@freedomwheels.io"
                      className="bg-fw-bg border-fw-border pl-10 h-11 text-sm font-mono focus:border-fw-accent/50"
                      required
                    />
                  </div>
                </div>

                {mode !== 'reset' && (
                  <div>
                    <label className="text-xs font-mono tracking-widest uppercase text-fw-dim mb-2 block">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-fw-dim" />
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter your password"
                        className="bg-fw-bg border-fw-border pl-10 pr-10 h-11 text-sm font-mono focus:border-fw-accent/50"
                        required
                        minLength={6}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-fw-dim hover:text-fw-text"
                      >
                        {showPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={loading || isPending}
                  className="w-full h-11 bg-fw-accent text-fw-bg font-bold text-sm tracking-widest uppercase hover:bg-fw-accent/90 fw-glow"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : null}
                  {mode === 'login' && 'Sign In'}
                  {mode === 'signup' && 'Create Account'}
                  {mode === 'reset' && 'Send Reset Link'}
                  {!loading && <ArrowRight className="w-4 h-4 ml-2" />}
                </Button>
              </form>

              {/* Footer links */}
              <div className="mt-6 space-y-2 text-center">
                {mode === 'login' && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setMode('reset')
                        setError('')
                        setResetSent(false)
                      }}
                      className="text-xs text-fw-dim font-mono hover:text-fw-accent transition-colors block w-full"
                    >
                      Forgot your password?
                    </button>
                    <p className="text-xs text-fw-dim font-mono">
                      Don&apos;t have an account?{' '}
                      <button
                        type="button"
                        onClick={() => {
                          setMode('signup')
                          setError('')
                        }}
                        className="text-fw-accent hover:underline"
                      >
                        Sign up
                      </button>
                    </p>
                  </>
                )}
                {mode === 'signup' && (
                  <p className="text-xs text-fw-dim font-mono">
                    Already have an account?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setMode('login')
                        setError('')
                      }}
                      className="text-fw-accent hover:underline"
                    >
                      Sign in
                    </button>
                  </p>
                )}
                {mode === 'reset' && (
                  <button
                    type="button"
                    onClick={() => {
                      setMode('login')
                      setError('')
                      setResetSent(false)
                    }}
                    className="text-xs text-fw-accent font-mono hover:underline"
                  >
                    Back to sign in
                  </button>
                )}
              </div>

              {/* Terms */}
              {mode === 'signup' && (
                <p className="text-[10px] text-fw-dim font-mono text-center mt-4 leading-relaxed">
                  By creating an account, you agree to the Freedom Wheels™{' '}
                  <span className="text-fw-accent">Terms of Service</span> and{' '}
                  <span className="text-fw-accent">Privacy Policy</span>.
                </p>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Firebase Config Paster (only in demo mode) */}
          {isDemoMode && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-8"
            >
              {/* Toggle button */}
              <button
                type="button"
                onClick={() => setShowConfigPaster(!showConfigPaster)}
                className="w-full p-4 rounded-lg border border-fw-accent/30 bg-fw-accent/5 hover:bg-fw-accent/10 transition-colors flex items-center gap-3"
              >
                <Flame className="w-4 h-4 text-fw-accent flex-shrink-0" />
                <div className="text-left flex-1">
                  <span className="text-xs font-bold tracking-wider uppercase text-fw-accent block">
                    Connect Firebase — Enable Live Mode
                  </span>
                  <span className="text-[10px] text-fw-dim font-mono">
                    Paste your Firebase config from the Console to go live
                  </span>
                </div>
                <motion.span
                  animate={{ rotate: showConfigPaster ? 180 : 0 }}
                  className="text-fw-accent text-lg"
                >
                  ▾
                </motion.span>
              </button>

              {/* Config paster panel */}
              <AnimatePresence>
                {showConfigPaster && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-3 p-4 rounded-lg border border-fw-border bg-fw-surface space-y-4">
                      {/* Step instructions */}
                      <div className="space-y-2">
                        <p className="text-[10px] font-mono tracking-widest uppercase text-fw-accent">
                          How to get your Firebase Config
                        </p>
                        <ol className="space-y-1 text-[10px] text-fw-dim font-mono leading-relaxed list-decimal list-inside">
                          <li>Go to <span className="text-fw-accent">console.firebase.google.com</span></li>
                          <li>Select your project (or create one)</li>
                          <li>Click the <span className="text-fw-accent">⚙ gear icon → Project Settings</span></li>
                          <li>Scroll to <span className="text-fw-accent">Your apps → Web app</span></li>
                          <li>Copy the <span className="text-fw-accent">firebaseConfig</span> object</li>
                          <li>Paste it below 👇</li>
                        </ol>
                      </div>

                      <Separator className="bg-fw-border" />

                      {/* Paste area */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-[10px] font-mono tracking-widest uppercase text-fw-dim">
                            Paste Firebase Config
                          </label>
                          <button
                            type="button"
                            onClick={handlePasteFromClipboard}
                            className="flex items-center gap-1.5 px-2.5 py-1 rounded border border-fw-border bg-fw-bg hover:bg-fw-surface text-[10px] font-mono text-fw-dim hover:text-fw-accent transition-colors"
                          >
                            <ClipboardPaste className="w-3 h-3" />
                            Paste from Clipboard
                          </button>
                        </div>

                        <textarea
                          value={configInput}
                          onChange={(e) => handleConfigInput(e.target.value)}
                          placeholder={`Paste your Firebase config here. Accepted formats:\n\nJSON:\n{\n  "apiKey": "AIzaSy...",\n  "authDomain": "your-project.firebaseapp.com",\n  "projectId": "your-project-id",\n  "storageBucket": "your-project.appspot.com",\n  "messagingSenderId": "123456789",\n  "appId": "1:123:web:abc123"\n}\n\nOr JS Object:\nconst firebaseConfig = {\n  apiKey: "AIzaSy...",\n  ...\n};`}
                          className="w-full h-44 p-3 rounded-lg border border-fw-border bg-fw-bg text-xs font-mono text-fw-text placeholder:text-fw-dim/50 focus:border-fw-accent/50 focus:outline-none resize-y"
                          spellCheck={false}
                        />

                        {/* Parse status */}
                        {configStatus === 'valid' && parsedPreview && (
                          <motion.div
                            initial={{ opacity: 0, y: -5 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-2 p-3 rounded-lg border border-fw-green/30 bg-fw-green/5"
                          >
                            <div className="flex items-center gap-2 mb-2">
                              <CheckCircle2 className="w-3.5 h-3.5 text-fw-green" />
                              <span className="text-[10px] font-mono tracking-widest uppercase text-fw-green">
                                Config Parsed Successfully
                              </span>
                            </div>
                            <div className="space-y-1 text-[10px] font-mono">
                              {Object.entries(parsedPreview).map(([key, value]) => (
                                <div key={key} className="flex gap-2">
                                  <span className="text-fw-dim min-w-[120px]">{key}:</span>
                                  <span className="text-fw-text truncate">
                                    {key === 'apiKey' || key === 'messagingSenderId' || key === 'appId'
                                      ? value.slice(0, 8) + '••••••' + value.slice(-4)
                                      : value}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </motion.div>
                        )}

                        {configStatus === 'invalid' && (
                          <motion.div
                            initial={{ opacity: 0, y: -5 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-2 p-3 rounded-lg border border-fw-red/30 bg-fw-red/5 flex items-center gap-2"
                          >
                            <XCircle className="w-3.5 h-3.5 text-fw-red flex-shrink-0" />
                            <p className="text-[10px] text-fw-red font-mono">{configError}</p>
                          </motion.div>
                        )}

                        {configStatus === 'error' && (
                          <motion.div
                            initial={{ opacity: 0, y: -5 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-2 p-3 rounded-lg border border-fw-red/30 bg-fw-red/5 flex items-center gap-2"
                          >
                            <XCircle className="w-3.5 h-3.5 text-fw-red flex-shrink-0" />
                            <p className="text-[10px] text-fw-red font-mono">{configError}</p>
                          </motion.div>
                        )}

                        {configStatus === 'saved' && (
                          <motion.div
                            initial={{ opacity: 0, y: -5 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-2 p-3 rounded-lg border border-fw-green/30 bg-fw-green/5 flex items-center gap-2"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 text-fw-green flex-shrink-0" />
                            <div>
                              <p className="text-[10px] text-fw-green font-mono font-bold">
                                Configuration Saved! Reloading...
                              </p>
                              <p className="text-[9px] text-fw-dim font-mono">
                                The app will reload to activate Firebase Live Mode.
                              </p>
                            </div>
                          </motion.div>
                        )}
                      </div>

                      {/* Save button */}
                      <Button
                        type="button"
                        onClick={handleSaveConfig}
                        disabled={configStatus !== 'valid' || configStatus === 'saving' || configStatus === 'saved'}
                        className="w-full h-10 bg-fw-accent text-fw-bg font-bold text-xs tracking-widest uppercase hover:bg-fw-accent/90 fw-glow"
                      >
                        {configStatus === 'saving' ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin mr-2" />
                            Saving Configuration...
                          </>
                        ) : configStatus === 'saved' ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 mr-2" />
                            Saved — Reloading...
                          </>
                        ) : (
                          <>
                            <Flame className="w-3.5 h-3.5 mr-2" />
                            Save & Activate Firebase
                          </>
                        )}
                      </Button>

                      {/* Security note */}
                      <p className="text-[9px] text-fw-dim font-mono text-center leading-relaxed">
                        Your config is saved locally to <span className="text-fw-accent">.env.local</span>.
                        It never leaves your device. Firebase keys are safe to use client-side.
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {/* Firebase setup steps (only in demo mode) — kept as a quick reference */}
          {isDemoMode && !showConfigPaster && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-4 p-3 rounded-lg border border-fw-border bg-fw-bg"
            >
              <div className="flex items-center gap-2 mb-2">
                <Info className="w-3 h-3 text-fw-dim" />
                <span className="text-[9px] font-mono tracking-widest uppercase text-fw-dim">
                  Firebase Services Needed
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {['Authentication', 'Cloud Firestore', 'Storage'].map((service) => (
                  <span
                    key={service}
                    className="px-2 py-0.5 rounded text-[9px] font-mono border border-fw-border bg-fw-surface text-fw-dim"
                  >
                    {service}
                  </span>
                ))}
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
