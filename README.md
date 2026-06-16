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

4. Add your Anthropic API key to `.env.local`:

```
ANTHROPIC_API_KEY=sk-ant-your-key-here
ANTHROPIC_MODEL=claude-sonnet-4-6
ANTHROPIC_MAX_TOKENS=500
```

5. Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Features

- **Three debate modes** — Normal, Moderate, Aggressive
- **Duel View** — Cinematic full-screen debate experience
- **Thread View** — Read the full debate as a feed
- **Live heat system** — Background responds to debate tension
- **User context** — Optional personalization saved to localStorage
- **SSE streaming** — Sequential agent responses via `/api/debate`

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
