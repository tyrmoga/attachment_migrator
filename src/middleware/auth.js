import dotenv from 'dotenv';
dotenv.config();

const API_USERNAME = process.env.API_USERNAME;
const API_PASSWORD = process.env.API_PASSWORD;

if (!API_USERNAME || !API_PASSWORD) {
  console.error('API_USERNAME and API_PASSWORD must be set in environment');
  process.exit(1);
}

export function basicAuth(req, res, next) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Basic ')) {
    res.set('WWW-Authenticate', 'Basic realm="Attachment Migrator"');
    return res.status(401).json({ message: 'Authentication required' });
  }

  const decoded = Buffer.from(header.slice(6), 'base64').toString('utf8');
  const colon = decoded.indexOf(':');
  if (colon === -1) {
    return res.status(400).json({ message: 'Invalid authorization format' });
  }

  const user = decoded.slice(0, colon);
  const pass = decoded.slice(colon + 1);

  if (user !== API_USERNAME || pass !== API_PASSWORD) {
    return res.status(403).json({ message: 'Invalid credentials' });
  }

  next();
}
