# Quicklime — PRD (Backend & Infrastructure)
**Version:** 2.0.0
**Date:** 2026-06-09
**Stack:** React Native (Expo) · Firebase Auth · Firestore · Firebase Storage · Cloud Functions · FCM

---

## 1. Project Overview

Quicklime is a cross-platform mobile app (iOS + Android) for managing university class routines,
events, and resources inside a shared workspace. A Class Representative (CR) administers the
workspace. Students join via invite code, view everything read-only, and receive push notifications
for new events and schedule changes.

### How the Stack Fits Together

```
┌─────────────────────────────────────────┐
│         React Native (Expo)             │  ← What users see and interact with
│   Talks directly to Firebase SDK        │
└────────────────┬────────────────────────┘
                 │
┌────────────────▼────────────────────────┐
│              Firebase                   │
│                                         │
│  ┌──────────┐  ┌──────────────────────┐ │
│  │   Auth   │  │      Firestore       │ │  ← Login + Database
│  └──────────┘  └──────────────────────┘ │
│  ┌──────────┐  ┌──────────────────────┐ │
│  │ Storage  │  │   Cloud Functions    │ │  ← Files + Background logic
│  └──────────┘  └──────────────────────┘ │
│  ┌──────────┐                           │
│  │   FCM    │                           │  ← Push notifications
│  └──────────┘                           │
└─────────────────────────────────────────┘
```

The app talks directly to Firebase — there is no separate server to build, host, or maintain.
Cloud Functions are the only "backend code" written, and they run on Google's infrastructure.

---

## 2. Goals & Non-Goals

### MVP Goals
- Secure real-time backend for class routine and event management
- Role-based access: CR can write, students read-only
- Push notifications when events are created or updated
- File attachment upload and download
- Invite-code based workspace joining

### Non-Goals (Post-MVP)
- Multiple workspace membership per user
- Analytics dashboard
- University SSO / LDAP login
- In-app chat
- Offline-first sync

---

## 3. Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| Mobile app | React Native via Expo SDK 51+ | iOS + Android from one JS codebase |
| Language | TypeScript | Type safety across app and functions |
| Auth | Firebase Authentication | Google Sign-In + Email/Password |
| Database | Cloud Firestore | Real-time NoSQL database |
| File storage | Firebase Storage | Syllabus, notes, slides |
| Background logic | Firebase Cloud Functions (Node.js 20) | Notifications, token management |
| Push notifications | Firebase Cloud Messaging (FCM) | Delivered via Expo Notifications SDK |
| Expo push layer | Expo Notifications + expo-dev-client | Handles FCM token registration on device |
| Environment | Firebase Emulator Suite | Local development and testing |
| CI/CD | GitHub Actions | Lint, test, deploy functions, EAS build |

---

## 4. Project Structure

```
quicklime/
├── app/                        # Expo Router file-based navigation
│   ├── (auth)/                 # Auth screens (login, onboarding)
│   ├── (app)/                  # Main app screens (tab layout)
│   └── _layout.tsx
├── components/                 # Shared UI components
├── hooks/                      # Custom React hooks (useRoutine, useEvents…)
├── lib/
│   ├── firebase.ts             # Firebase app init + exports
│   ├── firestore.ts            # Typed Firestore helpers
│   └── notifications.ts        # FCM token + permission helpers
├── types/                      # Shared TypeScript interfaces
├── functions/                  # Cloud Functions (Node.js 20)
│   ├── src/
│   │   ├── index.ts            # Function exports
│   │   ├── onEventCreate.ts
│   │   ├── onEventUpdate.ts
│   │   ├── onRoutineUpdate.ts
│   │   ├── joinWorkspace.ts
│   │   ├── createWorkspace.ts
│   │   ├── updateFcmToken.ts
│   │   └── refreshDownloadUrls.ts
│   ├── package.json
│   └── tsconfig.json
├── firebase.json               # Firebase project config
├── firestore.rules
├── storage.rules
├── firestore.indexes.json
└── app.json                    # Expo config
```

---

## 5. Firebase Project Setup

Two Firebase projects — one for development, one for production.

| Environment | Firebase Project ID | Used by |
|---|---|---|
| Development | `quicklime-dev` | Local dev + Firebase Emulator |
| Production | `quicklime-prod` | App Store / Play Store build |

### Required Firebase Services to Enable
1. Authentication — enable Google provider + Email/Password provider
2. Firestore — start in **production mode** (rules lock it down immediately)
3. Storage — start in **production mode**
4. Cloud Functions — requires Blaze (pay-as-you-go) plan for FCM sends
5. Cloud Messaging — no manual setup needed, auto-enabled

### `firebase.ts` — App Initialization

```typescript
import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getFunctions } from 'firebase/functions';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const functions = getFunctions(app, 'us-central1');
```

All keys are stored in `.env.local` (never committed). Expo exposes them via `EXPO_PUBLIC_` prefix.

---

## 6. Authentication

### 6.1 Providers
- **Google Sign-In** — via `expo-auth-session` + `@react-native-google-signin/google-signin`
- **Email + Password** — Firebase Auth native

### 6.2 Auth Flow

```
App opens
    ↓
Check Firebase Auth state (onAuthStateChanged)
    ↓
No user → show Welcome screen
    ↓
User signs in (Google or Email)
    ↓
Firebase creates user in Auth
    ↓
Cloud Function (onUserCreate) fires:
    - Creates users/{uid} document
    - Sets custom claim: { role: "student" }
    ↓
App checks users/{uid}.workspaceId
    ↓
null → Onboarding (Create or Join workspace)
set  → Main app (tab navigation)
```

### 6.3 Custom JWT Claims

Custom claims are set on the Firebase Auth token via the Admin SDK in Cloud Functions.
They are available on every Firestore and Storage rules check.

```typescript
// Claims shape
{
  role: "cr" | "student",
  workspaceId: string | null
}
```

After a Cloud Function sets claims, the client must force-refresh the token:
```typescript
await auth.currentUser?.getIdToken(true); // forces claim refresh
```

### 6.4 Auth State in the App

Use a context provider that wraps the entire app:

```typescript
// hooks/useAuth.ts
import { onIdTokenChanged, User } from 'firebase/auth';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // NOTE: onIdTokenChanged (not onAuthStateChanged) is required so the app
    // re-renders when custom claims are refreshed after joinWorkspace / createWorkspace.
    const unsub = onIdTokenChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return unsub;
  }, []);

  return { user, loading };
}
```

---

## 7. Data Models (Firestore)

All timestamps use Firestore `Timestamp` type. All IDs are auto-generated Firestore document IDs
unless noted. TypeScript interfaces live in `types/`.

---

### 7.1 `workspaces/{workspaceId}`

```typescript
interface Workspace {
  id: string;               // Same as document ID
  name: string;             // e.g. "CSE Batch 2025 Section A"
  crUid: string;            // Firebase Auth UID of the CR
  inviteCode: string;       // 6-char alphanumeric, unique across all workspaces
  fcmTopic: string;         // "workspace_{workspaceId}"
  memberCount: number;      // Maintained by Cloud Functions
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

**Firestore indexes:** `inviteCode` — single field, ascending

---

### 7.2 `workspaces/{workspaceId}/members/{uid}`

```typescript
interface Member {
  uid: string;                    // Firebase Auth UID
  displayName: string;
  email: string;
  photoUrl: string | null;
  role: 'cr' | 'student';
  joinedAt: Timestamp;
  fcmToken: string | null;        // Latest Expo push token
  notificationsEnabled: boolean;  // default true
}
```

---

### 7.3 `workspaces/{workspaceId}/routines/{routineId}`

One document per day of the week (7 documents max per workspace).

```typescript
interface Slot {
  slotId: string;         // uuid v4, generated client-side
  courseName: string;
  courseCode: string;
  teacherName: string;
  room: string | null;
  startTime: string;      // "HH:mm" 24-hour format e.g. "09:00"
  endTime: string;        // "HH:mm" 24-hour format e.g. "10:30"
}

interface Routine {
  id: string;
  dayOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6;  // 0 = Sunday, 6 = Saturday
  slots: Slot[];          // Ordered by startTime, validated server-side
  updatedAt: Timestamp;
  updatedBy: string;      // CR uid
}
```

**Validation rules (enforced in Cloud Function `updateRoutine`):**
- No two slots may overlap: slot A's `endTime` must be ≤ slot B's `startTime`
- `startTime` must be before `endTime`
- Max 12 slots per day

**CR Edit UX (Course-First Model):**
The CR uses a single "Add Course" modal that collects course metadata once (name, code, teacher, room) and then one or more day+time rows. Each row has an independent start/end time. On confirm, the course is written to each target day's routine document. This avoids the need to edit each day separately for courses that meet multiple times per week with different times per day.

---

### 7.4 `workspaces/{workspaceId}/events/{eventId}`

```typescript
type EventType = 'extra_class' | 'test' | 'assignment' | 'notice';

interface Attachment {
  attachmentId: string;   // uuid v4
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  storagePath: string;    // Firebase Storage path
  downloadUrl: string;    // Signed URL, refreshed every 6 days
  uploadedAt: Timestamp;
}

interface Event {
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
```

**Firestore indexes:**
- `date` ascending
- `type` + `date` ascending
- `createdAt` descending

---

### 7.5 `users/{uid}`

Top-level user document, mirrors Auth profile, used for cross-workspace lookups.

```typescript
interface UserProfile {
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
```

---

## 8. Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    function isSignedIn() {
      return request.auth != null;
    }

    function isCR(workspaceId) {
      return isSignedIn()
        && request.auth.token.role == 'cr'
        && request.auth.token.workspaceId == workspaceId;
    }

    function isMember(workspaceId) {
      return isSignedIn()
        && request.auth.token.workspaceId == workspaceId;
    }

    function isOwner(uid) {
      return isSignedIn() && request.auth.uid == uid;
    }

    // Users: only the owner can read/write their own profile
    match /users/{uid} {
      allow read, write: if isOwner(uid);
    }

    // Workspaces
    match /workspaces/{workspaceId} {
      allow read: if isMember(workspaceId);
      allow create: if isSignedIn();
      allow update, delete: if isCR(workspaceId);

      // Members subcollection
      match /members/{uid} {
        allow read: if isMember(workspaceId);
        // CR can write any member; member can write their own (for FCM token updates)
        allow write: if isCR(workspaceId) || isOwner(uid);
      }

      // Routines: members read, CR write
      match /routines/{routineId} {
        allow read: if isMember(workspaceId);
        allow write: if isCR(workspaceId);
      }

      // Events: members read, CR write
      match /events/{eventId} {
        allow read: if isMember(workspaceId);
        allow write: if isCR(workspaceId);
      }
    }
  }
}
```

---

## 9. Firebase Storage Rules

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {

    match /workspaces/{workspaceId}/events/{eventId}/{fileName} {
      // Any workspace member can download
      allow read: if request.auth != null
        && request.auth.token.workspaceId == workspaceId;

      // Only CR can upload; size and type restricted
      allow write: if request.auth != null
        && request.auth.token.role == 'cr'
        && request.auth.token.workspaceId == workspaceId
        && request.resource.size < 25 * 1024 * 1024
        && request.resource.contentType.matches(
             'image/.*|application/pdf|application/msword|'
             + 'application/vnd\\.openxmlformats.*|'
             + 'application/vnd\\.ms-.*|text/plain');
    }
  }
}
```

**Storage path convention:**
```
workspaces/{workspaceId}/events/{eventId}/{uuid}_{originalFileName}
```

**Constraints:**
- Max file size: 25 MB
- Max attachments per event: 10
- Allowed types: images, PDF, Word docs, Excel, plain text

---

## 10. Cloud Functions

All functions in `functions/src/`, deployed to `us-central1`.
All callable functions require a valid Firebase Auth token.
All functions are written in TypeScript.

---

### 10.1 `onUserCreate` — Auth trigger

**Trigger:** `functions.auth.user().onCreate`

```typescript
// Fires automatically when a new user signs up
export const onUserCreate = functions.auth.user().onCreate(async (user) => {
  // 1. Create the user's profile document
  await db.collection('users').doc(user.uid).set({
    uid: user.uid,
    displayName: user.displayName ?? '',
    email: user.email ?? '',
    photoUrl: user.photoURL ?? null,
    workspaceId: null,
    role: 'student',
    fcmToken: null,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    lastActiveAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  // 2. Set default custom claim
  await admin.auth().setCustomUserClaims(user.uid, {
    role: 'student',
    workspaceId: null,
  });
});
```

---

### 10.2 `createWorkspace` — HTTPS Callable

**Caller:** Any authenticated user (becomes the CR)

**Input:**
```typescript
{ name: string }
```

**Logic:**
1. Validate `name` (1–100 chars, non-empty)
2. Generate unique 6-char alphanumeric `inviteCode`
3. Create `workspaces/{newId}` document
4. Create `workspaces/{newId}/members/{uid}` with `role: "cr"`
5. Update `users/{uid}` — set `workspaceId` and `role: "cr"`
6. Set custom claims `{ role: "cr", workspaceId }` via Admin SDK

**Output:**
```typescript
{ workspaceId: string, inviteCode: string }
```

**Errors:**
- `invalid-argument` — name missing or too long
- `already-exists` — user already has a workspace

---

### 10.3 `joinWorkspace` — HTTPS Callable

**Caller:** Student (authenticated, no workspace yet)

**Input:**
```typescript
{ inviteCode: string }
```

**Logic:**
1. Query `workspaces` where `inviteCode == input.inviteCode` — return `not-found` if missing
2. Check user not already a member — return `already-exists` if so
3. Write `workspaces/{workspaceId}/members/{uid}`
4. Update `users/{uid}.workspaceId`
5. Set custom claims `{ role: "student", workspaceId }`
6. Subscribe FCM token to topic `workspace_{workspaceId}` (if token present)
7. Increment `memberCount` with `FieldValue.increment(1)`

**Output:**
```typescript
{ workspaceId: string, workspaceName: string }
```

**Errors:**
- `not-found` — invite code doesn't match any workspace
- `already-exists` — user is already in this workspace
- `unauthenticated` — no valid token

---

### 10.4 `updateRoutine` — HTTPS Callable

**Caller:** CR only

**Input:**
```typescript
{
  workspaceId: string,
  dayOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6,
  slots: Slot[]
}
```

**Logic:**
1. Verify caller has `role: "cr"` and matching `workspaceId` in claims
2. Validate no slot overlaps (sort by `startTime`, check adjacent pairs)
3. Validate each slot: `startTime < endTime`, max 12 slots
4. Upsert `workspaces/{workspaceId}/routines/{dayOfWeek}` (use dayOfWeek as doc ID)

**Errors:**
- `permission-denied` — caller is not the CR
- `invalid-argument` — time conflict, invalid format, or too many slots

---

### 10.5 `onEventCreate` — Firestore trigger

**Trigger:** `onCreate` on `workspaces/{workspaceId}/events/{eventId}`

**Logic:**
1. Build FCM notification payload (see Section 11)
2. Send to topic `workspace_{workspaceId}`
3. Update `events/{eventId}` — set `notificationSent: true`

```typescript
export const onEventCreate = functions.firestore
  .document('workspaces/{workspaceId}/events/{eventId}')
  .onCreate(async (snap, context) => {
    const event = snap.data() as Event;
    const { workspaceId } = context.params;

    const typeLabel: Record<string, string> = {
      test: 'Test',
      extra_class: 'Extra Class',
      assignment: 'Assignment',
      notice: 'Notice',
    };

    await admin.messaging().send({
      topic: `workspace_${workspaceId}`,
      notification: {
        title: `📅 New ${typeLabel[event.type] ?? 'Event'}`,
        body: `${event.title} · ${event.date}${event.startTime ? ` at ${event.startTime}` : ''}`,
      },
      data: {
        workspaceId,
        eventId: snap.id,
        type: 'new_event',
        deepLink: `quicklime://workspace/${workspaceId}/events/${snap.id}`,
      },
      android: { priority: 'high' },
      apns: { payload: { aps: { sound: 'default', badge: 1 } } },
    });

    await snap.ref.update({ notificationSent: true });
  });
```

---

### 10.6 `onEventUpdate` — Firestore trigger

**Trigger:** `onUpdate` on `workspaces/{workspaceId}/events/{eventId}`

**Logic:**
1. Compare `before` and `after` on: `title`, `date`, `startTime`, `type`, `description`
2. Only send notification if at least one of those fields changed
3. Do not re-notify if only `updatedAt` or `notificationSent` changed

---

### 10.7 `onRoutineUpdate` — Firestore trigger

**Trigger:** `onUpdate` on `workspaces/{workspaceId}/routines/{routineId}`

**Logic:**
1. Look up day name from `after.dayOfWeek`
2. Send FCM notification: `"📋 Schedule Changed"` / `"[DayName] schedule was updated"`

---

### 10.8 `updateFcmToken` — HTTPS Callable

**Caller:** Any workspace member

**Input:**
```typescript
{ fcmToken: string }
```

**Logic:**
1. Read current `fcmToken` from `users/{uid}`
2. If old token exists, unsubscribe it from `workspace_{workspaceId}` topic
3. Subscribe new token to `workspace_{workspaceId}` topic
4. Update `users/{uid}.fcmToken` and `members/{uid}.fcmToken`

---

### 10.9 `deleteEvent` — HTTPS Callable

**Caller:** CR only

**Input:**
```typescript
{ workspaceId: string, eventId: string }
```

**Logic:**
1. Verify caller is CR of the workspace
2. List all files at `workspaces/{workspaceId}/events/{eventId}/` in Storage
3. Delete each file
4. Delete `events/{eventId}` Firestore document

---

### 10.10 `generateInviteCode` — HTTPS Callable

**Caller:** CR only

**Logic:**
1. Generate new unique 6-char alphanumeric code
2. Check uniqueness with a Firestore query
3. Retry up to 5 times if collision
4. Update `workspaces/{workspaceId}.inviteCode`

**Output:**
```typescript
{ inviteCode: string }
```

---

### 10.11 `refreshDownloadUrls` — Scheduled

**Schedule:** `every 24 hours`

**Logic:**
1. Query all events that have attachments where `uploadedAt < now - 6 days`
2. For each attachment, generate a new signed URL (7-day TTL)
3. Update `downloadUrl` field in Firestore

---

### 10.12 `leaveWorkspace` — HTTPS Callable

**Caller:** Student only (CR cannot leave — must delete workspace)

**Logic:**
1. Verify caller is a `student` in the workspace
2. Unsubscribe FCM token from workspace topic
3. Delete `members/{uid}` document
4. Update `users/{uid}` — set `workspaceId: null`, `role: "student"`
5. Clear custom claims
6. Decrement `memberCount` with `FieldValue.increment(-1)`

---

## 11. Push Notifications (FCM + Expo)

### 11.1 How It Works End-to-End

```
1. App starts → request notification permission from OS (iOS requires explicit prompt)
2. Permission granted → Expo generates an Expo Push Token
3. App calls updateFcmToken Cloud Function with the token
4. Cloud Function stores token + subscribes it to workspace FCM topic
5. CR creates event → onEventCreate Cloud Function fires
6. Function sends FCM message to topic workspace_{workspaceId}
7. FCM delivers to every subscribed device
8. Device shows notification in the system tray
9. User taps → Expo deep links into the event detail screen
```

### 11.2 Notification Permission (Client)

```typescript
// lib/notifications.ts
import * as Notifications from 'expo-notifications';
import { getFunctions, httpsCallable } from 'firebase/functions';

export async function registerForPushNotifications() {
  // Request permission
  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== 'granted') return null;

  // Get Expo push token (wraps the native FCM/APNS token)
  const token = (await Notifications.getExpoPushTokenAsync()).data;

  // Send token to Cloud Function
  const updateToken = httpsCallable(functions, 'updateFcmToken');
  await updateToken({ fcmToken: token });

  return token;
}
```

### 11.3 FCM Notification Payload

```typescript
{
  notification: {
    title: string,   // e.g. "📅 New Test"
    body: string,    // e.g. "Mid-Term · 10 Jun at 10:00"
  },
  data: {
    workspaceId: string,
    eventId: string,
    type: 'new_event' | 'event_updated' | 'routine_updated',
    deepLink: string,  // e.g. "quicklime://workspace/abc/events/xyz"
  },
  android: { priority: 'high' },
  apns: { payload: { aps: { sound: 'default', badge: 1 } } },
  topic: 'workspace_{workspaceId}'
}
```

### 11.4 Notification Templates

| Trigger | Title | Body |
|---|---|---|
| New event | `📅 New {Type}` | `{title} · {date}` or `{title} · {date} at {startTime}` |
| Event updated | `✏️ Event Updated` | `{title} has been updated` |
| Routine updated | `📋 Schedule Changed` | `{dayName} schedule was updated` |

### 11.5 Deep Link Handling (Client)

```typescript
// In root _layout.tsx
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Handle tap on notification
const response = await Notifications.getLastNotificationResponseAsync();
if (response) {
  const { deepLink } = response.notification.request.content.data;
  router.push(deepLink); // Expo Router handles the deep link
}
```

---

## 12. File Upload Flow

The client uploads directly to Firebase Storage — no file passes through a Cloud Function.

```
1. CR selects a file via expo-document-picker
2. Client uploads file directly to Firebase Storage
   Path: workspaces/{workspaceId}/events/{eventId}/{uuid}_{filename}
3. Client writes Attachment object to event document in Firestore
   (storagePath set, downloadUrl initially empty string)
4. Cloud Function (onAttachmentWrite) fires on Firestore update
5. Function generates a 7-day signed download URL
6. Function writes downloadUrl back to the attachment in Firestore
7. All clients see the downloadUrl appear in real-time via Firestore listener
```

### Client Upload Code

```typescript
import * as DocumentPicker from 'expo-document-picker';
import { ref, uploadBytesResumable } from 'firebase/storage';
import { v4 as uuid } from 'uuid';

async function uploadAttachment(
  workspaceId: string,
  eventId: string,
  onProgress: (pct: number) => void
) {
  const result = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true });
  if (result.canceled) return;

  const file = result.assets[0];
  const filename = `${uuid()}_${file.name}`;
  const path = `workspaces/${workspaceId}/events/${eventId}/${filename}`;
  const storageRef = ref(storage, path);

  const response = await fetch(file.uri);
  const blob = await response.blob();

  const task = uploadBytesResumable(storageRef, blob, { contentType: file.mimeType });

  task.on('state_changed', (snap) => {
    onProgress((snap.bytesTransferred / snap.totalBytes) * 100);
  });

  await task;
  return { storagePath: path, fileName: file.name, mimeType: file.mimeType, sizeBytes: file.size };
}
```

---

## 13. Real-Time Listeners (Client)

Firestore supports real-time listeners — the app UI updates instantly when data changes without
any manual refresh. These are the core listeners the app maintains.

```typescript
// Listen to today's routine
const todayDoc = doc(db, `workspaces/${workspaceId}/routines/${dayOfWeek}`);
const unsubRoutine = onSnapshot(todayDoc, (snap) => {
  setRoutine(snap.data() as Routine);
});

// Listen to upcoming events (next 30 days)
const eventsQuery = query(
  collection(db, `workspaces/${workspaceId}/events`),
  where('date', '>=', todayStr),
  orderBy('date', 'asc'),
  limit(50)
);
const unsubEvents = onSnapshot(eventsQuery, (snap) => {
  setEvents(snap.docs.map(d => ({ id: d.id, ...d.data() }) as Event));
});

// Always unsubscribe on component unmount to prevent memory leaks
useEffect(() => {
  return () => {
    unsubRoutine();
    unsubEvents();
  };
}, []);
```

---

## 14. Expo Configuration (`app.json`)

```json
{
  "expo": {
    "name": "Quicklime",
    "slug": "quicklime",
    "version": "1.0.0",
    "scheme": "quicklime",
    "platforms": ["ios", "android"],
    "ios": {
      "bundleIdentifier": "com.quicklime.app",
      "googleServicesFile": "./GoogleService-Info.plist",
      "infoPlist": {
        "UIBackgroundModes": ["remote-notification"]
      }
    },
    "android": {
      "package": "com.quicklime.app",
      "googleServicesFile": "./google-services.json"
    },
    "plugins": [
      "@react-native-google-signin/google-signin",
      [
        "expo-notifications",
        {
          "icon": "./assets/notification-icon.png",
          "color": "#2D6A4F",
          "sounds": []
        }
      ]
    ]
  }
}
```

**Note:** `GoogleService-Info.plist` (iOS) and `google-services.json` (Android) are downloaded
from the Firebase Console and placed in the project root. These files are gitignored; they are
added to the CI environment as secrets.

---

## 15. Environment Variables

`.env.local` (never committed to git):

```
EXPO_PUBLIC_FIREBASE_API_KEY=
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=
EXPO_PUBLIC_FIREBASE_PROJECT_ID=
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
EXPO_PUBLIC_FIREBASE_APP_ID=
```

Cloud Functions environment (set via Firebase CLI):

```bash
firebase functions:secrets:set SIGNED_URL_TTL_DAYS
firebase functions:secrets:set MAX_ATTACHMENT_SIZE_MB
```

---

## 16. Error Codes

All Cloud Functions return `HttpsError` with these codes:

| Code | Meaning |
|---|---|
| `unauthenticated` | No valid Firebase ID token in request |
| `permission-denied` | User lacks the required role |
| `not-found` | Workspace, event, or user doesn't exist |
| `already-exists` | User is already a workspace member |
| `invalid-argument` | Missing field, wrong type, or business rule violation |
| `resource-exhausted` | File too large or attachment limit reached |
| `internal` | Unexpected error — logged to Google Cloud Logging |

---

## 17. Deep Link Routes

App uses `scheme: "quicklime"` defined in `app.json`.
Expo Router maps these to file-based routes automatically.

| Screen | Deep Link URI | Expo Router Path |
|---|---|---|
| Workspace home | `quicklime://workspace/{id}` | `/app/(app)/workspace/[id]` |
| Event detail | `quicklime://workspace/{id}/events/{eid}` | `/app/(app)/workspace/[id]/events/[eid]` |
| Routine view | `quicklime://workspace/{id}/routine` | `/app/(app)/workspace/[id]/routine` |

---

## 18. Local Development with Firebase Emulator

Firebase Emulator Suite lets you run Firestore, Auth, Storage, and Functions locally
— no live Firebase project needed during development.

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Start all emulators
firebase emulators:start

# Emulator ports
# Auth:      http://localhost:9099
# Firestore: http://localhost:8080
# Storage:   http://localhost:9199
# Functions: http://localhost:5001
# UI:        http://localhost:4000
```

Connect the app to emulators in development:

```typescript
// lib/firebase.ts (add after init)
if (__DEV__) {
  connectAuthEmulator(auth, 'http://localhost:9099');
  connectFirestoreEmulator(db, 'localhost', 8080);
  connectStorageEmulator(storage, 'localhost', 9199);
  connectFunctionsEmulator(functions, 'localhost', 5001);
}
```

---

## 19. Key NPM Packages

### App (`/`)
```json
{
  "expo": "~51.0.0",
  "expo-router": "~3.5.0",
  "firebase": "^10.12.0",
  "expo-notifications": "~0.28.0",
  "expo-document-picker": "~12.0.0",
  "@react-native-google-signin/google-signin": "^13.0.0",
  "expo-auth-session": "~5.5.0",
  "react-native-uuid": "^2.0.0"
}
```

### Functions (`/functions`)
```json
{
  "firebase-admin": "^12.0.0",
  "firebase-functions": "^5.0.0",
  "typescript": "^5.4.0"
}
```

---

## 20. MVP Acceptance Criteria

### Auth
- [ ] User can sign in with Google
- [ ] User can sign in with Email + Password
- [ ] Custom claims are set correctly on first sign-in
- [ ] CR claim blocks write operations for student accounts (verified via rules test)
- [ ] Token refresh after claim update is handled client-side

### Workspace
- [ ] CR can create a workspace and receive a 6-char invite code
- [ ] Student can join workspace using invite code
- [ ] Invalid invite code shows `not-found` error
- [ ] User already in workspace shows `already-exists` error
- [ ] CR can rotate the invite code

### Routine
- [ ] CR can add a course with custom times for multiple days in one action
- [ ] CR can delete individual slots from any day's edit screen
- [ ] Overlapping slots are rejected client-side before any Firestore write
- [ ] Students see routine updates in real-time (no refresh needed)
- [ ] Max 12 slots per day enforced server-side

### Events
- [ ] CR can create, update, and delete events
- [ ] Students receive push notification within 10 seconds of event creation
- [ ] Event update notification fires only when meaningful fields change
- [ ] Events appear in real-time for all members

### Attachments
- [ ] CR can upload files up to 25 MB
- [ ] Files over 25 MB are rejected by Storage rules
- [ ] Disallowed MIME types are rejected
- [ ] Download URLs are accessible to workspace members
- [ ] URLs are refreshed before 7-day expiry by scheduled function

### Notifications
- [ ] Notification permission prompt shown on first app open
- [ ] FCM token registered and stored on join
- [ ] All members receive notifications for new events
- [ ] Tapping notification deep-links to the correct event screen
- [ ] Token rotation (app reinstall) handled correctly

---

## 21. Future Enhancements (Post-MVP)

- Multiple workspace memberships per user
- Workspace analytics — event frequency, member activity
- University SSO / SAML integration
- Event RSVP and attendance tracking
- Recurring events (e.g., weekly quiz every Friday)
- In-app messaging per event thread
- Offline-first support via Firestore persistence
- Role: Teaching Assistant (limited write access)
- Web app version via Expo for Web
- Edit existing course across all its days at once (cascade-edit UX)
- Bulk import routine from CSV / timetable image (OCR)
