import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';

if (admin.apps.length === 0) {
  admin.initializeApp();
}
const db = admin.firestore();

/**
 * Scheduled function running every 24 hours.
 * Queries event attachments across all workspaces, re-signs URLs older than 6 days
 * with a 7-day expiration link, and updates Firestore.
 */
export const refreshDownloadUrls = functions.pubsub
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
                uploadedAt: Timestamp.now(), // Refresh timestamp
              });
              needsUpdate = true;
            } catch (err) {
              console.error(`Failed to generate signed URL for path: ${attachment.storagePath}`, err);
              updatedAttachments.push(attachment);
            }
          } else {
            updatedAttachments.push(attachment);
          }
        }

        if (needsUpdate) {
          batch.update(eventDoc.ref, {
            attachments: updatedAttachments,
            updatedAt: FieldValue.serverTimestamp(),
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
    } catch (error) {
      console.error('Error during scheduled refreshDownloadUrls:', error);
    }
  });
