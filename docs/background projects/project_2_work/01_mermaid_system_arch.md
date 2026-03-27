# System Architecture — V3 Full Mesh

> **Last Updated**: 2026-03-17  
> **Decisions**: D27 (B+C coordination), D28 (PM dual notification), D30-D35 (Router simplification, PM planning authority, LLM config, OTel tracing), Phase 5A (peer awareness, specialist proposals, artifact URI threading, parallel dispatch), Phase 5B (continuation tool, goal resolver, artifact catalog, composite planning), Phase 5D (artifact versioning, producer state tracker, cross-workflow artifact access), ADR-0004 (tool runtime standardization: Phase E complete; cloud telemetry dashboard validation pending)

## 1. High-Level System Flow

```mermaid
flowchart TD
  classDef infra fill:#f0f0f0,stroke:#666,color:#333
  classDef router fill:#ffe0b2,stroke:#e65100,color:#333
  classDef agent fill:#e8f1ff,stroke:#1f6feb,color:#0b2c5c
  classDef backend fill:#e8f5e9,stroke:#2e7d32,color:#1b5e20
  classDef runtime fill:#f3e5f5,stroke:#7b1fa2,color:#4a148c
  classDef planned fill:#fff3e0,stroke:#ff9800,color:#333,stroke-dasharray: 5 5

  GE[Gemini Enterprise<br/>Single entry point]:::infra
  GE -- "A2A Protocol" --> Router

  subgraph Router["Intent Router (Gemini 2.5 Pro)"]
    direction TB
    Cat[Agent Catalog<br/>auto-discovered from cards]:::router
    IC[LLM Intent Classifier]:::router
  end

  Router -- "A2A: submit to PM<br/>then presents results" --> PM

  subgraph PM["PM Agent (Gemini 2.5 Pro)"]
    direction TB
    Planner[ExecutionPlanner<br/>dependency graph resolution<br/>parallel_group assignment]:::agent
    PlanProposal[Plan Proposal Tool<br/>structural validation gates]:::agent
    GoalResolver[Goal Resolver Tool<br/>artifact-first pipeline discovery<br/>backward_chain from artifact catalog]:::agent
    ContinuationTool[Continuation Tool<br/>mid-workflow scope expansion<br/>backward_chain → filter → plan → mutate]:::agent
    ProgressTrack[Progress Tracker<br/>step events, issues, summary]:::agent
    Discovery[Discovery Tool<br/>list_mesh_agents]:::agent
    ParallelDispatch[Parallel Dispatch<br/>dispatch_parallel_agents<br/>fan-out / fan-in]:::agent
  end

  PM -- "A2A: plan-driven dispatch<br/>(sequential or parallel)<br/>with plan context + artifact URIs" --> Mesh

  RuntimeStd["Shared Tool Runtime (ADR-0004)<br/>ToolExecutor lifecycle<br/>build_executor_tool authoring pattern<br/>central timeout/retry/idempotency policy"]:::runtime

  subgraph Mesh["Agent Mesh (24 Cloud Run Services)"]
    direction TB

    subgraph Eminence["Eminence Content"]
      Email[Email Agent]:::agent
      LinkedIn[LinkedIn Agent]:::agent
      Video[Video Agent]:::agent
      Social[Social Strategy Agent]:::agent
      Review[Content Review Agent]:::agent
    end

    subgraph BrandNaming["Brand Naming"]
      BrBrief[Brand Brief Agent]:::agent
      BrNaming[Brand Naming Agent]:::agent
      BrLing[Linguistic Analysis Agent]:::agent
      BrVal[Validation & Messaging Agent]:::agent
      BrGov[Governance Review Agent]:::agent
      MktRes[Market Research Agent]:::agent
      DelInt[Deloitte Internal Agent]:::agent
    end

    subgraph CampaignPlanning["Campaign Planning"]
      CampBrief[Campaign Brief Agent]:::agent
      BriefVal[Brief Validator Agent]:::agent
      Strategy[Strategy Agent]:::agent
      ExecPlan[Execution Planner Agent]:::agent
      DelEvent[Deloitte Event Finder]:::agent
      ExtEvent[External Event Finder]:::agent
      Podcast[Podcast Finder]:::agent
      Merger[Simple Merger Agent]:::agent
    end

    subgraph Infrastructure["Infrastructure"]
      InfoGath[Info Gathering Agent]:::agent
    end
  end

  %% Emergent mesh: any agent can invoke any agent
  Email <-. "any agent can<br/>invoke any peer" .-> BrNaming
  LinkedIn <-. "cross-workflow<br/>composition" .-> BrGov
  Video <-. "emergent at<br/>runtime" .-> Social

  Email <-- "auto-review" --> Review
  LinkedIn <-- "auto-review" --> Review
  Video <-- "auto-review" --> Review

  %% Campaign planning chain
  CampBrief -. "likely" .-> BriefVal -. "likely" .-> Strategy -. "likely" .-> ExecPlan
  DelEvent & ExtEvent & Podcast -. "parallel" .-> Merger
  Merger -. "feeds into" .-> ExecPlan

  %% Cross-workflow: exec planner can invoke content agents
  ExecPlan <-. "cross-workflow<br/>emergent" .-> Email & LinkedIn & Video

  PMAgent -. "validates handoffs<br/>owns planning & dispatch<br/>tracks progress" .-> Mesh
  PM -. "tool entrypoints route through" .-> RuntimeStd
  Mesh -. "tool entrypoints route through" .-> RuntimeStd

  Mesh -- "MCP (Streamable HTTP)" --> MCP
  Mesh -- "IAM Auth (PSC)" --> CloudSQL
  Mesh -- "Signed URLs" --> GCS
  PM -- "IAM Auth (PSC)" --> CloudSQL

  subgraph Backend["Backend Services"]
    MCP[MCP Marketing Tools<br/>generate_image, guidelines_reader<br/>lookup_personas, google_search]:::backend
    CloudSQL[Cloud SQL PostgreSQL<br/>adk-a2a-poc<br/>a2a_tasks, adk_sessions<br/>workflow_state<br/>plan_version, step_events,<br/>correlation_id<br/>composition_patterns,<br/>composition_outcomes,<br/>capability_catalog]:::backend
    GCS["GCS Artifacts<br/>gs://adk-a2a-poc-artifacts<br/>workflows/id/type.json"]:::backend
  end

  MCP -- "Vertex AI" --> Vertex[Imagen / Gemini]:::backend
```

## 2. How Composition Works

The system does NOT have hardcoded workflows. Composition is **emergent** — agents
discover capabilities, reason about what they need, and invoke peers dynamically.

```mermaid
flowchart LR
  classDef step fill:#e8f1ff,stroke:#1f6feb,color:#0b2c5c
  classDef data fill:#f3e5f5,stroke:#7b1fa2,color:#4a148c
  classDef decision fill:#fff2db,stroke:#d17b00,color:#5c3200

  Cards["Peer Agent Cards<br/>loaded at startup<br/>(produces, requires,<br/>skills, examples)"]:::data
  LLM["Agent's LLM<br/>reasons about<br/>peer capabilities"]:::decision
  Decide{"Who should<br/>get this next?"}:::decision
  Invoke["invoke_peer()<br/>artifact + context brief"]:::step
  PM["PM validates<br/>handoff quality"]:::step
  Next["Downstream Agent<br/>receives work +<br/>distilled context"]:::step

  Cards --> LLM --> Decide
  Decide -- "agent decides" --> Invoke --> PM --> Next
```

### What makes this a mesh, not a pipeline

| Pipeline (what we DON'T do) | Mesh (what we DO) |
|---|---|
| Router tells Agent B to call Agent C | Agent B reads peer cards and decides who to call |
| Fixed `A → B → C` execution order | Agent discovers next step from `produces`/`requires` + LLM reasoning |
| New workflow = code change | New workflow = new agent card dropped in `agent_cards/` |
| Router polls every step | Router kicks off, agents self-chain, PM tracks |
| Single workflow boundary | Agent can invoke ANY peer — cross-workflow composition is automatic |

## 3. Coordination Model (B+C)

```mermaid
sequenceDiagram
  participant User
  participant Router as Intent Router
  participant A as Agent A
  participant PM as PM Agent
  participant B as Agent B

  User->>Router: "Name a brand and create launch emails"
  Router->>Router: Read agent catalog, classify intent
  Router->>PM: submit_to_pm(request, correlation_id)
  Note over Router: Steps back — NOT in critical path

  PM->>PM: create_execution_plan([info_gathering, brand_brief, ...])
  PM->>PM: Stores plan in workflow_state (plan_version=1)
  PM->>A: Dispatches first agent with plan context metadata

  A->>A: Does its work (LLM + MCP tools)
  A->>A: Reads peer cards → decides Brand Brief is next
  A->>A: Distills context brief (what, why, open questions)
  A->>PM: "Handing off to brand_brief_agent" + artifact + context brief
  PM->>PM: Validates: does context match? artifacts complete? plan aligned?
  PM-->>Router: [transparency] "Info gathering → brand brief handoff in progress"

  alt Handoff OK
    PM->>B: "Proceed" — artifact + context brief forwarded
    B->>B: Does its work, decides next peer...
  else Issue detected
    PM->>A: [corrective] "Brief is missing industry context"
    A->>A: Course corrects
    A->>PM: Resubmits
    PM->>B: "Proceed"
  end

  Note over B: Chain continues — each agent decides next peer
  Note over Router: Observes via PM transparency, acts only on escalation
```

## 4. Key Characteristics

| Aspect | Design |
|--------|--------|
| **Topology** | Full mesh — every agent is Server AND Client (dual-role). 23 agents + 1 MCP server across 3 workflows |
| **Entry point** | Gemini Enterprise → Intent Router (only registered surface) |
| **After kickoff** | Router submits to PM; PM plans, dispatches, and tracks; agents self-chain peer-to-peer |
| **Composition** | Emergent — agents read peer cards, LLM reasons about who to call next |
| **Coordination** | B+C — PM Agent validates handoffs, owns planning & dispatch + agents pass distilled context to peers (D27, D30-D34) |
| **Planning** | PM owns `ExecutionPlanner` — builds plan from dependency graph, agents propose mutations via `propose_plan_update` tool |
| **Plan evolution** | Living plans — any agent can propose additions; PM validates structurally (5 gates) then applies via `mutate_plan()` with optimistic concurrency (`plan_version`) |
| **Escalation** | Corrective → agent first, transparency → router, escalation only on retry exhaustion (D28) |
| **Human input** | Agent-decided at runtime — returns `input-required` status when it needs human feedback |
| **State** | Cloud SQL (JSONB) — tasks, sessions, workflow state with `plan_version`, `step_events`, `correlation_id` |
| **Artifacts** | GCS with signed URLs — `workflows/{id}/{type}.json` |
| **Tools** | Shared MCP server (Streamable HTTP, stateless) — 4 tools |
| **PM Tools** | 15 tools: `plan_and_create_workflow`, `create_execution_plan`, `create_workflow`, `record_step_completion`, `record_issue`, `update_living_summary`, `get_workflow_progress`, `get_correlation_status`, `propose_plan_update`, `get_workflow_plan`, `resolve_goal_agents` (5B), `continue_workflow` (5B), `list_mesh_agents`, `dispatch_agent`, `dispatch_parallel_agents` |
| **Specialist Tools** | `HandoffExecutor` auto-injects `propose_plan_update` + `get_workflow_plan` into every specialist from DB env vars (5.2). Agents can query and propose plan mutations directly |
| **Tool Runtime** | ADR-0004 runtime path is standardized: tool entrypoints route through `ToolExecutor` (directly or via `build_executor_tool`/adapter), with centralized timeout/retry/idempotency policy and normalized `ToolResult` telemetry tags |
| **Peer Awareness** | `_enrich_with_peer_awareness()` appends peer capability summaries (produces/requires) to PM-dispatched prompts (5.1). Specialists see mesh context without tool calls |
| **Parallel Dispatch** | PM uses `dispatch_parallel_agents` for independent steps sharing the same `parallel_group` (5.4). Fan-out via `asyncio.gather`, sequential bookkeeping fan-in |
| **Cross-Workflow Composition** | Artifact-first planning via `resolve_goal_agents` (5B) — backward-chains through `artifact_catalog` dependency graph across domain boundaries. Mid-workflow scope expansion via `continue_workflow` (5B) — extends active plan atomically with `correlation_id` threading. Composite workflow type auto-detected by planner when agents span multiple domains |
| **Auth** | IAM service-to-service (Cloud Run invoker tokens) — full mesh N×N bindings |
| **Transport** | A2A streaming (`message/stream` SSE) for progressive updates. Executor emits `working` events (tool calls, thinking traces, progress) relayed via `relay_event()` + ContextVar threading |
| **Discovery** | Agent cards auto-discovered from `agent_cards/*.json` + `list_mesh_agents` tool for runtime queries |
| **Tracing** | `correlation_id` (domain, persisted in Cloud SQL) + OTel `trace_id` (infrastructure, Cloud Trace). Linked via span attributes on `agent.execute` and `a2a.stream` spans. W3C `traceparent` propagated across A2A HTTP boundaries. Auto-configured: `CloudTraceSpanExporter` on Cloud Run, NOOP locally (`agents/shared/tracing.py`) |
| **LLM Config** | Centralized in `agents/shared/config/llm_config.py` — per-agent model, thinking config, tool config with 4-level env-var override hierarchy (D35) |
| **Adaptive Dispatch** | Earned delegation (D36) — `governed` vs `delegated` per plan step, driven by `trust_score` from `composition_patterns`. `agents/shared/learning/` package (pure algorithmic Python). Trust lifecycle: discovery→learning→promotion→delegation→demotion |
| **User Preferences** | Per-user personalization via `user_profiles` + `user_preferences` tables. Explicit (`confidence=1.0`) and inferred (climbs toward 0.9). PM threads into dispatch metadata. 90-day decay for stale preferences |
| **Extensibility** | Add agent = drop card + deploy service → mesh auto-discovers |

## 5. Streaming & Observability — How Users See Progress

Every agent emits **streaming events** as it works. These events propagate back
through the mesh to the user in real time — the user sees tool calls, reasoning
traces, and handoff transitions as they happen, not after a 3-minute silence.

### Streaming Event Relay Chain

```mermaid
sequenceDiagram
  participant User as User (SSE client)
  participant Router as Intent Router
  participant PM as PM Agent
  participant Agent as Specialist Agent
  participant LLM as Gemini LLM
  participant MCP as MCP Tools

  User->>Router: "Create a brand naming brief"
  Router->>PM: submit_to_pm() — opens SSE stream
  PM->>Agent: dispatch_to_agent() — opens SSE stream

  Note over Agent: BaseAgentExecutor.execute()
  Agent-->>PM: 🔄 working: "brand_brief_agent: Processing request..."

  Agent->>LLM: run_async() loop begins
  LLM-->>Agent: thought=True part (reasoning)
  Agent-->>PM: 🔄 working: "[12s] brand_brief_agent reasoning: Analyzing the client's industry..."

  LLM-->>Agent: function_call: google_search
  Agent-->>PM: 🔄 working: "[18s] brand_brief_agent: Calling tool: google_search..."
  Agent->>MCP: google_search("cybersecurity market")
  MCP-->>Agent: search results

  LLM-->>Agent: text response (final output)
  Agent-->>PM: ✅ completed: "Here is the brand naming brief..."

  Note over PM: relay_event() forwards each event<br/>via ContextVar EventQueue threading
  PM-->>Router: 🔄 working: "[PM] brand_brief_agent: Processing request..."
  PM-->>Router: 🔄 working: "[PM] [12s] brand_brief_agent reasoning: ..."
  PM-->>Router: 🔄 working: "[PM] [18s] brand_brief_agent: Calling tool: ..."
  PM-->>Router: ✅ completed (final result)

  Router-->>User: SSE events streamed progressively
```

### Event Types Emitted by Executor

| Event | Trigger | Format | Example |
|-------|---------|--------|---------|
| **Initial working** | `execute()` entry | `{agent}: Processing request...` | `brand_brief_agent: Processing request...` |
| **Tool call** | `function_call` part from LLM | `[{elapsed}s] {agent}: Calling tool: {name}...` | `[18s] brand_brief_agent: Calling tool: google_search...` |
| **Thinking trace** | `thought=True` part from LLM | `[{elapsed}s] {agent} reasoning: {summary}` | `[12s] brand_brief_agent reasoning: Analyzing the client's...` (truncated at 200 chars) |
| **Completed** | Final text response | Full response text | The complete brand naming brief |

### ContextVar Threading — How Events Cross Service Boundaries

Events don't flow through return values. Each executor sets a **ContextVar**
(`EventQueue`) before invoking the ADK agent. When a PM tool dispatches to a
peer agent via `dispatch_to_agent`, it opens an SSE stream and uses `relay_event()`
to forward each received event onto its own `EventQueue` — which the PM's
executor is watching.

```mermaid
flowchart TD
  classDef executor fill:#e8f1ff,stroke:#1f6feb,color:#0b2c5c
  classDef tool fill:#fff2db,stroke:#d17b00,color:#5c3200
  classDef queue fill:#e8f5e9,stroke:#2e7d32,color:#1b5e20
  classDef stream fill:#f3e5f5,stroke:#7b1fa2,color:#4a148c

  subgraph Router["Router Service"]
    RExec["Router Executor<br/>submit_to_pm tool"]:::executor
    RQ["EventQueue<br/>(ContextVar)"]:::queue
  end

  subgraph PM["PM Agent Service"]
    PMExec["PM Executor<br/>dispatch_to_agent tool"]:::executor
    PMQ["EventQueue<br/>(ContextVar)"]:::queue
    Relay["relay_event()<br/>dedup + forward"]:::tool
  end

  subgraph Agent["Specialist Agent Service"]
    AExec["Agent Executor<br/>run_async() loop"]:::executor
    AQ["EventQueue<br/>(ContextVar)"]:::queue
  end

  AExec -- "emit working event" --> AQ
  AQ -- "SSE stream<br/>(A2A message/stream)" --> Relay
  Relay -- "relay onto PM's queue" --> PMQ
  PMQ -- "SSE stream<br/>(A2A message/stream)" --> RExec
  RExec -- "yield to user" --> RQ

  style RQ fill:#c8e6c9,stroke:#2e7d32
  style PMQ fill:#c8e6c9,stroke:#2e7d32
  style AQ fill:#c8e6c9,stroke:#2e7d32
```

> **Key insight**: Each service boundary is an independent SSE stream. The
> ContextVar pattern means tools running inside an executor can emit events
> without any coupling to the transport layer. `relay_event()` handles
> deduplication (same `message_id` won't be forwarded twice) and adds a
> `[PM]` prefix for provenance.

### Distributed Tracing — OTel Spans Across the Mesh

The system maintains **two complementary trace keys**:

| Layer | Key | Purpose | Storage |
|-------|-----|---------|---------|
| **Domain** | `correlation_id` | PM queries, workflow status, audit trail | Cloud SQL (persisted) |
| **Infrastructure** | OTel `trace_id` | Latency waterfall, error diagnosis, Cloud Trace UI | Cloud Trace (ephemeral) |

They're linked: every OTel span carries `correlation_id` as an attribute, so you
can jump from a Cloud Trace waterfall to the corresponding workflow in the DB.

```mermaid
flowchart LR
  classDef span fill:#e8f1ff,stroke:#1f6feb,color:#0b2c5c
  classDef propagate fill:#fff2db,stroke:#d17b00,color:#5c3200
  classDef trace fill:#f3e5f5,stroke:#7b1fa2,color:#4a148c

  subgraph RouterService["Router (Cloud Run)"]
    RS["agent.execute span<br/>agent.name=router<br/>correlation_id=abc123"]:::span
  end

  subgraph PMService["PM Agent (Cloud Run)"]
    PS["agent.execute span<br/>agent.name=pm_agent<br/>correlation_id=abc123"]:::span
    PA["a2a.stream span<br/>target=brand_brief_agent"]:::span
  end

  subgraph AgentService["Brand Brief Agent (Cloud Run)"]
    AS["agent.execute span<br/>agent.name=brand_brief_agent<br/>correlation_id=abc123"]:::span
  end

  RS -- "A2A HTTP +<br/>traceparent header" --> PS
  PS --> PA
  PA -- "A2A HTTP +<br/>traceparent header" --> AS

  subgraph CloudTrace["Google Cloud Trace"]
    Waterfall["Full request waterfall<br/>Router → PM → Brand Brief<br/>with latency breakdown"]:::trace
  end

  RS & PS & AS -. "CloudTraceSpanExporter<br/>(auto on Cloud Run)" .-> Waterfall
```

**How it works**:
1. `BaseAgentExecutor.execute()` creates an `agent.execute` span with attributes (`agent.name`, `task.id`, `correlation_id`, `workflow_id`)
2. `A2AClient.send_task_streaming()` creates an `a2a.stream` child span and injects W3C `traceparent` into the HTTP headers via `inject_trace_headers()`
3. The downstream service's executor picks up the trace context — its `agent.execute` span becomes a child of the caller's `a2a.stream` span
4. On Cloud Run, `CloudTraceSpanExporter` ships spans to Google Cloud Trace automatically (detected via `K_SERVICE` env var)
5. Locally/in tests, tracing is NOOP — zero overhead, no side effects

> **Configuration**: `agents/shared/tracing.py` auto-detects the environment.
> No env vars needed. `use_test_provider()` / `reset_provider()` enable
> in-memory span capture for tests without touching the global OTel provider.

## 6. Plan Evolution Infrastructure (D34)

Plans are living documents managed by the PM Agent. Any agent can propose mutations;
PM validates structurally and applies atomically. This enables organic workflow evolution
without hardcoded pipelines.

```mermaid
flowchart TD
  classDef agent fill:#e8f1ff,stroke:#1f6feb,color:#0b2c5c
  classDef pm fill:#e8f5e9,stroke:#2e7d32,color:#1b5e20
  classDef gate fill:#fff2db,stroke:#d17b00,color:#5c3200
  classDef db fill:#f3e5f5,stroke:#7b1fa2,color:#4a148c

  Agent["Specialist Agent<br/>(propose_plan_update injected<br/>by HandoffExecutor, 5.2)"]:::agent
  Agent -- "propose_plan_update()<br/>(additions_json, reason, plan_version)" --> Gates

  subgraph Gates["Structural Validation (in-process Python, not LLM)"]
    G1["Gate 1: Agent exists?<br/>(AgentCatalog lookup)"]:::gate
    G2["Gate 2: Plan version current?<br/>(optimistic concurrency)"]:::gate
    G3["Gate 3: Dependencies satisfiable?<br/>(requires ⊆ upstream produces)"]:::gate
    G4["Gate 4: No duplicates?<br/>(same agent at same position)"]:::gate
    G5["Gate 5: Not before current step?<br/>(history is immutable)"]:::gate
  end

  Gates -- "all pass" --> Mutate["mutate_plan()<br/>atomic update<br/>plan_version++"]:::db
  Mutate --> DB["workflow_state<br/>(Cloud SQL JSONB)"]:::db
  Mutate --> PMSees["PM sees updated plan<br/>on next turn and decides<br/>whether to dispatch new steps"]:::pm

  Gates -. "any gate fails" .-> Reject["Proposal rejected<br/>with structured reason"]:::gate
```

> **5.2 change**: Specialists call `propose_plan_update` directly as an ADK tool
> (injected by `HandoffExecutor`). The 5 structural gates run in-process — PM is
> not in the proposal loop. PM sees the already-validated mutation on its next
> turn and decides dispatch. This avoids making PM a bottleneck for proposals.

### Plan Context in Dispatch

When PM dispatches an agent, it includes **plan context metadata** — a structured
snapshot of the current plan state:

```
{
  "plan_version": 3,
  "workflow_id": "wf-abc123",
  "total_steps": 7,
  "current_step": 2,
  "your_steps": [2, 5],        // indices where this agent appears
  "completed_steps": ["info_gathering"],
  "pending_steps": ["brand_naming", "linguistic", "validation", "governance"],
  "available_artifacts": {
    "brand_requirements": "gs://adk-a2a-poc-artifacts/workflows/wf-abc123/brand_requirements.json",
    "brand_naming_brief": "gs://adk-a2a-poc-artifacts/workflows/wf-abc123/brand_naming_brief.json"
  },
  "plan_summary": "✓ info_gathering ▸ brand_brief ○ brand_naming ○ linguistic ○ validation ○ governance"
}
```

This gives each agent situational awareness without needing to query the plan separately.
Artifact URIs (5.3) are threaded as GCS paths so downstream agents can reference
prior work products directly, not just by name.

## 7. Adaptive Learning & Delegated Dispatch (D36)

The mesh learns from execution history to optimize dispatch governance. New or risky
compositions start fully governed by PM; proven patterns earn delegated authority.

### Trust Lifecycle

```mermaid
stateDiagram-v2
  [*] --> Discovery: New pattern<br/>first seen
  Discovery --> Learning: PM governs<br/>records outcomes
  Learning --> Learning: trust climbing<br/>(success)
  Learning --> Promotion: trust ≥ 0.85<br/>AND runs ≥ 5
  Promotion --> Delegation: dispatch_mode<br/>= delegated
  Delegation --> Delegation: agent invokes<br/>peer directly
  Delegation --> Demotion: trust < 0.60<br/>(failures)
  Demotion --> Learning: dispatch_mode<br/>= governed
  Learning --> Learning: trust dropping<br/>(failure)

  note right of Discovery
    trust_score = 0.0
    dispatch_mode = governed
  end note

  note right of Delegation
    Agent invokes peer directly
    Reports back to PM after
  end note
```

### Governed vs Delegated Dispatch

```mermaid
flowchart TD
  classDef pm fill:#e8f5e9,stroke:#2e7d32,color:#1b5e20
  classDef agent fill:#e8f1ff,stroke:#1f6feb,color:#0b2c5c
  classDef gate fill:#fff2db,stroke:#d17b00,color:#5c3200
  classDef db fill:#f3e5f5,stroke:#7b1fa2,color:#4a148c

  PM[PM Agent<br/>creates plan]:::pm
  PM --> Query["get_dispatch_recommendations()<br/>queries composition_patterns"]:::db
  Query --> Decide{"dispatch_mode<br/>per step"}

  Decide -- "governed<br/>(new/risky/low trust)" --> Gov
  Decide -- "delegated<br/>(proven/high trust)" --> Del

  subgraph Gov["Governed Path"]
    G_AgentA[Agent A completes]:::agent
    G_PM_Val[PM validates<br/>handoff quality]:::pm
    G_PM_Dispatch[PM dispatches<br/>Agent B]:::pm
    G_Record[record_handoff_outcome<br/>updates trust_score]:::db
    G_AgentA --> G_PM_Val --> G_PM_Dispatch --> G_Record
  end

  subgraph Del["Delegated Path"]
    D_AgentA[Agent A completes]:::agent
    D_Direct[Agent A invokes<br/>Agent B directly<br/>via A2A dual-role]:::agent
    D_Report[Agent A reports<br/>completion to PM]:::pm
    D_Record[record_handoff_outcome<br/>updates trust_score]:::db
    D_AgentA --> D_Direct --> D_Report --> D_Record
  end

  G_Record --> Trust["trust_scorer.py<br/>recency-weighted update"]:::gate
  D_Record --> Trust
  Trust --> Check{"threshold<br/>check"}
  Check -- "≥0.85 + ≥5 runs" --> Promote["PROMOTE<br/>governed → delegated"]:::pm
  Check -- "<0.60" --> Demote["DEMOTE<br/>delegated → governed"]:::gate
  Check -- "in range" --> NoChange[No change]
```

### PM Queries Learning Data During Plan Creation

```mermaid
sequenceDiagram
  participant PM as PM Agent
  participant LT as Learning Tools<br/>(pure Python)
  participant DB as Cloud SQL<br/>(composition_patterns)
  participant Agent as Specialist Agent

  PM->>PM: create_execution_plan()
  PM->>LT: get_dispatch_recommendations(plan_steps)
  LT->>DB: SELECT trust_score, dispatch_mode<br/>FROM composition_patterns<br/>WHERE source/target match
  DB-->>LT: pattern data (trust, mode, skip_rate)
  LT-->>PM: per-step recommendations<br/>{recommendation, trust_score, reason}

  PM->>PM: LLM assigns dispatch_mode per step<br/>(may override recommendations)

  PM->>LT: get_known_capabilities("name a brand")
  LT->>DB: SELECT * FROM capability_catalog<br/>WHERE intent_pattern MATCH
  DB-->>LT: proven chains with success_rate, avg_duration
  LT-->>PM: "brand naming → 7 agents, 92% success, ~8 min"

  PM->>Agent: dispatch with plan context +<br/>dispatch_mode in metadata

  Note over Agent: After completion:
  Agent-->>PM: reports outcome
  PM->>LT: record_handoff_outcome(pattern, outcome, tokens, cost)
  LT->>DB: UPDATE composition_patterns SET trust_score = ...
  LT->>DB: INSERT INTO composition_outcomes
```

### Learning Tables (Cloud SQL)

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `composition_patterns` | Tracks each agent→agent pairing with cumulative trust | `pattern_id`, `source_agent`, `target_agent`, `trust_score`, `dispatch_mode`, `success_count`, `failure_count`, `skip_rate` |
| `composition_outcomes` | Per-handoff result with token/cost data | `outcome_id`, `pattern_id` (FK), `correlation_id`, `outcome`, `prompt_tokens`, `completion_tokens`, `estimated_cost`, `duration_ms` |
| `capability_catalog` | Discovered multi-step chains with end-to-end metrics | `capability_id`, `intent_pattern`, `composition_chain` (JSONB), `success_rate`, `avg_duration`, `user_satisfaction_avg` |
| `user_profiles` | User identity across sessions | `user_id` (PK), `display_name`, `role_inference`, `org_context` |
| `user_preferences` | Learned and stated preferences per user | `preference_id`, `user_id` (FK), `category`, `key`, `value`, `confidence`, `source` (explicit/inferred) |

### Design Principles

| Principle | Implementation |
|-----------|----------------|
| **Learning is algorithmic, not LLM** | `agents/shared/learning/` — pure Python: `PatternTracker`, `TrustScorer`, `CapabilityCatalog`, `PreferenceEngine` |
| **PM cognitive load unchanged** | PM calls tools, gets structured data, makes judgment calls. No learning math in prompts |
| **Agents stay simple** | Produce output, propose plan changes, report back. No dispatch logic |
| **Trust is earned, not configured** | Thresholds: `PROMOTE=0.85`, `DEMOTE=0.60`, `MIN_RUNS=5`, `RECENCY_WEIGHT=0.7` |
| **Cost-aware optimization** | Token/cost tracking per handoff enables cheaper chain selection |
| **User-grounded quality** | Satisfaction signals feed into trust alongside algorithmic success |
