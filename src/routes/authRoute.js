import { Router } from 'express';
import dotenv from 'dotenv';
dotenv.config();

const API_USERNAME = process.env.API_USERNAME;
const API_PASSWORD = process.env.API_PASSWORD;

if (!API_USERNAME || !API_PASSWORD) {
  console.error('API_USERNAME and API_PASSWORD must be set in environment');
  process.exit(1);
}

const authRouter = Router();

authRouter.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (username === API_USERNAME && password === API_PASSWORD) {
    const token = Buffer.from(`${username}:${password}`).toString('base64');
    return res.json({ token, username });
  }

  return res.status(401).json({ message: 'Invalid credentials' });
});

export default authRouter;
