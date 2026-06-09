import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from './useAuth';
import { Workspace } from '@/types';

/**
 * Custom hook to listen to the current active workspace profile in real-time.
 */
export function useWorkspace() {
  const { profile } = useAuth();
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile?.workspaceId) {
      setWorkspace(null);
      setLoading(false);
      return;
    }

    const docRef = doc(db, 'workspaces', profile.workspaceId);
    const unsub = onSnapshot(
      docRef,
      (snap) => {
        if (snap.exists()) {
          setWorkspace({ id: snap.id, ...snap.data() } as Workspace);
        } else {
          setWorkspace(null);
        }
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching workspace details:', err);
        setLoading(false);
      }
    );

    return unsub;
  }, [profile?.workspaceId]);

  return { workspace, loading };
}
export default useWorkspace;
