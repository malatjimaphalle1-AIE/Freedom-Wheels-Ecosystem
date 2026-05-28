'use client'

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo, useSyncExternalStore } from 'react'
import { type User } from 'firebase/auth'
import {
  onAuthChange,
  getUserProfile,
  createUserProfile,
  isFirebaseConfigured,
  type FirestoreUserProfile,
} from '@/lib/firebase-auth'
import {
  localGetCurrentUser,
  localGetProfile,
  localSignOut as localSignOutFn,
  type LocalUser,
} from '@/lib/local-auth'
import { isFounder, getRoleFromEmail, USER_ROLES, type UserRole } from '@/lib/firebase'

// ---- useSyncExternalStore helpers for client-only state ----

const emptySubscribe = () => () => {}

// Returns false on server, true on client — no hydration mismatch
function useHasMounted(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  )
}

// Subscribe to localStorage changes for a given key
function subscribeToLocalStorage(callback: () => void) {
  window.addEventListener('storage', callback)
  // Custom event for same-tab updates
  window.addEventListener('fw-local-auth-change', callback)
  return () => {
    window.removeEventListener('storage', callback)
    window.removeEventListener('fw-local-auth-change', callback)
  }
}

// Read local user from localStorage via useSyncExternalStore (hydration-safe)
function useLocalUser(): LocalUser | null {
  return useSyncExternalStore(
    subscribeToLocalStorage,
    () => localGetCurrentUser(),
    () => null // server always returns null
  )
}

// Read local profile from localStorage via useSyncExternalStore (hydration-safe)
function useLocalProfile(uid: string | null): ReturnType<typeof localGetProfile> {
  return useSyncExternalStore(
    subscribeToLocalStorage,
    () => uid ? localGetProfile(uid) : null,
    () => null // server always returns null
  )
}

// Dispatch a custom event so same-tab useSyncExternalStore subscribers re-read
function emitLocalAuthChange() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('fw-local-auth-change'))
  }
}

// ---- Context ----

interface AuthContextType {
  user: User | null
  profile: FirestoreUserProfile | null
  loading: boolean
  isAuthenticated: boolean
  isFounderUser: boolean
  role: UserRole
  refreshProfile: () => Promise<void>
  isDemoMode: boolean
  localUser: LocalUser | null
  setLocalUser: (user: LocalUser | null) => void
  mounted: boolean
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  isAuthenticated: false,
  isFounderUser: false,
  role: USER_ROLES.FREE,
  refreshProfile: async () => {},
  isDemoMode: true,
  localUser: null,
  setLocalUser: () => {},
  mounted: false,
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Firebase auth state
  const [user, setUser] = useState<User | null>(null)
  const [firebaseProfile, setFirebaseProfile] = useState<FirestoreUserProfile | null>(null)
  const [loading, setLoading] = useState(isFirebaseConfigured)

  // Local auth state via useSyncExternalStore (hydration-safe)
  const mounted = useHasMounted()
  const localUser = useLocalUser()
  const localProf = useLocalProfile(localUser?.uid ?? null)

  // isDemoMode is derived from isFirebaseConfigured (static, same on server & client)
  const isDemoMode = !isFirebaseConfigured

  // Profile: use Firebase profile in live mode, local profile in demo mode
  const profile = isFirebaseConfigured ? firebaseProfile : localProf

  const setLocalUser = useCallback((newUser: LocalUser | null) => {
    // When setting local user, update localStorage then emit change event
    // so useSyncExternalStore re-reads automatically
    if (newUser) {
      localStorage.setItem('fw_current_user', JSON.stringify(newUser))
    } else {
      localStorage.removeItem('fw_current_user')
    }
    emitLocalAuthChange()
  }, [])

  const refreshProfile = useCallback(async () => {
    if (isFirebaseConfigured && user) {
      const prof = await getUserProfile(user.uid)
      if (prof) setFirebaseProfile(prof)
    }
    // For demo mode, useSyncExternalStore auto-reads from localStorage
    // Just emit a change event to trigger re-read
    emitLocalAuthChange()
  }, [user])

  // Subscribe to Firebase auth changes
  useEffect(() => {
    if (!isFirebaseConfigured) return

    const unsubscribe = onAuthChange(async (firebaseUser) => {
      setUser(firebaseUser)
      if (firebaseUser) {
        try {
          let prof = await getUserProfile(firebaseUser.uid)
          if (!prof) {
            prof = await createUserProfile(firebaseUser)
          }
          const founderStatus = isFounder(firebaseUser.email)
          if (founderStatus && !prof.isFounder) {
            prof = await createUserProfile(firebaseUser)
          }
          setFirebaseProfile(prof)
        } catch (error) {
          console.error('Error loading user profile:', error)
          const fallbackProfile = await createUserProfile(firebaseUser)
          setFirebaseProfile(fallbackProfile)
        }
      } else {
        setFirebaseProfile(null)
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const founderStatus = isFounder(user?.email || localUser?.email)
  const role = profile?.role || getRoleFromEmail(user?.email || localUser?.email)
  const isAuthenticated = isFirebaseConfigured ? !!user : !!localUser

  const contextValue = useMemo(() => ({
    user,
    profile,
    loading,
    isAuthenticated,
    isFounderUser: founderStatus,
    role,
    refreshProfile,
    isDemoMode,
    localUser,
    setLocalUser,
    mounted,
  }), [user, profile, loading, isAuthenticated, founderStatus, role, refreshProfile, isDemoMode, localUser, setLocalUser, mounted])

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export { AuthContext }
