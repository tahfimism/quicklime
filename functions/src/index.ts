import * as admin from 'firebase-admin';

// Initialize the Firebase Admin SDK globally across functions
if (admin.apps.length === 0) {
  admin.initializeApp();
}

// Export Auth triggers
export { onUserCreate } from './onUserCreate';

// Export Callable actions
export { createWorkspace } from './createWorkspace';
export { joinWorkspace } from './joinWorkspace';
export { updateRoutine } from './updateRoutine';
export { updateFcmToken } from './updateFcmToken';
export { deleteEvent } from './deleteEvent';
export { generateInviteCode } from './generateInviteCode';
export { leaveWorkspace } from './leaveWorkspace';

// Export Firestore document triggers
export { onEventCreate } from './onEventCreate';
export { onEventUpdate } from './onEventUpdate';
export { onRoutineUpdate } from './onRoutineUpdate';

// Export Scheduled jobs
export { refreshDownloadUrls } from './refreshDownloadUrls';
