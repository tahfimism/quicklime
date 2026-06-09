import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

if (admin.apps.length === 0) {
  admin.initializeApp();
}
const db = admin.firestore();

/**
 * HTTPS Callable function to create a new workspace.
 * Automatically generates a unique 6-char invite code, sets up members subcollection,
 * links user profile doc, and elevates JWT custom claims to role: 'cr'.
 */
export const createWorkspace = functions.https.onCall(async (data, context) => {
  // 1. Ensure authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'User must be logged in to create a workspace.'
    );
  }

  const { name } = data;
  if (!name || typeof name !== 'string' || name.trim().length === 0 || name.trim().length > 100) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Workspace name is required and must be under 100 characters.'
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

    // 2. Generate a unique 6-char invite code
    let inviteCode = '';
    let isUnique = false;
    let attempts = 0;

    while (!isUnique && attempts < 5) {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      inviteCode = '';
      for (let i = 0; i < 6; i++) {
        inviteCode += chars.charAt(Math.floor(Math.random() * chars.length));
      }

      const checkDup = await db.collection('workspaces').where('inviteCode', '==', inviteCode).limit(1).get();
      if (checkDup.empty) {
        isUnique = true;
      }
      attempts++;
    }

    if (!isUnique) {
      throw new functions.https.HttpsError(
        'internal',
        'Failed to generate a unique invite code. Please try again.'
      );
    }

    // 3. Atomically write documents via Batch
    const workspaceRef = db.collection('workspaces').doc();
    const workspaceId = workspaceRef.id;
    const batch = db.batch();

    batch.set(workspaceRef, {
      id: workspaceId,
      name: name.trim(),
      crUid: uid,
      inviteCode: inviteCode,
      fcmTopic: `workspace_${workspaceId}`,
      memberCount: 1,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    const memberRef = workspaceRef.collection('members').doc(uid);
    batch.set(memberRef, {
      uid: uid,
      displayName: userSnap.data()?.displayName || 'CR',
      email: userSnap.data()?.email || '',
      photoUrl: userSnap.data()?.photoUrl || null,
      role: 'cr',
      joinedAt: admin.firestore.FieldValue.serverTimestamp(),
      fcmToken: null,
      notificationsEnabled: true,
    });

    batch.update(userRef, {
      workspaceId: workspaceId,
      role: 'cr',
      lastActiveAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    await batch.commit();

    // 4. Update Auth Custom Claims
    await admin.auth().setCustomUserClaims(uid, {
      role: 'cr',
      workspaceId: workspaceId,
    });

    return { workspaceId, inviteCode };
  } catch (error: any) {
    if (error instanceof functions.https.HttpsError) throw error;
    console.error('Error in createWorkspace function:', error);
    throw new functions.https.HttpsError('internal', 'Internal error creating workspace.');
  }
});
