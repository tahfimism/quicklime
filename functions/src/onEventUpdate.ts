import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

if (admin.apps.length === 0) {
  admin.initializeApp();
}

/**
 * Firestore trigger executed when an event document is updated.
 * Evaluates field changes (title, date, type, etc.) and dispatches
 * an FCM notification only if key user-facing data changes.
 */
export const onEventUpdate = functions.firestore
  .document('workspaces/{workspaceId}/events/{eventId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();

    if (!before || !after) return;

    const { workspaceId, eventId } = context.params;

    // 1. Detect structural updates
    const titleChanged = before.title !== after.title;
    const dateChanged = before.date !== after.date;
    const timeChanged = before.startTime !== after.startTime;
    const typeChanged = before.type !== after.type;
    const descChanged = before.description !== after.description;

    const isUpdated = titleChanged || dateChanged || timeChanged || typeChanged || descChanged;
    if (!isUpdated) return; // Skip notification for metadata-only updates (e.g. notificationSent status)

    try {
      // 2. Dispatch FCM notification
      await admin.messaging().send({
        topic: `workspace_${workspaceId}`,
        notification: {
          title: '✏️ Event Updated',
          body: `"${after.title}" has been updated.`,
        },
        data: {
          workspaceId,
          eventId,
          type: 'event_updated',
          deepLink: `quicklime://workspace/${workspaceId}/events/${eventId}`,
        },
        android: {
          priority: 'high',
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              badge: 1,
            },
          },
        },
      });
    } catch (error) {
      console.error(`Error sending FCM onEventUpdate for event ${eventId}:`, error);
    }
  });
