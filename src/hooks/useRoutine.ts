import { useState, useEffect } from 'react';
import { collection, doc, onSnapshot, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from './useAuth';
import { Routine, Slot } from '@/types';

/**
 * Custom hook to retrieve and update class routine slots in real-time.
 * Routines are stored with document IDs matching the `dayOfWeek` index (0 = Sunday ... 6 = Saturday).
 */
export function useRoutine() {
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

  /**
   * Overwrite routine slots for a specific day of the week.
   * Only accessible by Class Representatives (CR).
   */
  const updateRoutine = async (dayOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6, slots: Slot[]) => {
    if (!profile?.workspaceId || profile.role !== 'cr') {
      throw new Error('Permission Denied: Only CR can modify class routines.');
    }

    // Sort slots by start time to maintain consistent visual order
    const sortedSlots = [...slots].sort((a, b) => a.startTime.localeCompare(b.startTime));

    const docRef = doc(db, 'workspaces', profile.workspaceId, 'routines', dayOfWeek.toString());
    await setDoc(docRef, {
      dayOfWeek,
      slots: sortedSlots,
      updatedAt: serverTimestamp(),
      updatedBy: profile.uid,
    });
  };

  return { routines, loading, updateRoutine };
}
export default useRoutine;
