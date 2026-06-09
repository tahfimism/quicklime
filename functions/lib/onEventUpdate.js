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
exports.onEventUpdate = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
if (admin.apps.length === 0) {
    admin.initializeApp();
}
/**
 * Firestore trigger executed when an event document is updated.
 * Evaluates field changes (title, date, type, etc.) and dispatches
 * an FCM notification only if key user-facing data changes.
 */
exports.onEventUpdate = functions.firestore
    .document('workspaces/{workspaceId}/events/{eventId}')
    .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    if (!before || !after)
        return;
    const { workspaceId, eventId } = context.params;
    // 1. Detect structural updates
    const titleChanged = before.title !== after.title;
    const dateChanged = before.date !== after.date;
    const timeChanged = before.startTime !== after.startTime;
    const typeChanged = before.type !== after.type;
    const descChanged = before.description !== after.description;
    const isUpdated = titleChanged || dateChanged || timeChanged || typeChanged || descChanged;
    if (!isUpdated)
        return; // Skip notification for metadata-only updates (e.g. notificationSent status)
    try {
        // 2. Dispatch FCM notification
        await admin.messaging().send({
            topic: `workspace_${workspaceId}`,
            notification: {
                title: '✏️ Event Updated',
                body: `"${after.title}" has been updated.`,
            },
            data: {
                workspaceId,
                eventId,
                type: 'event_updated',
                deepLink: `quicklime://workspace/${workspaceId}/events/${eventId}`,
            },
            android: {
                priority: 'high',
            },
            apns: {
                payload: {
                    aps: {
                        sound: 'default',
                        badge: 1,
                    },
                },
            },
        });
    }
    catch (error) {
        console.error(`Error sending FCM onEventUpdate for event ${eventId}:`, error);
    }
});
//# sourceMappingURL=onEventUpdate.js.map