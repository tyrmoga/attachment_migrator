import { migrateRecord } from './migrateRecord.js';

export async function migrateSingleEmployee(employeeId) {
  return migrateRecord('hr.employee', employeeId, 'employee');
}
