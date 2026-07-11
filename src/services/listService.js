import { executeOdooWithRetry as srcExecute } from '../odoo/src_db.js';

export async function listWithAttachments(model, fields = ['id', 'name']) {
  const records = await srcExecute(model, 'search_read', [[], { fields, limit: 100000 }]);
  const ids = records.map(r => r.id);
  if (!ids.length) return records;

  const attachments = await srcExecute('ir.attachment', 'search_read', [[[['res_model', '=', model], ['res_id', 'in', ids]]], { fields: ['id', 'res_id'] }]);
  const byRecord = {};
  for (const att of attachments) {
    if (!byRecord[att.res_id]) byRecord[att.res_id] = [];
    byRecord[att.res_id].push(att.id);
  }
  for (const rec of records) {
    rec.attachment_ids = byRecord[rec.id] || [];
    rec.attachment_count = rec.attachment_ids.length;
  }
  return records.filter(r => r.attachment_count > 0);
}
