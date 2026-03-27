# Build Plan — Phased Execution

> **Estimated Total**: 4-6 focused sessions in Claude Code CLI
> **Approach**: Phase by phase, each phase is shippable

## Phase 0: Project Bootstrap (30 min)

- [ ] `npx create-next-app@latest` with App Router, Tailwind, TypeScript (Next.js 16)
- [ ] Configure Tailwind with custom dark theme (see DESIGN_SYSTEM.md)
- [ ] Add JetBrains Mono + Inter fonts via `next/font`
- [ ] Create `layout.tsx` with dark theme, metadata, font config
- [ ] Create `page.tsx` with placeholder sections
- [ ] Create `globals.css` with CSS variables and base styles
- [ ] Add dot grid background pattern
- [ ] Push to GitHub, connect to Vercel, verify deploy
- [ ] Add `.env.local` from `.env.example`

**Ship gate**: Dark page with "Devin Bartley" renders at `*.vercel.app`

## Phase 1: Static Sections (2-3 hours)

### 1a. Components
- [ ] `TerminalHeader.tsx` — Three dot chrome + title text
- [ ] `SectionCard.tsx` — Framer Motion wrapper with fade-in on scroll
- [ ] `TypeWriter.tsx` — Animated typing effect
- [ ] `TechBadge.tsx` — Pill component with glow hover
- [ ] `ProjectCard.tsx` — Expandable card with summary/detail toggle

### 1b. Sections
- [ ] `HeroSection.tsx` — Name, title, terminal intro, blinking cursor, tagline
- [ ] `PhilosophySection.tsx` — First principles, Lego metaphor, failure philosophy, brain obsession
- [ ] `TechStackSection.tsx` — Two columns (Personal | Work), badge grid
- [ ] `ProjectsSection.tsx` — 4 ProjectCards: A2A Mesh, Learning Accelerator, Dev Quickstart Agent, Riva
- [ ] `AIWorkflowSection.tsx` — "Built ALL of this using AI", planning/execution model stack
- [ ] `ContactSection.tsx` — GitHub, LinkedIn links

### 1c. Knowledge Base
- [ ] `src/data/knowledge.ts` — Complete structured knowledge base (single source of truth, see KNOWLEDGE_BASE_SPEC.md)

**Ship gate**: Full static site with all sections, animations, responsive layout

## Phase 2: Chatbot + Claude Integration (2-3 hours)

### 2a. API Route
- [ ] `npm install ai @ai-sdk/react @ai-sdk/google` — AI SDK + Gemini provider
- [ ] `src/app/api/chat/route.ts` — AI SDK `streamText` with Gemini, system prompt, ui_command tool
- [ ] `src/lib/ai.ts` — Gemini client setup + system prompt builder
- [ ] `src/lib/types.ts` — ChatMessage, UICommand types
- [ ] `src/lib/ui-commands.ts` — UI command tool definition (Zod schema)

### 2b. System Prompt
- [ ] Design 2-section prompt: Identity + Knowledge Base (ui_command is now a tool, not prompt text)
- [ ] See SYSTEM_PROMPT_DESIGN.md for full spec

### 2c. Chatbot Component
- [ ] `Chatbot.tsx` — Floating button, slide-up panel, AI SDK `useChat` hook, streaming
- [ ] `ChatMessage.tsx` — User/assistant message styling
- [ ] `CommandBar.tsx` — Terminal-style input with `>` prompt

**Ship gate**: Chat with Gemini about Devin, get accurate streaming answers

## Phase 3: Generative UI — Page Morphing (2-3 hours)

### 3a. Morph Controller
- [ ] `MorphController.tsx` — Context provider, receives ui_commands, manages active section state
- [ ] `src/lib/ui-commands.ts` — Command handlers (scroll, expand, highlight, reset)

### 3b. Section Morphing
- [ ] Each section accepts `isFocused`, `isExpanded`, `highlights` props
- [ ] Focused section: scales up, others fade
- [ ] Highlighted terms: green glow pulse
- [ ] Smooth Framer Motion transitions

### 3c. Architecture Diagrams
- [ ] Simplified mermaid diagrams for each project
- [ ] `show_architecture` command renders inline

### 3d. Reset
- [ ] "Reset view" button in generative mode
- [ ] Smooth transition back to standard layout

**Ship gate**: Ask "tell me about the mesh" → page scrolls, A2A card expands, architecture appears

## Phase 4: Supabase + Analytics (1 hour)

- [ ] Create Supabase project / use existing
- [ ] Run schema migration
- [ ] Enable RLS policies
- [ ] `src/lib/supabase.ts` — client setup
- [ ] API route logs messages + categorizes questions

**Ship gate**: Questions logged in Supabase dashboard

## Phase 5: Polish (1-2 hours)

- [ ] Mobile responsive (chatbot full-screen on mobile)
- [ ] Loading states and skeleton screens
- [ ] Error boundaries
- [ ] Rate limiting middleware
- [ ] SEO metadata (Open Graph tags)
- [ ] Favicon
- [ ] Performance audit (Lighthouse)
- [ ] Test all UI commands end-to-end

**Ship gate**: Production-ready, would show to the engineering team with zero caveats

## CLI Session Strategy

```bash
# Session 1: Phase 0 + Phase 1a (bootstrap + components)
# Session 2: Phase 1b (all sections with content)
# Session 3: Phase 2 (chatbot + Claude integration)
# Session 4: Phase 3 (generative UI morphing)
# Session 5: Phase 4 + 5 (Supabase + polish)
```

Each session: 2-3 Claude Code tabs
- Tab 1: Main implementation
- Tab 2: Testing / preview
- Tab 3: Docs / knowledge base
