import { getSession, onProgress, offProgress } from '../services/progressService.js';

export default async function progressController(req, res) {
  const session = getSession(req.params.sessionId);
  if (!session) return res.status(404).json({ message: 'Session not found' });
  res.json(session);
}

export async function sseController(req, res) {
  const sessionId = req.params.sessionId;
  const session = getSession(sessionId);
  if (!session) return res.status(404).json({ message: 'Session not found' });

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  });

  res.write(`data: ${JSON.stringify(session)}\n\n`);

  const handler = (data) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
    if (data.done) res.end();
  };

  onProgress(sessionId, handler);

  req.on('close', () => offProgress(sessionId, handler));
}
