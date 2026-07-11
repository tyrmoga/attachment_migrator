const pending = new Map();

export function addPendingDuplicate(jobId, data) {
  pending.set(String(jobId), data);
}

export function getPendingDuplicates() {
  return [...pending.values()];
}

export function removePendingDuplicate(jobId) {
  pending.delete(String(jobId));
}
