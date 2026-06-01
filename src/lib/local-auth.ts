/**
 * Freedom Wheels™ — Local Authentication Module
 * Provides localStorage-based auth for Demo Mode when Firebase is not configured.
 * This file is critical for the app to function and must NOT be deleted.
 */

// ─── Types ──────────────────────────────────────────────────────────────

export interface LocalUser {
  id: string
  uid: string
  email: string
  displayName: string
  password: string
  createdAt: string
}

export interface LocalProfile {
  uid: string
  email: string
  displayName: string
  photoURL: string
  bio: string
  phone: string
  location: string
  website: string
  role: string
  plan: string
  joinDate: string
  lastLogin: string
  createdAt: string
  updatedAt: string
  isFounder: boolean
  founderTitle: string
  permissions: string[]
  totalRevenue: number
  activeEngines: number
  referrals: number
  leaderboardRank: number
  notifications: {
    revenue: boolean
    engines: boolean
    leads: boolean
    system: boolean
    marketing: boolean
  }
  apiKeys: {
    gemini: string
    wise: string
  }
  twoFactorEnabled: boolean
  region: string
  theme: string
}

// ─── Storage Keys ───────────────────────────────────────────────────────

const USERS_KEY = 'fw_local_users'
const PROFILES_KEY = 'fw_local_profiles'
const CURRENT_USER_KEY = 'fw_current_user'

// ─── Helper Functions ───────────────────────────────────────────────────

function getUsers(): Record<string, LocalUser> {
  if (typeof window === 'undefined') return {}
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY) || '{}')
  } catch {
    return {}
  }
}

function saveUsers(users: Record<string, LocalUser>) {
  if (typeof window === 'undefined') return
  localStorage.setItem(USERS_KEY, JSON.stringify(users))
}

function getProfiles(): Record<string, LocalProfile> {
  if (typeof window === 'undefined') return {}
  try {
    return JSON.parse(localStorage.getItem(PROFILES_KEY) || '{}')
  } catch {
    return {}
  }
}

function saveProfiles(profiles: Record<string, LocalProfile>) {
  if (typeof window === 'undefined') return
  localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles))
}

function generateId(): string {
  return 'local_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8)
}

function emitAuthChange() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('fw-local-auth-change'))
  }
}

// ─── Seed Founder Account ───────────────────────────────────────────────

function seedFounder() {
  const users = getUsers()
  const founderEmail = 'malatjimaphalle1@gmail.com'

  if (!users[founderEmail]) {
    const founderId = 'founder_local_001'
    users[founderEmail] = {
      id: founderId,
      uid: founderId,
      email: founderEmail,
      displayName: 'Maphalle Malatji',
      password: 'Freedom2025!',
      createdAt: new Date().toISOString(),
    }
    saveUsers(users)

    const profiles = getProfiles()
    profiles[founderId] = {
      uid: founderId,
      email: founderEmail,
      displayName: 'Maphalle Malatji',
      photoURL: '',
      bio: 'Founder & Master Architect of Freedom Wheels™ Ecosystem. Building sovereign income infrastructure for the world.',
      phone: '',
      location: 'Johannesburg, South Africa',
      website: 'https://freedomwheels.io',
      role: 'FOUNDER',
      plan: 'SOVEREIGN FOUNDER',
      joinDate: '2025-01-01',
      lastLogin: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isFounder: true,
      founderTitle: 'Founder & Master Architect',
      permissions: ['all'],
      totalRevenue: 92000,
      activeEngines: 3,
      referrals: 24,
      leaderboardRank: 1,
      notifications: {
        revenue: true,
        engines: true,
        leads: true,
        system: true,
        marketing: false,
      },
      apiKeys: {
        gemini: 'sk-ge***********************************3xK',
        wise: 'sk-wi***********************************7pQ',
      },
      twoFactorEnabled: true,
      region: 'Global (Multi-Region)',
      theme: 'Cyberpunk Dark',
    }
    saveProfiles(profiles)
  }
}

// Auto-seed founder on module load (client-side only)
if (typeof window !== 'undefined') {
  seedFounder()
}

// ─── Authentication Functions ────────────────────────────────────────────

export function localSignIn(email: string, password: string): { user?: LocalUser; error?: string } {
  // Ensure founder is seeded
  seedFounder()

  const users = getUsers()
  const user = users[email]

  if (!user) {
    return { error: 'No account found with this email' }
  }

  if (user.password !== password) {
    return { error: 'Incorrect password' }
  }

  // Update last login
  const profiles = getProfiles()
  if (profiles[user.uid]) {
    profiles[user.uid].lastLogin = new Date().toISOString()
    saveProfiles(profiles)
  }

  // Set current user
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user))
  emitAuthChange()

  return { user }
}

export function localSignUp(email: string, password: string, displayName: string): { user?: LocalUser; error?: string } {
  const users = getUsers()

  if (users[email]) {
    return { error: 'An account with this email already exists' }
  }

  if (password.length < 6) {
    return { error: 'Password must be at least 6 characters' }
  }

  const uid = generateId()
  const user: LocalUser = {
    id: uid,
    uid,
    email,
    displayName,
    password,
    createdAt: new Date().toISOString(),
  }

  users[email] = user
  saveUsers(users)

  // Create profile
  const profiles = getProfiles()
  profiles[uid] = {
    uid,
    email,
    displayName,
    photoURL: '',
    bio: 'New member of the Freedom Wheels™ Ecosystem.',
    phone: '',
    location: '',
    website: '',
    role: 'FREE',
    plan: 'FREE',
    joinDate: new Date().toISOString().split('T')[0],
    lastLogin: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isFounder: false,
    founderTitle: '',
    permissions: [],
    totalRevenue: 0,
    activeEngines: 0,
    referrals: 0,
    leaderboardRank: 999,
    notifications: {
      revenue: true,
      engines: true,
      leads: true,
      system: false,
      marketing: false,
    },
    apiKeys: {
      gemini: '',
      wise: '',
    },
    twoFactorEnabled: false,
    region: 'Global (Multi-Region)',
    theme: 'Cyberpunk Dark',
  }
  saveProfiles(profiles)

  // Set current user
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user))
  emitAuthChange()

  return { user }
}

export function localSignOut() {
  if (typeof window === 'undefined') return
  localStorage.removeItem(CURRENT_USER_KEY)
  emitAuthChange()
}

export function localGetCurrentUser(): LocalUser | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(CURRENT_USER_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function localGetProfile(uid: string): LocalProfile | null {
  if (typeof window === 'undefined') return null
  const profiles = getProfiles()
  return profiles[uid] || null
}

export function localUpdateProfile(uid: string, updates: Partial<LocalProfile>) {
  if (typeof window === 'undefined') return
  const profiles = getProfiles()
  if (!profiles[uid]) return

  profiles[uid] = {
    ...profiles[uid],
    ...updates,
    updatedAt: new Date().toISOString(),
  }
  saveProfiles(profiles)
  emitAuthChange()
}

export async function localUploadProfilePhoto(uid: string, file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = reader.result as string
      localUpdateProfile(uid, { photoURL: dataUrl })
      resolve(dataUrl)
    }
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })
}

export function localChangePassword(
  uid: string,
  oldPassword: string,
  newPassword: string
): { error?: string } {
  if (typeof window === 'undefined') return { error: 'Not available on server' }

  const users = getUsers()
  const userEntry = Object.entries(users).find(([_, u]) => u.uid === uid)

  if (!userEntry) {
    return { error: 'User not found' }
  }

  const [email, user] = userEntry
  if (user.password !== oldPassword) {
    return { error: 'Current password is incorrect' }
  }

  if (newPassword.length < 6) {
    return { error: 'New password must be at least 6 characters' }
  }

  users[email].password = newPassword
  saveUsers(users)

  return {}
}

export function localResetPassword(email: string): { error?: string } {
  if (typeof window === 'undefined') return { error: 'Not available on server' }

  const users = getUsers()
  if (!users[email]) {
    return { error: 'No account found with this email' }
  }

  // In demo mode, we just simulate a reset
  return {}
}
