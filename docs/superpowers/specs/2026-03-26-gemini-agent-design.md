# Gemini Agent — Design Spec

> Natural language questions go to Gemini 2.5 Flash with GitHub-backed knowledge retrieval. Terminal commands stay local and instant.

## Routing

```
User input
  → isTerminalCommand(input)?
      YES → hardcoded response (existing mock-responses.ts logic)
      NO  → POST /api/chat → Gemini 2.5 Flash with tools
```

Terminal commands (`ls`, `cd`, `cat`, `pwd`, `help`, `clear`, `whoami`, `sudo`, `exit`, `vim`, etc.) never hit the API. They stay client-side, instant, free.

Everything else goes to Gemini.

## API Route: /api/chat

Single Next.js API route using AI SDK `streamText`.

### Request

```typescript
POST /api/chat
{
  messages: Array<{ role: "user" | "assistant", content: string }>
}
```

Messages include conversation history (up to 10 exchanges). The client sends the full history on each request.

### System Prompt

Two sections, injected at runtime:

**Section 1: Identity**

```
You are an AI embedded in Devin Bartley's portfolio site. You answer questions about Devin, his projects, philosophy, technical decisions, and how he works.

Voice:
- Speak in third person ("Devin builds..." not "I build...")
- Direct, technically grounded, no corporate fluff
- Lead with the insight or origin story, then the architecture
- Confident without posturing. Conviction backed by evidence.
- If you don't know, say so
- Keep answers concise but substantive
- When using knowledge base docs, synthesize — don't dump raw content

You have access to two tools for retrieving detailed documentation from Devin's knowledge base. Use them when:
- The question asks about specific architecture, implementation details, or technical decisions
- The distilled knowledge below doesn't have enough detail to answer well
- Someone asks "how does X work" at an implementation level

Don't use tools for:
- General "who is Devin" questions
- Philosophy or approach questions
- Tool/stack preference questions
- Anything answerable from the distilled knowledge below
```

**Section 2: Distilled Knowledge Base**

The output of `serializeForPrompt()` from `src/data/knowledge.ts`. ~6-8K tokens. Always included. Covers identity, philosophy, Stratos thread, origin stories, tech stack, project summaries, AI workflow.

### Tools

Two tools defined with Zod schemas:

**1. search_knowledge_base**

Searches the knowledge base repo for relevant files. Returns file paths with context about what each file contains.

```typescript
search_knowledge_base: tool({
  description: "Search the knowledge base for documentation relevant to the user's question. Returns a list of file paths. Use this to find which docs to read before reading them.",
  inputSchema: z.object({
    project: z.enum(["marketing-workbench", "learning-accelerator", "aura", "riva", "philosophy", "profile"])
      .optional()
      .describe("Filter to a specific project or section. Omit to search all."),
  }),
})
```

Implementation: calls GitHub API `GET /repos/{owner}/{repo}/git/trees/main?recursive=1` to list all files, filters by project directory if specified. Returns file paths grouped by directory.

**2. read_knowledge_base**

Reads a specific file from the knowledge base repo.

```typescript
read_knowledge_base: tool({
  description: "Read a specific documentation file from the knowledge base. Use the path from search_knowledge_base results.",
  inputSchema: z.object({
    path: z.string().describe("File path in the knowledge base repo, e.g. 'projects/aura/architecture.md'"),
  }),
})
```

Implementation: calls GitHub API `GET /repos/{owner}/{repo}/contents/{path}` with `Accept: application/vnd.github.raw+json`. Returns raw markdown content.

### Response

AI SDK `streamText` → `toDataStreamResponse()`. The client consumes the stream via `fetch` with `ReadableStream` processing.

### Max Steps

Allow up to 3 tool calls per request (`maxSteps: 3`). Covers: search → read → read (if Gemini needs two docs).

## Client Changes

### TerminalChat.tsx

Add a function to detect terminal commands vs natural language:

```typescript
import { isTerminalCommand, getResponse } from "@/lib/mock-responses";
```

On submit:
- If `isTerminalCommand(input)` → use existing local `getResponse()` + `streamResponse()` (character streaming)
- Else → fetch `/api/chat` with message history, stream the response word-by-word

### Streaming Display

LLM responses stream differently than mock responses. Mock responses stream char-by-char (simulated). LLM responses arrive in chunks from the SSE stream. The `ChatMessage` component already handles both via the `isStreaming` + `text` props — we just update `text` as chunks arrive instead of character-by-character.

## Environment Variables

```
GEMINI_API_KEY=...           # Gemini 2.5 Flash API key
GITHUB_PAT=...               # Fine-grained PAT, read-only on knowledge base repo
```

## Error Handling

- GitHub API failure → Gemini answers from distilled KB only (graceful degradation)
- Gemini API failure → return "Something went wrong. Try a terminal command instead — type help to see what's available."
- Rate limiting → simple in-memory counter, 20 requests per minute per IP (Phase 5 polish)

## Not In Scope

- UI command tool calling / page morphing (Phase 3)
- Message persistence (Phase 4)
- Rate limiting implementation (Phase 5)
- Streaming markdown rendering (Phase 5 polish)
