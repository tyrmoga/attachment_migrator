import dotenv from 'dotenv';
dotenv.config();
import { createClient } from './client.js';

const REQUIRED_ENV_VARS = ['JWT_SECRET', 'ODOO_SOURCE_HOST', 'ODOO_SOURCE_DB', 'ODOO_SOURCE_USERNAME', 'ODOO_SOURCE_API_KEY'];
const missing = REQUIRED_ENV_VARS.filter(v => !process.env[v]);
if (missing.length) {
  console.error('Missing required environment variables: %s', missing.join(', '));
  process.exit(1);
}

const { client, executeOdoo, executeOdooWithRetry } = createClient({
  url: process.env.ODOO_SOURCE_HOST,
  db: process.env.ODOO_SOURCE_DB,
  username: process.env.ODOO_SOURCE_USERNAME,
  password: process.env.ODOO_SOURCE_API_KEY,
});

export default client;
export { executeOdoo, executeOdooWithRetry };
