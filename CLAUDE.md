# CLAUDE.md — Instructions for Claude Code CLI

## Project Overview

This is Devin Bartley's interactive "about me" site. Dark terminal aesthetic,
Claude-powered chatbot, generative UI that morphs the page based on questions.

## Architecture

Read these docs before making changes:
- `docs/ARCHITECTURE.md` — System architecture, frontend/backend design
- `docs/BUILD_PLAN.md` — Phased execution plan with checkboxes
- `docs/KNOWLEDGE_BASE_SPEC.md` — All content about Devin (projects, philosophy, stack)
- `docs/SYSTEM_PROMPT_DESIGN.md` — Claude chatbot system prompt structure
- `docs/DESIGN_SYSTEM.md` — Colors, typography, components, animations

## Stack

- Next.js 16 (App Router) + TypeScript
- Tailwind CSS 4
- Framer Motion (animations)
- Vercel AI SDK (`ai` + `@ai-sdk/react` + `@ai-sdk/google`)
- Gemini 2.5 Flash (direct API, not Vertex)
- Supabase (analytics — Phase 4 only)
- Vercel (deployment)

## Key Principles

1. **Single source of truth**: All content lives in `src/data/knowledge.ts`. Static sections AND chatbot system prompt pull from this.
2. **Dark only**: No light mode. Terminal aesthetic. JetBrains Mono + Inter.
3. **Generative UI**: Chatbot uses AI SDK tool calling — text streams naturally, `ui_command` arrives as a structured tool call. `MorphController` handles page morphing.
4. **No RAG needed**: Knowledge base fits in context window. Static import.
5. **Server-side API key**: `GOOGLE_GENERATIVE_AI_API_KEY` never exposed to client.

## Commands

```bash
npm run dev          # Local dev server
npm run build        # Production build
npm run lint         # ESLint
```

## Environment Variables

Copy `.env.example` to `.env.local`:
```
GOOGLE_GENERATIVE_AI_API_KEY=AIza...

# Supabase (Phase 4 — optional until then)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

## Style Rules

- Tailwind classes, not inline styles
- Custom CSS variables in `globals.css`
- Framer Motion for animations
- JetBrains Mono for headings/code/terminal, Inter for body
- Green (#22c55e) primary accent
- No light mode
