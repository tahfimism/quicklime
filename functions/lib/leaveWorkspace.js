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
exports.leaveWorkspace = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const firestore_1 = require("firebase-admin/firestore");
if (admin.apps.length === 0) {
    admin.initializeApp();
}
const db = admin.firestore();
/**
 * HTTPS Callable function to let a student leave their workspace.
 * Deletes members subcollection doc, decrements workspace memberCount,
 * unsubscribes FCM tokens, updates user profiles, and resets claims to default.
 */
exports.leaveWorkspace = functions.https.onCall(async (data, context) => {
    // 1. Ensure authenticated
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be logged in to leave a workspace.');
    }
    const uid = context.auth.uid;
    const claims = context.auth.token;
    const workspaceId = claims.workspaceId;
    // 2. Validate permissions (CR cannot leave, must delete instead)
    if (claims.role !== 'student' || !workspaceId) {
        throw new functions.https.HttpsError('permission-denied', 'Only students can leave workspaces. CRs must delete the workspace instead.');
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
            }
            catch (fcmErr) {
                console.error('FCM Unsubscription failed during workspace leave:', fcmErr);
            }
        }
        // 4. Batch delete and updates
        const batch = db.batch();
        batch.delete(memberRef);
        batch.update(userRef, {
            workspaceId: null,
            role: 'student',
            lastActiveAt: firestore_1.FieldValue.serverTimestamp(),
        });
        batch.update(workspaceRef, {
            memberCount: firestore_1.FieldValue.increment(-1),
            updatedAt: firestore_1.FieldValue.serverTimestamp(),
        });
        await batch.commit();
        // 5. Reset Custom Claims
        await admin.auth().setCustomUserClaims(uid, {
            role: 'student',
            workspaceId: null,
        });
        return { success: true };
    }
    catch (error) {
        console.error('Error in leaveWorkspace function:', error);
        throw new functions.https.HttpsError('internal', 'Internal error leaving workspace.');
    }
});
//# sourceMappingURL=leaveWorkspace.js.map