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
exports.onRoutineUpdate = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
if (admin.apps.length === 0) {
    admin.initializeApp();
}
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
/**
 * Firestore trigger executed when a routine document is updated.
 * Dispatches an FCM alert indicating which day's routine was updated.
 */
exports.onRoutineUpdate = functions.firestore
    .document('workspaces/{workspaceId}/routines/{routineId}')
    .onUpdate(async (change, context) => {
    const after = change.after.data();
    if (!after)
        return;
    const { workspaceId } = context.params;
    const dayName = DAY_NAMES[after.dayOfWeek] || 'Routine';
    try {
        // Send notification to the workspace's FCM topic
        await admin.messaging().send({
            topic: `workspace_${workspaceId}`,
            notification: {
                title: '📋 Schedule Changed',
                body: `${dayName} schedule was updated.`,
            },
            data: {
                workspaceId,
                type: 'routine_updated',
                deepLink: `quicklime://workspace/${workspaceId}/routine`,
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
        console.error(`Error sending FCM onRoutineUpdate for workspace ${workspaceId}:`, error);
    }
});
//# sourceMappingURL=onRoutineUpdate.js.map