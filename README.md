# Council of Agents

Five specialized AI agents debate your hardest decisions in real time.

## Stack

- Next.js 14 (App Router, TypeScript)
- Anthropic SDK (`@anthropic-ai/sdk`)
- Tailwind CSS
- Framer Motion

## Setup

1. Clone the repository:

```bash
git clone git@github.com:cosmic-hash/Council-of-Agents.git
cd Council-of-Agents
```

2. Install dependencies:

```bash
npm install
```

3. Copy environment variables:

```bash
cp .env.example .env.local
```

4. Add your Gemini API key to `.env.local`:

```
GEMINI_API_KEY=your-gemini-api-key-here
GEMINI_MODEL=gemini-3.1-flash-lite
GEMINI_MAX_TOKENS=500
```

Anthropic is supported as a fallback if `GEMINI_API_KEY` is unset.

5. Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Features

- **Three debate modes** — Normal, Moderate, Aggressive
- **Try preview** — full debate UI with mock responses, no API key required
- **Duel View** — Cinematic full-screen debate experience
- **Thread View** — Read the full debate as a feed
- **Live heat system** — Background responds to debate tension
- **User context** — Optional personalization saved to localStorage
- **First-time onboarding** — Optional "About you" prompt on first visit
- **SSE streaming** — Sequential agent responses via `/api/debate`
- **White theme** — Light surfaces with agent colors and heat washes

## Preview mode

Click **Try preview** on the setup screen to run a canned debate without configuring an API key. Live debates require `GEMINI_API_KEY` in `.env.local`.

## Deploying (temporary share link)

**Recommended host:** [Vercel](https://vercel.com) — native Next.js support, free hobby tier, HTTPS, and encrypted environment variables for API keys.

This app needs a **server** (API routes at `/api/debate` and `/api/health`). Static-only hosts (GitHub Pages, Netlify static export) will not work.

### Secrets checklist

| Variable | Where to set | Never put it in |
|---|---|---|
| `GEMINI_API_KEY` | Vercel → Project → Settings → Environment Variables | Git, README, client code, chat |
| `GEMINI_MODEL` | Same | Committed `.env.local` |
| `GEMINI_MODEL_FALLBACKS` | Same (comma-separated, optional) | — |
| `GEMINI_MAX_TOKENS` | Same (optional, `500`) | — |

Local development: copy [`.env.example`](.env.example) to `.env.local` (already gitignored).

If a key was ever exposed, rotate it in [Google AI Studio](https://aistudio.google.com/apikey) before deploying.

### Deploy steps

1. Push your branch to GitHub.
2. Import the repo on Vercel (framework: Next.js, auto-detected).
3. Add environment variables **before** the first production deploy (see table above).
4. Deploy and share the `https://your-project.vercel.app` URL.

**Preview-only deploy:** omit `GEMINI_API_KEY` — **Try preview** still works; live **Convene the Council** will be disabled.

**Live debates:** add `GEMINI_API_KEY` on the server only. The key never reaches the browser; anyone with the URL can consume your API quota, so share the link privately and rotate the key when done.

Alternatives with the same secret pattern: Railway, Render, Fly.io.

## Tests

```bash
npm test
```

## The Council

| Agent | Role |
|---|---|
| The Optimist | Finds upside and opportunity |
| The Contrarian | Challenges assumptions |
| The Pragmatist | Assesses feasibility |
| The Oracle | Maps risks and scenarios |
| The Judge | Delivers the verdict |

## License

MIT
