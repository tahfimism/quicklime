import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

// Initialize firebase-admin if it hasn't been already
if (admin.apps.length === 0) {
  admin.initializeApp();
}
const db = admin.firestore();

/**
 * Triggered automatically when a new user signs up.
 * Instantiates their user profile document and assigns default custom claims.
 */
export const onUserCreate = functions.auth.user().onCreate(async (user) => {
  try {
    // 1. Create user document in /users/{uid}
    await db.collection('users').doc(user.uid).set({
      uid: user.uid,
      displayName: user.displayName ?? '',
      email: user.email ?? '',
      photoUrl: user.photoURL ?? null,
      workspaceId: null,
      role: 'student',
      fcmToken: null,
      createdAt: FieldValue.serverTimestamp(),
      lastActiveAt: FieldValue.serverTimestamp(),
    });

    // 2. Set custom claims { role: 'student', workspaceId: null }
    await admin.auth().setCustomUserClaims(user.uid, {
      role: 'student',
      workspaceId: null,
    });
  } catch (error) {
    console.error('Error in onUserCreate trigger:', error);
  }
});
