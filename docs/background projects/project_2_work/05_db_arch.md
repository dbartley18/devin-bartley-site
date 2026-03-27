# Database Architecture — V3 Normalized Persistence

> **Last Updated**: 2026-03-17  
> **Scope**: Cloud SQL PostgreSQL schema used by A2A tasks, ADK sessions, workflow tracking, intake capture, and artifact metadata  
> **Source of Truth**: `data_migration/sql/001_initial_schema.sql` through `007_normalize_schema.sql`

## 1) Persistence Principles

- **Normalized first**: event/history arrays moved out of JSONB blobs into row tables.
- **Queryability first**: frequently filtered fields promoted to indexed columns.
- **Traceability first**: `correlation_id` links workflows, tasks, and sessions.
- **Storage split**: Cloud SQL stores metadata and state; GCS stores large artifact payloads.
- **Operational safety**: append-style event tables + explicit indexes for common filters.
- **Runtime-policy isolation**: ADR-0004 tool-runtime standardization changes execution lifecycle and telemetry emission, but does not require DB schema changes.

## 2) Core Data Model (ER-style)

```mermaid
flowchart LR
  classDef core fill:#e8f1ff,stroke:#1f6feb,color:#0b2c5c
  classDef state fill:#fff2db,stroke:#d17b00,color:#5c3200
  classDef event fill:#f3e5f5,stroke:#7b1fa2,color:#4a148c
  classDef ext fill:#e8f5e9,stroke:#2e7d32,color:#1b5e20

  WS[workflow_state<br/>PK workflow_id<br/>correlation_id<br/>plan_version<br/>execution_plan<br/>context<br/>living_summary]:::state
  WStep[workflow_steps<br/>PK id<br/>workflow_id<br/>step_number<br/>agent_name<br/>status<br/>started_at and completed_at]:::event
  WIssue[workflow_issues<br/>PK id<br/>workflow_id<br/>step_number<br/>severity<br/>resolved]:::event
  Art[artifacts<br/>PK id UUID<br/>workflow_id<br/>correlation_id<br/>agent_name<br/>artifact_type<br/>gcs_uri<br/>metadata]:::event

  Sess[adk_sessions<br/>PK session_id<br/>app_name<br/>user_id<br/>correlation_id<br/>state<br/>session_data minimal]:::state
  SEvt[session_events<br/>PK id<br/>session_id<br/>seq<br/>author<br/>content<br/>tool_calls and tool_results<br/>is_thought]:::event

  Task[a2a_tasks<br/>PK id<br/>data JSONB<br/>correlation_id<br/>context_id<br/>state<br/>agent_name<br/>session_id]:::core
  Map[a2a_session_mappings<br/>PK user_id + agent_name<br/>session_id<br/>updated_at]:::core

  Intake[intake_responses<br/>PK id UUID<br/>correlation_id<br/>workflow_type<br/>field_key<br/>answer_text<br/>UNIQUE correlation_id + field_key]:::core

  GCS[(GCS Artifacts<br/>workflows per id per type json)]:::ext

  WS -->|1:N via workflow_id| WStep
  WS -->|1:N via workflow_id| WIssue
  WS -->|1:N via workflow_id| Art

  Sess -->|1:N via session_id| SEvt

  WS -. shared correlation_id .- Sess
  WS -. shared correlation_id .- Task
  WS -. shared correlation_id .- Intake
  Art -->|content reference| GCS

  Task -. session linkage .-> Sess
  Map -. session lookup .-> Sess
```

## 3) Write Path Architecture

```mermaid
sequenceDiagram
  participant U as User Request
  participant R as Router Executor
  participant PM as PM/Dispatch
  participant AG as Specialist Agent
  participant DB as Cloud SQL
  participant GS as GCS
  participant LG as Cloud Logging
  participant CT as Cloud Trace

  U->>R: A2A request (new or resumed)
  R->>DB: upsert workflow_state(correlation_id, plan_version, context)
  R->>DB: upsert a2a_tasks(id, state, context_id, agent_name, correlation_id)
  R->>DB: map task/session in a2a_session_mappings

  PM->>DB: insert workflow_steps(status=in_progress/completed/input_required)
  PM->>DB: update workflow_state.living_summary
  PM->>DB: insert workflow_issues (when validation/routing problems occur)

  AG->>DB: create/update adk_sessions(state, correlation_id)
  AG->>DB: append session_events(seq, content, tool_calls/results)

  AG->>GS: upload artifact payload (json/doc/image)
  AG->>DB: insert artifacts(workflow_id, artifact_type, gcs_uri, metadata)
  AG->>LG: emit runtime telemetry log<br/>(tool_runtime tags)
  AG->>CT: emit OTel span attrs<br/>(tool.runtime.*)

  AG->>DB: update a2a_tasks(state=completed or input_required)

  Note over AG,CT: ADR-0004 runtime telemetry is emitted to observability sinks<br/>no DB schema change is required for this lifecycle standardization.
```

## 4) Normalization Delta (Before → After)

```mermaid
flowchart LR
  classDef before fill:#ffebee,stroke:#c62828,color:#b71c1c
  classDef after fill:#e8f5e9,stroke:#2e7d32,color:#1b5e20

  subgraph Legacy[Before 007]
    S1[adk_sessions.session_data<br/>JSONB conversation array]:::before
    W1[workflow_state.step_events<br/>JSONB array]:::before
    W2[workflow_state.issues<br/>JSONB array]:::before
    W3[workflow_state.artifacts<br/>JSONB map]:::before
  end

  subgraph Normalized[After 007]
    N1[session_events<br/>one row per turn]:::after
    N2[workflow_steps<br/>one row per dispatch]:::after
    N3[workflow_issues<br/>one row per issue]:::after
    N4[artifacts<br/>indexed metadata + gcs_uri]:::after
    N5[adk_sessions.state<br/>StateField persistence]:::after
    N6[a2a_tasks promoted columns<br/>context_id state agent session]:::after
  end

  S1 --> N1
  W1 --> N2
  W2 --> N3
  W3 --> N4
  S1 --> N5
  W1 --> N6
```

## 5) Correlation & Query Axes

```mermaid
flowchart TD
  classDef key fill:#fff2db,stroke:#d17b00,color:#5c3200
  classDef tbl fill:#e8f1ff,stroke:#1f6feb,color:#0b2c5c

  C[correlation_id]:::key
  W[workflow_state<br/>idx_workflow_correlation]:::tbl
  T[a2a_tasks<br/>idx_a2a_tasks_correlation<br/>idx_a2a_tasks_state<br/>idx_a2a_tasks_context]:::tbl
  S[adk_sessions<br/>idx_adk_sessions_correlation]:::tbl
  I[intake_responses<br/>idx_intake_correlation]:::tbl
  A[artifacts<br/>idx_artifacts_correlation]:::tbl

  C --> W
  C --> T
  C --> S
  C --> I
  C --> A
```

### Typical operational queries

- **Workflow timeline**: `workflow_state` + `workflow_steps` + `workflow_issues` by `workflow_id`.
- **End-to-end trace**: join by `correlation_id` across workflow/task/session/intake/artifacts.
- **Session replay**: `adk_sessions` + ordered `session_events(seq)`.
- **Task lifecycle checks**: `a2a_tasks` filtered by `state`, `agent_name`, `context_id`, `updated_at`.
- **Artifact lineage**: `artifacts` by `workflow_id` and `artifact_type`, then resolve payload in GCS.

## 6) Ownership Map (Code → Tables)

| Component | Primary writes |
|---|---|
| `agents/shared/persistence/postgresql_task_store.py` | `a2a_tasks`, `a2a_session_mappings` |
| `agents/shared/persistence/postgresql_session_service.py` | `adk_sessions`, `session_events` |
| `agents/shared/progress_tracker.py` | `workflow_steps`, `workflow_issues`, `workflow_state.living_summary` |
| `agents/router/workflow_tracker.py` | `workflow_state` |
| `agents/info_gathering_agent/intake_store.py` | `intake_responses` |
| `agents/shared/persistence/gcs_artifact_client.py` + PM/agents | `artifacts` metadata + GCS object payload |

## 7) Non-Goals / Guardrails

- Do **not** store large generated content blobs in Cloud SQL when a `gcs_uri` is available.
- Do **not** reintroduce append-only JSONB arrays for events/issues/steps.
- Keep `adk_sessions.session_data` minimal for compatibility; authoritative turn history is `session_events`.
- Any new frequently queried field should be added as a promoted/indexed column, not only nested JSONB.
- Do **not** add DB columns solely for runtime telemetry tags unless there is a clear query/use-case requirement; prefer Cloud Logging/Trace for runtime telemetry inspection.
