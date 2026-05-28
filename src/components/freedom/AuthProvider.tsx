'use client'

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react'
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
} from '@/lib/local-auth'
import { isFounder, getRoleFromEmail, USER_ROLES, type UserRole } from '@/lib/firebase'

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
})

// Initialize local auth state from localStorage (client-side only)
function getInitialLocalState() {
  if (typeof window === 'undefined') return { localUser: null, profile: null }
  const stored = localGetCurrentUser()
  if (stored) {
    const prof = localGetProfile(stored.uid)
    return { localUser: stored, profile: prof }
  }
  return { localUser: null, profile: null }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // For demo mode, initialize directly from localStorage
  const initialState = isFirebaseConfigured ? null : getInitialLocalState()

  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<FirestoreUserProfile | null>(initialState?.profile || null)
  const [loading, setLoading] = useState(isFirebaseConfigured) // Firebase mode needs to check auth first
  const [localUser, setLocalUserState] = useState<LocalUser | null>(initialState?.localUser || null)

  // isDemoMode is derived from isFirebaseConfigured
  const isDemoMode = !isFirebaseConfigured

  const handleSetLocalUser = useCallback((newUser: LocalUser | null) => {
    setLocalUserState(newUser)
    if (newUser) {
      const prof = localGetProfile(newUser.uid)
      if (prof) setProfile(prof)
    } else {
      setProfile(null)
    }
  }, [])

  const refreshProfile = useCallback(async () => {
    if (isFirebaseConfigured && user) {
      const prof = await getUserProfile(user.uid)
      if (prof) setProfile(prof)
    } else if (localUser) {
      const prof = localGetProfile(localUser.uid)
      if (prof) setProfile(prof)
    }
  }, [user, localUser])

  // Only subscribe to Firebase auth changes (not needed in demo mode)
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
          setProfile(prof)
        } catch (error) {
          console.error('Error loading user profile:', error)
          const fallbackProfile = await createUserProfile(firebaseUser)
          setProfile(fallbackProfile)
        }
      } else {
        setProfile(null)
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
    setLocalUser: handleSetLocalUser,
  }), [user, profile, loading, isAuthenticated, founderStatus, role, refreshProfile, isDemoMode, localUser, handleSetLocalUser])

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
