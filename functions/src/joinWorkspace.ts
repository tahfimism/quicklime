import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

if (admin.apps.length === 0) {
  admin.initializeApp();
}
const db = admin.firestore();

/**
 * HTTPS Callable function to join a workspace via invite code.
 * Validates the code, creates a student member record, updates user profile,
 * increments memberCount, subscribes FCM tokens, and sets student custom claims.
 */
export const joinWorkspace = functions.https.onCall(async (data, context) => {
  // 1. Ensure authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'User must be logged in to join a workspace.'
    );
  }

  const { inviteCode } = data;
  if (!inviteCode || typeof inviteCode !== 'string' || inviteCode.trim().length !== 6) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Invite code must be exactly 6 characters.'
    );
  }

  const uid = context.auth.uid;
  const userRef = db.collection('users').doc(uid);

  try {
    const userSnap = await userRef.get();
    if (userSnap.exists && userSnap.data()?.workspaceId) {
      throw new functions.https.HttpsError(
        'already-exists',
        'User is already linked to a workspace.'
      );
    }

    const cleanCode = inviteCode.trim().toUpperCase();
    
    // 2. Query workspace by inviteCode
    const workspaceQuery = await db
      .collection('workspaces')
      .where('inviteCode', '==', cleanCode)
      .limit(1)
      .get();

    if (workspaceQuery.empty) {
      throw new functions.https.HttpsError(
        'not-found',
        'Workspace not found. Check the code and try again.'
      );
    }

    const workspaceDoc = workspaceQuery.docs[0];
    const workspaceId = workspaceDoc.id;
    const workspaceData = workspaceDoc.data();

    // 3. Atomically write documents via Batch
    const memberRef = db.collection('workspaces').doc(workspaceId).collection('members').doc(uid);
    const memberSnap = await memberRef.get();
    if (memberSnap.exists) {
      throw new functions.https.HttpsError(
        'already-exists',
        'User is already registered as a member of this workspace.'
      );
    }

    const batch = db.batch();

    batch.set(memberRef, {
      uid: uid,
      displayName: userSnap.data()?.displayName || 'Student',
      email: userSnap.data()?.email || '',
      photoUrl: userSnap.data()?.photoUrl || null,
      role: 'student',
      joinedAt: FieldValue.serverTimestamp(),
      fcmToken: userSnap.data()?.fcmToken || null,
      notificationsEnabled: true,
    });

    batch.update(workspaceDoc.ref, {
      memberCount: FieldValue.increment(1),
      updatedAt: FieldValue.serverTimestamp(),
    });

    batch.update(userRef, {
      workspaceId: workspaceId,
      role: 'student',
      lastActiveAt: FieldValue.serverTimestamp(),
    });

    await batch.commit();

    // 4. Subscribe user token to FCM topic
    const fcmToken = userSnap.data()?.fcmToken;
    if (fcmToken) {
      try {
        await admin.messaging().subscribeToTopic(fcmToken, `workspace_${workspaceId}`);
      } catch (fcmErr) {
        console.error('FCM Subscription failed during workspace join:', fcmErr);
      }
    }

    // 5. Update Auth Custom Claims
    await admin.auth().setCustomUserClaims(uid, {
      role: 'student',
      workspaceId: workspaceId,
    });

    return { workspaceId, workspaceName: workspaceData.name };
  } catch (error: any) {
    if (error instanceof functions.https.HttpsError) throw error;
    console.error('Error in joinWorkspace function:', error);
    throw new functions.https.HttpsError('internal', 'Internal error joining workspace.');
  }
});
