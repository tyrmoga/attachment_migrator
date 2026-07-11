import { executeOdooWithRetry as srcExecute } from '../odoo/src_db.js';
import fs from 'fs/promises';
import path from 'path';

const DOWNLOADS_DIR = path.resolve('downloads');

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

export async function downloadAttachments(resModel, resIds) {
  if (!resIds.length) return [];

  const attachments = await srcExecute('ir.attachment', 'search_read', [[
    [['res_model', '=', resModel], ['res_id', 'in', resIds]],
  ], { fields: ['id', 'name', 'datas', 'mimetype', 'res_id', 'res_model'] }]);

  const written = [];

  for (const att of attachments) {
    if (!att.datas) {
      console.log(`[DOWNLOAD] Attachment ${att.id} (${att.name}) has no data — skipping`);
      continue;
    }

    const recordDir = path.join(DOWNLOADS_DIR, String(att.res_id));
    await ensureDir(recordDir);

    const safeName = `${att.id}_${(att.name || 'untitled').replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    const filePath = path.join(recordDir, safeName);

    const buf = Buffer.from(att.datas, 'base64');
    await fs.writeFile(filePath, buf);
    console.log(`[DOWNLOAD] Wrote attachment ${att.id} (${att.name}) → ${filePath} (${buf.length} bytes)`);

    written.push({
      attachmentId: att.id,
      resId: att.res_id,
      fileName: safeName,
      filePath,
      mimetype: att.mimetype,
      name: att.name,
    });
  }

  console.log(`[DOWNLOAD] Finished — ${written.length} file(s) written for ${resModel}`);
  return written;
}

export async function uploadAttachment(fileInfo, destExecute, sourceRecordName, destModel, destId) {
  console.log(`[UPLOAD] Starting upload for attachment ${fileInfo.attachmentId} (${fileInfo.name}) → ${destModel}`);

  let resolvedDestId = destId;

  if (!resolvedDestId) {
    const destIds = await destExecute(destModel, 'search', [[[['name', '=', sourceRecordName]]]]);

    if (!destIds.length) {
      throw new Error(`No destination ${destModel} found matching name "${sourceRecordName}"`);
    }

    if (destIds.length > 1) {
      const records = await destExecute(destModel, 'search_read', [[[['id', 'in', destIds]]], { fields: ['id', 'name'] }]);
      const err = new Error(`DUPLICATE:${JSON.stringify(records)}`);
      err.code = 'DUPLICATE';
      err.duplicates = records;
      throw err;
    }

    resolvedDestId = destIds[0];
  }

  console.log(`[UPLOAD] Matched source "${sourceRecordName}" → destination ${destModel} ID ${resolvedDestId}`);

  const migrationTag = `migrated_from:${fileInfo.attachmentId}`;
  const existing = await destExecute('ir.attachment', 'search', [[[['description', '=', migrationTag]]]]);

  if (existing.length) {
    console.log(`[UPLOAD] Attachment ${fileInfo.attachmentId} (${fileInfo.name}) already migrated — skipping`);
    return existing[0];
  }

  const data = await fs.readFile(fileInfo.filePath);
  const datas = data.toString('base64');
  console.log(`[UPLOAD] Read ${data.length} bytes from disk`);

  const newId = await destExecute('ir.attachment', 'create', [[{
    name: fileInfo.name,
    datas,
    mimetype: fileInfo.mimetype,
    res_model: destModel,
    res_id: resolvedDestId,
    description: migrationTag,
  }]]);

  console.log(`[UPLOAD] Created ir.attachment ${newId} on destination for ${fileInfo.name}`);
}
