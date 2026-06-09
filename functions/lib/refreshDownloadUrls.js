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
exports.refreshDownloadUrls = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const firestore_1 = require("firebase-admin/firestore");
if (admin.apps.length === 0) {
    admin.initializeApp();
}
const db = admin.firestore();
/**
 * Scheduled function running every 24 hours.
 * Queries event attachments across all workspaces, re-signs URLs older than 6 days
 * with a 7-day expiration link, and updates Firestore.
 */
exports.refreshDownloadUrls = functions.pubsub
    .schedule('every 24 hours')
    .onRun(async (context) => {
    console.log('Started refreshDownloadUrls scheduled job.');
    const now = Date.now();
    const sixDays = 6 * 24 * 60 * 60 * 1000;
    const thresholdDate = new Date(now - sixDays);
    try {
        const bucket = admin.storage().bucket();
        // 1. Fetch all events across all workspaces
        const eventsSnap = await db.collectionGroup('events').get();
        let batch = db.batch();
        let batchCount = 0;
        const batchLimit = 500;
        for (const eventDoc of eventsSnap.docs) {
            const eventData = eventDoc.data();
            const attachments = eventData.attachments || [];
            let needsUpdate = false;
            const updatedAttachments = [];
            for (const attachment of attachments) {
                const uploadedAt = attachment.uploadedAt;
                const isExpired = !attachment.downloadUrl ||
                    (uploadedAt && uploadedAt.toMillis() < thresholdDate.getTime());
                if (isExpired) {
                    try {
                        // 2. Generate new signed URL (7-day duration)
                        const fileRef = bucket.file(attachment.storagePath);
                        const [signedUrl] = await fileRef.getSignedUrl({
                            action: 'read',
                            expires: now + 7 * 24 * 60 * 60 * 1000,
                        });
                        updatedAttachments.push({
                            ...attachment,
                            downloadUrl: signedUrl,
                            uploadedAt: firestore_1.Timestamp.now(), // Refresh timestamp
                        });
                        needsUpdate = true;
                    }
                    catch (err) {
                        console.error(`Failed to generate signed URL for path: ${attachment.storagePath}`, err);
                        updatedAttachments.push(attachment);
                    }
                }
                else {
                    updatedAttachments.push(attachment);
                }
            }
            if (needsUpdate) {
                batch.update(eventDoc.ref, {
                    attachments: updatedAttachments,
                    updatedAt: firestore_1.FieldValue.serverTimestamp(),
                });
                batchCount++;
                if (batchCount >= batchLimit) {
                    await batch.commit();
                    batch = db.batch();
                    batchCount = 0;
                }
            }
        }
        if (batchCount > 0) {
            await batch.commit();
        }
        console.log('Finished refreshDownloadUrls scheduled job successfully.');
    }
    catch (error) {
        console.error('Error during scheduled refreshDownloadUrls:', error);
    }
});
//# sourceMappingURL=refreshDownloadUrls.js.map