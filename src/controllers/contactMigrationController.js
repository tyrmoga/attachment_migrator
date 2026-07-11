import { migrateSingleContact } from '../services/contactMigrationService.js';

export default async function contactMigrateController(req, res) {
  try {
    const contactId = parseInt(req.params.id, 10);
    if (isNaN(contactId) || contactId < 1)
      return res.status(400).json({ message: 'Invalid contact ID' });
    const result = await migrateSingleContact(contactId);
    res.json(result);
  } catch (error) {
    console.error('[CONTACT MIGRATION] Failed:', error);
    res.status(500).json({ message: error.message || 'Internal error' });
  }
}
