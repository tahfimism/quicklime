"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateFcmToken = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
if (admin.apps.length === 0) {
    admin.initializeApp();
}
const db = admin.firestore();
/**
 * HTTPS Callable function to register/update user FCM Push Tokens.
 * Unsubscribes any old tokens from the workspace topic, subscribes the new token,
 * and updates user/member documents.
 */
exports.updateFcmToken = functions.https.onCall(async (data, context) => {
    // 1. Ensure authenticated
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be logged in to register FCM tokens.');
    }
    const { fcmToken } = data;
    if (!fcmToken || typeof fcmToken !== 'string') {
        throw new functions.https.HttpsError('invalid-argument', 'fcmToken must be a valid token string.');
    }
    const uid = context.auth.uid;
    const userRef = db.collection('users').doc(uid);
    try {
        const userSnap = await userRef.get();
        if (!userSnap.exists) {
            throw new functions.https.HttpsError('not-found', 'User profile not found.');
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
                }
                catch (unsubErr) {
                    console.error('Error unsubscribing old FCM token:', unsubErr);
                }
            }
            // Subscribe new token
            try {
                await admin.messaging().subscribeToTopic(fcmToken, topic);
            }
            catch (subErr) {
                console.error('Error subscribing new FCM token:', subErr);
            }
        }
        return { success: true };
    }
    catch (error) {
        if (error instanceof functions.https.HttpsError)
            throw error;
        console.error('Error in updateFcmToken function:', error);
        throw new functions.https.HttpsError('internal', 'Internal error updating FCM token.');
    }
});
//# sourceMappingURL=updateFcmToken.js.map