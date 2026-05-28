'use client'

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { type User } from 'firebase/auth'
import {
  onAuthChange,
  getUserProfile,
  createUserProfile,
  type FirestoreUserProfile,
} from '@/lib/firebase-auth'
import { isFounder, getRoleFromEmail, USER_ROLES, type UserRole } from '@/lib/firebase'

interface AuthContextType {
  user: User | null
  profile: FirestoreUserProfile | null
  loading: boolean
  isAuthenticated: boolean
  isFounderUser: boolean
  role: UserRole
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  isAuthenticated: false,
  isFounderUser: false,
  role: USER_ROLES.FREE,
  refreshProfile: async () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<FirestoreUserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  const refreshProfile = useCallback(async () => {
    if (user) {
      const prof = await getUserProfile(user.uid)
      if (prof) setProfile(prof)
    }
  }, [user])

  useEffect(() => {
    const unsubscribe = onAuthChange(async (firebaseUser) => {
      setUser(firebaseUser)
      if (firebaseUser) {
        try {
          let prof = await getUserProfile(firebaseUser.uid)
          if (!prof) {
            prof = await createUserProfile(firebaseUser)
          }
          // Ensure founder status is always correct
          const founderStatus = isFounder(firebaseUser.email)
          if (founderStatus && !prof.isFounder) {
            prof = await createUserProfile(firebaseUser)
          }
          setProfile(prof)
        } catch (error) {
          console.error('Error loading user profile:', error)
          // Create a fallback profile
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

  const founderStatus = isFounder(user?.email)
  const role = profile?.role || getRoleFromEmail(user?.email)

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        isAuthenticated: !!user,
        isFounderUser: founderStatus,
        role,
        refreshProfile,
      }}
    >
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
