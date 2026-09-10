import { VercelRequest, VercelResponse } from '@vercel/node';

// The Angular frontend is deployed both on Render (static hosting, no
// backend) and on Vercel. Render calls this API cross-origin, so its
// origin needs to be explicitly allowed.
const ALLOWED_ORIGINS = [
  'https://portfolio-4sve.onrender.com',
  'http://localhost:4200',
];

// Returns true if the request was a handled CORS preflight (caller should
// stop processing and return).
export function applyCors(req: VercelRequest, res: VercelResponse): boolean {
  const origin = req.headers.origin;
  if (typeof origin === 'string' && ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Vary', 'Origin');
  }

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return true;
  }

  return false;
}
