# Devin Bartley — Interactive Portfolio

> I think in architecture, I build with AI.

An interactive "about me" site with a Claude-powered chatbot and generative UI.
Ask a question — the page morphs to show you the answer.

## Tech Stack

- **Frontend**: Next.js 15 (App Router) + Tailwind CSS 4 + Framer Motion
- **LLM**: Claude Sonnet 4.6 via Anthropic API (server-side streaming)
- **Database**: Supabase (chat analytics)
- **Deployment**: Vercel

## Getting Started

```bash
npm install
cp .env.example .env.local
# Fill in: ANTHROPIC_API_KEY, SUPABASE_URL, SUPABASE_ANON_KEY
npm run dev
```

## Documentation

| Document | Description |
|----------|-------------|
| [Architecture](docs/ARCHITECTURE.md) | System design |
| [Build Plan](docs/BUILD_PLAN.md) | Phased execution plan |
| [Design System](docs/DESIGN_SYSTEM.md) | Visual spec |
| [Knowledge Base](docs/KNOWLEDGE_BASE_SPEC.md) | Content spec |
| [System Prompt](docs/SYSTEM_PROMPT_DESIGN.md) | Chatbot prompt design |

## License

Proprietary. All rights reserved.
