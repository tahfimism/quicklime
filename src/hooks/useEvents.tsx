import React, { createContext, useContext, useState, useEffect } from 'react';
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

interface EventsContextType {
  events: Event[];
  loading: boolean;
  addEvent: (
    eventData: Omit<
      Event,
      'id' | 'createdBy' | 'createdAt' | 'updatedAt' | 'notificationSent'
    >
  ) => Promise<void>;
  editEvent: (eventId: string, updates: Partial<Omit<Event, 'id' | 'createdAt'>>) => Promise<void>;
  deleteEvent: (eventId: string) => Promise<void>;
}

const EventsContext = createContext<EventsContextType>({
  events: [],
  loading: true,
  addEvent: async () => {},
  editEvent: async () => {},
  deleteEvent: async () => {},
});

export function EventsProvider({ children }: { children: React.ReactNode }) {
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

  const deleteEvent = async (eventId: string) => {
    if (!profile?.workspaceId || profile.role !== 'cr') {
      throw new Error('Permission Denied: Only CR can delete events.');
    }

    const eventDocRef = doc(db, 'workspaces', profile.workspaceId, 'events', eventId);
    await deleteDoc(eventDocRef);
  };

  return (
    <EventsContext.Provider value={{ events, loading, addEvent, editEvent, deleteEvent }}>
      {children}
    </EventsContext.Provider>
  );
}

export function useEvents() {
  return useContext(EventsContext);
}
export default useEvents;
