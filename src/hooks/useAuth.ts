import { useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (!u) {
        setProfile(null);
        setLoading(false);
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
        setProfile(snap.data() as UserProfile);
      } else {
        setProfile(null);
      }
      setLoading(false);
    }, (err) => {
      console.error('Error listening to user profile:', err);
      // Fallback: If document doesn't exist yet, we still want to finish loading
      setLoading(false);
    });

    return unsubDoc;
  }, [user]);

  return { user, profile, loading };
}
export default useAuth;
