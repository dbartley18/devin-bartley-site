# Terminal Chat — Design Spec

> The hero terminal IS the chat interface. No separate panel, widget, or UI paradigm switch.

## Concept

The hero section already looks like a terminal. This spec makes it act like one. The bio (`$ whoami`) is the first command's output. When the user types a question at the prompt, it becomes a new command, the response streams inline, and older exchanges collapse like terminal scrollback.

## Three States

### State 1: Idle (First Load)

The current hero section, unchanged, with one addition: a prompt at the bottom of the terminal body.

```
$ whoami
Devin Bartley
Manager, AI & Innovation | Deloitte
...full bio content...
Built with AI. One person.

──────────────────────────────
❯ Ask anything about what I build...▊
```

- Prompt text is placeholder/hint, styled as `text-text-tertiary`
- Blinking cursor (`▊`) in accent-green
- Separated from bio by a `border-top border-border`
- Input is a real text input, styled to look like a terminal prompt
- On focus, placeholder clears, user types freely

### State 2: Active Conversation (After First Question)

User types and hits Enter. The terminal transitions:

1. Bio content collapses to a one-liner: `$ whoami → Devin Bartley | Manager, AI & Innovation | Deloitte`
2. User's question appears as a command: `❯ Tell me about the mesh architecture`
3. Response streams in a block below with green left border and `devin.ai` label
4. New prompt appears at the bottom
5. Terminal body scrolls to keep the latest exchange visible

```
$ whoami → Devin Bartley | Manager, AI & Innovation | Deloitte

❯ Tell me about the mesh architecture

  devin.ai
  │ The Marketing Workbench started as GCP Workflows...
  │ 23 Cloud Run services now self-organize using A2A protocol...▊

──────────────────────────────
❯ ▊
```

### State 3: Multi-Turn

Older exchanges collapse to one-liners. Latest exchange is fully visible.

```
$ whoami → Devin Bartley
❯ Tell me about the mesh → 23 agents, A2A protocol, self-organizing...

❯ How does the trust scoring work?

  devin.ai
  │ Handoff patterns accumulate recency-weighted trust scores...
  │ Trust >= 0.85 + 5 runs = delegated authority...

──────────────────────────────
❯ ▊
```

- Message count in title bar: `devin@bartley ~ % · 3 messages`
- Typing `clear` (or clicking a reset affordance) restores State 1 with full bio
- Scroll up for full history (no accordion/expand on collapsed items)

## Terminal Body Behavior

- Max height on the terminal body: `max-h-[70vh]` with `overflow-y-auto`
- Auto-scroll to bottom when new content streams
- Smooth scroll for collapse animation (Framer Motion)
- Bio collapse is animated: content fades/shrinks, one-liner fades in

## Response Styling

- Response block: `bg-bg-tertiary rounded-lg border-l-2 border-accent-green p-4`
- Label: `devin.ai` in `text-accent-green text-xs font-mono`
- Response text: `text-text-secondary text-sm font-sans leading-relaxed`
- Streaming cursor: blinking `▊` at the end of the streaming text

## Input Styling

- Container: `border-t border-border pt-3 mt-3`
- Prompt symbol: `❯` in `text-accent-green`
- Input: transparent background, no border, `text-text-primary font-mono text-sm`
- Placeholder: `Ask anything about what I build...` in `text-text-tertiary`
- Submit on Enter key

## Mock Responses (Phase 2a)

Before wiring Gemini, use canned responses keyed to keywords:

```typescript
const mockResponses: Record<string, string> = {
  mesh: "The Marketing Workbench started as GCP Workflows...",
  aura: "This one started as a tool to help functional people...",
  brain: "15 brain regions mapped onto a cognitive architecture...",
  riva: "Job search is still weirdly manual...",
  learning: "Started as a conversation, an idea, and a simple question...",
  stack: "Five Claude Code CLI tabs in iTerm2...",
  philosophy: "Everything starts the same way. An idea...",
}
```

Keyword matching: first matching key in the user's input. Default response for no match: "That's a good question. Try asking about the mesh, Aura, Riva, or how I work."

Responses stream character-by-character with a ~20ms delay to simulate LLM streaming.

## Mobile

Same behavior. Terminal is full-width. No layout changes needed. The collapsed scrollback and streaming response work the same way. Keyboard pushes the input up naturally.

## Components

- `TerminalChat.tsx` — The main component. Manages state (idle/active), message history, input, collapse logic. Replaces the current hero terminal body content.
- `ChatMessage.tsx` — Renders a single AI response with the green border treatment.
- `CollapsedExchange.tsx` — One-liner for collapsed Q&A pairs.

`HeroSection.tsx` stays as the outer wrapper (terminal chrome, p10k prompt above). The terminal body content swaps between the static bio (idle) and the chat (active).

## Not In Scope

- Gemini integration (Phase 2b, after mock responses work)
- UI command tool calling / page morphing (Phase 3)
- Message persistence / session management (Phase 4)
- Rate limiting (Phase 5)
