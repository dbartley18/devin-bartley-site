# Marketing Workbench — V3 Full Mesh Architecture Plan

> **Status**: ACTIVE — Phases 0–3 complete, Phase 3A in progress  
> **Created**: 2025-07-22  
> **Last Updated**: 2026-02-20 (D27 B+C coordination model, D28 PM dual-notification, brand naming deployed)  
> **Author**: Architecture Team  
> **Supersedes**: `eminence_agent_a2a_refactor_plan.md` (hub-and-spoke model)

---

## Executive Summary

This document defines the **V3 Full Mesh** architecture for the Marketing Workbench — a system of **22+ autonomous agents** spanning three marketing workflows (Eminence Content, Brand Naming, Campaign Planning). Every agent is both an **A2A Server** (accepts tasks) and an **A2A Client** (invokes peers), enabling true peer-to-peer collaboration without a monolithic orchestrator.

A thin **Intent Router** registers in Gemini Enterprise as the single entry point. It reads extended agent cards, builds a dependency graph, plans execution, and kicks off the first agent in a chain — after which agents hand off to each other directly.

### Key Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Topology | Full mesh (V3) | Maximizes A2A; agents self-organize |
| Orchestration | Choreography, not orchestration | Router starts the chain; agents drive handoffs |
| Entry point | Intent Router in Gemini Enterprise | Single surface; user never sees agent internals |
| Agent cards | Extended (produces/requires/feedsInto) | Only router reads them — no spec constraint |
| Artifact passing | GCS bucket + signed URLs | Large payloads, cross-agent, durable |
| State model | Two-layer (workflow + task) | Router owns workflow; agents own task |
| Workflow definition | Emergent from dependency graph | No hardcoded step sequences |

---

## Table of Contents

1. [Full Agent Inventory](#1-full-agent-inventory)
2. [Dependency Graphs](#2-dependency-graphs)
3. [V3 Mesh Architecture](#3-v3-mesh-architecture)
4. [Extended Agent Card Schema](#4-extended-agent-card-schema)
5. [Intent Router Design](#5-intent-router-design)
6. [Artifact & State Model](#6-artifact--state-model)
7. [Adaptive Learning & Delegated Dispatch](#7-adaptive-learning--delegated-dispatch)
8. [Infrastructure & Deployment](#8-infrastructure--deployment)
9. [Implementation Phases](#9-implementation-phases)
10. [Risk Assessment](#10-risk-assessment)
11. [Success Criteria](#11-success-criteria)

---

## 1. Full Agent Inventory

### 1.1 Eminence Content Agents (deployed — Cloud Run)

These 5 agents are **already running** as independent A2A services on Cloud Run.

| # | Agent | Cloud Run Service | Model | Purpose | Tools (MCP) |
|---|-------|-------------------|-------|---------|-------------|
| 1 | **Email Campaign Agent** | `email-agent-dev` | gemini-2.5-pro | Email copy, drip sequences, nurture campaigns | `generate_image`, `guidelines_reader`, `lookup_personas`, `google_search` |
| 2 | **LinkedIn Content Agent** | `linkedin-agent-dev` | gemini-2.5-pro | LinkedIn posts, articles, carousels, TLAs | `generate_image`, `guidelines_reader`, `lookup_personas`, `google_search` |
| 3 | **Video Storyboard Agent** | `video-agent-dev` | gemini-2.5-pro | Video scripts, storyboards, scene imagery | `generate_image`, `guidelines_reader`, `google_search` |
| 4 | **Social Strategy Agent** | `social-agent-dev` | gemini-2.5-pro | Cross-platform campaign plans, posting calendars | `generate_image`, `guidelines_reader`, `google_search` |
| 5 | **Content Review Agent** | `review-agent-dev` | gemini-2.5-pro | Compliance review, brand audit, guideline checks | `guidelines_reader` |

### 1.2 Brand Naming Agents (✅ deployed)

Extracted from monolithic ADK app into 7 independent A2A services. All deployed to Cloud Run.

| # | Agent | Purpose | Tools | Notes |
|---|-------|---------|-------|-------|
| 6 | **Brand Brief Agent** | Generates Brand Naming Brief from gathered requirements | `guidelines_reader` | Entry point for brand naming flow |
| 7 | **Brand Naming Agent** | Generates 50+ compliant brand name options by category | `guidelines_reader`, `google_search` | Verifies names against existing Deloitte offerings |
| 8 | **Brand Linguistic Analysis Agent** | Phonetic, memorability, cross-language, cultural analysis | `google_search` | Scores each name 0-5 across 4 dimensions |
| 9 | **Brand Validation & Messaging Agent** | Domain checks, surveys, messaging framework, taglines | — | Multi-task: 5 modes per invocation |
| 10 | **Brand Governance Review Agent** | Deloitte brand compliance audit (Approved/Revisions/Rejected) | — | Final gate; rule-based |
| 11 | **Market Research Agent** | Competitive landscape, trends, strategic opportunities | `google_search` | Optional; on-demand |
| 12 | **Deloitte Internal Search Agent** | Internal capabilities, services, case studies alignment | `google_search` | Optional; site:deloitte.com |

### 1.3 Campaign Planning Agents (to be deployed)

Currently a monolithic ADK app with intent-based routing. Each must become an independent A2A service.

| # | Agent | Purpose | Tools | Notes |
|---|-------|---------|-------|-------|
| 13 | **Campaign Brief Agent** | Gathers 13 mandatory + 10 optional fields for campaign brief | `google_search`, `generate_word_doc` | Produces .docx with signed URL |
| 14 | **Brief Validator Agent** | Validates brief for completeness, consistency, feasibility | `google_search`, `generate_word_doc` | 8 validation categories |
| 15 | **Strategy Agent** | Persona-driven marketing strategy with competitive positioning | `google_search`, `persona_library` | Uses persona_library for exec personas |
| 16 | **Execution Planner Agent** | Tactical execution plan with timelines, resources, risk | `persona_library`, Deloitte content pipeline | Triggers content orchestration |
| 17 | **Deloitte Event Finder Agent** | Finds internal Deloitte events aligned with campaign | `google_search` | Writes to shared state |
| 18 | **External Event Finder Agent** | Finds external industry events for networking/showcase | `google_search` | Writes to shared state |
| 19 | **Deloitte Podcast Finder Agent** | Finds Deloitte podcasts aligned with campaign themes | `google_search` | Writes to shared state |
| 20 | **Simple Merger Agent** | Consolidates event + podcast findings into single report | — | Reads from shared state |

### 1.4 Infrastructure Agents

| # | Agent | Purpose | Status |
|---|-------|---------|--------|
| 21 | **Intent Router** | Gemini Enterprise entry point; plans & initiates workflows | ✅ Deployed |
| 22 | **Information Gathering Agent** | Conversational intake — collects requirements before workflow | ✅ Deployed |
| 23 | **PM Agent** | Handoff validation, progress tracking, conflict detection, escalation (D27/D28) | ⬜ Phase 3A |

### 1.5 Agent Count Summary

| Workflow | Agents | Status |
|----------|--------|--------|
| Eminence Content | 5 | ✅ Deployed on Cloud Run |
| Brand Naming | 7 | ✅ Deployed on Cloud Run (leaf nodes — mesh wiring in Phase 3A) |
| Campaign Planning | 8 | ⬜ Monolithic — needs decomposition (Phase 4) |
| Infrastructure | 3 | 🟡 2 deployed, PM Agent planned (Phase 3A) |
| **Total** | **23** | |

---

## 2. Dependency Graphs

### 2.1 Eminence Content — Loosely Coupled

Eminence agents are mostly **independent peers** — any can be invoked standalone. Cross-agent value emerges from composition:

```
                    ┌──────────────────┐
                    │  Content Review  │
                    │     Agent        │
                    └────────▲─────────┘
                             │ reviews
          ┌──────────────────┼──────────────────┐
          │                  │                  │
   ┌──────┴──────┐  ┌───────┴──────┐  ┌───────┴──────┐
   │  LinkedIn   │  │    Email     │  │    Video     │
   │  Content    │  │  Campaign    │  │  Storyboard  │
   │   Agent     │  │    Agent     │  │    Agent     │
   └─────────────┘  └──────────────┘  └──────────────┘
                             │
                    ┌────────▼─────────┐
                    │  Social Strategy │
                    │     Agent        │
                    └──────────────────┘
```

**Cross-agent flows:**
- `LinkedIn Agent` → `Content Review Agent` (review LinkedIn posts)
- `Email Agent` → `Content Review Agent` (review email copy)
- `LinkedIn Agent` + `Email Agent` → `Social Strategy Agent` (plan distribution of created content)
- `Video Agent` → `Content Review Agent` (review video scripts)

### 2.2 Brand Naming — Sequential Pipeline

Brand naming follows a strict sequential flow with user checkpoints:

```
┌─────────────────┐
│  Info Gathering  │  (collect 5 inputs from user)
│     Agent        │
└────────┬────────┘
         ▼
┌─────────────────┐     ┌─────────────────┐
│  Brand Brief    │     │ Market Research  │  (optional, any time)
│     Agent       │     │     Agent        │
└────────┬────────┘     └─────────────────┘
         ▼
┌─────────────────┐     ┌─────────────────┐
│  Brand Naming   │     │ Deloitte Internal│  (optional, any time)
│     Agent       │     │  Search Agent    │
└────────┬────────┘     └─────────────────┘
         ▼
   [User selects 5-10 names]
         ▼
┌─────────────────┐
│  Linguistic     │
│  Analysis Agent │
└────────┬────────┘
         ▼
┌─────────────────┐
│  Validation &   │
│  Messaging Agent│
└────────┬────────┘
         ▼
┌─────────────────┐
│  Governance     │
│  Review Agent   │
└─────────────────┘
```

**Artifact flow:**
1. `Info Gathering` → `brand_requirements` → `Brand Brief Agent`
2. `Brand Brief Agent` → `brand_naming_brief` → `Brand Naming Agent`
3. `Brand Naming Agent` → `brand_name_options` → User selection → `Linguistic Analysis Agent`
4. `Linguistic Analysis Agent` → `linguistic_report` → `Validation & Messaging Agent`
5. `Validation & Messaging Agent` → `validated_names` → `Governance Review Agent`
6. `Governance Review Agent` → `governance_report` (final deliverable)

### 2.3 Campaign Planning — DAG with Optional Branch

Campaign planning follows a DAG with an optional content-research branch:

```
┌─────────────────┐
│  Info Gathering  │  (collect campaign requirements)
│     Agent        │
└────────┬────────┘
         ▼
┌─────────────────┐
│  Campaign Brief │
│     Agent       │
└────────┬────────┘
         ▼
┌─────────────────┐
│  Brief Validator│
│     Agent       │
└────────┬────────┘
         ▼
┌─────────────────┐
│  Strategy Agent │
└────────┬────────┘
         ▼
┌─────────────────┐
│  Execution      │
│  Planner Agent  │
└────────┬────────┘
         │
         ├──► (optional, user-approved)
         │    ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
         │    │ Deloitte     │  │  External    │  │  Deloitte    │
         │    │ Event Finder │  │  Event Finder│  │  Podcast     │
         │    │              │  │              │  │  Finder      │
         │    └──────┬───────┘  └──────┬───────┘  └──────┬───────┘
         │           └─────────────────┼─────────────────┘
         │                             ▼
         │                    ┌──────────────┐
         │                    │ Simple Merger│
         │                    └──────┬───────┘
         │                           │
         └───────────────────────────┘
                      ▼
              [Final Execution Plan]
```

**Artifact flow:**
1. `Info Gathering` → `campaign_requirements` → `Campaign Brief Agent`
2. `Campaign Brief Agent` → `campaign_brief` (+ .docx) → `Brief Validator Agent`
3. `Brief Validator Agent` → `validated_brief` → `Strategy Agent`
4. `Strategy Agent` → `campaign_strategy` → `Execution Planner Agent`
5. `Execution Planner Agent` triggers content pipeline (3 finders → `Simple Merger`)
6. `Simple Merger` → `content_report` → back to `Execution Planner Agent`

### 2.4 Cross-Workflow Composition

The real power of the mesh is **cross-workflow** agent composition. Examples:

| Scenario | Flow |
|----------|------|
| "Name a brand and create a launch campaign" | Brand Naming pipeline → Campaign Planning pipeline (brand_naming_brief feeds campaign_brief context) |
| "Create LinkedIn posts for our brand launch" | Brand Naming → brand deliverables → LinkedIn Agent |
| "Plan a campaign and write the email sequence" | Campaign Planning → campaign_strategy → Email Agent |
| "Create all content for this campaign" | Campaign Planning → execution_plan → Email Agent + LinkedIn Agent + Video Agent (parallel) → Social Strategy Agent → Content Review Agent |
| "Review the campaign brief content" | Campaign Brief Agent → Content Review Agent |

These flows emerge naturally from the dependency graph — no hardcoded orchestration needed.

---

## 3. V3 Mesh Architecture

### 3.1 Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  GEMINI ENTERPRISE                                                              │
│  ┌───────────────────────────────────────────────────────────────────────────┐  │
│  │  Only sees: "Marketing Workbench"                                         │  │
│  │  Routes all marketing requests to the Intent Router                       │  │
│  └──────────────────────────────┬────────────────────────────────────────────┘  │
│                                 │ A2A (single registered agent)                 │
│                                 ▼                                               │
│  ┌──────────────────────────────────────────────────────────────────────────────┐│
│  │                         INTENT ROUTER                                       ││
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌───────────────┐   ││
│  │  │ Agent Card   │  │ Dependency   │  │ LLM Intent   │  │ Workflow      │   ││
│  │  │ Registry     │  │ Graph Builder│  │ Classifier   │  │ State Tracker │   ││
│  │  └──────────────┘  └──────────────┘  └──────────────┘  └───────────────┘   ││
│  └──────────────────────────────┬───────────────────────────────────────────────┘│
│                                 │                                               │
│                    A2A Protocol │ (peer-to-peer from here on)                   │
│                                 │                                               │
│  ┌──────────────────────────────┼──────────────────────────────────────────────┐│
│  │  AGENT MESH (Cloud Run)      │                                              ││
│  │                              ▼                                              ││
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐             ││
│  │  │LinkedIn │◄┤►Email   │◄┤►Video   │◄┤►Social  │◄┤►Review  │  Eminence   ││
│  │  │ Agent   │ │ Agent   │ │ Agent   │ │ Agent   │ │ Agent   │             ││
│  │  └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘             ││
│  │       │           │           │           │           │                    ││
│  │  ┌────┼───────────┼───────────┼───────────┼───────────┼──────┐            ││
│  │  │    ▼           ▼           ▼           ▼           ▼      │            ││
│  │  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐        │            ││
│  │  │  │Brand    │◄┤►Naming  │◄┤►Linguist│◄┤►Governan│  Brand │            ││
│  │  │  │Brief    │ │ Agent   │ │ Agent   │ │  Agent  │ Naming │            ││
│  │  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘        │            ││
│  │  │  ┌─────────┐ ┌─────────┐ ┌─────────┐                    │            ││
│  │  │  │Valid/Msg│ │Mkt Rsrch│ │Deloitte │                    │            ││
│  │  │  │ Agent   │ │ Agent   │ │Internal │                    │            ││
│  │  │  └─────────┘ └─────────┘ └─────────┘                    │            ││
│  │  └──────────────────────────────────────────────────────────┘            ││
│  │                                                                          ││
│  │  ┌──────────────────────────────────────────────────────────┐            ││
│  │  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐        │            ││
│  │  │  │Campaign │◄┤►Validatr│◄┤►Strategy│◄┤►Exec    │Campaign│            ││
│  │  │  │Brief    │ │ Agent   │ │ Agent   │ │Planner  │Planning│            ││
│  │  │  └─────────┘ └─────────┘ └─────────┘ └────┬────┘        │            ││
│  │  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌────┴────┐        │            ││
│  │  │  │DL Event │◄┤►Ext Evt │◄┤►Podcast │◄┤►Merger  │        │            ││
│  │  │  │Finder   │ │ Finder  │ │ Finder  │ │ Agent   │        │            ││
│  │  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘        │            ││
│  │  └──────────────────────────────────────────────────────────┘            ││
│  │                                                                          ││
│  │  ┌──────────────────────────────────────────────────────────┐            ││
│  │  │  ┌──────────────────┐                                    │            ││
│  │  │  │  Info Gathering  │  Shared Infrastructure             │            ││
│  │  │  │     Agent        │                                    │            ││
│  │  │  └──────────────────┘                                    │            ││
│  │  └──────────────────────────────────────────────────────────┘            ││
│  └──────────────────────────────────────────────────────────────────────────┘│
│                                 │                                            │
│                       MCP Protocol (tools)                                   │
│                                 ▼                                            │
│  ┌──────────────────────────────────────────────────────────────────────────┐│
│  │  MCP MARKETING TOOLS SERVER (Cloud Run)                                  ││
│  │  Tools: generate_image, guidelines_reader, lookup_personas,              ││
│  │         google_search, generate_word_doc, persona_library                ││
│  └──────────────────────────────────────────────────────────────────────────┘│
│                                 │                                            │
│  ┌──────────────────────────────┼──────────────────────────────────────────┐ │
│  │  BACKEND SERVICES            │                                          │ │
│  │  ├─ Cloud SQL (PostgreSQL) ──┤── agent state, sessions, task tracking   │ │
│  │  ├─ GCS Artifacts Bucket ────┤── inter-agent artifact storage           │ │
│  │  ├─ Vertex AI Imagen ────────┤── image generation                       │ │
│  │  └─ Google Search API ───────┘── web search                             │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 3.2 How V3 Mesh Differs from Hub-and-Spoke

| Aspect | V1 Hub-and-Spoke | V3 Full Mesh |
|--------|------------------|--------------|
| **Agent role** | Server only — waits for router | Server AND Client — can invoke peers |
| **Routing** | Router dispatches every step | Router starts chain; agents self-route |
| **Router load** | High — all traffic through router | Low — only initial request + status |
| **Cross-workflow** | Router must explicitly wire | Agents discover and invoke peers |
| **Failure handling** | Router retries | Agent retries, escalates to router |
| **Scalability** | Router is bottleneck | Each agent scales independently |
| **Latency** | 2 hops per step (client→router→agent) | 1 hop (agent→agent) after initial |

### 3.3 Agent Dual-Role Pattern

Every agent in the mesh implements two interfaces:

```
┌─────────────────────────────────────────────┐
│              Agent Service                   │
│                                             │
│  ┌────────────────────┐                     │
│  │   A2A Server       │  ← receives tasks   │
│  │   POST /            │    from router or   │
│  │   GET /.well-known/ │    peer agents      │
│  │   agent.json        │                     │
│  └────────────────────┘                     │
│                                             │
│  ┌────────────────────┐                     │
│  │   A2A Client       │  ← invokes peer     │
│  │   (httpx / aiohttp)│    agents when       │
│  │                    │    workflow requires  │
│  └────────────────────┘                     │
│                                             │
│  ┌────────────────────┐                     │
│  │   MCP Client       │  ← calls shared     │
│  │   (SSE transport)  │    tools server      │
│  └────────────────────┘                     │
│                                             │
│  ┌────────────────────┐                     │
│  │   ADK Agent Core   │  ← LLM, prompts,   │
│  │   (Gemini 2.5 Pro) │    reasoning        │
│  └────────────────────┘                     │
└─────────────────────────────────────────────┘
```

### 3.4 Peer-to-Peer Handoff Protocol

When Agent A needs to invoke Agent B:

```
Agent A                          Agent B
   │                                │
   │  1. Read B's agent card        │
   │     GET /.well-known/agent.json│
   │  ◄─────────────────────────────│
   │                                │
   │  2. Create task                │
   │     POST / (tasks/send)        │
   │  ─────────────────────────────►│
   │                                │
   │  3. Task accepted              │
   │     {status: "working"}        │
   │  ◄─────────────────────────────│
   │                                │
   │  4. Poll for completion        │
   │     POST / (tasks/get)         │
   │  ─────────────────────────────►│
   │                                │
   │  5. Task complete              │
   │     {status: "completed",      │
   │      artifacts: [...]}         │
   │  ◄─────────────────────────────│
   │                                │
   │  6. A continues with B's       │
   │     output as context          │
   │                                │
```

**Agent URL Resolution**: Each agent knows peer URLs via environment variables or a service registry (Cloud Run service URLs).

---

## 4. Extended Agent Card Schema

Since the Intent Router (not Gemini Enterprise) reads agent cards, we can extend them beyond the A2A spec with custom fields for dependency management.

### 4.1 Extended Fields

```jsonc
{
  // Standard A2A fields
  "name": "Brand Naming Agent",
  "description": "...",
  "url": "https://brand-naming-agent-dev-xxxxx-uc.a.run.app",
  "version": "1.0.0",
  "protocolVersion": "0.3.0",
  "skills": [...],

  // ─── Extended Fields (custom) ───────────────────────────
  "x-mesh": {
    "workflow": "brand_naming",           // workflow affinity
    "category": "specialist",             // router | specialist | utility | pipeline

    "produces": [                         // artifact types this agent outputs
      {
        "type": "brand_name_options",
        "format": "application/json",
        "description": "List of 50+ categorized brand name options"
      }
    ],

    "requires": [                         // artifact types this agent needs
      {
        "type": "brand_naming_brief",
        "source": "brand_brief_agent",
        "required": true
      }
    ],

    "feedsInto": [                        // agents that typically consume this agent's output
      "brand_linguistic_analysis_agent"
    ],

    "preconditions": [                    // conditions that must be true before invocation
      "brand_naming_brief exists in workflow context"
    ],

    "postconditions": [                   // guarantees after successful completion
      "50+ brand names generated and compliance-checked"
    ],

    "parallelizable": false,              // can run concurrently with siblings?
    "humanCheckpoint": false,             // requires user approval before next step?
    "estimatedDurationSeconds": 30,       // for planning
    "retryable": true,                    // safe to retry on failure?
    "idempotent": true                    // same input → same output?
  }
}
```

### 4.2 Agent Card Examples

#### Email Campaign Agent (Eminence)

```jsonc
{
  "name": "Email Campaign Agent",
  "description": "Creates email campaigns, writes email copy, drafts subject lines, and builds email sequences.",
  "url": "https://email-agent-dev-lwgedfpckq-uc.a.run.app",
  "version": "1.0.0",
  "protocolVersion": "0.3.0",
  "skills": [
    {"id": "write_email", "name": "Write Email Copy"},
    {"id": "create_email_campaign", "name": "Plan Email Campaign"}
  ],
  "x-mesh": {
    "workflow": "eminence",
    "category": "specialist",
    "produces": [
      {"type": "email_content", "format": "text/html"},
      {"type": "email_campaign_sequence", "format": "application/json"}
    ],
    "requires": [],
    "feedsInto": ["content_review_agent", "social_strategy_agent"],
    "preconditions": [],
    "postconditions": ["Production-ready email copy with subject lines and CTAs"],
    "parallelizable": true,
    "humanCheckpoint": false,
    "estimatedDurationSeconds": 45,
    "retryable": true,
    "idempotent": false
  }
}
```

#### Brand Brief Agent (Brand Naming)

```jsonc
{
  "name": "Brand Brief Agent",
  "description": "Generates a comprehensive Brand Naming Brief from gathered brand requirements.",
  "url": "https://brand-brief-agent-dev-xxxxx-uc.a.run.app",
  "version": "1.0.0",
  "protocolVersion": "0.3.0",
  "skills": [
    {"id": "create_brand_brief", "name": "Create Brand Naming Brief"}
  ],
  "x-mesh": {
    "workflow": "brand_naming",
    "category": "specialist",
    "produces": [
      {"type": "brand_naming_brief", "format": "application/json"}
    ],
    "requires": [
      {"type": "brand_requirements", "source": "info_gathering_agent", "required": true}
    ],
    "feedsInto": ["brand_naming_agent"],
    "preconditions": ["Brand requirements collected (company, industry, values, scope, constraints)"],
    "postconditions": ["Brand Naming Brief with Project Overview, Brand Foundation, Strategic Direction"],
    "parallelizable": false,
    "humanCheckpoint": true,
    "estimatedDurationSeconds": 20,
    "retryable": true,
    "idempotent": true
  }
}
```

### 4.3 Full Dependency Matrix

| Agent | Produces | Requires | Feeds Into | Parallel? | Human Checkpoint? |
|-------|----------|----------|------------|-----------|-------------------|
| **Info Gathering Agent** | `brand_requirements`, `campaign_requirements` | — | Brand Brief, Campaign Brief | No | No |
| **Brand Brief Agent** | `brand_naming_brief` | `brand_requirements` | Brand Naming Agent | No | Yes |
| **Brand Naming Agent** | `brand_name_options` | `brand_naming_brief` | Linguistic Analysis | No | Yes (user selects names) |
| **Linguistic Analysis Agent** | `linguistic_report` | `brand_name_options` (subset) | Validation & Messaging | No | No |
| **Validation & Messaging Agent** | `validated_names`, `messaging_framework` | `linguistic_report` | Governance Review | No | No |
| **Governance Review Agent** | `governance_report` | `validated_names` | — (terminal) | No | No |
| **Market Research Agent** | `market_research_report` | `brand_requirements` (partial) | Any (on-demand) | Yes | No |
| **Deloitte Internal Agent** | `internal_alignment_report` | `brand_naming_brief` | Any (on-demand) | Yes | No |
| **Campaign Brief Agent** | `campaign_brief`, `campaign_brief_docx` | `campaign_requirements` | Brief Validator | No | Yes |
| **Brief Validator Agent** | `validated_brief` | `campaign_brief` | Strategy Agent | No | No |
| **Strategy Agent** | `campaign_strategy` | `validated_brief` | Execution Planner | No | No |
| **Execution Planner Agent** | `execution_plan` | `campaign_strategy` | Content pipeline, Eminence agents | No | Yes |
| **Deloitte Event Finder** | `deloitte_events` | campaign context | Simple Merger | Yes | No |
| **External Event Finder** | `external_events` | campaign context | Simple Merger | Yes | No |
| **Podcast Finder** | `deloitte_podcasts` | campaign context | Simple Merger | Yes | No |
| **Simple Merger Agent** | `content_report` | `deloitte_events`, `external_events`, `deloitte_podcasts` | Execution Planner | No | No |
| **Email Campaign Agent** | `email_content` | — (or campaign context) | Content Review, Social Strategy | Yes | No |
| **LinkedIn Content Agent** | `linkedin_content` | — (or campaign context) | Content Review, Social Strategy | Yes | No |
| **Video Storyboard Agent** | `video_storyboard` | — (or campaign context) | Content Review | Yes | No |
| **Social Strategy Agent** | `campaign_plan` | content assets (from above) | — (terminal) | No | No |
| **Content Review Agent** | `review_report` | any content artifact | — (terminal, or back to source) | Yes | No |

---

## 5. Intent Router Design

### 5.1 Responsibilities

The Intent Router is the **only** agent registered in Gemini Enterprise. It acts as a thin "front door" with four core responsibilities:

1. **Intent Classification** — LLM determines which workflow(s) the user request maps to
2. **Dependency Planning** — Builds execution plan from the agent card dependency graph
3. **Workflow Initiation** — Sends the first A2A task to kick off the chain
4. **Status Tracking** — Monitors workflow progress, reports to user, handles failures

### 5.2 Router Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                      INTENT ROUTER                                │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │ Agent Card Registry                                        │  │
│  │ - Fetches /.well-known/agent.json from all peer agents     │  │
│  │ - Caches cards (TTL: 5 min)                                │  │
│  │ - Builds dependency graph on refresh                       │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │ Dependency Graph Builder                                   │  │
│  │ - Parses x-mesh.produces / x-mesh.requires                │  │
│  │ - Resolves feedsInto chains                                │  │
│  │ - Identifies parallelizable groups                         │  │
│  │ - Detects cycles (error)                                   │  │
│  │ - Output: DAG of execution steps                           │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │ LLM Intent Classifier (Gemini 2.5 Flash — fast/cheap-)     │  │
│  │ - Input: user message + agent card summaries               │  │
│  │ - Output: {workflow, agents_needed[], parameters}          │  │
│  │ - Handles: multi-workflow, follow-up, clarification        │  │
│  │ - Fallback: general conversation (router is still an LLM)  │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │ Workflow State Tracker                                     │  │
│  │ - Tracks active workflows per user/session                 │  │
│  │ - State: {workflow_id, current_step, artifacts[], status}  │  │
│  │ - Stored in Cloud SQL (JSONB)                              │  │
│  │ - Handles timeouts, retries, escalation                    │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │ A2A Client (async + streaming)                             │  │
│  │ - Submits via message/send → receives task_id immediately   │  │
│  │ - Streams via message/stream SSE for progress updates      │  │
│  │ - Falls back to tasks/get polling if SSE unavailable       │  │
│  │ - Relays progressive status to client ("working…")         │  │
│  └────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
```

### 5.3 Intent Classification Logic

```python
# Pseudocode — Router intent classification
WORKFLOW_SIGNALS = {
    "brand_naming": [
        "name a brand", "brand name", "naming brief", "brand identity",
        "naming options", "brand compliance", "governance review"
    ],
    "campaign_planning": [
        "campaign brief", "campaign plan", "campaign strategy",
        "execution plan", "marketing campaign", "campaign timeline"
    ],
    "eminence_email": [
        "write email", "email campaign", "drip sequence", "email copy",
        "subject line", "newsletter"
    ],
    "eminence_linkedin": [
        "linkedin post", "linkedin article", "linkedin content",
        "thought leadership post"
    ],
    "eminence_video": [
        "video storyboard", "video script", "video content"
    ],
    "eminence_social": [
        "social strategy", "posting calendar", "social campaign",
        "content distribution"
    ],
    "eminence_review": [
        "review content", "compliance check", "brand audit",
        "content review"
    ]
}
```

The LLM classifier uses these signals plus the full agent card descriptions to make routing decisions. It also handles:
- **Multi-workflow**: "Name a brand and create a launch campaign" → brand_naming + campaign_planning (sequential)
- **Ambiguous**: "Help me with marketing" → ask clarifying question
- **Follow-up**: "Now review that" → route to Content Review with context
- **General**: "What can you do?" → router responds directly

### 5.4 Execution Planning

Given a classified intent, the router builds an execution plan from the dependency graph:

```python
# Example: "Name a brand and create LinkedIn launch content"
execution_plan = {
    "workflow_id": "wf_abc123",
    "steps": [
        {
            "step": 1,
            "agent": "info_gathering_agent",
            "action": "collect_brand_requirements",
            "parallel": False,
            "humanCheckpoint": False
        },
        {
            "step": 2,
            "agent": "brand_brief_agent",
            "requires": ["brand_requirements"],
            "parallel": False,
            "humanCheckpoint": True
        },
        {
            "step": 3,
            "agent": "brand_naming_agent",
            "requires": ["brand_naming_brief"],
            "parallel": False,
            "humanCheckpoint": True  # user selects names
        },
        # ... linguistic, validation, governance ...
        {
            "step": 7,
            "agent": "linkedin_agent",
            "requires": ["governance_report"],  # uses brand deliverables as context
            "parallel": True,
            "humanCheckpoint": False
        }
    ]
}
```

### 5.5 Router Agent Card

```jsonc
{
  "name": "Marketing Workbench",
  "description": "Your AI marketing assistant. Handles brand naming, campaign planning, email campaigns, LinkedIn content, video storyboards, social media strategy, and content compliance review. Tell me what you need and I'll coordinate the right specialists.",
  "url": "https://intent-router-dev-xxxxx-uc.a.run.app",
  "version": "1.0.0",
  "protocolVersion": "0.3.0",
  "provider": {
    "organization": "Deloitte",
    "url": "https://www.deloitte.com"
  },
  "capabilities": {
    "streaming": true,
    "pushNotifications": true,
    "stateTransitionHistory": true
  },
  "skills": [
    {
      "id": "brand_naming",
      "name": "Brand Naming",
      "description": "End-to-end brand naming: brief creation, name generation, linguistic analysis, validation, and governance review.",
      "tags": ["brand", "naming", "identity"],
      "examples": [
        "Help me name a new product",
        "Create a brand naming brief",
        "Generate brand name options for our fintech startup"
      ]
    },
    {
      "id": "campaign_planning",
      "name": "Campaign Planning",
      "description": "Full campaign planning: brief creation, validation, strategy development, and execution planning with Deloitte content integration.",
      "tags": ["campaign", "strategy", "planning"],
      "examples": [
        "Plan a marketing campaign for Q3",
        "Create a campaign brief",
        "Develop a go-to-market strategy"
      ]
    },
    {
      "id": "content_creation",
      "name": "Content Creation",
      "description": "Create marketing content: emails, LinkedIn posts, video storyboards. Includes compliance review.",
      "tags": ["email", "linkedin", "video", "content"],
      "examples": [
        "Write an email campaign for our product launch",
        "Create a LinkedIn thought leadership post",
        "Build a video storyboard for our conference"
      ]
    },
    {
      "id": "social_strategy",
      "name": "Social Media Strategy",
      "description": "Cross-platform social media campaign planning and content distribution calendars.",
      "tags": ["social", "strategy", "calendar"],
      "examples": [
        "Plan a social media campaign across LinkedIn and Twitter",
        "Create a posting calendar for next month"
      ]
    },
    {
      "id": "content_review",
      "name": "Content Review",
      "description": "Review marketing content for brand compliance, inclusive language, and guideline adherence.",
      "tags": ["review", "compliance", "audit"],
      "examples": [
        "Review this LinkedIn post for compliance",
        "Check this email against brand guidelines"
      ]
    }
  ]
}
```

---

## 6. Artifact & State Model

### 6.1 Two-Layer State

| Layer | Owned By | Stored In | Purpose | Scope |
|-------|----------|-----------|---------|-------|
| **Workflow State** | Intent Router | Cloud SQL (JSONB) | Tracks overall workflow progress, step completion, artifact refs | Per user session |
| **Task State** | Each Agent | Cloud SQL (JSONB) | A2A task lifecycle (submitted → working → completed/failed) | Per agent task |

### 6.2 Workflow State Schema

```sql
CREATE TABLE workflow_state (
    workflow_id    TEXT PRIMARY KEY,
    session_id     TEXT NOT NULL,
    user_id        TEXT NOT NULL,
    workflow_type  TEXT NOT NULL,          -- brand_naming, campaign_planning, eminence, composite
    status         TEXT NOT NULL,          -- planning, active, paused, completed, failed
    execution_plan JSONB NOT NULL,         -- the DAG of steps
    current_step   INTEGER DEFAULT 0,
    artifacts      JSONB DEFAULT '{}',     -- {artifact_type: gcs_url}
    context        JSONB DEFAULT '{}',     -- accumulated context passed between agents
    created_at     TIMESTAMPTZ DEFAULT NOW(),
    updated_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_workflow_session ON workflow_state(session_id);
CREATE INDEX idx_workflow_user ON workflow_state(user_id);
```

### 6.3 Artifact Storage (GCS)

Artifacts are the **primary data contract** between agents. Stored in GCS with signed URLs for cross-agent access.

```
gs://adk-a2a-poc-artifacts/
  └── workflows/
      └── {workflow_id}/
          ├── brand_requirements.json
          ├── brand_naming_brief.json
          ├── brand_name_options.json
          ├── linguistic_report.json
          ├── validated_names.json
          ├── governance_report.json
          ├── campaign_brief.json
          ├── campaign_brief.docx
          ├── validated_brief.json
          ├── campaign_strategy.json
          ├── execution_plan.json
          ├── content_report.json
          ├── email_content.html
          ├── linkedin_content.html
          ├── video_storyboard.html
          └── review_report.json
```

### 6.4 Artifact Passing Between Agents

When Agent A completes and needs to pass output to Agent B:

```python
# Agent A (producer)
async def on_task_complete(task_result):
    # 1. Write artifact to GCS
    artifact_url = await gcs_client.upload(
        bucket="adk-a2a-poc-artifacts",
        path=f"workflows/{workflow_id}/brand_naming_brief.json",
        data=task_result
    )

    # 2. Return artifact reference in A2A task response
    return TaskResult(
        status="completed",
        artifacts=[
            Artifact(
                name="brand_naming_brief",
                parts=[Part(type="uri", uri=artifact_url)]
            )
        ]
    )

# Agent B (consumer — peer invocation)
async def invoke_next_agent(next_agent_url, artifact_url):
    # 1. Create A2A task with artifact reference
    task = await a2a_client.send_task(
        url=next_agent_url,
        message=Message(
            role="user",
            parts=[
                Part(type="text", text="Analyze these brand names..."),
                Part(type="uri", uri=artifact_url)
            ]
        )
    )
    return task
```

### 6.5 How Agents Know Who to Call Next

Each agent has a `feedsInto` declaration in its agent card, but the **actual decision** to invoke a peer is made at runtime.

> **Decision D27 (2026-02-20)**: Adopted **Model B+C** — PM Agent + Agent-to-Agent context passing.
> See [Build Tracker](v3_build_tracker.md) for full rationale.

#### Model B — PM Agent (separation of concerns)

A lightweight LLM agent that reasons about handoff quality, tracks progress, documents decisions, and escalates. It does NOT relay content between agents or decide the workflow — agents are autonomous domain experts.

- Validates every handoff before downstream agent starts
- Tracks workflow progress (replaces router polling `get_workflow_status`)
- Detects cross-agent conflicts
- Dual notification on issues (D28): corrective → originating agent, transparency → router

#### Model C — Agent-to-Agent context passing

When an agent delegates to a peer, it sends both the **artifact** (work product) and a **distilled context brief** (what, why, open questions, key decisions). The PM doesn't relay content — agents brief each other directly as domain experts.

- Context brief is LLM-distilled by the producing agent — not a raw dump
- Travels with the A2A task message alongside the artifact URI
- Agents read peer cards to decide who to invoke (LLM-guided, not hardcoded)

#### Combined Flow

1. Agent A finishes → produces artifact + distilled context brief → declares intent to hand off to Agent B
2. PM Agent receives handoff event → reviews context + artifact summary → checks against the plan
3. ✅ Validated → Agent B receives work + context brief, proceeds
4. ❌ Issue detected →
   - PM → Agent A (corrective): "Here's what's off, course correct"
   - PM → Router (transparency): "FYI, correction in progress"
   - Agent A resubmits → PM re-validates
   - If retry exhausted → PM → Router: "This needs your attention" (actual escalation)

#### Superseded Options

- ~~**Option A — Deterministic routing logic**~~: Rejected — hardcoded routing requires code changes for every workflow adjustment
- ~~**Option B alone — PM only**~~: Rejected — PM becomes content relay bottleneck (telephone game)
- ~~**Option C alone — Context passing only**~~: Rejected — nobody catches when things go off the rails

### 6.6 Async Task Execution & Streaming

> **Added 2026-02-19** — Based on live testing that revealed synchronous timeout chain failure (see tracker items 2.14–2.16, blocker B4).

#### Problem: Synchronous Blocking Doesn't Scale

The initial implementation used synchronous HTTP blocking at every hop:

```
Client ──[HTTP POST]──▸ Router ──[HTTP POST]──▸ Agent ──[HTTP POST]──▸ MCP Server
  │                      │                     │                     │
  │   blocks 300s        │   blocks 300s       │   blocks 300s       │
  │◂─────────────────────┘◂────────────────────┘◂────────────────────┘
```

Each hop's timeout must be ≥ the sum of all downstream hops. With thinking models (30–90s per LLM call) and multi-hop chains (Router → Agent → MCP → Review Agent), a 300s outer budget is mathematically impossible:

| Hop | Typical Duration | Why |
|-----|-----------------|-----|
| Router LLM (intent classification) | 30–90s | Gemini 2.5 Pro with thinking |
| Agent LLM (content generation) | 30–90s | Gemini 2.5 Pro with thinking |
| MCP tool calls (1–3 tools) | 5–30s | SSE round-trip to MCP server |
| Review Agent LLM (compliance check) | 30–90s | Gemini 2.5 Pro with thinking |
| **Total (serial)** | **95–300s** | **Squeezes or exceeds 300s budget** |

#### Solution: A2A Async Task Pattern

The A2A protocol supports three interaction patterns:

1. **Blocking** (`message/send` + wait) — current implementation, doesn't scale
2. **Async + Poll** (`message/send` → `submitted`, poll `tasks/get`) — decouples timeouts
3. **Streaming** (`message/stream` SSE) — progressive updates, best UX

Target architecture uses **pattern 3 (streaming)** with **pattern 2 (async + poll)** as fallback:

```
Client ──[message/stream]──▸ Router ──[message/send]──▸ Agent
  │                           │                        │
  │  SSE: "classifying..."     │  returns task_id       │  starts working
  │  SSE: "agent working..."   │  immediately           │  (no timeout pressure)
  │  SSE: "reviewing..."       │                        │
  │  SSE: final result         │◂──[tasks/get or SSE]───┘  completes async
  │◂──────────────────────────┘
```

**Key benefits:**
- Router Cloud Run timeout is independent of agent processing time
- Agent can take 5+ minutes without the router timing out
- Auto-review becomes true fire-and-forget (no blocking await)
- Client sees progressive status updates instead of a loading spinner

#### Timeout Budget (Safety Nets, Not Flow Control)

With async execution, timeouts become **safety nets** (kill runaway processes) rather than **flow control** (limit processing time):

| Component | Timeout | Rationale |
|-----------|---------|----------|
| Router Cloud Run | 900s (15 min) | Must outlast longest single-agent chain |
| Content Agent Cloud Run | 600s (10 min) | Thinking model + MCP tools + retry |
| Review Agent Cloud Run | 600s (10 min) | Thinking model compliance check |
| MCP Server Cloud Run | 3600s (1 hr) | Long-lived SSE sessions for tool chains |
| A2A Client `_READ_TIMEOUT` | 600s | Match agent Cloud Run timeout |
| A2A Client `_CONNECT_TIMEOUT` | 30s | Fast-fail on unreachable agents |

#### Auto-Review Fire-and-Forget

`ContentProducerExecutor._on_task_complete()` currently `await`s the review call despite being documented as "fire-and-forget". With async invocation:

```python
# Before (synchronous — blocks agent until review completes)
async def _on_task_complete(self, result):
    review_response = await self.a2a_client.send_task_and_wait(review_url, result)  # blocks!
    return review_response

# After (async — submits review task, returns immediately)
async def _on_task_complete(self, result):
    task_id = await self.a2a_client.send_task(review_url, result)  # returns immediately
    # Review runs in background; client polls for updated result
    return result  # return content now, review appended later
```

---

## 7. Adaptive Learning & Delegated Dispatch

> **Added 2026-02-24** — Decisions D36 (adaptive dispatch with earned delegation).
> Build tracker items 5.8–5.12c (Phase 5) and 7.1–7.10 (Phase 7).

### 7.1 Problem Statement

In the base mesh architecture (§3, §6.5), PM validates every single handoff before
the next agent can start. This is correct for new or risky compositions, but wasteful
for proven patterns. If the email→review handoff has succeeded 50 times without PM
correction, there's no value in PM gating it on attempt 51.

The inverse problem also exists: agents today have no way to learn from past runs.
Every workflow starts from scratch — no memory of what worked, what failed, or what
the user prefers.

### 7.2 Adaptive Dispatch Model

Each plan step receives a `dispatch_mode` assigned by PM during plan creation:

| Mode | Description | PM Role | Agent Behavior |
|------|-------------|---------|----------------|
| `governed` | PM validates handoff then dispatches | Gatekeeper — reviews artifact + context before downstream starts | Agent reports completion to PM, waits for dispatch |
| `delegated` | Agent invokes peer directly, reports back | Observer — receives after-the-fact notification, can intervene | Agent invokes peer via A2A dual-role client, reports completion to PM |

Mode is determined by a **trust score** learned from execution history. New or risky
compositions start governed; proven patterns earn delegation. PM can revoke delegation
if a pattern starts failing.

### 7.3 Trust Lifecycle

```
Discovery → Learning → Promotion → Delegation → (Demotion)
```

| Phase | Trigger | `dispatch_mode` | `trust_score` | PM Behavior |
|-------|---------|-----------------|---------------|-------------|
| **Discovery** | New pattern first seen (source→target) | `governed` | 0.0 | Full validation every handoff |
| **Learning** | Pattern runs under PM governance | `governed` | Climbing | PM records outcomes, trust climbs on success |
| **Promotion** | `trust_score ≥ 0.85` AND `success_count ≥ 5` | → `delegated` | ≥0.85 | PM marks pattern as earned |
| **Delegation** | Agent invokes peer directly, reports back | `delegated` | Stable | PM monitors after-the-fact, can still intervene |
| **Demotion** | `trust_score < 0.60` (failures erode trust) | → `governed` | <0.60 | PM re-tightens oversight |

Trust scoring is recency-weighted (`RECENCY_WEIGHT=0.7`) — recent failures count
more than distant successes. This prevents a long history of successes from masking
a new failure pattern.

### 7.4 Schema — Learning Tables

Three tables in Cloud SQL support the learning system:

#### `composition_patterns`

Tracks every observed source→target agent pairing and its cumulative trust.

| Column | Type | Description |
|--------|------|-------------|
| `pattern_id` | `TEXT PK` | `{source_agent}→{target_agent}:{artifact_type}` |
| `source_agent` | `TEXT` | Agent that produced the artifact |
| `target_agent` | `TEXT` | Agent that received the artifact |
| `artifact_type` | `TEXT` | What was handed off (e.g., `brand_brief`) |
| `workflow_type` | `TEXT` | Which workflow context (e.g., `brand_naming`) |
| `success_count` | `INT` | Cumulative successful handoffs |
| `failure_count` | `INT` | Cumulative failed handoffs |
| `trust_score` | `FLOAT` | Recency-weighted success rate (0.0–1.0) |
| `dispatch_mode` | `TEXT` | Current mode: `governed` or `delegated` |
| `skip_rate` | `FLOAT` | How often this step is skipped in successful chains |
| `first_seen` | `TIMESTAMPTZ` | First occurrence |
| `last_seen` | `TIMESTAMPTZ` | Most recent occurrence |
| `promoted_at` | `TIMESTAMPTZ` | When promoted to delegated (NULL if never) |
| `demoted_at` | `TIMESTAMPTZ` | When last demoted (NULL if never) |

#### `composition_outcomes`

Per-handoff result record. Feeds into trust scoring.

| Column | Type | Description |
|--------|------|-------------|
| `outcome_id` | `SERIAL PK` | Auto-increment |
| `pattern_id` | `TEXT FK` | References `composition_patterns` |
| `correlation_id` | `TEXT` | Ties to user request |
| `outcome` | `TEXT` | `success`, `corrective`, `failure`, `escalation` |
| `prompt_tokens` | `INT` | LLM tokens consumed (input) |
| `completion_tokens` | `INT` | LLM tokens consumed (output) |
| `estimated_cost` | `FLOAT` | Estimated $ cost of this handoff |
| `duration_ms` | `INT` | Wall-clock time for the handoff |
| `pm_notes` | `TEXT` | PM's free-text notes on the outcome |
| `created_at` | `TIMESTAMPTZ` | When recorded |

#### `capability_catalog`

Discovered multi-step chains that produce reliable end-to-end results.

| Column | Type | Description |
|--------|------|-------------|
| `capability_id` | `TEXT PK` | Derived from intent pattern hash |
| `intent_pattern` | `TEXT` | Natural language intent (e.g., "name a brand") |
| `composition_chain` | `JSONB` | Ordered list of agents in the chain |
| `success_rate` | `FLOAT` | End-to-end success rate |
| `avg_duration` | `FLOAT` | Average wall-clock time (seconds) |
| `user_satisfaction_avg` | `FLOAT` | Average user satisfaction (0.0–1.0) |
| `user_satisfaction_count` | `INT` | Number of satisfaction signals received |
| `example_correlations` | `JSONB` | Sample `correlation_id` values for reference |
| `discovered_at` | `TIMESTAMPTZ` | When PM first identified this chain |

### 7.5 `agents/shared/learning/` Package

Learning logic is **pure algorithmic Python** — no LLM dependency. PM calls these
utilities as tools, gets structured recommendations, and makes judgment calls.
Agent cognitive load is unchanged.

```
agents/shared/learning/
├── __init__.py              # re-exports public API
├── models.py                # CompositionPattern, CompositionOutcome, Capability dataclasses
├── pattern_tracker.py       # records outcomes, calculates trust, promotes/demotes
├── trust_scorer.py          # recency-weighted scoring, configurable thresholds
├── capability_catalog.py    # chain discovery, intent matching, capability surfacing
└── preference_engine.py     # user preference inference & retrieval (Phase 7)
```

**Key design principle**: PM's LLM gets structured data and makes judgment calls.
Learning math stays in utilities, not in prompts. PM tool calls:

| PM Tool | Returns | Used During |
|---------|---------|-------------|
| `record_handoff_outcome(pattern, outcome, tokens, duration)` | Updated trust score | After each handoff completes |
| `get_dispatch_recommendations(plan_steps)` | Per-step `{recommendation, trust_score, successful_runs, last_failure, reason}` | During `create_execution_plan` |
| `get_known_capabilities(intent)` | Proven chains with success rate, duration estimate, cost estimate | When building initial plan |

### 7.6 Token/Cost Tracking & Chain Optimization

Every handoff outcome records `prompt_tokens`, `completion_tokens`, `estimated_cost`,
and `duration_ms`. This enables:

- **Cost-aware chain selection**: When two chains achieve the same outcome, PM can
  recommend the cheaper or faster one
- **Duration grounding**: "This usually takes 8 minutes and costs ~$0.12" — real data,
  not LLM estimates
- **Skip rate optimization**: `skip_rate` tracks how often optional steps are skipped
  in successful chains — PM can default-skip low-value steps or offer them as opt-in

### 7.7 User Satisfaction Signal

User feedback grounds trust in real outcomes, not just algorithmic success:

1. User says "this was great" / "this missed the mark" → router classifies as positive/negative
2. Router includes satisfaction signal in `submit_to_pm` or `relay_human_input`
3. PM records against `correlation_id` → capability chain → `user_satisfaction_avg` updated
4. Trust scores incorporate user satisfaction alongside algorithmic success

### 7.8 Capability Surfacing

PM proactively suggests proven follow-on work:

> "Based on successful runs, teams often create launch emails after brand naming.
> Include it?"

Powered by `capability_catalog` — `intent_pattern` matched against current request
context. Only surfaces capabilities with high `success_rate` and sufficient
`user_satisfaction_avg`.

### 7.9 User Preferences & Personalization (Phase 7)

Agents adapt their output style based on learned user preferences. User identity
flows from Gemini Enterprise → router → A2A metadata. Preferences are per-user,
not per-workflow — they follow the user across sessions and workflows.

#### Schema

| Table | Key Columns | Purpose |
|-------|-------------|---------|
| `user_profiles` | `user_id` (PK), `display_name`, `role_inference`, `org_context`, `first_seen`, `last_active` | Identifies the user across sessions |
| `user_preferences` | `preference_id` (PK), `user_id` (FK), `category`, `key`, `value`, `confidence`, `evidence_count`, `source` (explicit/inferred), `first_seen`, `last_reinforced` | Stores learned and stated preferences |

#### Preference Categories

| Category | Examples |
|----------|----------|
| `tone` | formal, conversational, executive |
| `format` | bullet-heavy, narrative, data-rich |
| `content` | topic focus, industry emphasis |
| `workflow` | preferred agent chains, default steps |
| `interaction` | verbosity level, detail depth |

#### How It Works

- **Explicit**: User says "I always want formal tone" → `confidence=1.0`, `source=explicit`
- **Inferred**: User consistently chooses one format → first inference `confidence=0.5`, reinforced toward 0.9
- **Decay**: Preferences not reinforced in 90 days decay by 0.1/month; below `MIN_CONFIDENCE=0.3` → inactive
- **Transparency**: User can ask "what do you know about my preferences?" → formatted summary
- **Integration**: PM threads active preferences into dispatch metadata → agent prompts reference them

---

## 8. Infrastructure & Deployment

### 8.1 GCP Resources

| Resource | Type | Current Status | Notes |
|----------|------|----------------|-------|
| **GCP Project** | `us-gcp-ame-con-ae963-npd-1` | ✅ Active | |
| **Region** | `us-central1` | ✅ | |
| **Cloud SQL** | `adk-a2a-poc` (PostgreSQL) | ✅ Deployed | PSC-only, tables: a2a_tasks, a2a_session_mappings, adk_sessions, workflow_state |
| **GCS Bucket** | `gs://adk-a2a-poc-artifacts` | ✅ Deployed | Inter-agent artifact storage |
| **MCP Server** | `mcp-marketing-tools-dev` | ✅ Deployed | Streamable HTTP transport (stateless) |
| **Artifact Registry** | `us-central1-docker.pkg.dev/…/eminence-agents` | ✅ Deployed | Docker images |
| **VPC Connector** | Serverless VPC for Cloud SQL | ✅ Deployed | |

### 8.2 Cloud Run Services (Current + Target State)

| Service | Source | Status | Agent Card URL |
|---------|--------|--------|----------------|
| `intent-router-dev` | `eminence_agent_v2/agents/router/` | ✅ Deployed | `https://intent-router-dev-…/` |
| `info-gathering-agent-dev` | `eminence_agent_v2/agents/info_gathering_agent/` | ✅ Deployed | `https://info-gathering-agent-dev-…/` |
| `email-agent-dev` | `eminence_agent_v2/agents/email_agent/` | ✅ Deployed | `https://email-agent-dev-…/` |
| `linkedin-agent-dev` | `eminence_agent_v2/agents/linkedin_agent/` | ✅ Deployed | `https://linkedin-agent-dev-…/` |
| `video-agent-dev` | `eminence_agent_v2/agents/video_storyboard_agent/` | ✅ Deployed | `https://video-agent-dev-…/` |
| `social-agent-dev` | `eminence_agent_v2/agents/social_strategy_agent/` | ✅ Deployed | `https://social-agent-dev-…/` |
| `review-agent-dev` | `eminence_agent_v2/agents/content_review_agent/` | ✅ Deployed | `https://review-agent-dev-…/` |
| `brand-brief-agent-dev` | `eminence_agent_v2/agents/brand_brief_agent/` | ✅ Deployed | `https://brand-brief-agent-dev-…/` |
| `brand-naming-agent-dev` | `eminence_agent_v2/agents/brand_naming_agent/` | ✅ Deployed | `https://brand-naming-agent-dev-…/` |
| `linguistic-agent-dev` | `eminence_agent_v2/agents/brand_linguistic_agent/` | ✅ Deployed | `https://linguistic-agent-dev-…/` |
| `validation-messaging-agent-dev` | `eminence_agent_v2/agents/brand_validation_agent/` | ✅ Deployed | `https://validation-messaging-agent-dev-…/` |
| `governance-agent-dev` | `eminence_agent_v2/agents/brand_governance_agent/` | ✅ Deployed | `https://governance-agent-dev-…/` |
| `market-research-agent-dev` | `eminence_agent_v2/agents/market_research_agent/` | ✅ Deployed | `https://market-research-agent-dev-…/` |
| `deloitte-internal-agent-dev` | `eminence_agent_v2/agents/deloitte_internal_agent/` | ✅ Deployed | `https://deloitte-internal-agent-dev-…/` |
| `pm-agent-dev` | `eminence_agent_v2/agents/pm_agent/` | ✅ Deployed | `https://pm-agent-dev-…/` |
| `campaign-brief-agent-dev` | new | ✅ Built | `https://campaign-brief-agent-dev-…/` |
| `brief-validator-agent-dev` | new | ✅ Built | `https://brief-validator-agent-dev-…/` |
| `strategy-agent-dev` | new | ✅ Built | `https://strategy-agent-dev-…/` |
| `exec-planner-agent-dev` | new | ✅ Built| `https://exec-planner-agent-dev-…/` |
| `deloitte-event-finder-dev` | new | ✅ Built | `https://deloitte-event-finder-dev-…/` |
| `external-event-finder-dev` | new | ✅ Built | `https://external-event-finder-dev-…/` |
| `podcast-finder-dev` | new | ✅ Built | `https://podcast-finder-dev-…/` |
| `simple-merger-dev` | new | ✅ Built | `https://simple-merger-dev-…/` |
| `mcp-marketing-tools-dev` | `eminence_agent_v2/mcp_server/` | ✅ Deployed | N/A (MCP, not A2A) |

**Total Cloud Run services**: 24 (23 A2A agents + 1 MCP server)  
**Currently deployed**: 16 (14 agents + intent router + MCP server)

### 8.3 Cloud SQL Schema Updates

Add the `workflow_state` table to the existing `adk-a2a-poc` database:

```sql
-- New table for router workflow tracking
CREATE TABLE IF NOT EXISTS workflow_state (
    workflow_id    TEXT PRIMARY KEY,
    session_id     TEXT NOT NULL,
    user_id        TEXT NOT NULL,
    workflow_type  TEXT NOT NULL,
    status         TEXT NOT NULL DEFAULT 'planning',
    execution_plan JSONB NOT NULL DEFAULT '{}',
    current_step   INTEGER DEFAULT 0,
    artifacts      JSONB DEFAULT '{}',
    context        JSONB DEFAULT '{}',
    created_at     TIMESTAMPTZ DEFAULT NOW(),
    updated_at     TIMESTAMPTZ DEFAULT NOW()
);

-- Existing tables (already deployed)
-- a2a_tasks (id TEXT PK, data JSONB, updated_at TIMESTAMPTZ)
-- a2a_session_mappings
-- adk_sessions
```

### 8.4 Environment Variables (Per Agent)

```bash
# Standard (all agents)
GOOGLE_CLOUD_PROJECT=us-gcp-ame-con-ae963-npd-1
GOOGLE_CLOUD_LOCATION=us-central1
GOOGLE_GENAI_USE_VERTEXAI=true
MCP_SERVER_URL=https://mcp-marketing-tools-dev-lwgedfpckq-uc.a.run.app
GCS_ARTIFACT_BUCKET=adk-a2a-poc-artifacts
DB_CONNECTION_STRING=postgresql+asyncpg://...

# Agent-specific — peer URLs for mesh communication
PEER_AGENT_URLS='{
  "email_agent": "https://email-agent-dev-lwgedfpckq-uc.a.run.app",
  "linkedin_agent": "https://linkedin-agent-dev-lwgedfpckq-uc.a.run.app",
  "video_agent": "https://video-agent-dev-lwgedfpckq-uc.a.run.app",
  "social_agent": "https://social-agent-dev-lwgedfpckq-uc.a.run.app",
  "review_agent": "https://review-agent-dev-lwgedfpckq-uc.a.run.app",
  "brand_brief_agent": "https://brand-brief-agent-dev-xxxxx-uc.a.run.app",
  ...
}'

# Router-only
AGENT_REGISTRY_URLS='[list of all agent service URLs]'
WORKFLOW_DB_TABLE=workflow_state
```

### 8.5 Shared Agent Template

Every new agent follows the same scaffolding pattern already proven with the eminence agents:

```
agents/{agent_name}/
├── __init__.py
├── agent.py              # ADK agent definition + prompts
├── agent_card.json        # Extended agent card (with x-mesh)
├── Dockerfile             # Standard Cloud Run Dockerfile
├── deploy.py              # Deployment script
└── requirements.txt
```

Shared infrastructure (all built and tested):

```
agents/shared/
├── executor.py                    # Base A2A executor (dual-role: server + client, peer invocation)
├── a2a_client.py                  # Async A2A client (retry, streaming, IAM auth)
├── agent_registry.py              # Agent card registry + dependency graph (TTL cache)
├── agent_catalog.py               # Agent catalog for router
├── gcs_artifact_client.py         # GCS artifact storage (upload/download/sign)
├── circuit_breaker.py             # Circuit breaker for resilience
├── mesh_agent_card.py             # x-mesh agent card model
├── mcp_client.py                  # MCP toolset (Streamable HTTP, per-task session isolation)
├── db_manager.py                  # Cloud SQL async connection management
├── postgresql_task_store.py       # JSONB task storage
├── postgresql_session_service.py  # ADK session management
└── stores.py                      # Store factory
```

---

## 9. Implementation Phases

### Phase 1: Mesh Infrastructure (Week 1-2)

**Goal**: Build the shared components that enable peer-to-peer communication.

| Task | Description | Effort |
|------|-------------|--------|
| 1.1 | Build `a2a_client.py` — async A2A client for peer invocation (tasks/send, tasks/get, agent card fetch) | 1 day |
| 1.2 | Build `gcs_artifact_client.py` — upload/download/sign artifacts to GCS bucket | 1 day |
| 1.3 | Build `agent_registry.py` — fetch agent cards, cache, build dependency DAG | 1 day |
| 1.4 | Define extended agent card JSON schema and validate | 0.5 day |
| 1.5 | Add `workflow_state` table to Cloud SQL | 0.5 day |
| 1.6 | Update existing 5 eminence agent cards with `x-mesh` extensions | 1 day |
| 1.7 | Add A2A client capability to existing eminence agents (dual-role pattern) | 2 days |
| 1.8 | Write unit tests for all shared components (≥80% coverage) | 2 days |

**Deliverable**: All 5 eminence agents can invoke each other peer-to-peer (e.g., LinkedIn Agent → Content Review Agent).

### Phase 2: Intent Router (Week 2-3)

**Goal**: Build and deploy the Intent Router as the Gemini Enterprise entry point.

| Task | Description | Effort |
|------|-------------|--------|
| 2.1 | Build router agent with LLM intent classifier (Gemini 2.5 Pro) | 2 days |
| 2.2 | Implement dependency graph builder (parses x-mesh, builds DAG) | 1 day |
| 2.3 | Implement workflow state tracker (Cloud SQL JSONB) + async task completion tracking | 1 day |
| 2.4 | Implement execution planner (generates step plans from DAG) | 1 day |
| 2.5 | Build router agent card (Marketing Workbench) | 0.5 day |
| 2.6 | Deploy router to Cloud Run | 0.5 day |
| 2.7 | Register router in Gemini Enterprise | 0.5 day |
| 2.8 | End-to-end test: Gemini Enterprise → Router → Eminence agents | 1 day |
| 2.9 | Write unit + integration tests (≥80% coverage) | 2 days |
| 2.10 | Streaming response support (`message/stream` SSE) | 2 days |
| 2.11 | Async agent invocation (non-blocking `message/send`) | 1.5 days |
| 2.12 | Generous Cloud Run timeouts as safety nets | 0.5 day |

**Deliverable**: Users in Gemini Enterprise can invoke eminence agents through the router. "Write me an email campaign" works end-to-end.

### Phase 3: Brand Naming Decomposition (Week 3-5)

**Goal**: Extract brand naming subagents into independent A2A services.

| Task | Description | Effort |
|------|-------------|--------|
| 3.1 | Build Information Gathering Agent (conversational intake for brand naming) | 2 days |
| 3.2 | Extract Brand Brief Agent → A2A service | 1 day |
| 3.3 | Extract Brand Naming Agent → A2A service | 1 day |
| 3.4 | Extract Linguistic Analysis Agent → A2A service | 1 day |
| 3.5 | Extract Validation & Messaging Agent → A2A service | 1 day |
| 3.6 | Extract Governance Review Agent → A2A service | 1 day |
| 3.7 | Extract Market Research Agent → A2A service | 0.5 day |
| 3.8 | Extract Deloitte Internal Agent → A2A service | 0.5 day |
| 3.9 | Create extended agent cards for all 7 agents | 1 day |
| 3.10 | Wire peer-to-peer handoffs (agent-driven for pipeline) | 2 days |
| 3.11 | Deploy all to Cloud Run | 1 day |
| 3.12 | End-to-end test: Router → full brand naming pipeline | 1 day |
| 3.13 | Unit + integration tests (≥80% coverage) | 2 days |

**Deliverable**: Full brand naming workflow runs via A2A mesh. "Help me name a product" works end-to-end through Gemini Enterprise.

### Phase 4: Campaign Planning Decomposition (Week 5-7)

**Goal**: Extract campaign planning subagents into independent A2A services.

| Task | Description | Effort |
|------|-------------|--------|
| 4.1 | Extend Information Gathering Agent for campaign intake | 1 day |
| 4.2 | Extract Campaign Brief Agent → A2A service | 1 day |
| 4.3 | Extract Brief Validator Agent → A2A service | 1 day |
| 4.4 | Extract Strategy Agent → A2A service | 1 day |
| 4.5 | Extract Execution Planner Agent → A2A service | 1.5 days |
| 4.6 | Extract Deloitte Event Finder → A2A service | 0.5 day |
| 4.7 | Extract External Event Finder → A2A service | 0.5 day |
| 4.8 | Extract Podcast Finder → A2A service | 0.5 day |
| 4.9 | Extract Simple Merger → A2A service | 0.5 day |
| 4.10 | Create extended agent cards for all 8 agents | 1 day |
| 4.11 | Wire peer-to-peer handoffs (agent-driven for pipeline) | 2 days |
| 4.12 | Deploy all to Cloud Run | 1 day |
| 4.13 | End-to-end test: Router → full campaign planning pipeline | 1 day |
| 4.14 | Unit + integration tests (≥80% coverage) | 2 days |

**Deliverable**: Full campaign planning workflow runs via A2A mesh.

### Phase 5: Cross-Workflow Composition (Week 7-8)

**Goal**: Enable cross-workflow agent composition.

| Task | Description | Effort |
|------|-------------|--------|
| 5.1 | Update router to handle multi-workflow intent (e.g., "name + campaign") | 1 day |
| 5.2 | Implement artifact bridging — passing outputs between workflows | 1 day |
| 5.3 | Wire eminence agents into campaign pipeline (e.g., execution plan → email agent) | 2 days |
| 5.4 | Wire brand outputs into content creation (e.g., brand brief → LinkedIn post) | 1 day |
| 5.5 | End-to-end test: multi-workflow scenarios | 1 day |
| 5.6 | Integration tests for cross-workflow (≥80% coverage) | 1 day |

**Deliverable**: Complex scenarios like "Name a brand and create a launch campaign with email and LinkedIn content" work end-to-end.

### Phase 6: Hardening & Production (Week 8-10)

| Task | Description | Effort |
|------|-------------|--------|
| 6.1 | Retry logic and circuit breakers for all A2A calls | 1 day |
| 6.2 | Timeout tuning and monitoring (optimal values per agent, alerts on near-timeout) | 0.5 day |
| 6.3 | Observability: structured logging, Cloud Trace spans across agents | 1 day |
| 6.4 | Error reporting: Failed agents surface human-readable errors to router | 1 day |
| 6.5 | Rate limiting and cost controls (LLM call budgets per workflow) | 1 day |
| 6.6 | IAM: service-to-service auth for all A2A calls (Cloud Run invoker) | 0.5 day |
| 6.7 | Load testing: simulate concurrent workflows | 1 day |
| 6.8 | Documentation: update README, architecture docs, runbooks | 1 day |
| 6.9 | Terraform: IaC for all Cloud Run services, SQL, GCS | 2 days |

**Deliverable**: Production-ready mesh with observability, security, and resilience.

### Phase Summary

| Phase | Duration | Key Deliverable |
|-------|----------|-----------------|
| 1. Mesh Infrastructure | 2 weeks | Eminence agents can peer-to-peer |
| 2. Intent Router | 2.5 weeks | Gemini Enterprise → Router → Agents works (async + streaming) |
| 3. Brand Naming | 2 weeks | Full brand naming pipeline via mesh |
| 4. Campaign Planning | 2 weeks | Full campaign planning pipeline via mesh |
| 5. Cross-Workflow | 1.5 weeks | Multi-workflow composition works |
| 6. Hardening | 2 weeks | Production-ready |
| **Total** | **~10 weeks** | **Full V3 mesh in production** |

---

## 10. Risk Assessment

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| **Gemini Enterprise can't register custom A2A agents** | High | Medium | Fallback: deploy router as standalone web UI or Slack bot |
| **A2A latency cascades in long pipelines** | High | High | **Proven fatal with synchronous blocking** — see Section 6.6. Fix: async task submission (2.15), streaming (2.14), generous safety-net timeouts (2.16) |
| **22 Cloud Run services = high cold-start latency** | Medium | High | Min instances = 1 for critical agents; others scale to 0 |
| **Agent LLM hallucinations in peer invocations** | Medium | Medium | Structured output schemas; validation at each step |
| **GCS artifact storage costs** | Low | Low | Auto-delete after 30 days; lifecycle policies |
| **Context window overflow in long workflows** | Medium | Medium | Summarize artifacts between steps; don't pass raw history |
| **Cloud SQL connection limits with 22 services** | Medium | Medium | Connection pooling; consider AlloyDB if exceeded |
| **Circular dependencies in agent graph** | High | Low | Graph validation on startup; detect cycles |
| **MCP server bottleneck** | Medium | Low | Scale MCP server; shard tools if needed |
| **Debugging multi-agent failures** | High | High | Correlation IDs, structured logs, Cloud Trace, workflow state audit trail |

---

## 11. Success Criteria

### 11.1 Functional

| Criterion | Metric |
|-----------|--------|
| **Single entry point** | All workflows accessible via Gemini Enterprise → Router |
| **Brand naming works** | Full 7-step pipeline completes successfully |
| **Campaign planning works** | Full pipeline including optional content research |
| **Cross-workflow** | "Name + campaign + content" composite flow completes |
| **Peer-to-peer** | Agents invoke each other without router mediation (after initiation) |
| **Content review** | Any content agent's output can be reviewed by Content Review Agent |

### 11.2 Non-Functional

| Criterion | Target |
|-----------|--------|
| **End-to-end latency** | Single agent: < 60s. Full pipeline: < 5 min |
| **Availability** | 99.5% per agent (Cloud Run SLA) |
| **Test coverage** | ≥ 80% on all new/changed code |
| **Cold start** | < 15s per agent |
| **Concurrent workflows** | Support ≥ 10 simultaneous workflows |
| **Artifact durability** | GCS (11 9's); signed URLs expire after 1 hour |
| **Recovery** | Any failed step restartable without losing prior artifacts |

### 11.3 Architecture Validation

- [ ] No hardcoded workflow sequences — all flows emerge from dependency graph
- [ ] Adding a new agent requires only: create service + deploy + agent card
- [ ] Router discovers new agents automatically via agent card registry
- [ ] Agents are independently deployable, scalable, and testable
- [ ] MCP tools are shared — no tool duplication across agents
- [ ] Workflow state survives agent failures and restarts

---

## Appendix A: Glossary

| Term | Definition |
|------|-----------|
| **A2A** | Agent-to-Agent protocol — Google's open protocol for agent interop (JSON-RPC over HTTP) |
| **Agent Card** | JSON metadata describing an agent's capabilities, served at `/.well-known/agent.json` |
| **MCP** | Model Context Protocol — Anthropic's protocol for sharing tools/resources with LLMs |
| **ADK** | Agent Development Kit — Google's framework for building agents |
| **Choreography** | Decentralized coordination where agents drive their own handoffs (vs. centralized orchestration) |
| **DAG** | Directed Acyclic Graph — the dependency structure between agents |
| **x-mesh** | Custom extension fields in agent cards for mesh-specific metadata |
| **Signed URL** | Time-limited GCS URL for secure artifact access between agents |
| **Workflow** | A complete user-facing task (e.g., "name a brand") that may span multiple agents |
| **Task** | A2A unit of work — one agent processing one request |

## Appendix B: Related Documents

| Document | Path | Description |
|----------|------|-------------|
| Original A2A Refactor Plan | `docs/eminence_agent_a2a_refactor_plan.md` | Superseded hub-and-spoke design |
| System Architecture (Mermaid) | `docs/01_mermaid_system_arch.md` | Current system diagrams |
| Agent Architecture (Mermaid) | `docs/02_mermaid_agent_arch.md` | Current agent diagrams |
| DB Architecture (Mermaid) | `docs/05_db_arch.md` | Cloud SQL normalized schema, write paths, and correlation/query model |
| System Guide | `docs/03_system_guide_and_references.md` | Reference documentation |
| Agent Inventory | `docs/agents.md` | Agent listing |
