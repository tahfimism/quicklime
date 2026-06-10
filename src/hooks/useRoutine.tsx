import React, { createContext, useContext, useState, useEffect } from 'react';
import { collection, doc, onSnapshot, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from './useAuth';
import { Routine, Slot } from '@/types';

interface RoutineContextType {
  routines: Record<number, Routine>;
  loading: boolean;
  updateRoutine: (dayOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6, slots: Slot[]) => Promise<void>;
}

const RoutineContext = createContext<RoutineContextType>({
  routines: {},
  loading: true,
  updateRoutine: async () => {},
});

export function RoutineProvider({ children }: { children: React.ReactNode }) {
  const { profile } = useAuth();
  const [routines, setRoutines] = useState<Record<number, Routine>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile?.workspaceId) {
      setRoutines({});
      setLoading(false);
      return;
    }

    const routinesColRef = collection(db, 'workspaces', profile.workspaceId, 'routines');
    const unsub = onSnapshot(
      routinesColRef,
      (snap) => {
        const newRoutines: Record<number, Routine> = {};
        snap.forEach((doc) => {
          const data = doc.data() as Omit<Routine, 'id'>;
          const day = data.dayOfWeek;
          newRoutines[day] = {
            id: doc.id,
            ...data,
          } as Routine;
        });
        setRoutines(newRoutines);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching routines:', err);
        setLoading(false);
      }
    );

    return unsub;
  }, [profile?.workspaceId]);

  const updateRoutine = async (dayOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6, slots: Slot[]) => {
    if (!profile?.workspaceId || profile.role !== 'cr') {
      throw new Error('Permission Denied: Only CR can modify class routines.');
    }

    const sortedSlots = [...slots].sort((a, b) => a.startTime.localeCompare(b.startTime));

    const docRef = doc(db, 'workspaces', profile.workspaceId, 'routines', dayOfWeek.toString());
    await setDoc(docRef, {
      dayOfWeek,
      slots: sortedSlots,
      updatedAt: serverTimestamp(),
      updatedBy: profile.uid,
    });
  };

  return (
    <RoutineContext.Provider value={{ routines, loading, updateRoutine }}>
      {children}
    </RoutineContext.Provider>
  );
}

export function useRoutine() {
  return useContext(RoutineContext);
}
export default useRoutine;
