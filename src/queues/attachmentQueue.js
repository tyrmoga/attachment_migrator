import { Queue, Worker } from 'bullmq';
import IORedis from 'ioredis';
import fs from 'fs/promises';
import { executeOdooWithRetry as destExecute } from '../odoo/dest_db.js';
import { uploadAttachment } from '../services/attachmentService.js';
import { addPendingDuplicate } from '../services/duplicateService.js';
import { incrementCompleted, incrementFailed, incrementDuplicates } from '../services/progressService.js';

export const connection = new IORedis(process.env.REDIS_URL, { maxRetriesPerRequest: null });

export const attachmentQueue = new Queue('attachment-migration', { connection });

export const attachmentWorker = new Worker('attachment-migration', async (job) => {
  const { fileInfo, recordName, resModel, destId } = job.data;
  console.log(`[WORKER] Processing job ${job.id} — attachment ${fileInfo.attachmentId} (${fileInfo.name}) for ${resModel}`);

  try {
    await uploadAttachment(fileInfo, destExecute, recordName, resModel, destId);
    await fs.unlink(fileInfo.filePath).catch(() => {});
    console.log(`[WORKER] Completed job ${job.id} — attachment ${fileInfo.attachmentId}`);
  } catch (err) {
    if (err.code === 'DUPLICATE') {
      addPendingDuplicate(job.id, {
        jobId: job.id,
        attachmentId: fileInfo.attachmentId,
        fileName: fileInfo.name,
        recordName,
        resModel,
        duplicates: err.duplicates,
      });
      console.log(`[WORKER] Job ${job.id} — duplicate resolution needed for ${fileInfo.name}`);
      if (job.data.sessionId) incrementDuplicates(job.data.sessionId);
    }
    throw err;
  }
}, { connection });

attachmentWorker.on('completed', (job) => {
  console.log(`[WORKER] Job ${job.id} marked completed`);
  if (job.data.sessionId) incrementCompleted(job.data.sessionId);
});

attachmentWorker.on('failed', (job, err) => {
  console.error(`[WORKER] Job ${job?.id} failed:`, err.message);
  if (job?.data?.sessionId) incrementFailed(job.data.sessionId);
});
