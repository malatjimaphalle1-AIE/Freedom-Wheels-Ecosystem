import { initializeApp, getApps, getApp } from 'firebase/app'
import { getAuth, connectAuthEmulator } from 'firebase/auth'
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore'
import { getStorage, connectStorageEmulator } from 'firebase/storage'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
}

// Initialize Firebase (prevent duplicate initialization)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp()

// Initialize services
export const auth = getAuth(app)
export const db = getFirestore(app)
export const storage = getStorage(app)

export default app

// Founder email constant
export const FOUNDER_EMAIL = process.env.NEXT_PUBLIC_FOUNDER_EMAIL || 'maphalle.malatji@freedomwheels.io'

// User roles
export const USER_ROLES = {
  FOUNDER: 'FOUNDER',
  ADMIN: 'ADMIN',
  SOVEREIGN: 'SOVEREIGN',
  PRO: 'PRO',
  STARTER: 'STARTER',
  FREE: 'FREE',
} as const

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES]

// Role permissions
export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  FOUNDER: [
    'all', // Unlimited access
  ],
  ADMIN: [
    'dashboard', 'builder', 'leads', 'wallet', 'marketplace', 'analysis',
    'traffic', 'automation', 'leaderboard', 'referrals', 'knowledge',
    'settings', 'profile', 'admin_panel', 'user_management', 'system_config',
  ],
  SOVEREIGN: [
    'dashboard', 'builder', 'leads', 'wallet', 'marketplace', 'analysis',
    'traffic', 'automation', 'leaderboard', 'referrals', 'knowledge',
    'settings', 'profile',
  ],
  PRO: [
    'dashboard', 'builder', 'leads', 'wallet', 'marketplace', 'analysis',
    'traffic', 'settings', 'profile',
  ],
  STARTER: [
    'dashboard', 'leads', 'wallet', 'settings', 'profile',
  ],
  FREE: [
    'dashboard', 'settings', 'profile',
  ],
}

export function hasPermission(role: UserRole, permission: string): boolean {
  const perms = ROLE_PERMISSIONS[role]
  if (perms.includes('all')) return true
  return perms.includes(permission)
}

export function isFounder(email: string | null | undefined): boolean {
  if (!email) return false
  return email.toLowerCase() === FOUNDER_EMAIL.toLowerCase()
}

export function getRoleFromEmail(email: string | null | undefined): UserRole {
  if (isFounder(email)) return USER_ROLES.FOUNDER
  return USER_ROLES.FREE // Default role for new users
}
