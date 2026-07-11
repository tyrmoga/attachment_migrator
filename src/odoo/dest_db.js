import dotenv from 'dotenv';
dotenv.config();
import { createClient } from './client.js';

const REQUIRED_ENV_VARS = ['ODOO_DEST_URL', 'ODOO_DEST_DB', 'ODOO_DEST_USERNAME', 'ODOO_DEST_API_KEY'];
const missing = REQUIRED_ENV_VARS.filter(v => !process.env[v]);
if (missing.length) {
  console.error('Missing required environment variables: %s', missing.join(', '));
  process.exit(1);
}

const { client, executeOdoo, executeOdooWithRetry } = createClient({
  url: process.env.ODOO_DEST_URL,
  db: process.env.ODOO_DEST_DB,
  username: process.env.ODOO_DEST_USERNAME,
  password: process.env.ODOO_DEST_API_KEY,
});

export default client;
export { executeOdoo, executeOdooWithRetry };
