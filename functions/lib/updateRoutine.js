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
exports.updateRoutine = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
if (admin.apps.length === 0) {
    admin.initializeApp();
}
const db = admin.firestore();
/**
 * HTTPS Callable function to update routine slots for a day.
 * Validates CR authorization using claims, parses parameters,
 * sorts slots, and performs strict timeline overlap checks.
 */
exports.updateRoutine = functions.https.onCall(async (data, context) => {
    // 1. Ensure authenticated
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated.');
    }
    const { workspaceId, dayOfWeek, slots } = data;
    // 2. Validate CR Permissions
    const claims = context.auth.token;
    if (claims.role !== 'cr' || claims.workspaceId !== workspaceId) {
        throw new functions.https.HttpsError('permission-denied', 'Only the CR of this workspace can modify the class routine.');
    }
    // 3. Basic parameters validations
    if (dayOfWeek === undefined || dayOfWeek < 0 || dayOfWeek > 6) {
        throw new functions.https.HttpsError('invalid-argument', 'dayOfWeek must be between 0 and 6.');
    }
    if (!Array.isArray(slots)) {
        throw new functions.https.HttpsError('invalid-argument', 'slots must be a valid array.');
    }
    if (slots.length > 12) {
        throw new functions.https.HttpsError('invalid-argument', 'Maximum 12 slots are allowed per day.');
    }
    // 4. Sort slots and validate overlaps
    const sortedSlots = [...slots].sort((a, b) => a.startTime.localeCompare(b.startTime));
    for (let i = 0; i < sortedSlots.length; i++) {
        const slot = sortedSlots[i];
        if (!slot.courseName || !slot.courseCode || !slot.startTime || !slot.endTime) {
            throw new functions.https.HttpsError('invalid-argument', 'All slots require courseName, courseCode, startTime, and endTime.');
        }
        if (slot.startTime >= slot.endTime) {
            throw new functions.https.HttpsError('invalid-argument', `Start time must be before end time for course: ${slot.courseName}`);
        }
        // Check conflict with adjacent next slot
        if (i < sortedSlots.length - 1) {
            const nextSlot = sortedSlots[i + 1];
            if (slot.endTime > nextSlot.startTime) {
                throw new functions.https.HttpsError('invalid-argument', `Schedule conflict: ${slot.courseName} (${slot.endTime}) overlaps with ${nextSlot.courseName} (${nextSlot.startTime})`);
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
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedBy: context.auth.uid,
        });
        return { success: true };
    }
    catch (error) {
        console.error('Error in updateRoutine function:', error);
        throw new functions.https.HttpsError('internal', 'Internal error updating routine.');
    }
});
//# sourceMappingURL=updateRoutine.js.map