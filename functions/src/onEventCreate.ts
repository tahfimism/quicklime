import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

if (admin.apps.length === 0) {
  admin.initializeApp();
}

/**
 * Firestore trigger executed when a new event document is created.
 * Compiles and sends FCM notifications to the workspace topic,
 * then marks notificationSent: true.
 */
export const onEventCreate = functions.firestore
  .document('workspaces/{workspaceId}/events/{eventId}')
  .onCreate(async (snap, context) => {
    const event = snap.data();
    if (!event) return;

    const { workspaceId, eventId } = context.params;

    const typeLabel: Record<string, string> = {
      test: 'Test',
      extra_class: 'Extra Class',
      assignment: 'Assignment',
      notice: 'Notice',
    };

    const eventTypeStr = typeLabel[event.type] || 'Event';
    const timeInfo = event.startTime ? ` at ${event.startTime}` : '';

    try {
      // Send notification to the workspace's FCM topic
      await admin.messaging().send({
        topic: `workspace_${workspaceId}`,
        notification: {
          title: `📅 New ${eventTypeStr}`,
          body: `${event.title} · ${event.date}${timeInfo}`,
        },
        data: {
          workspaceId,
          eventId,
          type: 'new_event',
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

      // Mark event as notified
      await snap.ref.update({ notificationSent: true });
    } catch (error) {
      console.error(`Error sending FCM onEventCreate for event ${eventId}:`, error);
    }
  });
