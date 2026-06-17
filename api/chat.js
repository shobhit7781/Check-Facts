// Vercel serverless function — proxies chat requests to Groq.
// The Groq API key lives only here (as an env var), never in the browser,
// so anyone visiting the deployed URL can use the app without their own key.

export const config = { maxDuration: 30 };

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

async function callGroq(apiKey, model, messages, useCompoundTools) {
  const upstream = await fetch(GROQ_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.1,
      max_tokens: 1024,
      // Restrict compound to plain web search — skip visit_website/code
      // execution, which can pull full page content and balloon the
      // response on claims with little or no evidence to find.
      ...(useCompoundTools ? { compound_custom: { tools: { enabled_tools: ['web_search'] } } } : {}),
    }),
  });
  const data = await upstream.json().catch(() => ({}));
  return { ok: upstream.ok, status: upstream.status, data };
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
  const isCompound = chosenModel.startsWith('groq/compound');

  try {
    let result = await callGroq(apiKey, chosenModel, messages, isCompound);
    let usedFallback = false;

    // Compound models occasionally fail on claims with little evidence to
    // find (their internal search-and-retry loop can grow too large and
    // Groq rejects the request with a 413). Rather than surfacing that as
    // an error, fall back to a plain model without live search so the user
    // still gets a verdict — degraded, but better than a failed claim.
    if (!result.ok && isCompound) {
      result = await callGroq(apiKey, 'llama-3.3-70b-versatile', messages, false);
      usedFallback = true;
    }

    if (!result.ok) {
      const msg = result.data?.error?.message || `Groq API error (HTTP ${result.status})`;
      return res.status(result.status).json({ error: msg });
    }

    // Forward only what the frontend needs — never the raw Groq payload.
    // The full response (especially executed_tools, which can carry large
    // tool-call traces) is what was triggering "Request Entity Too Large".
    const choiceMsg = result.data.choices?.[0]?.message || {};
    const usedSearch = !usedFallback && Array.isArray(choiceMsg.executed_tools) && choiceMsg.executed_tools.length > 0;
    return res.status(200).json({ content: choiceMsg.content || '', usedSearch });
  } catch (err) {
    return res.status(502).json({ error: 'Failed to reach Groq: ' + (err?.message || 'unknown error') });
  }
}
