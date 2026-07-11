import { migrateSingleEmployee } from '../services/migrationService.js';

export default async function migrateController(req, res) {
  try {
    const employeeId = parseInt(req.params.id, 10);
    if (isNaN(employeeId) || employeeId < 1)
      return res.status(400).json({ message: 'Invalid employee ID' });
    const result = await migrateSingleEmployee(employeeId);
    res.json(result);
  } catch (error) {
    console.error('[MIGRATION] Failed:', error);
    res.status(500).json({ message: error.message || 'Internal error' });
  }
}
