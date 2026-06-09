import { useState, useEffect } from 'react';
import { onIdTokenChanged, User, ParsedToken } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { UserProfile } from '@/types';

/**
 * Custom hook to monitor user authentication state and user profile updates in Firestore.
 * Automatically synchronizes the workspaceId and role claims.
 */
export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [claims, setClaims] = useState<ParsedToken | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubAuth = onIdTokenChanged(auth, async (u) => {
      setUser(u);
      if (!u) {
        setProfile(null);
        setClaims(null);
        setLoading(false);
      } else {
        try {
          const tokenResult = await u.getIdTokenResult();
          setClaims(tokenResult.claims);
        } catch (err) {
          console.error('Error fetching initial token claims:', err);
        }
      }
    });

    return unsubAuth;
  }, []);

  useEffect(() => {
    if (!user) return;

    // Listen to changes in the users/{uid} document
    const userDocRef = doc(db, 'users', user.uid);
    const unsubDoc = onSnapshot(userDocRef, (snap) => {
      if (snap.exists()) {
        const profileData = snap.data() as UserProfile;
        setProfile(profileData);
      } else {
        setProfile(null);
      }
      setLoading(false);
    }, (err) => {
      console.error('Error listening to user profile:', err);
      setLoading(false);
    });

    return unsubDoc;
  }, [user]);

  return { user, profile, claims, loading };
}
export default useAuth;
