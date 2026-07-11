import { EventEmitter } from 'events';

const emitter = new EventEmitter();
emitter.setMaxListeners(200);

const sessions = new Map();

function emit(sessionId) {
  const s = sessions.get(sessionId);
  if (s) emitter.emit(sessionId, { ...s });
}

export function initSession(total) {
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  sessions.set(id, { total, completed: 0, failed: 0, duplicates: 0, done: false });
  return id;
}

export function incrementCompleted(id) {
  const s = sessions.get(id);
  if (!s) return;
  s.completed++;
  if (s.completed + s.failed >= s.total) s.done = true;
  emit(id);
}

export function incrementFailed(id) {
  const s = sessions.get(id);
  if (!s) return;
  s.failed++;
  if (s.completed + s.failed >= s.total) s.done = true;
  emit(id);
}

export function incrementDuplicates(id) {
  const s = sessions.get(id);
  if (!s) return;
  s.duplicates++;
}

export function getSession(id) {
  return sessions.get(id) || null;
}

export function onProgress(id, callback) {
  emitter.on(id, callback);
}

export function offProgress(id, callback) {
  emitter.off(id, callback);
}
