# Architecture — Devin Bartley Interactive Site

> **Last Updated**: 2026-03-26
> **Stack**: Next.js 16 (App Router) · Vercel · AI SDK · Gemini 2.5 Flash (direct API)

## 1. System Overview

An interactive "about me" site with two modes:

- **Standard Mode** — Dark, terminal-aesthetic single page with static sections (hero, philosophy, tech stack, projects, AI workflow).
- **Generative Mode** — Chatbot panel where visitors ask questions. Claude returns structured output: text answer + `ui_command` that morphs the page.

```
┌─────────────────────────────────────────────────────────────────────┐
│  Browser (devin-bartley.vercel.app)                                 │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │  Next.js App (Static Sections + Generative UI Shell)          │  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌─────────────────┐  │  │
│  │  │ Hero     │ │Philosophy│ │ Projects │ │ AI Workflow      │  │  │
│  │  └──────────┘ └──────────┘ └──────────┘ └─────────────────┘  │  │
│  │  ┌───────────────────────────────────────────────────────┐   │  │
│  │  │  Chatbot Panel (slide-up from bottom-right)            │   │  │
│  │  └───────────────────────────────────────────────────────┘   │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                    POST /api/chat                                   │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │  Next.js API Route — server-side only                         │  │
│  │  AI SDK + Gemini 2.5 Flash (streaming)                        │  │
│  └───────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

## 2. Frontend Architecture

### Technology
- **Framework**: Next.js 16 with App Router
- **Styling**: Tailwind CSS 4 with custom dark theme
- **Animations**: Framer Motion for section transitions and morphing
- **Fonts**: JetBrains Mono (terminal) + Inter (body)
- **Deployment**: Vercel (auto-deploy from GitHub main branch)

### Page Structure

```
src/
├── app/
│   ├── layout.tsx              # Root layout, dark theme, fonts, metadata
│   ├── page.tsx                # Main page — assembles all sections
│   ├── globals.css             # Tailwind config + CSS variables
│   └── api/chat/route.ts       # AI SDK streaming endpoint
├── components/
│   ├── Chatbot.tsx             # Floating chatbot panel
│   ├── ChatMessage.tsx         # Message bubble
│   ├── CommandBar.tsx          # Terminal-style input
│   ├── MorphController.tsx     # Orchestrates generative UI morphs
│   ├── SectionCard.tsx         # Animated card wrapper
│   ├── TerminalHeader.tsx      # Terminal chrome (dots, title bar)
│   ├── TypeWriter.tsx          # Typewriter text effect
│   ├── ProjectCard.tsx         # Expandable project card
│   └── TechBadge.tsx           # Tech stack pill
├── sections/
│   ├── HeroSection.tsx         # Name, title, tagline, terminal intro
│   ├── PhilosophySection.tsx   # How I think — Legos, first principles
│   ├── TechStackSection.tsx    # Personal + work stacks
│   ├── ProjectsSection.tsx     # 4 projects with expandable cards
│   ├── AIWorkflowSection.tsx   # "Built ALL of this using AI"
│   └── ContactSection.tsx      # GitHub, LinkedIn links
├── data/
│   └── knowledge.ts            # Complete knowledge base (single source of truth)
└── lib/
    ├── ai.ts                   # AI SDK Gemini client + system prompt builder
    ├── types.ts                # Shared types
    └── ui-commands.ts          # UI command tool definitions
```

### Generative UI Flow

1. User types question in chatbot
2. Client sends message via AI SDK `useChat` hook
3. API route builds system prompt with full knowledge base
4. AI SDK `streamText` with Gemini + `ui_command` tool definition
5. Text streams to client naturally; `ui_command` arrives as a tool call
6. MorphController triggers: scroll, expand, highlight, fade others
7. "Reset" button restores standard layout

### UI Commands

| Command | Effect |
|---------|--------|
| `expand_section` | Scroll to section, expand with focus on subsection |
| `highlight` | Glow specific keywords/concepts |
| `show_architecture` | Render mermaid diagram inline |
| `show_stats` | Surface metrics (test count, services, brain regions) |
| `compare` | Side-by-side of two projects or approaches |
| `reset` | Return to standard layout |
| `focus_philosophy` | Bring philosophy section to prominence |

## 3. Backend Architecture

### API Route: /api/chat

Single Next.js API route. No separate backend.

- Uses AI SDK `streamText` with `@ai-sdk/google` (Gemini 2.5 Flash, direct API)
- System prompt: Identity + Knowledge Base (static import from `src/data/knowledge.ts`)
- `ui_command` defined as an AI SDK tool with `inputSchema` (Zod) — not JSON-in-text
- Streaming via `toDataStreamResponse()` → consumed by `useChat` on client

No RAG — total knowledge base fits in context window.

### Supabase Schema (Phase 4)

Supabase is **not required** for Phases 0–3. The chat API works without it.

```sql
CREATE TABLE chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  user_agent TEXT,
  ip_hash TEXT
);

CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES chat_sessions(id),
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  ui_command JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE chat_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES chat_sessions(id),
  question_category TEXT,
  section_triggered TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## 4. Environment Variables

| Variable | Source | Purpose |
|----------|--------|---------|
| `GOOGLE_GENERATIVE_AI_API_KEY` | Google AI Studio | Gemini API (server-side only) |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Dashboard | Supabase project URL (Phase 4) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Dashboard | Public anon key (Phase 4) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Dashboard | Server-side access (Phase 4) |

## 5. Security

- Rate limiting on `/api/chat` (Phase 5 — simple in-route counter initially)
- No PII — anonymized session IDs only
- API keys server-side only
- Supabase RLS on all tables
- Claude built-in content safety filters
