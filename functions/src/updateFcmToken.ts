import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

if (admin.apps.length === 0) {
  admin.initializeApp();
}
const db = admin.firestore();

/**
 * HTTPS Callable function to register/update user FCM Push Tokens.
 * Unsubscribes any old tokens from the workspace topic, subscribes the new token,
 * and updates user/member documents.
 */
export const updateFcmToken = functions.https.onCall(async (data, context) => {
  // 1. Ensure authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'User must be logged in to register FCM tokens.'
    );
  }

  const { fcmToken } = data;
  if (!fcmToken || typeof fcmToken !== 'string') {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'fcmToken must be a valid token string.'
    );
  }

  const uid = context.auth.uid;
  const userRef = db.collection('users').doc(uid);

  try {
    const userSnap = await userRef.get();
    if (!userSnap.exists) {
      throw new functions.https.HttpsError(
        'not-found',
        'User profile not found.'
      );
    }

    const userData = userSnap.data();
    const oldToken = userData?.fcmToken;
    const workspaceId = userData?.workspaceId;

    const batch = db.batch();

    // Update global user document fcmToken
    batch.update(userRef, {
      fcmToken: fcmToken,
      lastActiveAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Update member list fcmToken
    if (workspaceId) {
      const memberRef = db
        .collection('workspaces')
        .doc(workspaceId)
        .collection('members')
        .doc(uid);
      
      const memberSnap = await memberRef.get();
      if (memberSnap.exists) {
        batch.update(memberRef, {
          fcmToken: fcmToken,
        });
      }
    }

    await batch.commit();

    // 2. Synchronize FCM Topic subscriptions
    if (workspaceId) {
      const topic = `workspace_${workspaceId}`;
      
      // Unsubscribe old token if changing
      if (oldToken && oldToken !== fcmToken) {
        try {
          await admin.messaging().unsubscribeFromTopic(oldToken, topic);
        } catch (unsubErr) {
          console.error('Error unsubscribing old FCM token:', unsubErr);
        }
      }

      // Subscribe new token
      try {
        await admin.messaging().subscribeToTopic(fcmToken, topic);
      } catch (subErr) {
        console.error('Error subscribing new FCM token:', subErr);
      }
    }

    return { success: true };
  } catch (error: any) {
    if (error instanceof functions.https.HttpsError) throw error;
    console.error('Error in updateFcmToken function:', error);
    throw new functions.https.HttpsError('internal', 'Internal error updating FCM token.');
  }
});
