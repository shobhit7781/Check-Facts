# FactCheck Agent

A deployed web app that reads a PDF, pulls out checkable claims (stats, dates,
financial/technical figures), searches the live web to verify each one, and
reports every claim as **Verified**, **Inaccurate**, or **False** — with the
correct fact when something's wrong.

No sign-up, no API key entry, no local setup: visit the URL, drop in a PDF,
get a verdict.

## How it works

1. **Extract** — The PDF is parsed entirely in the browser with [pdf.js](https://mozilla.github.io/pdf.js/);
   the extracted text never leaves the client at this stage.
2. **Identify claims** — The text is sent to a fast Groq-hosted Llama model
   (`llama-3.3-70b-versatile`), which pulls out up to 10 specific, checkable
   claims.
3. **Verify** — Each claim is checked individually using
   [`groq/compound`](https://console.groq.com/docs/compound), a Groq system
   that has *real* web search built directly into the model call (no scraping
   code on our side). The UI shows a 🔎 marker on any claim the model actually
   searched the web for, so the verification step is transparent rather than
   a black box.
4. **Report** — Results stream in one card at a time with a live tally of
   Verified / Inaccurate / False, each expandable for the explanation and
   (where relevant) the correct fact.

## Architecture

```
index.html        → static frontend (HTML/CSS/vanilla JS), served as-is
api/chat.js        → Vercel serverless function (Node) — the only thing
                      that talks to Groq, using GROQ_API_KEY from the server
                      environment. The key is never sent to the browser.
```

The frontend never holds or sends an API key — it calls `/api/chat` on the
same origin, which forwards the request to Groq using a key stored as a
Vercel environment variable. This is what lets anyone open the deployed URL
and use the tool immediately, with no setup of their own.

An earlier version of this app asked the user to paste in their own Groq key
and patched together "live web data" from a public DuckDuckGo proxy. Both
were removed: the first one means the tool doesn't actually work for someone
who lands on the URL without already having a Groq account, and the second
returned little to no usable context for most numeric claims (it's built for
encyclopedia-style lookups, not stats), making the "cross-reference against
live web data" step unreliable. `groq/compound`'s built-in search (powered by
Tavily) replaces both.

## Local development

```bash
npm i -g vercel        # if you don't already have it
cp .env.example .env   # then fill in GROQ_API_KEY
vercel dev             # serves index.html + api/chat.js together, matching production
```

Get a free Groq API key at [console.groq.com](https://console.groq.com/keys).

## Deploying

1. Push this folder to a new GitHub repository.
2. Go to [vercel.com/new](https://vercel.com/new) and import that repository.
   No build settings are required — Vercel auto-detects the static
   `index.html` and the `api/` folder.
3. In the project's **Settings → Environment Variables**, add:
   - `GROQ_API_KEY` = your key from console.groq.com
4. Deploy. Visit the URL — no further setup needed for anyone testing it.

## Known limitations

- `groq/compound` decides for itself when to invoke web search; the prompt
  instructs it to always search for stats/dates/figures, and the UI flags
  whenever it did, but it isn't a hard-forced tool call.
- Claim extraction is capped at the first ~6,000 characters of the PDF and up
  to 10 claims, to keep the demo fast and within free-tier token limits.
- Rate limiting in `api/chat.js` is a simple in-memory, best-effort guard
  (resets on cold start) — fine for a demo, not a substitute for a real
  rate limiter (e.g. Upstash) in production.
