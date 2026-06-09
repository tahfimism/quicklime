import { useState, useEffect } from 'react';
import {
  collection,
  doc,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from './useAuth';
import { Event } from '@/types';

/**
 * Custom hook to manage workspace events in real-time.
 * Supports adding, editing, and deleting events (restricted to CRs).
 */
export function useEvents() {
  const { profile } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile?.workspaceId) {
      setEvents([]);
      setLoading(false);
      return;
    }

    const eventsColRef = collection(db, 'workspaces', profile.workspaceId, 'events');
    const q = query(eventsColRef, orderBy('date', 'asc'), orderBy('startTime', 'asc'));

    const unsub = onSnapshot(
      q,
      (snap) => {
        const list: Event[] = [];
        snap.forEach((doc) => {
          list.push({ id: doc.id, ...doc.data() } as Event);
        });
        setEvents(list);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching workspace events:', err);
        setLoading(false);
      }
    );

    return unsub;
  }, [profile?.workspaceId]);

  /**
   * Adds a new event to the workspace events collection.
   */
  const addEvent = async (
    eventData: Omit<
      Event,
      'id' | 'createdBy' | 'createdAt' | 'updatedAt' | 'notificationSent'
    >
  ) => {
    if (!profile?.workspaceId || profile.role !== 'cr') {
      throw new Error('Permission Denied: Only CR can create events.');
    }

    const eventsColRef = collection(db, 'workspaces', profile.workspaceId, 'events');
    await addDoc(eventsColRef, {
      ...eventData,
      createdBy: profile.uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      notificationSent: false,
    });
  };

  /**
   * Edits/updates an existing event in the workspace.
   */
  const editEvent = async (eventId: string, updates: Partial<Omit<Event, 'id' | 'createdAt'>>) => {
    if (!profile?.workspaceId || profile.role !== 'cr') {
      throw new Error('Permission Denied: Only CR can edit events.');
    }

    const eventDocRef = doc(db, 'workspaces', profile.workspaceId, 'events', eventId);
    await updateDoc(eventDocRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  };

  /**
   * Deletes an event from the workspace.
   */
  const deleteEvent = async (eventId: string) => {
    if (!profile?.workspaceId || profile.role !== 'cr') {
      throw new Error('Permission Denied: Only CR can delete events.');
    }

    const eventDocRef = doc(db, 'workspaces', profile.workspaceId, 'events', eventId);
    await deleteDoc(eventDocRef);
  };

  return { events, loading, addEvent, editEvent, deleteEvent };
}
export default useEvents;
