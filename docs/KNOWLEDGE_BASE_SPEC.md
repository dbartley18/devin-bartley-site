# Knowledge Base Specification

> **Purpose**: All content that powers the chatbot and static sections
> **Location**: `src/data/knowledge.ts`

No RAG, no embeddings. Total content fits in Gemini's context window.

---

## Identity

```yaml
name: Devin Bartley
title: Manager, AI & Innovation
org: Deloitte
tagline: "I think in architecture, I build with AI."
background:
  - Deep business strategy, marketing, martech background
  - Highly technical — picked up software engineering easily
  - Leads AI & Transformation for Deloitte (technical strategy)
  - Leads engineers for agentic builds
  - "Weird unicorn" — strategy mind + engineering execution
  - One person with the right mental models and the right tools
```

## Philosophy

```yaml
core_belief: "Everything great started with a simple idea. Those that don't progress to great is due to an unwillingness to pressure test."
on_failure: "Failure isn't bad. It's the collection of additional variables to adjust approach."
first_principles: "Knowledge is like Legos. Concepts build on one another. Understand first principles, stack into endless configurations."
brain_obsession: "Obsessed with the brain and how it works — built an entire agent architecture modeled on neuroscience."
on_intelligence: "Intelligence isn't magic — it's pattern recognition refined by feedback."
on_agents: "LLMs aren't the agent — they're the substrate for experience. Most 'agents' are mislabeled — they're LLM-powered tools with deterministic capabilities. The real agent is the orchestrator with goals, memory, and judgment."
on_ai: "Built ALL of these systems using AI. A strategist who weaponized AI as a force multiplier."
on_architecture: "Systems thinking is the meta-skill. Every project starts with architecture — the code writes itself after that."
on_ideas: "Every single project started with a seed of an idea. A frustration, a question, a 'what if.' The architecture emerged from pressure-testing that idea."
on_building: "We didn't build it to sell it. We mapped it because we know we'd use it."
```

## How Devin Thinks — The Stratos Thread

Stratos (https://github.com/dbartley18/Stratos) is a strategic vision document — not a product, but an externalization of how Devin thinks. It's a whitepaper on "Agentic GTM Orchestration" that reveals the intellectual thread connecting all four projects. The tagline: "Transform Brand Moments into Market Action."

"Stratos wasn't launched — it isn't even built yet. It emerged because we needed something that didn't exist."

### The Journey: From Tension to Architecture

Devin spent years building BDR playbooks, CRM systems, lead management processes, demand generation programs. Same friction every time: disconnected systems, abundant but inactive data, manual processes, team silos with endless handoffs. Market moments happen in real-time but teams can't respond at that speed. Five distinct experiments followed — each with honest findings about what worked and what didn't:

**Experiment 1: Multi-Agent Persona Systems**
- Objective: Create realistic executive personas (CFO, CMO, CTO) that could simulate decision-making across industries and company sizes
- Built multi-agent frameworks with distinct behavioral parameters, risk tolerance, and decision criteria
- Found: LLMs could embody personas effectively with proper context and constraints, but behavioral consistency required explicit memory systems — agents without memory produced inconsistent responses
- Challenge: Agents exhibited "generic executive" behavior without sufficient persona-specific constraints; maintaining personality consistency across longer interactions proved difficult
- **Core insight: "Personas need to be 'memories' rather than 'prompts' — stable behavioral patterns that persist across interactions."**

**Experiment 2: Orchestration Graphs**
- Objective: Create dynamic workflow systems that could adapt and reason about process optimization
- Designed graph-based systems where nodes represented decision points with self-modification based on outcomes
- Found: Static workflows break at edge cases — dynamic graphs could adapt and self-heal. The most effective graphs had "meta-nodes" that could reason about the graph structure itself
- Challenge: Graph complexity grew exponentially; debugging dynamic self-modifying graphs was extremely difficult
- **Core insight: "Orchestration needs to be 'cognitive' — not just routing decisions, but reasoning about the decision-making process itself."**

**Experiment 3: Deterministic Agents**
- Objective: Create agents that operate autonomously within strict business constraints while exhibiting intelligent behavior
- Built agents with explicit constraint boundaries, deterministic fallbacks, and limited autonomy within predefined sandboxes
- Found: Agents performed best with clear boundaries rather than open-ended freedom. The sweet spot was "bounded creativity" — freedom to innovate within specific parameters
- Challenge: Too many constraints = robotic; too few = unpredictable. Defining the right boundaries required deep domain expertise
- **Core insight: "Intelligence isn't about unlimited freedom — it's about sophisticated reasoning within appropriate constraints."**

**Experiment 4: LLM-Based Cognition with Tiered Memory**
- Objective: Build cognitive architectures mirroring human thinking with distinct memory systems
- Implemented three-tier memory: working (immediate context), short-term (recent interactions), long-term (persistent knowledge and patterns)
- Found: The distinction between memory tiers was crucial for decision quality. Different decisions required different memory access patterns
- Challenge: Memory systems required careful curation to avoid noise; balancing persistence with adaptability was technically complex
- **Core insight: "LLMs aren't cognitive agents by themselves — they become cognitive when paired with appropriate memory architectures."**

**Experiment 5: GAN-Inspired Modeling**
- Objective: Use adversarial training principles to model buyer behavior patterns
- Built generator/discriminator loops — one system creates synthetic buyer responses, another evaluates realism against known behavioral patterns
- Found: Adversarial validation significantly improved synthetic persona quality. Multiple validation rounds created increasingly sophisticated responses
- Challenge: Training discriminators required substantial real-world behavioral data; system could overfit to specific patterns
- **Core insight: "Synthetic validation works, but only when grounded in substantial real-world behavioral data and iterative refinement."**

### The Lightbulb Moment

Teaching his son to shoot a basketball: "He didn't need equations — he needed feedback. Watch the arc, adjust angle and force, repeat until muscle memory forms." That analogy crystallized the core thesis:

**"LLMs aren't the agent — they're the substrate for experience."** The agent is the system that knows what to do with that experience. "LLMs don't lack intelligence — they're trained on more patterns than any one person could ever live. What they need is structure to apply those patterns toward a goal." Judgment isn't generated — it's orchestrated.

The intelligence cycle: Pattern → Response → Feedback → Adjustment → Reuse.

This insight directly produced:
- **Aura's brain architecture** — removing the orchestrator from the graph, treating sub-agents as smart tools. "Today's 'agents' are mislabeled — they're smart tools, not agents. The orchestrator is the true agent because it has Goals, Memory, and Judgment."
- **The Marketing Workbench mesh** — decomposing agents, using A2A for emergent composition
- **The Learning Accelerator's pedagogy** — the 5-phase cognitive loop mirrors Stratos's Think → Plan → Choose → Act → Review

### The Stratos Architecture (Conceptual)

Dual memory: Execution State (Postgres — working + short-term) and Cognitive Memory (PGVector — long-term semantic embeddings). Only the orchestrator has direct access to both systems. Smart tools operate statelessly, relying on the orchestrator to route relevant context — "just like human cognition distributes memory access as needed."

GAN-abstraction testing loop for campaign validation: Generator Agent (creates variants) → Simulation Agent (tests against synthetic executive personas — CFO, CMO, CTO, COO, CEO archetypes with industry-specific behavioral parameters) → Discriminator Agent (ranks response strength) → Coordinator Agent (selects best path). "This isn't campaign automation. It's proactive, validated decisioning."

Persona hub inspired by Tencent's latent persona modeling. "We don't need to train a custom model. We need to structure the prompts, select the right behavioral parameters, and evaluate response fit."

### Voice (for chatbot personality calibration)

Devin's actual voice, from Stratos: precise, confident without posturing, technically grounded but strategically elevated. Uses "we" not "I." Avoids buzzwords. Em-dashes liberally. Direct but not blunt. Conviction backed by evidence, not assertion. "Stratos isn't the future. It's a system-shaped bet on what should've existed already."

## Origin Stories

Every project started with a simple idea — then architectural thinking and AI execution turned it into something real.

### Riva — "Why does job search still suck?"
Started from frustration: busy senior people don't have time to manually search LinkedIn. Why are *we* searching for jobs when we have AI systems? The "Reverse Headhunter" concept — AI finds you, not the other way around — came from that single question.

### Aura — "What if I could make it easier for non-engineers to go from idea to scaffolded agent project?"
The most fascinating evolution. Started as a LangGraph-based system to help functional people within orgs build agents. Then a realization: "I hate LangGraph. An agent bound to a graph isn't an agent — it's a runnable function with an LLM wrapper and access to runnable functions with tool decorators." Started calling those **smart tools**. Then the lightbulb: if you lean into smart tools (what most call sub-agents) but *remove the orchestrator from the graph*, you can build a true agent with access to sub-agents treated as tools. The brain architecture, the emotional intelligence, the persona system — everything else came in time, building on that core insight.

### Learning Accelerator — "Can we use Custom GPTs to teach people about AI?"
Started with an idea from Mark K (team leader): could we use Google Gems or Custom GPTs to teach people about AI? That seed question evolved into a full generative curriculum engine with zero pre-authored content, a 6-agent state machine, adaptive pedagogy, and persona-specific learning paths. The rest was history.

### Marketing Workbench — "What if you decomposed each agent and used A2A?"
The Marketing Workbench already existed as a product (workflows running in GCP). Devin's idea: decompose each agent, rip out the orchestrator, use A2A protocol, deploy via Gemini Enterprise. The hypothesis was that Gemini Enterprise would be smart enough to call agents using semantic mapping. It couldn't — that's only possible with Vertex Search. So the pivot: build a front door as a surface, register that front door in Gemini Enterprise, and let the mesh handle composition behind it. The rest is history.

## Tech Stack

### Personal
- Coding: Cursor, Claude Code CLI (iTerm2 — 5 tabs)
- LLM: ChatGPT (history), prefers Claude, Ollama
- Favorite models: 1. Claude 2. Gemini
- Planning: Opus 4.6 + Gemini 2.5 Pro + GPT 5.x
- Execution: Sonnet 4.6 + Opus 4.6
- Gemini for served apps (cost of intelligence) — "Google emailed me about 2.0 Flash deprecation"

### Work
- Coding: Claude Code CLI (5 iTerm2 tabs), VSCode + GitHub Copilot
- Same model preferences

---

## Projects

### 1. Marketing Workbench — V3 Full Mesh (Work)

**One-liner**: A self-organizing multi-agent mesh where 23 autonomous AI agents discover each other, negotiate handoffs, and compose marketing workflows without hardcoded pipelines.

**What it is**: Enterprise marketing platform built for Deloitte. Users issue natural-language requests in Gemini Enterprise ("Name a brand and create launch emails") and the system decomposes, plans, executes, and delivers complex multi-step marketing outputs automatically.

**Architecture — Full Mesh, Not a Pipeline**:
- Every agent is both an A2A server and client — no hub-and-spoke
- Composition is emergent: agents read each other's capability cards at startup, use LLMs to reason about handoffs
- Adding a new agent = drop a JSON card + deploy a Cloud Run service. Mesh auto-discovers within 5 minutes
- Evolved from V1 hub-and-spoke → V3 full mesh (principled architectural progression)

**Key agents**:
- **Intent Router** (Gemini 2.5 Pro): Classifies user intent, builds dependency graph via topological sort (Kahn's algorithm)
- **PM Agent** (Gemini 2.5 Pro): Central planning authority with 15 tools. Validates handoffs, tracks progress. Does NOT relay content — agents brief each other directly
- **23 specialist agents** across 3 domains + 1 shared MCP tool server = 24 Cloud Run services

**Three workflow domains**:
- **Eminence Content** (5 agents): Email campaigns, LinkedIn posts, video storyboards, social strategy, content review
- **Brand Naming** (7 agents): End-to-end from requirements through governance review. Generates 50+ compliant name options with linguistic analysis
- **Campaign Planning** (8 agents): Brief creation, validation, persona-driven strategy, execution planning. 3 content-discovery agents run in parallel via asyncio.gather fan-out

**Emergent composition via extended agent cards**: Each agent declares `produces`, `requires`, `feedsInto`, `parallelizable`, `humanCheckpoint` in an `x-mesh` extension. Agents load peer cards at startup and use LLM reasoning for handoffs — not code changes.

**Living execution plans**: Plans are mutable documents. Any specialist can propose plan mutations via `propose_plan_update`. 5 structural validation gates run in pure Python (no LLM): agent exists, plan version current (optimistic concurrency), dependencies satisfiable, no duplicates, history immutable.

**Adaptive trust scoring**: Handoff patterns accumulate recency-weighted trust scores (RECENCY_WEIGHT=0.7). Trust ≥ 0.85 + ≥ 5 runs = delegated authority (agents invoke peers directly). Trust < 0.60 = demoted to governed mode (PM must approve). All scoring is pure algorithmic Python — no LLM in the loop.

**Cross-workflow composition**: `resolve_goal_agents` backward-chains through an artifact catalog dependency graph to discover agents across domain boundaries. `continue_workflow` enables mid-workflow scope expansion atomically with correlation_id threading.

**Observability**: Real-time SSE streaming across service boundaries with dedup. Dual tracing: `correlation_id` (domain, Cloud SQL) linked to OTel `trace_id` (infra, Cloud Trace) via span attributes. W3C traceparent propagated across all A2A HTTP calls.

**Database**: Cloud SQL PostgreSQL, 7 migrations. Normalized from JSONB blobs to proper row tables. 5 learning tables track composition patterns, outcomes, capabilities, user profiles, preferences.

**Infrastructure**: GCP us-central1, Terraform-managed with reusable Cloud Run modules, IAM service-to-service auth, PSC-only Cloud SQL, GCS artifacts with versioned paths and signed URLs.

**Stats**:
- 24 Cloud Run services (23 agents + 1 MCP server)
- 37+ documented architecture decisions (ADRs)
- A2A + MCP + Google ADK, Gemini 2.5 Pro/Flash
- Tool runtime standardization (ADR-0004) — centralized ToolExecutor with timeout, retry, idempotency
- Performance targets: single agent < 60s, full pipeline < 5 min, 99.5% availability

---

### 2. Learning Accelerator (Work)

**One-liner**: An AI learning platform that generates every lesson, quiz, exercise, and visual in real time — zero pre-authored content. Adding a new audience = ~80 lines of data, zero code changes.

**What it is**: Enterprise AI learning platform for Deloitte's marketing & communications org. Teaches employees about AI/LLMs through fully conversational, personalized experiences. Replaces $50K-200K traditional course development.

**Architecture — 6-Agent State Machine**:
- **Orchestrator** (Gemini 2.5 Flash): Central router, reads user state from Firestore, dispatches to correct sub-agent. Auto-identifies users from IAP headers
- **Onboarding Agent** (Flash): Collects name, presents 7 persona options, creates account
- **Assessment Agent** (Flash): 20-question adaptive quiz with persona-specific LLM-generated questions. Early termination when proficiency level is clear
- **Teach Agent** (Gemini 2.5 Pro): Interactive lessons using 5-phase pedagogical model. Generates educational visuals inline via Gemini Flash Image
- **Coach Agent** (Pro): Triggered after 2 failed quiz attempts. Uses Socratic method, alternative analogies, scaffolded re-explanation — fundamentally different instructional strategies, not repetition
- **Exploration Agent** (Flash): Post-completion self-directed advanced topics

Agents never communicate directly. All transitions flow through Firestore state changes — deterministic and auditable.

**5-Phase Pedagogical Model** (per lesson):
1. **Connect**: Hook into learner's existing knowledge and role context
2. **Explore**: Introduce new concepts with role-specific analogies
3. **Apply**: Hands-on exercises tailored to the learner's actual job
4. **Confirm**: Assessment to verify understanding
5. **Close**: Summarize, preview next module, reinforce confidence

**Adaptive Assessment**:
- All 20 questions pre-generated at session creation (eliminates inter-question latency)
- Section-based: Beginner (Q1-8, stop at 4+ wrong), Intermediate (Q9-14, stop at 3+ wrong), Advanced (Q15-20, complete all)
- Proficiency thresholds: <45% Beginner, 45-75% Intermediate, >75% Advanced
- Options shuffled post-generation to prevent position bias
- Correctness determined server-side only — agent presents tool response data verbatim

**Dynamic Learning Path Composition**:
- Focus modules (from assessment gaps) prepended
- Standard curriculum: Foundations → Prompt Craft → Persona-Specific → Advanced
- Exploration modules appended
- Beginner path: up to 23 modules. Advanced: as few as 10

**7 Persona-Specific Tracks**: Each persona (Communicator, Coordinator, Creator, Insights, Marketer, Operator, Strategist) gets a unique 5-module Week 3 track (35 scaffolds total). Same concept taught to different personas produces completely different hooks, analogies, exercises, and quiz scenarios.

**Generative Content Engine — 4 Data Layers**:
1. 7 persona definitions (~50 lines each: responsibilities, outputs, challenges, AI use cases)
2. 20 question templates (~8 lines each: concept + correct answer meaning + distractor guidance)
3. Module scaffolds (~5 lines each: title/description only — no lesson content)
4. Prompt instructions (~200 lines per agent: pedagogical rules)
Total human-authored content: ~1,700 lines of scaffolding → unlimited personalized curriculum

**Security**: Cloud IAP with Google Workspace SSO. Emails never stored — HMAC-SHA256 pseudonymization with Cloud KMS envelope encryption, multi-key rotation, in-memory key caching (1h TTL), bytearray zeroing on exit.

**Infrastructure**: Vertex AI Agent Engine (Cloud Run), Firestore (named DB), Cloud KMS, GCS with 30-day lifecycle + V4 signed URLs, OpenTelemetry, Cloud Trace, daily Cloud Function aggregates metrics to Firestore + BigQuery.

**Stats**:
- 167 unit tests (full mocking, no network IO)
- 7 professional personas, 27 standard modules + dynamic focus/exploration
- 23 tools across 7 modules (least-privilege distribution)
- Google ADK v1.22.1+, Gemini 2.5 Pro (Teach/Coach) + Flash (others)
- Python 3.13, ruff + black + mypy strict, uv package manager

---

### 3. Dev Quickstart Agent — "Aura" (Personal)

**One-liner**: A brain-inspired cognitive architecture with 15 neuroscience-mapped regions (16th in progress) that automates the full software development lifecycle — from requirements through deployment.

**What it is**: Not a chatbot or code generator. A cognitive architecture that thinks, plans, learns, remembers, assesses risk, and delegates execution like a senior developer. Each brain region is a distinct Python module with biologically-analogous functions.

**Architecture — 16-Region Computational Brain**:

| Brain Region | Function |
|---|---|
| Prefrontal Cortex | Executive function, strategic planning, goal management |
| Cerebral Cortex | Higher-order reasoning, pattern recognition, problem decomposition |
| Thalamus | Input classification, context filtering, priority gating |
| Basal Ganglia | Action/agent selection, habit formation, grounded planning |
| Amygdala | Risk assessment, threat/opportunity detection, emotional state |
| Hippocampus | Memory consolidation, vector-based semantic search (pgvector + HNSW) |
| Wernicke's Area | Language comprehension, entity extraction, intent classification |
| Angular Gyrus | Deep semantic understanding, implicit needs detection |
| Cerebellum | Code quality refinement, error correction, procedural learning |
| ACC | Conflict monitoring, contradiction detection |
| Insular Cortex | Self-awareness, system health monitoring, confidence calibration |
| Posterior Cingulate | Self-reflection, meta-cognition ("Am I on track?") |
| Retrosplenial Cortex | Memory-action bridge (READ side of learning loop) |
| Entorhinal Cortex | Insight extraction for storage (WRITE side of learning loop) |
| VTA | Reinforcement learning, reward prediction (in progress) |
| OFC | Action-outcome prediction, pre-condition evaluation |

15 regions implemented, VTA in progress. All brain regions are free-floating (not bound to LangGraph nodes), coordinated by a cognitive orchestrator. 33 supporting brain components.

**CEO Model**: The orchestrator operates as a CEO consuming executive summaries, not an analyst parsing raw data. Brain regions pre-process inputs into concise summaries (semantic understanding, learning context, self-reflection, grounded plans). Reduced orchestrator token usage from ~800+ to ~300 per decision while improving decision quality.

**Cognitive Loop**: THINK → PLAN → CHOOSE → ACT → REVIEW
1. THINK: Cerebral Cortex + Hippocampus + Wernicke's Area analyze the situation
2. PLAN: Prefrontal Cortex formulates strategy while Amygdala assesses risk
3. CHOOSE: Basal Ganglia selects which agent/tool to execute
4. ACT: Stateless "smart tool" agents execute the task
5. REVIEW: Hippocampus consolidates learnings, patterns are updated

**Dual-Store Memory**:
- Working Memory (PostgresSaver/LangGraph checkpoints): 1-10ms, deterministic, session-scoped, time-travel debugging
- Long-Term Memory (PGVector + HNSW): 10-100ms semantic search, persistent across sessions, LLM reranking auto-enables at 50+ stored projects

**9 Specialized Agents** (full SDLC):
Requirements → Data Modeling → API Design (conditional) → Architecture → Database → Scaffolding → Testing → Deployment → Human Interaction. Each agent has action registries, handlers, prompts, tools, and schemas.

**Emotional Intelligence** — 5 persistent emotions (0.0-1.0) tracked across sessions:
- **Frustration**: Triggers assumption verification, slower pace
- **Confidence**: High = autonomous; Low = conservative recommendations
- **Anxiety**: Triggers human guidance, single-step focus
- **Excitement**: Positive framing, momentum preservation
- **Distrust**: Triggers thorough reasoning, trust-building

Natural decay rates (distrust slowest at 0.05, excitement fastest at 0.2). Hard behavioral gates force human interaction at extreme states. Amygdala integrates signals from OFC accuracy, ACC conflicts, Insular Cortex health, and phase progress.

**68 Named Personas with HR System**:
- YAML-based inheritance: base → role → named persona
- StaffingEngine scores: affinity (40%) + performance (50%) + exploration bonus (10%)
- Lifecycle: SEED → EXPERIMENTAL (5 uses, 70% success) → PROVEN (15 uses, 80%) → EVOLVED (50 uses, 90%)
- Token consumption tracked as "billing rate" with ROI calculations
- Underperformers go on bench → coaching injection → fired if no improvement
- Terminated personas trigger LLM-assisted recruiting for replacements addressing failure patterns

**Model Distillation Pipeline**:
1. DistillationCollector: Captures frontier model I/O during operation
2. QualityJudge: Async evaluation (scoring correctness, completeness, format)
3. TrainingExporter: High-quality examples (score ≥ 0.8) → JSONL for Together AI / Fireworks
4. InferenceRouter: Routes to student or teacher with confidence-based fallback + shadow mode
Six-phase rollout: passive collection → quality judgment → fine-tune → shadow mode → gradual rollout (10% → 100%) → full deployment

**Artifact Registry**: 12+ artifacts across 8 SDLC phases with pre/post-conditions and cascade invalidation. When `finalized_requirements` changes → `domain_model` stale → cascades to `api_contract`, `architecture_layers`, `database_schema`, etc.

**Stats**:
- 15 brain regions implemented (16th — VTA — in progress), 33 brain components
- 9 agents, 68 named personas
- 107 golden record patterns (14 categories)
- 70+ tools, 200+ prompt files
- 76+ test files, 32 Alembic migrations
- LangGraph + PostgreSQL + pgvector + FastAPI
- Full REST API with checkpoint rollback, Kubernetes probes, Prometheus metrics
- GitHub: https://github.com/dbartley18/Aura

---

### 4. Riva — Agentic Career Intelligence (Personal)

**One-liner**: An agentic career co-pilot with a "Reverse Headhunter" that proactively sources roles, generates evidence-grounded match explanations, and produces ATS-safe resume variants — all with determinism-tested LangGraph orchestration.

**What it is**: Full-stack career intelligence platform for senior/executive job seekers. Inverts the typical job search: instead of pasting JDs, the system proactively sources opportunities from your profile and resume. Each opportunity becomes a "Case" with tailored artifacts (ATS-safe resume variants, outreach emails, match explanations with grounded evidence).

**Architecture — Monorepo with Domain Boundaries**:
```
apps/api/       — FastAPI (13 routers)
apps/worker/    — ARQ background workers (async job queue via Redis)
apps/web/       — Next.js 15 + React 19 + Three.js 3D visualization
packages/core/  — Pydantic domain schemas + typed settings
packages/graphs/— LangGraph orchestration (flows, nodes, policies, tools, state, eval)
packages/llm/   — Multi-provider abstraction (6 providers)
packages/connectors/ — External data connectors (RSS, pluggable registry)
packages/storage/    — SQLAlchemy repositories
packages/analytics/  — Event tracking, feature flags, LLM telemetry
```

**LangGraph Agent Orchestration** — 10 specialized node categories:
- `ats/` — ATS-safe resume variant generation
- `comp/` — Compensation estimation
- `explain/` — Evidence-first match explanations (3+ grounded evidence chips per recommendation)
- `features/` — Feature extraction from JDs/resumes
- `normalize/` — Job posting normalization
- `outreach/` — Recruiter outreach drafting
- `rank/` — Scoring and ranking
- `sources/` — Opportunity sourcing ("Reverse Headhunter")
- `synthesis/` — Weekly synthesis reports
- `pulse/` — Market pulse analysis
4 main graph flows: recommendations, ats_variant, outreach, explain

**Key Engineering Decisions**:
- **Determinism as first-class concern**: Temperature ≤ 0.2. Golden snapshot tests assert two-call determinism on every LLM node. Dedicated CI workflow gates PRs touching graph code
- **Evidence-first explainability**: Every recommendation requires 3+ grounded evidence chips mapping JD requirements to resume spans. 80% JD line coverage target
- **Multi-provider LLM abstraction**: Swap between OpenAI, Anthropic, Google, Together, Azure, OpenRouter via single config toggle in `riva.toml`
- **Profile-driven config**: TOML profiles (local/dev/staging/prod) with Pydantic-typed settings. Feature flags per environment. Runtime profile switching via Admin API
- **3D Radar visualization**: Three.js/React Three Fiber 3D radar for career fit dimensions — with unit, integration, a11y, and Playwright e2e tests
- **Strict typing everywhere**: `mypy --strict` on all Python, TypeScript strict on frontend, Pydantic on every API boundary

**Observability**: OpenTelemetry on FastAPI, Prometheus metrics + Grafana dashboards + alert rules (p95 > 2s), Langfuse/LangSmith LLM telemetry, structlog structured logging.

**Stats**:
- ~214 Python files, ~252 TypeScript/TSX files
- 82 Python test files, 9 TS/Playwright test files
- 13 API routers, 10 LangGraph node categories, 4 flows
- 7 CI workflows, 6 internal packages
- 6 LLM providers supported
- Performance budgets: P50 recs < 1s, P95 < 2s; ATS variant P50 < 15s
- Full ops: Helm charts, Docker Compose, Alembic migrations, pre-commit hooks (ruff, black, mypy)
- GitHub: https://github.com/dbartley18/Riva

---

## AI Workflow

```yaml
headline: "Built ALL of this using AI"
planning: "Claude Opus 4.6 + Gemini 2.5 Pro + GPT 5.x"
execution: "Sonnet 4.6 + Opus 4.6, 5 Claude Code CLI tabs in iTerm2"
philosophy: "I think in architecture, I build with AI. One person with the right mental models and the right tools."
meta: "This portfolio site itself was built using AI — it's recursive proof of the workflow."
```
