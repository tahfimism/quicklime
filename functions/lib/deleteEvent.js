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
exports.deleteEvent = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
if (admin.apps.length === 0) {
    admin.initializeApp();
}
const db = admin.firestore();
/**
 * HTTPS Callable function to delete an event.
 * Validates CR authorization via claims, lists all files uploaded for the event
 * in Storage, deletes them, and removes the Firestore document.
 */
exports.deleteEvent = functions.https.onCall(async (data, context) => {
    // 1. Ensure authenticated
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be logged in to delete events.');
    }
    const { workspaceId, eventId } = data;
    if (!workspaceId || !eventId || typeof workspaceId !== 'string' || typeof eventId !== 'string') {
        throw new functions.https.HttpsError('invalid-argument', 'workspaceId and eventId are required parameters.');
    }
    // 2. Validate CR Permissions
    const claims = context.auth.token;
    if (claims.role !== 'cr' || claims.workspaceId !== workspaceId) {
        throw new functions.https.HttpsError('permission-denied', 'Only the CR of this workspace can delete events.');
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
    }
    catch (error) {
        console.error('Error in deleteEvent function:', error);
        throw new functions.https.HttpsError('internal', 'Internal error deleting event.');
    }
});
//# sourceMappingURL=deleteEvent.js.map