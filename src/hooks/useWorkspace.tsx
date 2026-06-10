import React, { createContext, useContext, useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from './useAuth';
import { Workspace } from '@/types';

interface WorkspaceContextType {
  workspace: Workspace | null;
  loading: boolean;
}

const WorkspaceContext = createContext<WorkspaceContextType>({
  workspace: null,
  loading: true,
});

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
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

  return (
    <WorkspaceContext.Provider value={{ workspace, loading }}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  return useContext(WorkspaceContext);
}
export default useWorkspace;
