# Agent Architecture — V3 Full Mesh

> **Last Updated**: 2026-03-17  
> **Decisions**: D27 (B+C coordination), D28 (PM dual notification), D30-D35 (Router simplification, PM planning authority, LLM config, OTel tracing), Phase 5A (peer awareness, specialist proposals, artifact URI threading, parallel dispatch), Phase 5B (continuation tool, goal resolver, artifact catalog, composite planning), Phase 5D (artifact versioning, producer state tracker, cross-workflow artifact access), ADR-0004 (tool runtime standardization: Phase E complete; cloud telemetry dashboard validation pending)

## 1. Agent Dual-Role Pattern (Foundation)

Every agent in the mesh is **both a server and a client**. This is what makes
the mesh possible — any agent can receive work AND invoke any other agent.

```mermaid
flowchart TD
  classDef server fill:#e8f1ff,stroke:#1f6feb
  classDef client fill:#fff2db,stroke:#d17b00
  classDef core fill:#f3e5f5,stroke:#7b1fa2
  classDef data fill:#e8f5e9,stroke:#2e7d32

  subgraph Agent["Every Agent Service (Cloud Run)"]
    direction TB
    subgraph Server["A2A Server"]
      Endpoint["POST / — receive tasks<br/>GET /.well-known/agent.json — serve card"]:::server
    end

    subgraph Core["Agent Core"]
      LLM["ADK LlmAgent<br/>(Gemini 2.5 Pro or Flash)<br/>model from llm_config.py"]:::core
      Prompt["System Prompt<br/>(identity, workflow, handoff rules)"]:::core
      Tracing["OTel Tracing<br/>agent.execute span<br/>correlation_id + trace_id"]:::core

      subgraph Runtime["Tool Runtime (ADR-0004)"]
        ExecRuntime["ToolExecutor<br/>timeout/retry/idempotency<br/>error normalization + telemetry tags"]:::core
        WrapRuntime["build_executor_tool<br/>wrapper-first authoring<br/>FunctionToolAdapter compatibility"]:::core
      end
    end

    subgraph Clients["Client Capabilities"]
      A2AClient["A2A Client<br/>invoke_peer(name, message)<br/>send_task_streaming()<br/>W3C traceparent propagation"]:::client
      MCPClient["MCP Client<br/>Streamable HTTP<br/>google_search, guidelines_reader,<br/>generate_image, lookup_personas"]:::client
      GCSClient["GCS Artifact Client<br/>upload_versioned() / download_artifact()<br/>list_versions() / get_signed_url()"]:::client
    end

    subgraph Enrichment["Prompt Enrichment (automatic)"]
      MetaEnrich["_enrich_with_metadata()<br/>plan context, step number,<br/>artifact URIs (gs://), dispatched-by"]:::data
      PeerAware["_enrich_with_peer_awareness()<br/>peer capability summaries<br/>(produces/requires) for PM-dispatched tasks"]:::data
    end

    subgraph Discovery["Peer Discovery & Planning"]
      PeerCards["Peer Agent Cards<br/>loaded from PEER_AGENT_URLS<br/>at startup"]:::data
      CardReader["Reads produces, requires,<br/>skills, feedsInto from<br/>every peer's card"]:::data
      PlanToolsPM["PM-only Tools<br/>create_execution_plan<br/>dispatch_parallel_agents<br/>list_mesh_agents"]:::data
      PlanToolsAll["Specialist Tools (auto-injected)<br/>propose_plan_update<br/>get_workflow_plan<br/>(via HandoffExecutor from DB env vars)"]:::data
    end
  end

  OtherAgents["Any Peer Agent"] -- "A2A task" --> Endpoint
  LLM -- "tool calls" --> ExecRuntime
  WrapRuntime --> ExecRuntime
  A2AClient -- "A2A task + context brief" --> OtherAgents
  MCPClient -- "tool calls" --> MCP["MCP Server"]
  GCSClient -- "artifacts" --> GCS["GCS Bucket"]
```

## 1b. Tool Runtime Standardization (ADR-0004)

- Tool execution lifecycle is standardized through `ToolExecutor` for migrated tool entrypoints.
- Tool-authoring pattern is wrapper-first (`build_executor_tool`) with adapters for compatibility paths.
- Runtime policy concerns (timeout/retry/idempotency/error normalization/telemetry tags) are centralized, not duplicated in specialist tool bodies.
- Current remaining runtime sign-off is cloud dashboard telemetry validation (Cloud Logging/Trace field verification).

## 2. Emergent Composition — How Agents Decide Who's Next

Agents don't follow hardcoded pipelines. They **read peer cards** at startup,
**reason about capabilities** using their LLM, and **decide at runtime** who
should receive their output. This is what makes the system extensible — drop
a new agent card and the mesh discovers it automatically.

```mermaid
flowchart TD
  classDef agent fill:#e8f1ff,stroke:#1f6feb,color:#0b2c5c
  classDef decision fill:#fff2db,stroke:#d17b00,color:#5c3200
  classDef data fill:#f3e5f5,stroke:#7b1fa2,color:#4a148c
  classDef pm fill:#e8f5e9,stroke:#2e7d32,color:#1b5e20

  subgraph AgentA["Agent A — just finished its task"]
    Output["Produced artifact<br/>(e.g. brand_naming_brief)"]:::data
    Cards["Reads all peer cards:<br/>• Brand Naming Agent requires brand_naming_brief ✓<br/>• Linguistic Agent requires brand_name_options ✗<br/>• Email Agent requires campaign_strategy ✗<br/>• Market Research Agent — on-demand only"]:::data
    LLM["LLM reasons:<br/>'I produced a brand_naming_brief.<br/>Brand Naming Agent requires that.<br/>I should hand off to them.'"]:::decision
    Bundle["Packages:<br/>1. Artifact (the work product)<br/>2. Context brief (distilled by LLM —<br/>   what I did, why, key decisions,<br/>   open questions for next agent)"]:::data
  end

  Output --> Cards --> LLM --> Bundle

  Bundle -- "invoke_peer()" --> PM

  subgraph PMGate["PM Agent — Quality Gate & Workflow Authority"]
    Validate["Validates:<br/>• Context brief complete?<br/>• Artifact matches produces?<br/>• Aligns with plan?<br/>• Plan version current?"]:::pm
  end

  PM -- "✅ proceed" --> AgentB["Agent B<br/>(receives artifact + context brief,<br/>does its own work,<br/>then repeats this same cycle)"]:::agent

  PM -. "❌ corrective" .-> AgentA
  PM -. "📋 transparency" .-> Router["Router<br/>(human awareness)"]
```

### Why this matters

| Static pipeline | Emergent mesh |
|---|---|
| `A → B → C` hardcoded in code | A reads cards → LLM decides B is next → A invokes B |
| Adding Agent D requires code change | Adding Agent D = drop a card with `requires: [X]` → A discovers it |
| Cross-workflow = separate code path | Agent reasons: "Email Agent can help here" → invokes it directly |
| Failure = pipeline breaks | Agent retries, PM course-corrects, plan evolves |

## 3. Agent Mesh — Complete Service Map

```mermaid
flowchart LR
  classDef router fill:#ffe0b2,stroke:#e65100,color:#333
  classDef agent fill:#e8f1ff,stroke:#1f6feb,color:#0b2c5c
  classDef planned fill:#fff3e0,stroke:#ff9800,color:#333,stroke-dasharray: 5 5
  classDef mcp fill:#e8f5e9,stroke:#2e7d32,color:#1b5e20

  subgraph Router["Intent Router"]
    R[Router<br/>Gemini 2.5 Pro<br/>Project Leader]:::router
  end

  R -- "submit to PM" --> PMAgent

  subgraph Infra["Infrastructure"]
    PMAgent[PM Agent<br/>Pro · 15 tools<br/>planning, dispatch,<br/>parallel dispatch,<br/>goal resolver, continuation,<br/>validation, tracking]:::agent
    InfoGath[Info Gathering<br/>Pro · no tools]:::agent
  end

  PMAgent -- "plan-driven dispatch<br/>(sequential or parallel)" --> InfoGath & Email & LinkedIn & Video & Social & BrBrief & CampBrief

  subgraph Eminence["Eminence Content (5 agents)"]
    Email[Email Campaign<br/>Pro · gen_img guide<br/>personas search]:::agent
    LinkedIn[LinkedIn Content<br/>Pro · gen_img guide<br/>personas search]:::agent
    Video[Video Storyboard<br/>Pro · gen_img<br/>guide search]:::agent
    Social[Social Strategy<br/>Pro · gen_img<br/>guide search]:::agent
    Review[Content Review<br/>Pro · guide]:::agent
  end

  Email -- "auto-review<br/>HandoffExecutor" --> Review
  LinkedIn -- "auto-review" --> Review
  Video -- "auto-review" --> Review

  subgraph BrandNaming["Brand Naming (7 agents)"]
    BrBrief[Brand Brief<br/>Pro · guide]:::agent
    BrNaming[Brand Naming<br/>Pro · guide search]:::agent
    BrLing[Linguistic Analysis<br/>Pro · search]:::agent
    BrVal[Validation & Messaging<br/>Pro · search]:::agent
    BrGov[Governance Review<br/>Pro · search]:::agent
    MktRes[Market Research<br/>Flash · search]:::agent
    DelInt[Deloitte Internal<br/>Flash · search]:::agent
  end

  %% Likely handoff paths (discovered, not hardcoded)
  BrBrief -. "likely" .-> BrNaming -. "likely" .-> BrLing
  BrLing -. "likely" .-> BrVal -. "likely" .-> BrGov
  MktRes -. "on-demand" .-> BrBrief & BrNaming
  DelInt -. "on-demand" .-> BrBrief & BrNaming

  subgraph CampaignPlanning["Campaign Planning (8 agents)"]
    CampBrief[Campaign Brief<br/>Pro · search]:::agent
    BriefVal[Brief Validator<br/>Pro]:::agent
    Strategy[Strategy<br/>Pro · personas search<br/>thinking]:::agent
    ExecPlan[Execution Planner<br/>Pro · personas search<br/>thinking]:::agent
    DelEvent[Deloitte Event Finder<br/>Flash · search]:::agent
    ExtEvent[External Event Finder<br/>Flash · search]:::agent
    Podcast[Podcast Finder<br/>Flash · search]:::agent
    Merger[Simple Merger<br/>Flash · no tools]:::agent
  end

  %% Campaign planning chain
  CampBrief -. "likely" .-> BriefVal -. "likely" .-> Strategy -. "likely" .-> ExecPlan
  DelEvent & ExtEvent & Podcast -. "parallel" .-> Merger
  Merger -. "feeds into" .-> ExecPlan

  PMAgent -. "validates all handoffs<br/>owns plan & dispatch" .-> Eminence & BrandNaming & CampaignPlanning

  %% Cross-workflow (emergent — Phase 5)
  BrGov -. "cross-workflow<br/>emergent" .-> Email & LinkedIn
  ExecPlan -. "cross-workflow<br/>emergent" .-> Email & LinkedIn & Video
```

> **Note**: Dashed arrows between agents are "likely" handoff paths
> based on `produces`/`requires` alignment — but agents discover these at runtime
> from peer cards, they are NOT hardcoded. An agent could skip steps, add steps,
> or invoke agents from a different domain based on what it learns.

## 4. Context Passing — What Flows Between Agents

```mermaid
flowchart LR
  classDef agent fill:#e8f1ff,stroke:#1f6feb,color:#0b2c5c
  classDef artifact fill:#f3e5f5,stroke:#7b1fa2,color:#4a148c
  classDef context fill:#fff2db,stroke:#d17b00,color:#5c3200
  classDef gcs fill:#e8f5e9,stroke:#2e7d32,color:#1b5e20

  A[Agent A]:::agent

  subgraph Bundle["A2A Task Message"]
    direction TB
    Artifact["Artifact<br/>(work product)<br/>GCS signed URL for large,<br/>inline TextPart for small"]:::artifact
    Context["Context Brief<br/>(LLM-distilled)<br/>• What I did<br/>• Why I did it<br/>• Key decisions made<br/>• Open questions<br/>• What you need to know"]:::context
  end

  A -- "invoke_peer()" --> Bundle
  Bundle -- "A2A task" --> B[Agent B]:::agent

  Artifact -- "large payloads" --> GCS["GCS<br/>workflows/id/type.json"]:::gcs
  GCS -- "signed URL in message" --> B
```

### Context brief vs raw dump

The context brief is **distilled by the agent's own LLM** — not a copy of the
entire conversation history. The agent summarizes what matters for the next
agent. This prevents context degradation across long chains.

```
Example context brief (Brand Brief → Brand Naming):

"I created a brand naming brief for Acme Corp, a B2B cybersecurity startup.
Key decisions: positioned as 'trusted guardian' archetype, excluded any
military/aggressive imagery per client constraint. Industry: cybersecurity.
Target audience: CISOs and IT directors at Fortune 500. Open question:
client mentioned potential international expansion but didn't confirm
markets — you may want to consider cross-language analysis for the names."
```

### What the specialist LLM actually sees (Phase 5 enrichment pipeline)

When PM dispatches a specialist, the executor automatically enriches the raw
A2A message text through three layers before it reaches the LLM:

```mermaid
flowchart TD
  classDef raw fill:#f5f5f5,stroke:#999,color:#333
  classDef enrich fill:#e8f1ff,stroke:#1f6feb,color:#0b2c5c
  classDef final fill:#e8f5e9,stroke:#2e7d32,color:#1b5e20

  Raw["Raw A2A message text<br/>'Write a LinkedIn post about tech trends'"]:::raw

  subgraph Pipeline["BaseAgentExecutor enrichment pipeline"]
    M["_enrich_with_metadata() (3D)<br/>+ Source: 'Assigned by PM Agent'<br/>+ Plan: 'Step 3 of 7'<br/>+ Completed: info_gathering, campaign_brief<br/>+ Artifacts: gs://...campaign_brief.json (5.3)<br/>+ Traceability: workflow_id, correlation_id"]:::enrich
    P["_enrich_with_peer_awareness() (5.1)<br/>+ Peer capability summaries:<br/>  email_agent → produces: email_draft<br/>  social_agent → produces: social_strategy<br/>  review_agent → produces: review_report"]:::enrich
    A["_enrich_with_artifact() (existing)<br/>+ Downloads GCS content<br/>+ Inlines artifact text"]:::enrich
  end

  Raw --> M --> P --> A

  Final["Enriched prompt → LLM<br/>(agent has full context to reason,<br/>propose plan changes,<br/>and produce quality output)"]:::final

  A --> Final
```

This is why a specialist can reason about the plan and propose changes — it
doesn't just see "Write a LinkedIn post." It sees its step number, what's been
completed, what artifacts are available (with GCS URIs), and what peer agents
exist in the mesh. Combined with the injected `propose_plan_update` and
`get_workflow_plan` tools (5.2), the specialist has both the **context to reason**
and the **tools to act**.

## 5. Brand Naming — Example of Emergent Flow

This shows how the brand naming pipeline works. The arrows represent
**likely** handoff paths based on `produces`/`requires` — but each agent
decides at runtime whether to follow, skip, or deviate.

```mermaid
flowchart TD
  classDef agent fill:#e8f1ff,stroke:#1f6feb,color:#0b2c5c
  classDef artifact fill:#f3e5f5,stroke:#7b1fa2,color:#4a148c
  classDef human fill:#fce4ec,stroke:#c62828,color:#b71c1c
  classDef pm fill:#e8f5e9,stroke:#2e7d32,color:#1b5e20
  classDef optional fill:#fff3e0,stroke:#ff9800,color:#333,stroke-dasharray: 5 5
  classDef decision fill:#fff2db,stroke:#d17b00,color:#5c3200

  IG[Info Gathering Agent]:::agent
  IG -- "brand_requirements +<br/>context brief" --> PM1{PM validates}:::pm
  PM1 -- "✅" --> BB[Brand Brief Agent]:::agent

  BB -- "brand_naming_brief +<br/>context brief" --> PM2{PM validates}:::pm
  PM2 -- "✅" --> BN[Brand Naming Agent]:::agent

  BN -- "brand_name_options" --> HC{Agent decides:<br/>human should pick}:::human
  HC -- "input-required status<br/>→ PM → Router → User" --> UserPick[User selects names]
  UserPick --> LA[Linguistic Analysis Agent]:::agent

  LA -- "linguistic_report +<br/>context brief" --> PM3{PM validates}:::pm
  PM3 -- "✅" --> VM[Validation & Messaging Agent]:::agent

  VM -- "validated_names +<br/>context brief" --> PM4{PM validates}:::pm
  PM4 -- "✅" --> GR[Governance Review Agent]:::agent

  GR -- "governance_report<br/>(final deliverable)" --> Done[✅ Complete]

  MR[Market Research Agent]:::optional -. "on-demand —<br/>any agent can request" .-> BB & BN & LA
  DI[Deloitte Internal Agent]:::optional -. "on-demand —<br/>any agent can request" .-> BB & BN

  %% Emergent: agent might decide it needs content creation
  GR -. "emergent:<br/>agent reads cards,<br/>decides to create<br/>launch content" .-> Cross[Email / LinkedIn / Video<br/>cross-workflow]:::decision
```

## 5b. Campaign Planning — Example of Emergent Flow

The campaign planning pipeline has a main chain (brief → validator → strategy →
exec planner) and a parallel content finder sub-pipeline (3 finders → merger →
exec planner). All handoffs go through PM validation.

```mermaid
flowchart TD
  classDef agent fill:#e8f1ff,stroke:#1f6feb,color:#0b2c5c
  classDef artifact fill:#f3e5f5,stroke:#7b1fa2,color:#4a148c
  classDef pm fill:#e8f5e9,stroke:#2e7d32,color:#1b5e20
  classDef parallel fill:#fff3e0,stroke:#ff9800,color:#333
  classDef decision fill:#fff2db,stroke:#d17b00,color:#5c3200

  IG[Info Gathering Agent]:::agent
  IG -- "campaign_requirements +<br/>context brief" --> PM1{PM validates}:::pm
  PM1 -- "✅" --> CB[Campaign Brief Agent]:::agent

  CB -- "campaign_brief +<br/>context brief" --> PM2{PM validates}:::pm
  PM2 -- "✅" --> BV[Brief Validator Agent]:::agent

  BV -- "validated_brief +<br/>context brief" --> PM3{PM validates}:::pm
  PM3 -- "✅" --> SA[Strategy Agent]:::agent

  SA -- "campaign_strategy +<br/>context brief" --> PM4{PM validates}:::pm
  PM4 -- "✅" --> EP[Execution Planner Agent]:::agent

  subgraph ContentPipeline["Content Discovery (parallel)"]
    DEF[Deloitte Event Finder]:::parallel
    EEF[External Event Finder]:::parallel
    PF[Podcast Finder]:::parallel
  end

  DEF & EEF & PF -- "dispatch_parallel_agents<br/>(5.4 fan-out)" --> PM5{PM validates}:::pm
  PM5 -- "✅" --> SM[Simple Merger Agent]:::agent
  SM -- "consolidated_findings +<br/>context brief" --> PM6{PM validates}:::pm
  PM6 -- "feeds into" --> EP

  EP -- "execution_plan<br/>(final deliverable)" --> Done[✅ Complete]

  %% Cross-workflow: exec planner can invoke content agents
  EP -. "emergent:<br/>reads peer cards,<br/>invokes content agents<br/>for deliverable creation" .-> Cross[Email / LinkedIn / Video<br/>cross-workflow]:::decision
```

> **Content pipeline**: The 3 finder agents (Deloitte Events, External Events,
> Podcasts) run in parallel (`parallelizable: true` in agent cards). PM dispatches
> them simultaneously using `dispatch_parallel_agents` (5.4), which fans out via
> `asyncio.gather` and collects all results before advancing. Their outputs feed into
> the Simple Merger, which consolidates findings with cross-references and insights.

## 5c. Parallel Dispatch — How PM Handles Independent Steps (5.4)

When plan steps share the same `parallel_group` (computed by Kahn's topological
sort from `produces`/`requires` in agent cards), PM uses `dispatch_parallel_agents`
instead of dispatching sequentially.

```mermaid
sequenceDiagram
  participant PM as PM Agent
  participant Tool as dispatch_parallel_agents
  participant DEF as Deloitte Event Finder
  participant EEF as External Event Finder
  participant PF as Podcast Finder
  participant DB as Cloud SQL

  PM->>PM: Reads plan: steps 4-6 share parallel_group=2
  PM->>Tool: dispatch_parallel_agents(<br/>agents_json=[DEF, EEF, PF],<br/>workflow_id, correlation_id)

  par Fan-out (asyncio.gather)
    Tool->>DEF: A2A stream: "Find Deloitte events..."
    Tool->>EEF: A2A stream: "Find external events..."
    Tool->>PF: A2A stream: "Find podcasts..."
  end

  DEF-->>Tool: ✅ deloitte_events artifact
  EEF-->>Tool: ✅ external_events artifact
  PF-->>Tool: ✅ podcasts artifact

  Note over Tool: Fan-in: sequential bookkeeping
  Tool->>DB: record_step_completion(DEF)
  Tool->>DB: record_step_completion(EEF)
  Tool->>DB: record_step_completion(PF)
  Tool->>DB: advance_step (×3)

  Tool-->>PM: Summary: 3/3 succeeded,<br/>artifacts: [deloitte_events, external_events, podcasts]

  PM->>PM: Next step: Simple Merger (sequential)
```

### How `parallel_group` is assigned

The `ExecutionPlanner` uses Kahn's topological sort on the `produces`/`requires`
dependency graph. Agents whose dependencies are all satisfied at the same
topological level AND whose cards have `parallelizable: true` receive the
same `parallel_group` number. PM serialization (5.4a) threads this into the
plan so `dispatch_parallel_agents` knows which steps to fan out together.

### PM prompt decision logic

| Condition | PM action |
|-----------|-----------|
| Next step is **sequential** (no `parallel_group` or unique group) | Use `dispatch_agent` (single dispatch) |
| Next steps share a **`parallel_group`** | Use `dispatch_parallel_agents` (fan-out/fan-in) |
| Mixed (some parallel, some sequential at barrier) | Dispatch parallel group first, then sequential after fan-in |

## 5d. Artifact Versioning & Cross-Workflow Access (5.13–5.15)

Artifacts are the **primary data contract** between agents.  Phase 5D adds
versioned storage, per-agent production tracking, and cross-workflow resolution.

### GCS Path Layout

```
gs://adk-a2a-poc-artifacts/
  └── workflows/{workflow_id}/
      ├── brand_brief_agent_brand_brief.json          ← flat (backward-compat alias)
      └── brand_brief_agent_brand_brief/
          ├── v1.json                                  ← versioned (primary)
          ├── v2.json                                  ← revision
          └── v3.json
```

### Component Map

| Component | Module | Purpose |
|-----------|--------|---------|
| `GcsArtifactClient.upload_versioned()` | `gcs_artifact_client.py` | Write to `…/{name}/v{N}.json` path |
| `GcsArtifactClient.list_versions()` | `gcs_artifact_client.py` | Scan GCS prefix, return `[(version, uri)]` |
| `GcsArtifactClient.get_latest_version_uri()` | `gcs_artifact_client.py` | Highest `(version, uri)` or `None` |
| `ArtifactRepository.get_latest()` | `artifacts/repository.py` | Highest-version DB record for (wf, agent, type) |
| `ArtifactRepository.get_versions()` | `artifacts/repository.py` | All version records ascending |
| `ArtifactRepository.query_cross_workflow()` | `artifacts/repository.py` | Find artifacts by type across ALL workflows |
| `ArtifactRepository.find_by_uri()` | `artifacts/repository.py` | Look up record by GCS URI |
| `ArtifactStore.resolve_artifact_ref()` | `artifacts/service.py` | Flexible ref resolution: `gs://…`, `{wf}:{type}`, UUID |
| `ProducerArtifactTracker` | `artifact_state.py` | Per-agent wrapper: `get_latest`, `current_version`, `get_history`, `record_production` |
| `build_plan_context(extra_artifacts=…)` | `plan_context.py` | PM threads cross-workflow artifact URIs into dispatch metadata |

### Revision Flow

```mermaid
sequenceDiagram
    participant PM as PM Agent
    participant Spec as Specialist Agent
    participant GCS as GCS Bucket
    participant DB as Artifacts Table

    PM->>Spec: dispatch("revise the email intro")
    Note over Spec: ProducerArtifactTracker.current_version() → 1
    Spec->>GCS: upload_versioned(…, version=2)
    GCS-->>Spec: gs://…/email_agent_email_html/v2.json
    Spec->>DB: insert(version=2, gcs_uri=…)
    Spec-->>PM: COMPLETION_METADATA {artifact_uri: "gs://…/v2.json"}
    PM->>PM: _persist_available_artifacts (merges v2 URI)
```

## 6. Cross-Workflow Composition (Phase 5 — Emergent)

This is the payoff of the mesh. Agents aren't siloed in workflows — they
can invoke peers from any domain based on what they discover.

```mermaid
flowchart LR
  classDef brand fill:#e8f1ff,stroke:#1f6feb,color:#0b2c5c
  classDef content fill:#fff2db,stroke:#d17b00,color:#5c3200
  classDef campaign fill:#f3e5f5,stroke:#7b1fa2,color:#4a148c
  classDef emergent fill:#fce4ec,stroke:#c62828,color:#b71c1c,stroke-dasharray: 5 5

  subgraph BN["Brand Naming Domain"]
    Gov[Governance Review<br/>produces: governance_report]:::brand
  end

  subgraph CP["Campaign Planning Domain"]
    ExecPlan[Execution Planner<br/>produces: execution_plan]:::campaign
    CampBrief2[Campaign Brief<br/>produces: campaign_brief]:::campaign
    Strategy2[Strategy<br/>produces: campaign_strategy]:::campaign
  end

  subgraph EC["Eminence Content Domain"]
    Email[Email Agent]:::content
    LinkedIn[LinkedIn Agent]:::content
    Video[Video Agent]:::content
  end

  %% Cross-workflow: governance report → launch content
  Gov -. "Agent reads peer cards:<br/>'Email Agent can create launch emails<br/>from brand context. I should invoke it.'" .-> Email:::emergent
  Gov -. "emergent" .-> LinkedIn:::emergent

  %% Campaign → content creation
  ExecPlan -. "Strategy says '10 emails,<br/>5 LinkedIn posts, 2 videos'<br/>→ reads peer cards<br/>→ invokes content agents" .-> Email & LinkedIn & Video

  %% New agent drops in
  NewAgent["🆕 New Agent<br/>(just deployed)"]:::emergent
  NewAgent -. "Drop card with<br/>requires: [governance_report]<br/>→ Gov discovers it<br/>at next card refresh" .-> Gov
```

> **This is NOT orchestration.** No code change is needed. The Governance agent's
> LLM reads peer cards, sees that Email Agent accepts brand context as input,
> and decides to invoke it. The Execution Planner reads its strategy output,
> sees that content agents can produce the deliverables, and invokes them in
> parallel. A new agent deployed to the mesh is discoverable at the next
> card refresh (5-min TTL).

### 6b. Cross-Workflow Composition Infrastructure (5B)

The PM has three tool-level mechanisms for cross-workflow composition:

| Mechanism | Tool | When used |
|-----------|------|-----------|
| **Artifact-first planning** | `resolve_goal_agents` | Start of workflow — PM maps user intent to goal artifacts, backward-chains to discover full agent pipeline across domains |
| **Composite workflow creation** | `plan_and_create_workflow` with `workflow_type="composite"` | When `resolve_goal_agents` returns agents from multiple domains (e.g. brand + content) |
| **Mid-workflow scope expansion** | `continue_workflow` | When a specialist's output reveals additional deliverables not in the original plan |

```mermaid
sequenceDiagram
  participant User
  participant PM as PM Agent
  participant Catalog as Artifact Catalog<br/>(backward_chain)
  participant Planner as ExecutionPlanner
  participant DB as workflow_state

  User->>PM: "Name a brand and create launch emails"

  Note over PM: Decision: No active workflow → use resolve_goal_agents
  PM->>Catalog: resolve_goal_agents(["brand_name_candidates",<br/>"governance_report", "email_content"])
  Catalog->>Catalog: backward_chain() traces pre-requisites:<br/>email_content ← email_agent (requires: campaign_strategy?)<br/>brand_name_candidates ← brand_naming_agent (requires: brand_brief)<br/>governance_report ← governance_agent (requires: validated_names)
  Catalog-->>PM: required_agents: [brand_brief, brand_naming,<br/>linguistic, validation, governance, email_agent]

  PM->>Planner: plan_and_create_workflow(agents, type="composite")
  Planner->>Planner: Topological sort across domains<br/>Auto-detects composite (brand_naming + eminence)
  Planner-->>DB: Workflow created (plan_version=1)
  PM->>PM: Dispatches step 1...

  Note over PM: Mid-workflow: governance output suggests LinkedIn launch
  PM->>PM: continue_workflow(["linkedin_content"],<br/>reason="governance output suggests launch content")
  Note over PM: backward_chain → filter duplicates → plan → mutate_plan<br/>correlation_id threaded for audit trail
  PM-->>DB: Plan extended (+linkedin_agent), plan_version=2
```

> **Key design**: `resolve_goal_agents` and `continue_workflow` both use the
> same `backward_chain` from `artifact_catalog` — a pure-Python dependency
> graph derived from agent cards' `produces`/`requires`. No LLM calls in the
> resolution path. The planner's `plan()` method auto-detects `composite`
> workflow type when agents span multiple domains (Kahn's topological sort).

## 7. Eminence Content — PM-Validated Handoff Pattern (Live)

All content producers use `HandoffExecutor` which routes through PM validation
before dispatching to downstream peers (replaced the hardcoded `ContentProducerExecutor`
auto-review pattern).

```mermaid
flowchart LR
  classDef agent fill:#e8f1ff,stroke:#1f6feb,color:#0b2c5c
  classDef review fill:#e8f5e9,stroke:#2e7d32,color:#1b5e20
  classDef pm fill:#fff2db,stroke:#d17b00,color:#5c3200

  E[Email Agent<br/>HandoffExecutor]:::agent -- "PM-validated<br/>handoff" --> PM{PM Agent}:::pm
  L[LinkedIn Agent<br/>HandoffExecutor]:::agent -- "PM-validated" --> PM
  V[Video Agent<br/>HandoffExecutor]:::agent -- "PM-validated" --> PM
  S[Social Strategy Agent<br/>BaseAgentExecutor]:::agent -. "standalone<br/>(review on request)" .-> R[Content Review Agent]:::review

  PM -- "proceed" --> R
  PM -- "proceed" --> S2[Social Strategy Agent]:::agent
```

## 8. PM Agent — Validation & Planning Protocol

The PM Agent is the single authority for planning, execution state, and dispatch.
It validates handoffs, tracks progress, and manages plan evolution.

### PM Agent Tool Suite (15 tools)

| Tool | Purpose |
|------|---------|  
| `plan_and_create_workflow` | Compound tool: build plan from dependency graph + create workflow in one call. Supports `workflow_type="composite"` for multi-domain plans |
| `create_execution_plan` | Build initial plan from dependency graph (assigns `parallel_group`) |
| `create_workflow` | Persist a pre-built plan as a trackable workflow |
| `record_step_completion` | Record agent completion with artifact info |
| `record_issue` | Log issues detected during validation |
| `update_living_summary` | Maintain human-readable workflow narrative |
| `get_workflow_progress` | Query current workflow state |
| `get_correlation_status` | Aggregate status across all workflows in a correlation |
| `propose_plan_update` | Structurally validate and apply plan mutations |
| `get_workflow_plan` | Query plan context for any workflow |
| `resolve_goal_agents` | Artifact-first pipeline discovery — backward-chains through artifact catalog to find all required agents (5B) |
| `continue_workflow` | Mid-workflow scope expansion — backward-chain → filter duplicates → plan → mutate_plan atomically. Threads `correlation_id` for audit trail (5B) |
| `list_mesh_agents` | Discover agents in the mesh (filter by workflow/produces/requires) |
| `dispatch_agent` | Dispatch a single specialist with plan context and artifact URIs |
| `dispatch_parallel_agents` | Fan-out independent steps via `asyncio.gather`, fan-in with sequential bookkeeping (5.4) |

### Specialist Agent Tools (auto-injected by HandoffExecutor, 5.2)

Every specialist using `HandoffExecutor` automatically receives two tools
injected in `__init__` **before** `Runner` creation — no per-agent config needed:

| Tool | Purpose |
|------|---------|  
| `propose_plan_update` | Propose new steps (validated through 5 structural gates + optimistic concurrency) |
| `get_workflow_plan` | Query current plan to get `plan_version`, step statuses, and available artifacts |

**How it works**: `HandoffExecutor.__init__` auto-builds a `WorkflowTracker`
from `DB_INSTANCE` / `DB_NAME` / `DB_USER` env vars, then calls
`_inject_proposal_tools(agent, workflow_tracker)` to append both tools.
Double-injection is guarded. If env vars are missing (tests, non-DB agents),
injection is silently skipped.

### Handoff Validation Protocol

```mermaid
stateDiagram-v2
  [*] --> HandoffDeclared: Agent A finishes and declares intent

  HandoffDeclared --> PMValidates: PM receives handoff event

  PMValidates --> Approved: Context complete, artifacts match, plan aligned
  PMValidates --> IssueDetected: Missing context, misalignment, or plan conflict

  Approved --> AgentBReceives: Artifact + context brief + plan context forwarded

  IssueDetected --> CorrectiveToA: PM tells Agent A what is off
  IssueDetected --> TransparencyToRouter: PM notifies Router of correction

  CorrectiveToA --> AgentAFixes: Agent A course corrects
  AgentAFixes --> PMValidates: Resubmits

  CorrectiveToA --> RetryExhausted: Max retries reached
  RetryExhausted --> EscalateToRouter: PM escalates to Router

  AgentBReceives --> [*]: Agent B does its work and cycle repeats
  EscalateToRouter --> [*]: Router decides next action
```

## 9. Plan Evolution — Living Plans (D34)

Plans are living documents. Any agent can propose mutations via the
`propose_plan_update` tool. Specialist agents call this tool **directly**
(injected by `HandoffExecutor`, 5.2) — the 5 structural validation gates
run in-process, then the mutation is applied atomically with optimistic
concurrency (`plan_version`). PM sees the updated plan on its next turn
and decides whether to dispatch the new steps.

```mermaid
sequenceDiagram
  participant Agent as Specialist Agent (mid-workflow)
  participant Tool as propose_plan_update (in-process)
  participant DB as workflow_state (Cloud SQL)
  participant PM as PM Agent (next turn)

  Note over Agent: Agent sees peer capabilities (5.1)<br/>+ plan context in prompt (3D)
  Agent->>Agent: LLM reasons: "This campaign<br/>also needs an SEO audit"
  Agent->>Tool: get_workflow_plan(workflow_id)
  Tool->>DB: SELECT execution_plan, plan_version
  DB-->>Tool: plan_version=3, steps=[...]
  Tool-->>Agent: {plan_version: 3, steps: [...], available_artifacts: {...}}

  Agent->>Tool: propose_plan_update(workflow_id,<br/>'[{"agent": "seo_agent", "description": "SEO audit"}]',<br/>reason="Campaign needs SEO", plan_version=3)
  Tool->>Tool: Gate 1: seo_agent exists in AgentCatalog?
  Tool->>Tool: Gate 2: plan_version == 3 (current)?
  Tool->>Tool: Gate 3: Dependencies satisfiable?
  Tool->>Tool: Gate 4: No duplicates?
  Tool->>Tool: Gate 5: insert_after >= current_step?

  alt All gates pass
    Tool->>DB: mutate_plan(additions, plan_version=3)
    DB-->>Tool: plan_version=4, updated plan
    Tool-->>Agent: {status: accepted, new_plan_version: 4, added_agents: ["seo_agent"]}
    Note over Agent: Agent continues its primary work
    Note over PM: Next turn: PM sees plan v4<br/>with new seo_agent step,<br/>decides when to dispatch it
  else Gate fails
    Tool-->>Agent: {status: rejected, reason: "Stale plan_version: you sent 3, current is 4"}
    Note over Agent: Agent can re-read plan and retry
  end
```

> **Key change from prior design**: Specialists call `propose_plan_update`
> and `get_workflow_plan` directly as ADK tools — the 5 structural gates
> run in-process (pure Python, not LLM). PM is NOT in the proposal loop;
> it sees the already-validated mutation on its next turn and decides
> dispatch. This avoids making PM a bottleneck for every proposal.

### Guardrails

| Type | Guard | Enforced by |
|------|-------|-------------|
| **Structural** | Agent must exist in `AgentCatalog` | Code (`if` statement) |
| **Structural** | `plan_version` must match (optimistic concurrency) | Code |
| **Structural** | `requires` must be `produces`'d by upstream steps | Code |
| **Structural** | No duplicate agent at same position | Code |
| **Structural** | Cannot insert before `current_step` (history immutable) | Code |
| **PM judgment** | Plan getting large? Decompose into child workflows | LLM |
| **PM judgment** | Scope creep? Reject proposal with reason | LLM |
| **Infrastructure** | Cloud Run request timeout (900s router, 600s agents) | Cloud Run |

## 10. Agent Observability — What Each Agent Produces

Every agent automatically emits streaming events and OTel spans through the
shared executor infrastructure. No agent-specific code is needed — the
`BaseAgentExecutor` handles all observability concerns.

### Executor Event Loop — What Happens Inside `execute()`

```mermaid
flowchart TD
  classDef exec fill:#e8f1ff,stroke:#1f6feb,color:#0b2c5c
  classDef event fill:#fff2db,stroke:#d17b00,color:#5c3200
  classDef otel fill:#f3e5f5,stroke:#7b1fa2,color:#4a148c
  classDef ctx fill:#e8f5e9,stroke:#2e7d32,color:#1b5e20

  Start["execute() called<br/>with A2A RequestContext"]:::exec

  subgraph Setup["Setup Phase"]
    SetCV["set_event_queue(queue)<br/>ContextVar for this execution"]:::ctx
    StartSpan["tracer.start_span('agent.execute')<br/>attrs: agent.name, task.id,<br/>correlation_id, workflow_id"]:::otel
    InitEvent["Emit: '{agent}: Processing request...'<br/>TaskState.working"]:::event
  end

  Start --> Setup

  subgraph Loop["run_async() Event Loop"]
    direction TB
    Scan["Scan each content part<br/>from ADK LlmAgent"]:::exec

    ToolCall{"function_call?"}:::exec
    EmitTool["Emit: '[{elapsed}s] {agent}:<br/>Calling tool: {name}...'"]:::event

    Thought{"thought=True?"}:::exec
    EmitThought["Emit: '[{elapsed}s] {agent}<br/>reasoning: {summary}'<br/>(truncated at 200 chars)"]:::event

    Text{"text response?"}:::exec
    EmitDone["Emit: TaskState.completed<br/>with full response"]:::event
  end

  Setup --> Loop
  Scan --> ToolCall
  ToolCall -- "yes" --> EmitTool --> Scan
  ToolCall -- "no" --> Thought
  Thought -- "yes" --> EmitThought --> Scan
  Thought -- "no" --> Text
  Text -- "yes" --> EmitDone
  Text -- "no" --> Scan

  subgraph Teardown["Teardown Phase"]
    EndSpan["span.end()<br/>OTel span completed"]:::otel
    ResetCV["reset_event_queue(token)<br/>ContextVar restored"]:::ctx
  end

  EmitDone --> Teardown
```

### LLM Configuration — Centralized Per-Agent Settings

All 23 agents pull their LLM configuration from `agents/shared/config/llm_config.py`.
The 4-level resolution hierarchy means production can override any agent's model
without code changes:

```
Resolution order (first match wins):
  1. LLM_MODEL_{AGENT_NAME}   — env var per agent (e.g. LLM_MODEL_ROUTER)
  2. _AGENT_MODELS[agent]     — code default per agent (e.g. market_research → flash)
  3. LLM_DEFAULT_MODEL        — env var global override
  4. _GLOBAL_DEFAULT_MODEL    — hardcoded constant (gemini-2.5-pro)
```

| Agent Group | Default Model | Thinking | Tool Config |
|-------------|---------------|----------|-------------|
| Router | Gemini 2.5 Pro | `include_thoughts=True` | `FunctionCallingConfig(mode=AUTO)` |
| PM Agent | Gemini 2.5 Pro | `include_thoughts=True` | — |
| Content agents (5) | Gemini 2.5 Pro | — | — |
| Brand naming agents (5) | Gemini 2.5 Pro | — | — |
| Campaign Brief + Brief Validator | Gemini 2.5 Pro | — | — |
| Strategy Agent | Gemini 2.5 Pro | `include_thoughts=True` | — |
| Execution Planner | Gemini 2.5 Pro | `include_thoughts=True` | — |
| Event/Podcast Finders (3) | Gemini 2.5 Flash | — | — |
| Simple Merger | Gemini 2.5 Flash | — | — |
| Market Research | Gemini 2.5 Flash | — | — |
| Deloitte Internal | Gemini 2.5 Flash | — | — |
| Info Gathering | Gemini 2.5 Pro | — | — |
