import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

if (admin.apps.length === 0) {
  admin.initializeApp();
}
const db = admin.firestore();

/**
 * HTTPS Callable function to let a student leave their workspace.
 * Deletes members subcollection doc, decrements workspace memberCount,
 * unsubscribes FCM tokens, updates user profiles, and resets claims to default.
 */
export const leaveWorkspace = functions.https.onCall(async (data, context) => {
  // 1. Ensure authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'User must be logged in to leave a workspace.'
    );
  }

  const uid = context.auth.uid;
  const claims = context.auth.token;
  const workspaceId = claims.workspaceId;

  // 2. Validate permissions (CR cannot leave, must delete instead)
  if (claims.role !== 'student' || !workspaceId) {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Only students can leave workspaces. CRs must delete the workspace instead.'
    );
  }

  const userRef = db.collection('users').doc(uid);
  const memberRef = db.collection('workspaces').doc(workspaceId).collection('members').doc(uid);
  const workspaceRef = db.collection('workspaces').doc(workspaceId);

  try {
    const userSnap = await userRef.get();
    const fcmToken = userSnap.data()?.fcmToken;

    // 3. Unsubscribe FCM token from topic
    if (fcmToken) {
      try {
        await admin.messaging().unsubscribeFromTopic(fcmToken, `workspace_${workspaceId}`);
      } catch (fcmErr) {
        console.error('FCM Unsubscription failed during workspace leave:', fcmErr);
      }
    }

    // 4. Batch delete and updates
    const batch = db.batch();

    batch.delete(memberRef);

    batch.update(userRef, {
      workspaceId: null,
      role: 'student',
      lastActiveAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    batch.update(workspaceRef, {
      memberCount: admin.firestore.FieldValue.increment(-1),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    await batch.commit();

    // 5. Reset Custom Claims
    await admin.auth().setCustomUserClaims(uid, {
      role: 'student',
      workspaceId: null,
    });

    return { success: true };
  } catch (error: any) {
    console.error('Error in leaveWorkspace function:', error);
    throw new functions.https.HttpsError('internal', 'Internal error leaving workspace.');
  }
});
