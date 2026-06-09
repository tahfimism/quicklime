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
exports.generateInviteCode = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
if (admin.apps.length === 0) {
    admin.initializeApp();
}
const db = admin.firestore();
/**
 * HTTPS Callable function to regenerate a workspace's invite code.
 * Validates CR authorization, generates a unique 6-char code with duplicate checks,
 * and updates the workspace document.
 */
exports.generateInviteCode = functions.https.onCall(async (data, context) => {
    // 1. Ensure authenticated
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be logged in to regenerate invite codes.');
    }
    // 2. Validate CR Permissions
    const claims = context.auth.token;
    const workspaceId = claims.workspaceId;
    if (claims.role !== 'cr' || !workspaceId) {
        throw new functions.https.HttpsError('permission-denied', 'Only the CR can regenerate the workspace invite code.');
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
            throw new functions.https.HttpsError('internal', 'Collision limit exceeded. Please try again.');
        }
        // 4. Update Workspace Document
        const workspaceRef = db.collection('workspaces').doc(workspaceId);
        await workspaceRef.update({
            inviteCode: inviteCode,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        return { inviteCode };
    }
    catch (error) {
        if (error instanceof functions.https.HttpsError)
            throw error;
        console.error('Error in generateInviteCode function:', error);
        throw new functions.https.HttpsError('internal', 'Internal error generating invite code.');
    }
});
//# sourceMappingURL=generateInviteCode.js.map