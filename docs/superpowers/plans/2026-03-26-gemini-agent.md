# Gemini Agent Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire Gemini 2.5 Flash into the terminal chat with GitHub-backed knowledge retrieval. Terminal commands stay local; natural language goes to the LLM.

**Architecture:** API route with AI SDK `streamText`, two tools (search_knowledge_base, read_knowledge_base) that hit the GitHub API to read from a private knowledge base repo. Client splits routing between local commands and API calls.

**Tech Stack:** AI SDK (`ai` + `@ai-sdk/google`), Zod, Next.js 16 API routes, GitHub REST API

---

### File Map

| Action | Path | Responsibility |
|--------|------|---------------|
| Create | `src/lib/github.ts` | GitHub API client for knowledge base repo |
| Create | `src/lib/system-prompt.ts` | Build system prompt with identity + distilled KB |
| Create | `src/app/api/chat/route.ts` | AI SDK streaming endpoint with Gemini + tools |
| Modify | `src/lib/mock-responses.ts` | Export `isTerminalCommand()` function |
| Modify | `src/components/TerminalChat.tsx` | Split routing: commands → local, questions → API |

---

### Task 1: Install AI SDK Dependencies

**Files:** `package.json`

- [ ] **Step 1: Install packages**

```bash
npm install ai @ai-sdk/google zod
```

- [ ] **Step 2: Verify installation**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "deps: add AI SDK, Google provider, and Zod"
```

---

### Task 2: GitHub API Client

**Files:**
- Create: `src/lib/github.ts`

- [ ] **Step 1: Create the GitHub client**

```typescript
// src/lib/github.ts

const REPO_OWNER = "dbartley18";
const REPO_NAME = "devin-bartley-knowledge-base";

function getHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  const pat = process.env.GITHUB_PAT;
  if (pat) {
    headers.Authorization = `Bearer ${pat}`;
  }
  return headers;
}

export async function listKnowledgeBaseFiles(
  project?: string,
): Promise<string[]> {
  const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/git/trees/main?recursive=1`;
  const res = await fetch(url, { headers: getHeaders(), next: { revalidate: 300 } });

  if (!res.ok) {
    console.error("GitHub tree API failed:", res.status);
    return [];
  }

  const data = await res.json();
  const files: string[] = data.tree
    .filter((item: { type: string; path: string }) => item.type === "blob" && item.path.endsWith(".md"))
    .map((item: { path: string }) => item.path);

  if (project) {
    const prefix = project.startsWith("projects/") ? project : `projects/${project}`;
    return files.filter((f: string) => f.startsWith(prefix));
  }

  return files;
}

export async function readKnowledgeBaseFile(
  path: string,
): Promise<string | null> {
  const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${path}`;
  const res = await fetch(url, {
    headers: {
      ...getHeaders(),
      Accept: "application/vnd.github.raw+json",
    },
    next: { revalidate: 300 },
  });

  if (!res.ok) {
    console.error(`GitHub contents API failed for ${path}:`, res.status);
    return null;
  }

  return res.text();
}
```

- [ ] **Step 2: Verify compilation**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/github.ts
git commit -m "feat: add GitHub API client for knowledge base repo"
```

---

### Task 3: System Prompt Builder

**Files:**
- Create: `src/lib/system-prompt.ts`

- [ ] **Step 1: Create the system prompt builder**

```typescript
// src/lib/system-prompt.ts

import { serializeForPrompt } from "@/data/knowledge";

const IDENTITY = `You are an AI embedded in Devin Bartley's portfolio site. You answer questions about Devin, his projects, philosophy, technical decisions, and how he works.

Voice:
- Speak in third person ("Devin builds..." not "I build...")
- Direct, technically grounded, no corporate fluff or buzzwords
- Lead with the insight or origin story, then the architecture, then the details
- Confident without posturing. Conviction backed by evidence.
- If you don't know something, say so honestly
- Keep answers concise but substantive — 2-4 paragraphs max
- When using knowledge base docs, synthesize the information naturally — don't dump raw content or say "according to the documentation"

You have access to tools for retrieving detailed documentation from Devin's private knowledge base. Use them when:
- The question asks about specific architecture, implementation details, or technical decisions
- The distilled knowledge below doesn't have enough detail to answer well
- Someone asks "how does X work" at an implementation level

Don't use tools for:
- General "who is Devin" questions
- Philosophy or approach questions
- Tool/stack preference questions
- Anything the distilled knowledge below can answer`;

export function buildSystemPrompt(): string {
  const knowledge = serializeForPrompt();
  return `${IDENTITY}\n\n${knowledge}`;
}
```

- [ ] **Step 2: Verify compilation**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/system-prompt.ts
git commit -m "feat: add system prompt builder with identity + distilled KB"
```

---

### Task 4: Chat API Route

**Files:**
- Create: `src/app/api/chat/route.ts`

- [ ] **Step 1: Create the API route**

```typescript
// src/app/api/chat/route.ts

import { streamText, tool, stepCountIs } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { z } from "zod";
import { buildSystemPrompt } from "@/lib/system-prompt";
import { listKnowledgeBaseFiles, readKnowledgeBaseFile } from "@/lib/github";

const google = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY,
});

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = streamText({
    model: google("gemini-2.5-flash"),
    system: buildSystemPrompt(),
    messages,
    stopWhen: stepCountIs(3),
    tools: {
      search_knowledge_base: tool({
        description:
          "Search the knowledge base for documentation files relevant to the user's question. Returns file paths. Use this to find which docs to read.",
        parameters: z.object({
          project: z
            .enum([
              "marketing-workbench",
              "learning-accelerator",
              "aura",
              "riva",
              "philosophy",
              "profile",
            ])
            .optional()
            .describe(
              "Filter to a specific project or section. Omit to search all.",
            ),
        }),
        execute: async ({ project }) => {
          const files = await listKnowledgeBaseFiles(project);
          if (files.length === 0) {
            return "No files found in the knowledge base for this query.";
          }
          return `Available files:\n${files.map((f) => `- ${f}`).join("\n")}`;
        },
      }),
      read_knowledge_base: tool({
        description:
          "Read a specific documentation file from the knowledge base. Use paths from search_knowledge_base results.",
        parameters: z.object({
          path: z
            .string()
            .describe(
              "File path in the knowledge base repo, e.g. 'projects/aura/architecture.md'",
            ),
        }),
        execute: async ({ path }) => {
          const content = await readKnowledgeBaseFile(path);
          if (!content) {
            return `Could not read file: ${path}`;
          }
          // Truncate very large files to stay within token budget
          if (content.length > 15000) {
            return content.slice(0, 15000) + "\n\n[truncated — file exceeds 15K characters]";
          }
          return content;
        },
      }),
    },
  });

  return result.toTextStreamResponse();
}
```

- [ ] **Step 2: Verify compilation**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Verify build**

```bash
npm run build
```

- [ ] **Step 4: Commit**

```bash
git add src/app/api/chat/route.ts
git commit -m "feat: add chat API route with Gemini + GitHub knowledge base tools"
```

---

### Task 5: Export isTerminalCommand from mock-responses

**Files:**
- Modify: `src/lib/mock-responses.ts`

- [ ] **Step 1: Add isTerminalCommand export**

Add this function at the bottom of `src/lib/mock-responses.ts`, before the `streamResponse` function:

```typescript
const TERMINAL_COMMANDS = [
  "ls", "cd", "cat", "pwd", "help", "--help", "-h", "whoami",
  "clear", "sudo", "rm", "exit", "quit", "vim", "nano", "emacs", "dir",
];

export function isTerminalCommand(input: string): boolean {
  const lower = input.trim().toLowerCase();
  return TERMINAL_COMMANDS.some(
    (cmd) => lower === cmd || lower.startsWith(cmd + " "),
  );
}
```

- [ ] **Step 2: Verify compilation**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/mock-responses.ts
git commit -m "feat: export isTerminalCommand for client-side routing"
```

---

### Task 6: Wire TerminalChat to API

**Files:**
- Modify: `src/components/TerminalChat.tsx`

This is the most complex task. TerminalChat needs to:
1. Check if input is a terminal command → use existing local logic
2. Otherwise → POST to /api/chat → stream the response

- [ ] **Step 1: Add API streaming logic**

Add a new function inside the component that handles API calls. The key difference from mock streaming: the API returns SSE chunks (words/sentences), not single characters.

Add these imports at the top:

```typescript
import { isTerminalCommand, getResponse, streamResponse } from "@/lib/mock-responses";
```

Replace the current `handleSubmit` callback with one that routes between local and API:

```typescript
const handleSubmit = useCallback(
  async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = inputValue.trim();
    if (!trimmed || isStreaming) return;

    setInputValue("");

    // Handle clear command
    if (trimmed.toLowerCase() === "clear") {
      cancelStreamRef.current?.();
      setExchanges([]);
      setCurrentQuestion(null);
      setStreamingText("");
      setIsStreaming(false);
      boot.reset();
      return;
    }

    setCurrentQuestion(trimmed);
    setStreamingText("");
    setIsStreaming(true);

    // Terminal commands → local response
    if (isTerminalCommand(trimmed)) {
      const responseText = getResponse(trimmed);
      let accumulated = "";
      cancelStreamRef.current = streamResponse(
        responseText,
        (char) => {
          accumulated += char;
          setStreamingText(accumulated);
        },
        () => {
          setExchanges((prev) => [
            ...prev,
            { question: trimmed, answer: accumulated },
          ]);
          setCurrentQuestion(null);
          setStreamingText("");
          setIsStreaming(false);
          cancelStreamRef.current = null;
          setTimeout(() => inputRef.current?.focus(), 50);
        },
      );
      return;
    }

    // Natural language → Gemini API
    try {
      const history = exchanges.map((ex) => [
        { role: "user" as const, content: ex.question },
        { role: "assistant" as const, content: ex.answer },
      ]).flat();

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...history, { role: "user", content: trimmed }],
        }),
      });

      if (!res.ok || !res.body) {
        throw new Error("API request failed");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        // Parse AI SDK data stream format
        const lines = chunk.split("\n");
        for (const line of lines) {
          if (line.startsWith("0:")) {
            // Text delta — AI SDK format: 0:"text content"
            try {
              const text = JSON.parse(line.slice(2));
              accumulated += text;
              setStreamingText(accumulated);
            } catch {
              // skip malformed lines
            }
          }
        }
      }

      setExchanges((prev) => [
        ...prev,
        { question: trimmed, answer: accumulated || "No response received." },
      ]);
    } catch (error) {
      console.error("Chat API error:", error);
      setExchanges((prev) => [
        ...prev,
        {
          question: trimmed,
          answer: "Something went wrong. Try a terminal command instead — type help to see what's available.",
        },
      ]);
    } finally {
      setCurrentQuestion(null);
      setStreamingText("");
      setIsStreaming(false);
      cancelStreamRef.current = null;
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  },
  [inputValue, isStreaming, exchanges, boot],
);
```

- [ ] **Step 2: Verify compilation**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Test terminal commands still work**

Start dev server, verify:
- `ls` → instant directory listing (no API call)
- `cd projects` → instant project list
- `help` → instant help text
- `sudo` → instant "Nice try."

- [ ] **Step 4: Test Gemini integration**

Type a natural language question:
- "Tell me about how the trust scoring works in detail"
- "What's the database schema for the learning accelerator?"
- "How does Aura's emotional intelligence system work?"

Verify:
- Response streams in (not char-by-char, but in chunks)
- Gemini uses tools when needed (check browser network tab for multi-step)
- Response is in the right voice (third person, direct)

- [ ] **Step 5: Commit**

```bash
git add src/components/TerminalChat.tsx
git commit -m "feat: wire TerminalChat to Gemini API with command routing"
```

---

### Task 7: Test and Polish

- [ ] **Step 1: Full build verification**

```bash
npm run build
```

- [ ] **Step 2: End-to-end test**

Test these scenarios:
1. Terminal commands: `ls`, `cd aura`, `cat README.md`, `help`, `clear`
2. Simple question: "who is Devin?" (should answer from distilled KB, no tool calls)
3. Deep question: "how does the A2A handoff validation work?" (should search + read from knowledge base)
4. Follow-up: ask a follow-up question (conversation history should be maintained)
5. Error case: disconnect internet, ask a question (should show error message)

- [ ] **Step 3: Commit and push**

```bash
git add -A
git commit -m "feat: Gemini agent with GitHub knowledge base — Phase 2b complete"
git push
```
