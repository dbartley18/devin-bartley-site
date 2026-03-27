# System Guide & References — V3 Full Mesh

> **Last Updated**: 2026-02-20

## System Flow (End-to-End)

### Request Path
1. **User → Gemini Enterprise** — User sends a marketing request via Gemini Enterprise UI
2. **Gemini Enterprise → Intent Router** — A2A protocol, single registered agent (`Marketing Workbench`)
3. **Intent Router classifies intent** — LLM reads agent card summaries, determines which workflow/agents are needed
4. **Router builds execution plan** — Dependency graph from `x-mesh` fields (produces/requires/feedsInto), topological sort
5. **Router invokes first agent** — A2A `message/stream` SSE to the entry agent (e.g., Info Gathering Agent)
6. **Agents self-chain** — Each agent completes its task → packages artifact + distilled context brief → hands off to next peer via A2A
7. **PM Agent validates handoffs** (Phase 3A) — Sits in the handoff path, checks alignment, dual-notifies on issues
8. **Artifacts flow through GCS** — Each step writes output to `gs://adk-a2a-poc-artifacts/workflows/{workflow_id}/`
9. **Agent-decided human input** — When an agent needs human feedback, it returns `input-required` status → PM → Router → User
10. **Router relays final result** — Streams back to user via Gemini Enterprise

### Agent Communication Pattern
- **A2A Protocol** — JSON-RPC over HTTP (`POST /`, `GET /.well-known/agent.json`)
- **Streaming** — `message/stream` SSE for progressive updates (working status, intermediate results)
- **IAM Auth** — Each agent's service account has `run.invoker` on peer Cloud Run services
- **Context passing** — Artifact (GCS URI) + distilled context brief (what, why, open questions) sent with every handoff

## Component Reference

### Intent Router (`agents/router/`)
| File | Purpose |
|------|---------|
| `agent.py` | ADK agent definition, Gemini 2.5 Pro, system prompt |
| `tools.py` | `invoke_agent`, `plan_execution`, `list_available_agents` — ADK tools |
| `workflow_tracker.py` | Workflow lifecycle (create, update, query) in Cloud SQL |
| `a2a_agent.py` | A2A service wrapper, FastAPI app, agent card serving |

### Shared Modules (`agents/shared/`)
| Module | Purpose | Key Details |
|--------|---------|-------------|
| `executor.py` | Base A2A executor | Dual-role (server + client), `invoke_peer()`, `_on_task_complete()` hook, `ContentProducerExecutor` subclass for auto-review |
| `a2a_client.py` | Async A2A client | `send_task()`, `send_task_streaming()`, `get_agent_card()`, IAM auth, retry with backoff |
| `agent_registry.py` | Agent card registry | `fetch_all_cards()`, `build_dependency_graph()`, `get_execution_plan()`, TTL cache (5 min), cycle detection |
| `agent_catalog.py` | Agent catalog for router | Maps agent names to URLs, card summaries for LLM prompt |
| `gcs_artifact_client.py` | GCS artifact storage | `upload_artifact()`, `download_artifact()`, `get_signed_url()` |
| `circuit_breaker.py` | Circuit breaker | `call()`, `call_with_fallback()`, `reset()` — protects against cascading failures |
| `mesh_agent_card.py` | x-mesh agent card model | Parses extended agent card fields (produces, requires, feedsInto, humanCheckpoint) |
| `mcp_client.py` | MCP toolset | Streamable HTTP transport, per-task session isolation (D19), `header_provider` for fresh IAM tokens |
| `db_manager.py` | Cloud SQL connections | Async connection pool, PSC endpoint, IAM auth |
| `postgresql_task_store.py` | A2A task persistence | JSONB storage in `a2a_tasks` table |
| `postgresql_session_service.py` | ADK session management | `_SafeEncoder` (bytes, set), session CRUD in `adk_sessions` table |
| `stores.py` | Store factory | Creates task store + session service instances |

### Agent Cards (`agent_cards/`)
Extended A2A agent cards with `x-mesh` schema:
- `x-mesh.produces` — Artifact types this agent creates
- `x-mesh.requires` — Artifact types this agent needs as input
- `x-mesh.feedsInto` — Downstream agents (informational, not hardcoded routing)
- `x-mesh.humanCheckpoint` — Whether this agent may request human input
- `x-mesh.parallelizable` — Whether this agent can run concurrently with peers

### MCP Marketing Tools (`mcp_server/`)
Shared tool server, Streamable HTTP transport (stateless POST per call):
| Tool | Purpose |
|------|---------|
| `generate_image` | Vertex AI Imagen — image generation |
| `guidelines_reader` | Reads Deloitte brand/content guidelines from Firestore KB |
| `lookup_personas` | Executive persona library lookup |
| `google_search` | Google Custom Search API |

### Data Migration (`data_migration/`)
| File | Purpose |
|------|---------|
| `migrate.py` | Schema migration runner — connects as `postgres` superuser, runs numbered SQL files, creates `mesh_agents` role |
| `sql/` | Numbered migration files (e.g., `001_create_tables.sql`) |

### Terraform (`terraform/`)
| Path | Purpose |
|------|---------|
| `modules/a2a_cloudrun_agent/` | Reusable module for Cloud Run agent services (supports `peer_agent_urls`, IAM, env vars) |
| `modules/mcp_server/` | MCP server Cloud Run module |
| `modules/iam/` | IAM bindings module |
| `environments/dev/` | Dev environment config (`main.tf` with 15 service modules, `variables.tf`, `terraform.tfvars`) |

## Environment & Infrastructure

### GCP Resources
| Resource | Value |
|----------|-------|
| Project | `us-gcp-ame-con-ae963-npd-1` |
| Region | `us-central1` |
| Cloud SQL | `adk-a2a-poc` (PostgreSQL, PSC-only, IAM auth) |
| GCS Bucket | `gs://adk-a2a-poc-artifacts` |
| Artifact Registry | `us-central1-docker.pkg.dev/.../eminence-agents` |
| VPC Connector | `adk-a2a-connector` |

### Cloud SQL Tables
| Table | Purpose |
|-------|---------|
| `a2a_tasks` | A2A task state (id TEXT PK, data JSONB, updated_at) |
| `a2a_session_mappings` | Maps A2A task IDs to ADK session IDs |
| `adk_sessions` | ADK session state |
| `workflow_state` | Workflow lifecycle (workflow_id, status, execution_plan, artifacts, context) |

### Key Configuration
| Env Var | Purpose |
|---------|---------|
| `GOOGLE_CLOUD_PROJECT` | GCP project ID |
| `GOOGLE_CLOUD_LOCATION` | Region |
| `GOOGLE_GENAI_USE_VERTEXAI` | Use Vertex AI for Gemini |
| `MCP_SERVER_URL` | MCP Marketing Tools endpoint |
| `GCS_ARTIFACT_BUCKET` | Artifact storage bucket |
| `PEER_AGENT_URLS` | JSON dict of peer agent name → Cloud Run URL |
| `AGENT_REGISTRY_URLS` | (Router only) JSON list of all agent service URLs |

## Related Documents

| Document | Path | Description |
|----------|------|-------------|
| V3 Mesh Architecture Plan | [v3_mesh_architecture_plan.md](v3_mesh_architecture_plan.md) | Full architecture design — agent inventory, dependency graphs, protocols |
| V3 Build Tracker | [v3_build_tracker.md](v3_build_tracker.md) | Implementation progress, decision log (D1–D28) |
| V3 Engineering Rules | [v3_engineering_rules.md](v3_engineering_rules.md) | Coding standards, testing policy, conventions |
| System Architecture (Mermaid) | [01_mermaid_system_arch.md](01_mermaid_system_arch.md) | System-level Mermaid diagram |
| Agent Architecture (Mermaid) | [02_mermaid_agent_arch.md](02_mermaid_agent_arch.md) | Agent-level Mermaid diagrams |
| DB Architecture (Mermaid) | [05_db_arch.md](05_db_arch.md) | Database model, normalized write paths, and correlation/query architecture |
| README | [../eminence_agent_v2/README.md](../eminence_agent_v2/README.md) | Quickstart, project structure, deployment |
