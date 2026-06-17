// Vercel serverless function — proxies chat requests to Groq.
// The Groq API key lives only here (as an env var), never in the browser,
// so anyone visiting the deployed URL can use the app without their own key.

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

// Very small in-memory throttle. Resets on cold start, so it's "best effort"
// rather than a hard guarantee — fine for a demo, not a substitute for real
// rate limiting (e.g. Upstash) in a production deployment.
const hits = new Map();
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 20;

function rateLimited(ip) {
  const now = Date.now();
  const entry = hits.get(ip);
  if (!entry || now - entry.start > WINDOW_MS) {
    hits.set(ip, { start: now, count: 1 });
    return false;
  }
  entry.count += 1;
  return entry.count > MAX_PER_WINDOW;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || 'unknown';
  if (rateLimited(ip)) {
    return res.status(429).json({ error: 'Too many requests — please wait a minute and try again.' });
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Server misconfigured: GROQ_API_KEY is not set.' });
  }

  const { messages, model } = req.body || {};
  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'Request body must include a non-empty "messages" array.' });
  }

  const allowedModels = new Set(['llama-3.3-70b-versatile', 'groq/compound', 'groq/compound-mini']);
  const chosenModel = allowedModels.has(model) ? model : 'llama-3.3-70b-versatile';

  try {
    const upstream = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: chosenModel,
        messages,
        temperature: 0.1,
        max_tokens: 1024,
      }),
    });

    const data = await upstream.json();

    if (!upstream.ok) {
      const msg = data?.error?.message || `Groq API error (HTTP ${upstream.status})`;
      return res.status(upstream.status).json({ error: msg });
    }

    return res.status(200).json(data);
  } catch (err) {
    return res.status(502).json({ error: 'Failed to reach Groq: ' + (err?.message || 'unknown error') });
  }
}
