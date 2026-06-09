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
exports.onUserCreate = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const firestore_1 = require("firebase-admin/firestore");
// Initialize firebase-admin if it hasn't been already
if (admin.apps.length === 0) {
    admin.initializeApp();
}
const db = admin.firestore();
/**
 * Triggered automatically when a new user signs up.
 * Instantiates their user profile document and assigns default custom claims.
 */
exports.onUserCreate = functions.auth.user().onCreate(async (user) => {
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
            createdAt: firestore_1.FieldValue.serverTimestamp(),
            lastActiveAt: firestore_1.FieldValue.serverTimestamp(),
        });
        // 2. Set custom claims { role: 'student', workspaceId: null }
        await admin.auth().setCustomUserClaims(user.uid, {
            role: 'student',
            workspaceId: null,
        });
    }
    catch (error) {
        console.error('Error in onUserCreate trigger:', error);
    }
});
//# sourceMappingURL=onUserCreate.js.map