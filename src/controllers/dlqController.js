import { attachmentQueue } from '../queues/attachmentQueue.js';
import { getPendingDuplicates, removePendingDuplicate } from '../services/duplicateService.js';

function isDuplicateJob(job) {
  return job.failedReason?.startsWith('DUPLICATE:');
}

export async function listFailed(req, res) {
  try {
    const failed = await attachmentQueue.getJobs('failed');
    const jobs = failed.map(job => ({
      id: job.id,
      name: job.name,
      attachmentId: job.data.fileInfo?.attachmentId,
      fileName: job.data.fileInfo?.name,
      recordName: job.data.recordName,
      resModel: job.data.resModel,
      failedReason: job.failedReason,
      timestamp: job.timestamp,
    }));
    res.json(jobs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

export async function listDuplicates(req, res) {
  res.json(getPendingDuplicates());
}

export async function resolveDuplicate(req, res) {
  try {
    const { jobId, chosenDestId } = req.body;
    if (!Number.isInteger(chosenDestId) || chosenDestId < 1) {
      return res.status(400).json({ message: 'chosenDestId must be a positive integer' });
    }

    const job = await attachmentQueue.getJob(jobId);
    if (!job) return res.status(404).json({ message: `Job ${jobId} not found` });

    await job.update({ ...job.data, destId: chosenDestId });
    await job.retry();
    removePendingDuplicate(jobId);
    res.json({ message: `Job ${jobId} queued for retry with destination ID ${chosenDestId}` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

export async function retryJob(req, res) {
  try {
    const jobId = req.params.jobId;
    const job = await attachmentQueue.getJob(jobId);
    if (!job) return res.status(404).json({ message: `Job ${jobId} not found` });
    if (job.failedReason === undefined)
      return res.status(400).json({ message: `Job ${jobId} has not failed` });
    await job.retry();
    res.json({ message: `Job ${jobId} queued for retry` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

export async function retryAll(req, res) {
  try {
    const failed = await attachmentQueue.getJobs('failed');
    const retryable = failed.filter(j => !isDuplicateJob(j));

    for (const job of retryable) {
      await job.retry();
    }

    res.json({ message: `Retried ${retryable.length} of ${failed.length} failed job(s)` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}
