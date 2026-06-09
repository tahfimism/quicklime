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
exports.createWorkspace = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const firestore_1 = require("firebase-admin/firestore");
if (admin.apps.length === 0) {
    admin.initializeApp();
}
const db = admin.firestore();
/**
 * HTTPS Callable function to create a new workspace.
 * Automatically generates a unique 6-char invite code, sets up members subcollection,
 * links user profile doc, and elevates JWT custom claims to role: 'cr'.
 */
exports.createWorkspace = functions.https.onCall(async (data, context) => {
    // 1. Ensure authenticated
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be logged in to create a workspace.');
    }
    const { name } = data;
    if (!name || typeof name !== 'string' || name.trim().length === 0 || name.trim().length > 100) {
        throw new functions.https.HttpsError('invalid-argument', 'Workspace name is required and must be under 100 characters.');
    }
    const uid = context.auth.uid;
    const userRef = db.collection('users').doc(uid);
    try {
        const userSnap = await userRef.get();
        if (userSnap.exists && userSnap.data()?.workspaceId) {
            throw new functions.https.HttpsError('already-exists', 'User is already linked to a workspace.');
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
            throw new functions.https.HttpsError('internal', 'Failed to generate a unique invite code. Please try again.');
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
            createdAt: firestore_1.FieldValue.serverTimestamp(),
            updatedAt: firestore_1.FieldValue.serverTimestamp(),
        });
        const memberRef = workspaceRef.collection('members').doc(uid);
        batch.set(memberRef, {
            uid: uid,
            displayName: userSnap.data()?.displayName || 'CR',
            email: userSnap.data()?.email || '',
            photoUrl: userSnap.data()?.photoUrl || null,
            role: 'cr',
            joinedAt: firestore_1.FieldValue.serverTimestamp(),
            fcmToken: null,
            notificationsEnabled: true,
        });
        batch.update(userRef, {
            workspaceId: workspaceId,
            role: 'cr',
            lastActiveAt: firestore_1.FieldValue.serverTimestamp(),
        });
        await batch.commit();
        // 4. Update Auth Custom Claims
        await admin.auth().setCustomUserClaims(uid, {
            role: 'cr',
            workspaceId: workspaceId,
        });
        return { workspaceId, inviteCode };
    }
    catch (error) {
        if (error instanceof functions.https.HttpsError)
            throw error;
        console.error('Error in createWorkspace function:', error);
        throw new functions.https.HttpsError('internal', 'Internal error creating workspace.');
    }
});
//# sourceMappingURL=createWorkspace.js.map