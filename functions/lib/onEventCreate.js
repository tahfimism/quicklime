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
exports.onEventCreate = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
if (admin.apps.length === 0) {
    admin.initializeApp();
}
/**
 * Firestore trigger executed when a new event document is created.
 * Compiles and sends FCM notifications to the workspace topic,
 * then marks notificationSent: true.
 */
exports.onEventCreate = functions.firestore
    .document('workspaces/{workspaceId}/events/{eventId}')
    .onCreate(async (snap, context) => {
    const event = snap.data();
    if (!event)
        return;
    const { workspaceId, eventId } = context.params;
    const typeLabel = {
        test: 'Test',
        extra_class: 'Extra Class',
        assignment: 'Assignment',
        notice: 'Notice',
    };
    const eventTypeStr = typeLabel[event.type] || 'Event';
    const timeInfo = event.startTime ? ` at ${event.startTime}` : '';
    try {
        // Send notification to the workspace's FCM topic
        await admin.messaging().send({
            topic: `workspace_${workspaceId}`,
            notification: {
                title: `📅 New ${eventTypeStr}`,
                body: `${event.title} · ${event.date}${timeInfo}`,
            },
            data: {
                workspaceId,
                eventId,
                type: 'new_event',
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
        // Mark event as notified
        await snap.ref.update({ notificationSent: true });
    }
    catch (error) {
        console.error(`Error sending FCM onEventCreate for event ${eventId}:`, error);
    }
});
//# sourceMappingURL=onEventCreate.js.map