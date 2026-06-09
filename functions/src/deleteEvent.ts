import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

if (admin.apps.length === 0) {
  admin.initializeApp();
}
const db = admin.firestore();

/**
 * HTTPS Callable function to delete an event.
 * Validates CR authorization via claims, lists all files uploaded for the event
 * in Storage, deletes them, and removes the Firestore document.
 */
export const deleteEvent = functions.https.onCall(async (data, context) => {
  // 1. Ensure authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'User must be logged in to delete events.'
    );
  }

  const { workspaceId, eventId } = data;
  if (!workspaceId || !eventId || typeof workspaceId !== 'string' || typeof eventId !== 'string') {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'workspaceId and eventId are required parameters.'
    );
  }

  // 2. Validate CR Permissions
  const claims = context.auth.token;
  if (claims.role !== 'cr' || claims.workspaceId !== workspaceId) {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Only the CR of this workspace can delete events.'
    );
  }

  try {
    // 3. Delete event attachments in Storage
    const bucket = admin.storage().bucket();
    const prefix = `workspaces/${workspaceId}/events/${eventId}/`;
    const [files] = await bucket.getFiles({ prefix });

    const deletePromises = files.map((file) => {
      console.log(`Deleting attachment file: ${file.name}`);
      return file.delete().catch((err) => {
        console.error(`Failed to delete file ${file.name}:`, err);
      });
    });
    await Promise.all(deletePromises);

    // 4. Delete Event Firestore Document
    const eventDocRef = db
      .collection('workspaces')
      .doc(workspaceId)
      .collection('events')
      .doc(eventId);
    
    await eventDocRef.delete();

    return { success: true };
  } catch (error: any) {
    console.error('Error in deleteEvent function:', error);
    throw new functions.https.HttpsError('internal', 'Internal error deleting event.');
  }
});
