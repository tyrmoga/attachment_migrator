import { executeOdooWithRetry as srcExecute } from '../odoo/src_db.js';
import { downloadAttachments } from './attachmentService.js';
import { attachmentQueue } from '../queues/attachmentQueue.js';
import { initSession } from './progressService.js';

export async function migrateRecord(model, recordId, label) {
  console.log(`[MIGRATION] Starting migration for ${label} ${recordId}`);

  const [record] = await srcExecute(model, 'search_read', [[[['id', '=', recordId]]], { fields: ['id', 'name'] }]);

  if (!record) {
    console.error(`[MIGRATION] ${label} ${recordId} not found`);
    throw new Error(`${label} ${recordId} not found`);
  }
  console.log(`[MIGRATION] Found ${label}: ${record.name} (ID ${record.id})`);

  const attachments = await srcExecute('ir.attachment', 'search_read', [[[['res_model', '=', model], ['res_id', '=', recordId]]], { fields: ['id', 'name', 'datas', 'mimetype', 'res_model', 'res_id'] }]);

  console.log(`[MIGRATION] Found ${attachments.length} attachment(s) for ${label} ${recordId}`);
  console.log(`[MIGRATION] Attachment IDs: ${attachments.map(a => a.id).join(', ')}`);

  const downloaded = await downloadAttachments(model, [recordId]);
  console.log(`[MIGRATION] Downloaded ${downloaded.length} file(s) to disk`);

  const sessionId = initSession(downloaded.length);

  for (const fileInfo of downloaded) {
    await attachmentQueue.add(
      `attachment-${fileInfo.attachmentId}`,
      { fileInfo, recordName: record.name, resModel: model, sessionId }
    );
    console.log(`[MIGRATION] Queued attachment ${fileInfo.attachmentId} (${fileInfo.name})`);
  }

  console.log(`[MIGRATION] Migration queued for ${label} ${recordId}`);
  return { sessionId, total: downloaded.length };
}
