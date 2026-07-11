import { listWithAttachments } from '../services/listService.js';

export async function listEmployees(req, res) {
  try {
    const employees = await listWithAttachments('hr.employee');
    res.json(employees);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

export async function listContacts(req, res) {
  try {
    const contacts = await listWithAttachments('res.partner');
    res.json(contacts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}
