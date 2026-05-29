import { initializeApp, getApps, getApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
}

// Check if Firebase credentials are valid (not placeholder values)
function isValidFirebaseConfig(): boolean {
  const apiKey = firebaseConfig.apiKey
  if (!apiKey) return false
  // Detect placeholder / demo keys
  if (apiKey.startsWith('AIzaSyDemo') || apiKey.includes('Replace-With') || apiKey.includes('YOUR_')) return false
  if (apiKey === 'undefined' || apiKey.length < 20) return false
  // Check project ID is also valid
  const projectId = firebaseConfig.projectId
  if (!projectId || projectId === 'undefined' || projectId.includes('Replace-With')) return false
  return true
}

export const isFirebaseConfigured = isValidFirebaseConfig()

// Only initialize Firebase if credentials are valid
let app: ReturnType<typeof initializeApp> | null = null
let authModule: ReturnType<typeof getAuth> | null = null
let dbModule: ReturnType<typeof getFirestore> | null = null
let storageModule: ReturnType<typeof getStorage> | null = null

if (isFirebaseConfigured) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp()
    authModule = getAuth(app)
    dbModule = getFirestore(app)
    storageModule = getStorage(app)
  } catch (error) {
    console.error('[FIREBASE] Initialization failed:', error)
  }
}

export const auth = authModule
export const db = dbModule
export const storage = storageModule
export default app

// Founder email constant
export const FOUNDER_EMAIL = process.env.NEXT_PUBLIC_FOUNDER_EMAIL || 'malatjimaphalle1@gmail.com'

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
