import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

if (admin.apps.length === 0) {
  admin.initializeApp();
}
const db = admin.firestore();

/**
 * HTTPS Callable function to regenerate a workspace's invite code.
 * Validates CR authorization, generates a unique 6-char code with duplicate checks,
 * and updates the workspace document.
 */
export const generateInviteCode = functions.https.onCall(async (data, context) => {
  // 1. Ensure authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'User must be logged in to regenerate invite codes.'
    );
  }

  // 2. Validate CR Permissions
  const claims = context.auth.token;
  const workspaceId = claims.workspaceId;
  if (claims.role !== 'cr' || !workspaceId) {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Only the CR can regenerate the workspace invite code.'
    );
  }

  try {
    // 3. Generate unique code
    let inviteCode = '';
    let isUnique = false;
    let attempts = 0;

    while (!isUnique && attempts < 5) {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      inviteCode = '';
      for (let i = 0; i < 6; i++) {
        inviteCode += chars.charAt(Math.floor(Math.random() * chars.length));
      }

      const checkDup = await db
        .collection('workspaces')
        .where('inviteCode', '==', inviteCode)
        .limit(1)
        .get();

      if (checkDup.empty) {
        isUnique = true;
      }
      attempts++;
    }

    if (!isUnique) {
      throw new functions.https.HttpsError(
        'internal',
        'Collision limit exceeded. Please try again.'
      );
    }

    // 4. Update Workspace Document
    const workspaceRef = db.collection('workspaces').doc(workspaceId);
    await workspaceRef.update({
      inviteCode: inviteCode,
      updatedAt: FieldValue.serverTimestamp(),
    });

    return { inviteCode };
  } catch (error: any) {
    if (error instanceof functions.https.HttpsError) throw error;
    console.error('Error in generateInviteCode function:', error);
    throw new functions.https.HttpsError('internal', 'Internal error generating invite code.');
  }
});
