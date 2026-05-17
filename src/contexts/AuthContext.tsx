import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User, 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut 
} from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot, collection, query, where, getDocs, increment, addDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '../lib/firebase';

interface AuthContextType {
  user: User | null;
  profile: any | null;
  loading: boolean;
  signIn: () => Promise<void>;
  logOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        // Sync or Create Profile
        const userDocRef = doc(db, 'users', user.uid);
        
        try {
          const userDoc = await getDoc(userDocRef);
          
          if (!userDoc.exists()) {
            const isAdmin = user.email === 'malatjimaphalle1@gmail.com';
            // Get referral from session if exists
            const referredBy = sessionStorage.getItem('referredBy');
            
            const newProfile = {
              uid: user.uid,
              email: user.email,
              displayName: user.displayName,
              role: isAdmin ? 'ADMIN' : 'USER',
              level: 1,
              balance: 5000, 
              btcBalance: 0,
              usdtBalance: 0,
              referralCode: user.uid.substring(0, 8).toUpperCase(),
              referredBy: referredBy || null,
              referralCount: 0,
              referralEarnings: 0,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };
            await setDoc(userDocRef, newProfile);
            setProfile(newProfile);
            sessionStorage.removeItem('referredBy');

            // Handle Referrer Reward Sequence
            if (referredBy) {
              const referrersQuery = query(collection(db, 'users'), where('referralCode', '==', referredBy));
              const referrerSnap = await getDocs(referrersQuery);
              
              if (!referrerSnap.empty) {
                const referrerDoc = referrerSnap.docs[0];
                const referrerRef = doc(db, 'users', referrerDoc.id);
                
                // 1. Reward the referrer
                const reward = 50; // $50 neural reward
                await setDoc(referrerRef, { 
                  referralCount: increment(1),
                  referralEarnings: increment(reward),
                  balance: increment(reward),
                  updatedAt: new Date().toISOString()
                }, { merge: true });

                // 2. Create Referral Record
                await addDoc(collection(db, 'referrals'), {
                  referrerId: referrerDoc.id,
                  refereeId: user.uid,
                  refereeEmail: user.email,
                  rewardAmount: reward,
                  timestamp: serverTimestamp()
                });

                // 3. Log the event for the referrer
                await addDoc(collection(db, 'logs'), {
                  userId: referrerDoc.id,
                  title: "Neural Node Expansion",
                  desc: `New agent synced via your protocol. +$${reward}.00 synthesize reward credited.`,
                  type: "referral",
                  timestamp: serverTimestamp()
                });

                // 4. Reward the referee (current user)
                const refereeBonus = 25; 
                await setDoc(userDocRef, {
                  balance: increment(refereeBonus),
                  updatedAt: serverTimestamp()
                }, { merge: true });

                // 5. Log for the referee
                await addDoc(collection(db, 'logs'), {
                  userId: user.uid,
                  title: "Referral Status: Synced",
                  desc: `Protocol link established with referrer: ${referredBy}. +$${refereeBonus}.00 bonus credit received.`,
                  type: "system",
                  timestamp: serverTimestamp()
                });
              }
            }
          } else {
            const existingData = userDoc.data();
            // Ensure existing users have a referral code
            if (!existingData.referralCode) {
              const updates = {
                referralCode: user.uid.substring(0, 8).toUpperCase(),
                referralCount: existingData.referralCount || 0,
                referralEarnings: existingData.referralEarnings || 0,
                updatedAt: new Date().toISOString()
              };
              await setDoc(userDocRef, updates, { merge: true });
              setProfile({ ...existingData, ...updates });
            } else if (user.email === 'malatjimaphalle1@gmail.com' && existingData.role !== 'ADMIN') {
              await setDoc(userDocRef, { role: 'ADMIN', updatedAt: new Date().toISOString() }, { merge: true });
              setProfile({ ...existingData, role: 'ADMIN' });
            } else {
              setProfile(existingData);
            }
          }
        } catch (error) {
          handleFirestoreError(error, OperationType.GET, `users/${user.uid}`);
        }

        // Listen for profile changes
        const unsubProfile = onSnapshot(userDocRef, (doc) => {
          if (doc.exists()) setProfile(doc.data());
        }, (error) => {
          handleFirestoreError(error, OperationType.GET, `users/${user.uid}`);
        });
        
        return () => unsubProfile();
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signIn = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      if (error.code === 'auth/popup-closed-by-user') {
        console.warn("Authentication popup closed by user.");
      } else {
        console.error("Sign in failed:", error.message || error);
        throw error;
      }
    }
  };

  const logOut = async () => {
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signIn, logOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
