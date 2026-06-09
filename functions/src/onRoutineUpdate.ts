import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

if (admin.apps.length === 0) {
  admin.initializeApp();
}

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/**
 * Firestore trigger executed when a routine document is updated.
 * Dispatches an FCM alert indicating which day's routine was updated.
 */
export const onRoutineUpdate = functions.firestore
  .document('workspaces/{workspaceId}/routines/{routineId}')
  .onUpdate(async (change, context) => {
    const after = change.after.data();
    if (!after) return;

    const { workspaceId } = context.params;
    const dayName = DAY_NAMES[after.dayOfWeek] || 'Routine';

    try {
      // Send notification to the workspace's FCM topic
      await admin.messaging().send({
        topic: `workspace_${workspaceId}`,
        notification: {
          title: '📋 Schedule Changed',
          body: `${dayName} schedule was updated.`,
        },
        data: {
          workspaceId,
          type: 'routine_updated',
          deepLink: `quicklime://workspace/${workspaceId}/routine`,
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
      console.error(`Error sending FCM onRoutineUpdate for workspace ${workspaceId}:`, error);
    }
  });
