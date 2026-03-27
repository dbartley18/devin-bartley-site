# Terminal Chat Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the hero terminal into a working chat interface with mock responses that stream character-by-character.

**Architecture:** Three new components (TerminalChat, ChatMessage, CollapsedExchange) plus a mock response module. HeroSection becomes a thin wrapper around TerminalChat. The terminal has three states: idle (bio visible), active (first exchange), multi-turn (scrollback collapses). TerminalHeader gains an optional message count.

**Tech Stack:** React 19, Framer Motion 12, Next.js 16 (client components)

---

### File Map

| Action | Path | Responsibility |
|--------|------|---------------|
| Create | `src/lib/mock-responses.ts` | Keyword-matched canned responses + streaming simulator |
| Create | `src/components/ChatMessage.tsx` | Single AI response block with green border |
| Create | `src/components/CollapsedExchange.tsx` | One-liner for collapsed Q&A pairs |
| Create | `src/components/TerminalChat.tsx` | Main chat state machine: idle/active/multi-turn, input, history |
| Modify | `src/components/TerminalHeader.tsx` | Add optional `messageCount` prop |
| Modify | `src/sections/HeroSection.tsx` | Swap static bio for TerminalChat |

---

### Task 1: Mock Response Module

**Files:**
- Create: `src/lib/mock-responses.ts`

- [ ] **Step 1: Create the mock response data and streaming function**

```typescript
// src/lib/mock-responses.ts

const mockResponses: Record<string, string> = {
  mesh: "The Marketing Workbench started as GCP Workflows. Devin looked at it and thought: what if you decomposed every agent into its own service, threw away the orchestrator, and forced them to discover each other at runtime?\n\nThat turned into 23 Cloud Run services using A2A protocol, each reading each other's capability cards and deciding who to hand off to. No hardcoded pipelines. The system composes itself or it doesn't ship.",
  workbench: "The Marketing Workbench started as GCP Workflows. Devin looked at it and thought: what if you decomposed every agent into its own service, threw away the orchestrator, and forced them to discover each other at runtime?\n\nThat turned into 23 Cloud Run services using A2A protocol, each reading each other's capability cards and deciding who to hand off to. No hardcoded pipelines. The system composes itself or it doesn't ship.",
  aura: "Started as a tool to help functional people scaffold agent projects. Then the realization: most agents aren't agents. They're runnable functions with LLM wrappers. That's not agency.\n\nSo Devin pulled the orchestrator out of the graph, started calling sub-agents 'smart tools,' and gave the orchestrator actual goals, memory, and judgment. 15 brain regions mapped onto a cognitive architecture. 68 named personas with an HR system that coaches underperformers and fires them if they don't improve.\n\nAll because he got annoyed at the word 'agent' being misused.",
  brain: "15 regions of the human brain mapped onto a cognitive architecture. Each brain region is a distinct Python module: Prefrontal Cortex for planning, Amygdala for risk assessment, Hippocampus for vector-based memory, Wernicke's Area for language comprehension.\n\nThe orchestrator operates as a CEO consuming executive summaries from each region. Reduced token usage from ~800 to ~300 per decision while improving quality. The cognitive loop: THINK, PLAN, CHOOSE, ACT, REVIEW.",
  riva: "Job search is still weirdly manual for something that's mostly pattern matching. Riva inverts it. Sources roles from your resume and profile, then shows you exactly why each one is worth your time.\n\nEvery recommendation has grounded evidence mapping JD requirements to actual resume spans. No black-box scoring. It also handles execution: outreach, follow-ups, inbox scanning. Determinism-tested end to end. If it's not reproducible, it doesn't ship.",
  learning: "Started as a conversation, an idea, and a simple question: can we use Google Gems or Custom GPTs to teach people about AI?\n\nEvolved into a platform where every lesson, quiz, exercise, and visual is generated in real time. Zero pre-authored content. A 6-agent state machine where the Coach agent doesn't repeat the lesson — it rethinks the approach entirely. Adding a new audience costs ~80 lines of data and zero code changes.",
  stack: "Five Claude Code CLI tabs in iTerm2, running at the same time. Main implementation, testing, docs, and two for whatever comes up. Opus is the default, Sonnet for speed.\n\nThe IDE only opens when needed. Most of the time, the terminal is enough. Gemini for served applications — cost of intelligence at scale. Previously 2.0 Flash, until Google politely emailed that they were deprecating it. RIP to a real one.",
  philosophy: "Everything starts the same way. An idea. Sometimes it's mine, sometimes it's not; doesn't matter, it's a seed.\n\nIf it sticks, I stay with it. Turn it into a real question, push past the point where most people would stop, then pull it apart. See where it breaks, see what holds. At some point, you know whether there's actually something there or not.",
  trust: "Handoff patterns between agents accumulate recency-weighted trust scores. The weight is 0.7 — recent interactions matter more than historical ones.\n\nWhen trust hits 0.85 or higher after at least 5 successful runs, that agent pair earns delegated authority — they can invoke each other directly without PM approval. Drop below 0.60 and you're demoted back to governed mode. All scoring is pure Python, no LLM in the loop.",
  persona: "68 named personas, each with real backgrounds, specializations, and performance tracking. The system has actual agent economics: error rates, user sentiment analysis, token consumption vs. baseline.\n\nUnderperformers don't get fired immediately. They get coached — the system injects what's failing directly into their prompt at runtime. If issues persist, they're benched. Stay on the bench too long, you're terminated. When a role needs filling, an LLM spins up a new persona using the fired one's failure patterns as anti-patterns.",
};

const DEFAULT_RESPONSE =
  "Good question. Try asking about the mesh architecture, Aura, Riva, the learning accelerator, my stack, or how I think about building things.";

export function getResponse(input: string): string {
  const lower = input.toLowerCase();
  for (const [key, value] of Object.entries(mockResponses)) {
    if (lower.includes(key)) return value;
  }
  return DEFAULT_RESPONSE;
}

export function streamResponse(
  text: string,
  onChunk: (char: string) => void,
  onDone: () => void,
): () => void {
  let i = 0;
  const interval = setInterval(() => {
    if (i < text.length) {
      onChunk(text[i]);
      i++;
    } else {
      clearInterval(interval);
      onDone();
    }
  }, 18);
  return () => clearInterval(interval);
}
```

- [ ] **Step 2: Verify the file compiles**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/lib/mock-responses.ts
git commit -m "feat: add mock response module with keyword matching and streaming"
```

---

### Task 2: ChatMessage Component

**Files:**
- Create: `src/components/ChatMessage.tsx`

- [ ] **Step 1: Create the ChatMessage component**

```tsx
// src/components/ChatMessage.tsx
"use client";

interface ChatMessageProps {
  text: string;
  isStreaming: boolean;
}

export default function ChatMessage({ text, isStreaming }: ChatMessageProps) {
  return (
    <div className="bg-bg-tertiary rounded-lg border-l-2 border-accent-green p-4 mt-3">
      <p className="text-accent-green text-xs font-mono mb-2">devin.ai</p>
      <div className="text-text-secondary text-sm font-sans leading-relaxed whitespace-pre-wrap">
        {text}
        {isStreaming && (
          <span className="cursor-blink text-accent-green">▊</span>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify the file compiles**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/components/ChatMessage.tsx
git commit -m "feat: add ChatMessage component with streaming cursor"
```

---

### Task 3: CollapsedExchange Component

**Files:**
- Create: `src/components/CollapsedExchange.tsx`

- [ ] **Step 1: Create the CollapsedExchange component**

```tsx
// src/components/CollapsedExchange.tsx
"use client";

interface CollapsedExchangeProps {
  question: string;
  answerPreview: string;
  isWhoami?: boolean;
}

export default function CollapsedExchange({
  question,
  answerPreview,
  isWhoami,
}: CollapsedExchangeProps) {
  const prefix = isWhoami ? "$" : "❯";
  return (
    <div className="text-text-tertiary text-xs font-mono truncate">
      <span>{prefix} {question}</span>
      <span className="mx-1">→</span>
      <span>{answerPreview}</span>
    </div>
  );
}
```

- [ ] **Step 2: Verify the file compiles**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/components/CollapsedExchange.tsx
git commit -m "feat: add CollapsedExchange component for terminal scrollback"
```

---

### Task 4: Update TerminalHeader with Message Count

**Files:**
- Modify: `src/components/TerminalHeader.tsx`

- [ ] **Step 1: Add messageCount prop**

Replace the entire file with:

```tsx
// src/components/TerminalHeader.tsx
interface TerminalHeaderProps {
  title?: string;
  messageCount?: number;
}

export default function TerminalHeader({
  title = "devin@bartley ~ %",
  messageCount,
}: TerminalHeaderProps) {
  return (
    <div className="flex items-center gap-3 bg-bg-tertiary border-b border-border px-4 py-3 rounded-t-xl">
      <div className="flex gap-2">
        <span className="w-3 h-3 rounded-full bg-accent-red" />
        <span className="w-3 h-3 rounded-full bg-accent-amber" />
        <span className="w-3 h-3 rounded-full bg-accent-green" />
      </div>
      <span className="font-nerd text-sm text-text-tertiary">{title}</span>
      {messageCount !== undefined && messageCount > 0 && (
        <span className="ml-auto font-mono text-xs text-text-tertiary">
          {messageCount} {messageCount === 1 ? "message" : "messages"}
        </span>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify the file compiles**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/components/TerminalHeader.tsx
git commit -m "feat: add optional messageCount to TerminalHeader"
```

---

### Task 5: TerminalChat — The Main Component

**Files:**
- Create: `src/components/TerminalChat.tsx`

- [ ] **Step 1: Create the TerminalChat component**

This is the core state machine. It manages three states: idle (bio), active (first exchange), multi-turn (collapsed scrollback).

```tsx
// src/components/TerminalChat.tsx
"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ChatMessage from "@/components/ChatMessage";
import CollapsedExchange from "@/components/CollapsedExchange";
import { getResponse, streamResponse } from "@/lib/mock-responses";

interface Exchange {
  question: string;
  answer: string;
}

interface TerminalChatProps {
  onMessageCountChange?: (count: number) => void;
}

export default function TerminalChat({
  onMessageCountChange,
}: TerminalChatProps) {
  const [exchanges, setExchanges] = useState<Exchange[]>([]);
  const [input, setInput] = useState("");
  const [streamingText, setStreamingText] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [showBio, setShowBio] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const cleanupRef = useRef<(() => void) | null>(null);

  const isIdle = exchanges.length === 0 && !isStreaming;

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [exchanges, streamingText]);

  useEffect(() => {
    onMessageCountChange?.(exchanges.length);
  }, [exchanges.length, onMessageCountChange]);

  useEffect(() => {
    return () => {
      cleanupRef.current?.();
    };
  }, []);

  const handleSubmit = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed || isStreaming) return;

    if (trimmed.toLowerCase() === "clear") {
      setExchanges([]);
      setInput("");
      setShowBio(true);
      onMessageCountChange?.(0);
      return;
    }

    setShowBio(false);
    setInput("");
    setIsStreaming(true);
    setStreamingText("");

    const response = getResponse(trimmed);
    const question = trimmed;

    cleanupRef.current = streamResponse(
      response,
      (char) => {
        setStreamingText((prev) => prev + char);
      },
      () => {
        setExchanges((prev) => [...prev, { question, answer: response }]);
        setStreamingText("");
        setIsStreaming(false);
        cleanupRef.current = null;
        inputRef.current?.focus();
      },
    );
  }, [input, isStreaming, onMessageCountChange]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const latestExchange =
    exchanges.length > 0 ? exchanges[exchanges.length - 1] : null;
  const collapsedExchanges = exchanges.slice(0, -1);

  return (
    <div ref={scrollRef} className="max-h-[70vh] overflow-y-auto p-8 font-mono">
      {/* Bio or collapsed whoami */}
      <AnimatePresence mode="wait">
        {showBio ? (
          <motion.div
            key="bio"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="text-sm text-text-secondary mb-6">$ whoami</div>
            <div className="space-y-5">
              <h1 className="text-4xl font-bold tracking-tight text-text-primary sm:text-5xl">
                Devin Bartley
              </h1>
              <p className="text-lg text-accent-green">
                Manager, AI &amp; Innovation | Deloitte
              </p>
              <div className="max-w-2xl font-sans space-y-4">
                <p className="text-sm leading-relaxed text-text-secondary">
                  Almost two decades building and rebuilding how organizations
                  go to market across Wall Street, big law, advocacy, and
                  business services environments. I&apos;ve led strategy, owned
                  transformation, and built the systems behind it.
                </p>
                <p className="text-base text-text-primary font-medium border-l-2 border-accent-green pl-3">
                  Most people sit on one side of that line. I don&apos;t.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="rounded-lg bg-bg-tertiary p-4">
                    <p className="font-mono text-xs text-accent-cyan mb-1.5">Strategy</p>
                    <p className="text-sm text-text-secondary">
                      I understand how the business is supposed to work. Growth
                      models, GTM design, operating structure.
                    </p>
                  </div>
                  <div className="rounded-lg bg-bg-tertiary p-4">
                    <p className="font-mono text-xs text-accent-purple mb-1.5">Systems</p>
                    <p className="text-sm text-text-secondary">
                      And I build the systems that actually make it work. Data,
                      orchestration, AI, infrastructure.
                    </p>
                  </div>
                </div>
                <p className="text-sm leading-relaxed text-text-secondary">
                  A lot of what passes as strategy breaks the second it hits
                  execution. A lot of what gets built technically works, but has
                  nothing to do with the business it&apos;s supposed to serve.
                </p>
                <p className="text-sm text-text-primary">
                  I&apos;m not interested in either.
                </p>
                <p className="text-sm leading-relaxed text-text-secondary">
                  I spend my time in that gap. Taking ideas, pushing on them,
                  seeing if they actually hold up, then turning them into
                  systems that run.
                </p>
                <p className="text-sm leading-relaxed text-text-secondary">
                  Lately that&apos;s AI, agents, cognitive architectures. Not
                  as concepts. As things built end to end.
                </p>
                <p className="text-base text-text-primary font-medium">
                  Built with AI. One person.
                </p>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="collapsed-bio"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
          >
            <CollapsedExchange
              question="whoami"
              answerPreview="Devin Bartley | Manager, AI & Innovation | Deloitte"
              isWhoami
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Collapsed older exchanges */}
      {collapsedExchanges.map((ex, i) => (
        <div key={i} className="mt-1">
          <CollapsedExchange
            question={ex.question}
            answerPreview={
              ex.answer.length > 80
                ? ex.answer.slice(0, 80) + "..."
                : ex.answer
            }
          />
        </div>
      ))}

      {/* Latest full exchange */}
      {latestExchange && !isStreaming && (
        <div className="mt-4">
          <div className="text-text-secondary text-sm">
            <span className="text-accent-green">❯</span> {latestExchange.question}
          </div>
          <ChatMessage text={latestExchange.answer} isStreaming={false} />
        </div>
      )}

      {/* Currently streaming exchange */}
      {isStreaming && (
        <div className="mt-4">
          <div className="text-text-secondary text-sm">
            <span className="text-accent-green">❯</span> {input || exchanges.length > 0 ? "" : ""}{exchanges.length > 0 || streamingText ? "" : ""}{/* question shown via the last submitted input */}
          </div>
          <ChatMessage text={streamingText} isStreaming />
        </div>
      )}

      {/* Input prompt */}
      <div className="border-t border-border pt-3 mt-4">
        <div className="flex items-center gap-2">
          <span className="text-accent-green shrink-0">❯</span>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isIdle ? "Ask anything about what I build..." : ""}
            disabled={isStreaming}
            className="flex-1 bg-transparent border-none outline-none text-text-primary font-mono text-sm placeholder:text-text-tertiary disabled:opacity-50"
          />
          {isIdle && (
            <span className="cursor-blink text-accent-green">▊</span>
          )}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Fix the streaming question display**

The streaming state needs to track which question is being answered. Update the component: add a `currentQuestion` state that's set on submit and displayed during streaming.

In the `handleSubmit` callback, before the streaming starts, add:

```tsx
// Add to state declarations at top:
const [currentQuestion, setCurrentQuestion] = useState("");

// In handleSubmit, before streamResponse call:
setCurrentQuestion(question);

// In the streaming render section, replace the empty div with:
{isStreaming && (
  <div className="mt-4">
    <div className="text-text-secondary text-sm">
      <span className="text-accent-green">❯</span> {currentQuestion}
    </div>
    <ChatMessage text={streamingText} isStreaming />
  </div>
)}
```

- [ ] **Step 3: Verify the file compiles**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add src/components/TerminalChat.tsx
git commit -m "feat: add TerminalChat state machine with mock streaming"
```

---

### Task 6: Wire HeroSection to TerminalChat

**Files:**
- Modify: `src/sections/HeroSection.tsx`

- [ ] **Step 1: Replace HeroSection with TerminalChat wrapper**

Replace the entire file:

```tsx
// src/sections/HeroSection.tsx
"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import TerminalHeader from "@/components/TerminalHeader";
import TerminalChat from "@/components/TerminalChat";

export default function HeroSection() {
  const [messageCount, setMessageCount] = useState(0);

  const handleMessageCountChange = useCallback((count: number) => {
    setMessageCount(count);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2 }}
      className="overflow-hidden rounded-xl border border-border bg-bg-secondary"
    >
      <TerminalHeader messageCount={messageCount} />
      <TerminalChat onMessageCountChange={handleMessageCountChange} />
    </motion.div>
  );
}
```

- [ ] **Step 2: Verify the file compiles**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Run the dev server and test**

Run: `npm run dev`

Test the three states:
1. **Idle**: Page loads with full bio + blinking prompt at bottom
2. **Active**: Type "Tell me about the mesh" + Enter. Bio collapses, response streams with green border
3. **Multi-turn**: Ask another question. First exchange collapses to one-liner
4. **Clear**: Type "clear" + Enter. Bio restores

- [ ] **Step 4: Commit**

```bash
git add src/sections/HeroSection.tsx
git commit -m "feat: wire HeroSection to TerminalChat, terminal is now interactive"
```

---

### Task 7: Polish and Edge Cases

**Files:**
- Modify: `src/components/TerminalChat.tsx`

- [ ] **Step 1: Remove the "Scroll to explore or ask the chatbot anything" line**

The old hero had this prompt text. It's no longer needed since the terminal input IS the chatbot. Verify it's not in `TerminalChat.tsx` (it shouldn't be, since we rewrote HeroSection). If the page.tsx still references it anywhere, remove it.

- [ ] **Step 2: Add smooth scroll behavior to the terminal body**

Add `scroll-smooth` to the scrollRef div className:

```tsx
<div ref={scrollRef} className="max-h-[70vh] overflow-y-auto scroll-smooth p-8 font-mono">
```

- [ ] **Step 3: Build and verify**

Run: `npm run build`
Expected: Clean build, no errors

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: polish terminal chat — smooth scroll, cleanup"
```
