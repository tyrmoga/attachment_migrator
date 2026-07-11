import { migrateRecord } from './migrateRecord.js';

export async function migrateSingleContact(contactId) {
  return migrateRecord('res.partner', contactId, 'contact');
}
