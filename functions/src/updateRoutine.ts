import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

if (admin.apps.length === 0) {
  admin.initializeApp();
}
const db = admin.firestore();

interface Slot {
  slotId: string;
  courseName: string;
  courseCode: string;
  teacherName: string;
  room: string | null;
  startTime: string; // "HH:mm"
  endTime: string; // "HH:mm"
}

/**
 * HTTPS Callable function to update routine slots for a day.
 * Validates CR authorization using claims, parses parameters,
 * sorts slots, and performs strict timeline overlap checks.
 */
export const updateRoutine = functions.https.onCall(async (data, context) => {
  // 1. Ensure authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'User must be authenticated.'
    );
  }

  const { workspaceId, dayOfWeek, slots } = data;

  // 2. Validate CR Permissions
  const claims = context.auth.token;
  if (claims.role !== 'cr' || claims.workspaceId !== workspaceId) {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Only the CR of this workspace can modify the class routine.'
    );
  }

  // 3. Basic parameters validations
  if (dayOfWeek === undefined || dayOfWeek < 0 || dayOfWeek > 6) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'dayOfWeek must be between 0 and 6.'
    );
  }

  if (!Array.isArray(slots)) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'slots must be a valid array.'
    );
  }

  if (slots.length > 12) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Maximum 12 slots are allowed per day.'
    );
  }

  // 4. Sort slots and validate overlaps
  const sortedSlots = [...slots].sort((a: Slot, b: Slot) => a.startTime.localeCompare(b.startTime));

  for (let i = 0; i < sortedSlots.length; i++) {
    const slot = sortedSlots[i];
    
    if (!slot.courseName || !slot.courseCode || !slot.startTime || !slot.endTime) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'All slots require courseName, courseCode, startTime, and endTime.'
      );
    }

    if (slot.startTime >= slot.endTime) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        `Start time must be before end time for course: ${slot.courseName}`
      );
    }

    // Check conflict with adjacent next slot
    if (i < sortedSlots.length - 1) {
      const nextSlot = sortedSlots[i + 1];
      if (slot.endTime > nextSlot.startTime) {
        throw new functions.https.HttpsError(
          'invalid-argument',
          `Schedule conflict: ${slot.courseName} (${slot.endTime}) overlaps with ${nextSlot.courseName} (${nextSlot.startTime})`
        );
      }
    }
  }

  try {
    // 5. Write to Firestore routines collection
    const routineRef = db
      .collection('workspaces')
      .doc(workspaceId)
      .collection('routines')
      .doc(dayOfWeek.toString());

    await routineRef.set({
      id: dayOfWeek.toString(),
      dayOfWeek,
      slots: sortedSlots,
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: context.auth.uid,
    });

    return { success: true };
  } catch (error) {
    console.error('Error in updateRoutine function:', error);
    throw new functions.https.HttpsError('internal', 'Internal error updating routine.');
  }
});
