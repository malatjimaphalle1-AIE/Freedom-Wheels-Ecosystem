import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  updateProfile,
  updatePassword,
  sendPasswordResetEmail,
  reauthenticateWithCredential,
  EmailAuthProvider,
  deleteUser,
  type User,
} from 'firebase/auth'
import { doc, setDoc, getDoc, updateDoc, serverTimestamp, onSnapshot } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { auth, db, storage, isFounder, getRoleFromEmail, USER_ROLES, isFirebaseConfigured, type UserRole } from './firebase'

// Re-export isFirebaseConfigured for convenience
export { isFirebaseConfigured }

// User profile interface for Firestore
export interface FirestoreUserProfile {
  uid: string
  email: string
  displayName: string
  photoURL: string
  bio: string
  phone: string
  location: string
  website: string
  role: UserRole
  plan: string
  joinDate: string
  lastLogin: string
  createdAt: string
  updatedAt: string
  // Founder-specific
  isFounder: boolean
  founderTitle: string
  // Permissions
  permissions: string[]
  // Stats
  totalRevenue: number
  activeEngines: number
  referrals: number
  leaderboardRank: number
  // Settings
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

// Default profile for new users
export function createDefaultProfile(user: User): FirestoreUserProfile {
  const founderStatus = isFounder(user.email)
  const role = getRoleFromEmail(user.email)

  return {
    uid: user.uid,
    email: user.email || '',
    displayName: user.displayName || user.email?.split('@')[0] || 'New User',
    photoURL: user.photoURL || '',
    bio: founderStatus
      ? 'Founder & Master Architect of Freedom Wheels™ Ecosystem. Building sovereign income infrastructure for the world.'
      : 'New member of the Freedom Wheels™ Ecosystem.',
    phone: '',
    location: '',
    website: '',
    role,
    plan: founderStatus ? 'SOVEREIGN FOUNDER' : 'FREE',
    joinDate: new Date().toISOString().split('T')[0],
    lastLogin: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isFounder: founderStatus,
    founderTitle: founderStatus ? 'Founder & Master Architect' : '',
    permissions: founderStatus ? ['all'] : [],
    totalRevenue: founderStatus ? 92000 : 0,
    activeEngines: founderStatus ? 3 : 0,
    referrals: founderStatus ? 24 : 0,
    leaderboardRank: founderStatus ? 1 : 999,
    notifications: {
      revenue: true,
      engines: true,
      leads: true,
      system: founderStatus,
      marketing: false,
    },
    apiKeys: {
      gemini: founderStatus ? 'sk-ge***********************************3xK' : '',
      wise: founderStatus ? 'sk-wi***********************************7pQ' : '',
    },
    twoFactorEnabled: founderStatus,
    region: 'Global (Multi-Region)',
    theme: 'Cyberpunk Dark',
  }
}

// Create or update user profile in Firestore
export async function createUserProfile(user: User): Promise<FirestoreUserProfile> {
  const profile = createDefaultProfile(user)

  if (!db) {
    console.warn('[FIREBASE] Firestore not available — returning default profile')
    return profile
  }

  const userRef = doc(db, 'users', user.uid)

  try {
    // Check if profile already exists
    const existingDoc = await getDoc(userRef)
    if (existingDoc.exists()) {
      // Update last login
      const existing = existingDoc.data() as FirestoreUserProfile
      // Ensure founder status is always correct
      const updatedProfile = {
        ...existing,
        lastLogin: new Date().toISOString(),
        isFounder: isFounder(user.email),
        role: isFounder(user.email) ? USER_ROLES.FOUNDER : existing.role,
        plan: isFounder(user.email) ? 'SOVEREIGN FOUNDER' : existing.plan,
        founderTitle: isFounder(user.email) ? 'Founder & Master Architect' : existing.founderTitle,
        permissions: isFounder(user.email) ? ['all'] : existing.permissions,
      }
      await updateDoc(userRef, updatedProfile)
      return updatedProfile
    } else {
      // Create new profile
      await setDoc(userRef, {
        ...profile,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
      return profile
    }
  } catch (error) {
    console.error('Error creating/updating user profile:', error)
    return profile
  }
}

// Get user profile from Firestore
export async function getUserProfile(uid: string): Promise<FirestoreUserProfile | null> {
  if (!db) return null

  try {
    const userRef = doc(db, 'users', uid)
    const docSnap = await getDoc(userRef)
    if (docSnap.exists()) {
      return docSnap.data() as FirestoreUserProfile
    }
    return null
  } catch (error) {
    console.error('Error getting user profile:', error)
    return null
  }
}

// Update user profile in Firestore
export async function updateUserProfile(
  uid: string,
  updates: Partial<FirestoreUserProfile>
): Promise<void> {
  if (!db) {
    console.warn('[FIREBASE] Firestore not available — profile update skipped')
    return
  }

  try {
    const userRef = doc(db, 'users', uid)
    await updateDoc(userRef, {
      ...updates,
      updatedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Error updating user profile:', error)
    throw error
  }
}

// Upload profile photo to Firebase Storage
export async function uploadProfilePhoto(
  uid: string,
  file: File
): Promise<string> {
  if (!storage) {
    throw new Error('Firebase Storage not available')
  }

  try {
    const fileRef = ref(storage, `profile-photos/${uid}/${file.name}`)
    await uploadBytes(fileRef, file)
    const downloadURL = await getDownloadURL(fileRef)

    // Update both Auth profile and Firestore profile
    if (auth?.currentUser) {
      await updateProfile(auth.currentUser, { photoURL: downloadURL })
    }
    await updateUserProfile(uid, { photoURL: downloadURL })

    return downloadURL
  } catch (error) {
    console.error('Error uploading profile photo:', error)
    throw error
  }
}

// Auth functions — all guard against missing auth module
export async function signUpWithEmail(email: string, password: string) {
  if (!auth) throw new Error('Firebase Authentication not configured. Add valid credentials to .env.local')
  const credential = await createUserWithEmailAndPassword(auth, email, password)
  await createUserProfile(credential.user)
  return credential.user
}

export async function signInWithEmail(email: string, password: string) {
  if (!auth) throw new Error('Firebase Authentication not configured. Add valid credentials to .env.local')
  const credential = await signInWithEmailAndPassword(auth, email, password)
  await createUserProfile(credential.user)
  return credential.user
}

export async function signInWithGoogle() {
  if (!auth) throw new Error('Firebase Authentication not configured. Add valid credentials to .env.local')
  const provider = new GoogleAuthProvider()
  const credential = await signInWithPopup(auth, provider)
  await createUserProfile(credential.user)
  return credential.user
}

export async function signOutUser() {
  if (!auth) throw new Error('Firebase Authentication not configured')
  await signOut(auth)
}

export async function updateUserDisplayName(displayName: string) {
  if (!auth?.currentUser) return
  await updateProfile(auth.currentUser, { displayName })
  await updateUserProfile(auth.currentUser.uid, { displayName })
}

export async function changeUserPassword(oldPassword: string, newPassword: string) {
  if (!auth?.currentUser || !auth.currentUser.email) return
  const credential = EmailAuthProvider.credential(auth.currentUser.email, oldPassword)
  await reauthenticateWithCredential(auth.currentUser, credential)
  await updatePassword(auth.currentUser, newPassword)
}

export async function resetPassword(email: string) {
  if (!auth) throw new Error('Firebase Authentication not configured')
  await sendPasswordResetEmail(auth, email)
}

export async function deleteAccount() {
  if (auth?.currentUser) {
    await deleteUser(auth.currentUser)
  }
}

// Listen to auth state
export function onAuthChange(callback: (user: User | null) => void) {
  if (!auth) {
    // Firebase not configured — immediately return null user
    callback(null)
    return () => {}
  }
  return onAuthStateChanged(auth, callback)
}

// Listen to user profile changes in real-time
export function onProfileChange(uid: string, callback: (profile: FirestoreUserProfile) => void) {
  if (!db) return () => {}
  const userRef = doc(db, 'users', uid)
  return onSnapshot(userRef, (docSnap) => {
    if (docSnap.exists()) {
      callback(docSnap.data() as FirestoreUserProfile)
    }
  })
}
