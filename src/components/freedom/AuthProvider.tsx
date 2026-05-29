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
  type LocalUser,
  type LocalProfile,
} from '@/lib/local-auth'
import { isFounder, getRoleFromEmail, USER_ROLES, type UserRole } from '@/lib/firebase'

// ---- Hydration-safe useSyncExternalStore primitives ----

const emptySubscribe = () => () => {}

function useHasMounted(): boolean {
  return useSyncExternalStore(emptySubscribe, () => true, () => false)
}

// ---- Cached localStorage store for auth ----
// useSyncExternalStore requires referentially stable return values.
// We cache parsed objects and only create new ones when the raw JSON changes.

const NULL_USER: LocalUser | null = null
const NULL_PROFILE: LocalProfile | null = null

let _userJSON = ''
let _userObj: LocalUser | null = null
let _profileJSON = ''
let _profileObj: LocalProfile | null = null

function subscribeToAuthStore(callback: () => void) {
  if (typeof window === 'undefined') return () => {}
  window.addEventListener('storage', callback)
  window.addEventListener('fw-local-auth-change', callback)
  return () => {
    window.removeEventListener('storage', callback)
    window.removeEventListener('fw-local-auth-change', callback)
  }
}

function getUserSnapshot(): LocalUser | null {
  if (typeof window === 'undefined') return NULL_USER
  const raw = localStorage.getItem('fw_current_user') || ''
  if (raw === _userJSON) return _userObj
  _userJSON = raw
  try {
    _userObj = raw ? JSON.parse(raw) : null
  } catch {
    _userObj = null
  }
  return _userObj
}

function getProfileSnapshot(uid: string | null): LocalProfile | null {
  if (typeof window === 'undefined' || !uid) return NULL_PROFILE
  const raw = localStorage.getItem('fw_local_profiles') || ''
  if (raw === _profileJSON) return _profileObj
  _profileJSON = raw
  try {
    const all = raw ? JSON.parse(raw) : {}
    _profileObj = all[uid] || null
  } catch {
    _profileObj = null
  }
  return _profileObj
}

// Invalidate the profile cache (called after profile updates)
function invalidateProfileCache() {
  _profileJSON = ''
  _profileObj = null
}

// Invalidate user cache
function invalidateUserCache() {
  _userJSON = ''
  _userObj = null
}

function emitLocalAuthChange() {
  if (typeof window !== 'undefined') {
    invalidateUserCache()
    invalidateProfileCache()
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

  // Hydration-safe mount flag
  const mounted = useHasMounted()

  // Local auth via useSyncExternalStore (hydration-safe, referentially stable)
  const localUser = useSyncExternalStore(subscribeToAuthStore, getUserSnapshot, () => null)
  const localProfile = useSyncExternalStore(subscribeToAuthStore, () => getProfileSnapshot(localUser?.uid ?? null), () => null)

  // isDemoMode is derived from isFirebaseConfigured (static, same on server & client)
  const isDemoMode = !isFirebaseConfigured

  // Profile: use Firebase profile in live mode, local profile in demo mode
  const profile = isFirebaseConfigured ? firebaseProfile : localProfile as FirestoreUserProfile | null

  const setLocalUser = useCallback((newUser: LocalUser | null) => {
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
