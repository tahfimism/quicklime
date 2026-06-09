import { Timestamp } from 'firebase/firestore';

export interface Workspace {
  id: string;               // Same as document ID
  name: string;             // e.g. "CSE Batch 2025 Section A"
  crUid: string;            // Firebase Auth UID of the CR
  inviteCode: string;       // 6-char alphanumeric, unique across all workspaces
  fcmTopic: string;         // "workspace_{workspaceId}"
  memberCount: number;      // Maintained by Cloud Functions
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Member {
  uid: string;                    // Firebase Auth UID
  displayName: string;
  email: string;
  photoUrl: string | null;
  role: 'cr' | 'student';
  joinedAt: Timestamp;
  fcmToken: string | null;        // Latest Expo push token
  notificationsEnabled: boolean;  // default true
}

export interface Slot {
  slotId: string;         // uuid v4, generated client-side
  courseName: string;
  courseCode: string;
  teacherName: string;
  room: string | null;
  startTime: string;      // "HH:mm" 24-hour format e.g. "09:00"
  endTime: string;        // "HH:mm" 24-hour format e.g. "10:30"
}

export interface Routine {
  id: string;
  dayOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6;  // 0 = Sunday, 6 = Saturday
  slots: Slot[];          // Ordered by startTime, validated server-side
  updatedAt: Timestamp;
  updatedBy: string;      // CR uid
}

export type EventType = 'extra_class' | 'test' | 'assignment' | 'notice';

export interface Attachment {
  attachmentId: string;   // uuid v4
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  storagePath: string;    // Firebase Storage path
  downloadUrl: string;    // Signed URL, refreshed every 6 days
  uploadedAt: Timestamp;
}

export interface Event {
  id: string;
  title: string;          // max 120 chars
  type: EventType;
  courseCode: string | null;
  teacherName: string | null;
  date: string;           // "YYYY-MM-DD"
  startTime: string | null;  // "HH:mm"
  endTime: string | null;    // "HH:mm"
  description: string | null;  // max 2000 chars
  attachments: Attachment[];   // max 10
  createdBy: string;      // CR uid
  createdAt: Timestamp;
  updatedAt: Timestamp;
  notificationSent: boolean;
}

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoUrl: string | null;
  workspaceId: string | null;  // null until joined
  role: 'cr' | 'student';
  fcmToken: string | null;
  createdAt: Timestamp;
  lastActiveAt: Timestamp;
}
