# Dev Quickstart Agent API Reference

## Overview

The Dev Quickstart Agent API provides a RESTful interface for interacting with the AI-powered development assistant. The API supports session management, chat interactions, cognitive memory access, and background execution for long-running operations.

## Base URL

```
http://localhost:8000/v1
```

## Authentication

Currently, the API does not require authentication. For production deployments, configure appropriate authentication middleware.

## API Versioning

All endpoints are prefixed with `/v1/` for API versioning. Future breaking changes will be released under `/v2/`, etc.

---

## Interactive Documentation

FastAPI automatically generates interactive documentation:

- **Swagger UI**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`
- **OpenAPI JSON**: `http://localhost:8000/openapi.json`

---

## Core Concepts

### Correlation ID

The `correlation_id` is the primary session identifier (also called "thread key"). It's a UUID that uniquely identifies a conversation session and is used to:
- Track conversation state
- Persist checkpoints
- Associate cognitive memory
- Link run executions

### Interrupt/Resume Pattern

The API implements LangGraph's human-in-the-loop pattern:
1. Agent processes a message
2. If human input is needed, `awaiting_human_input=true` is returned
3. `interrupt_context` contains the question and expected input type
4. Use `POST /resume` with the human response to continue

### Cognitive Phases

The agent operates in cognitive phases:
- **THINK**: Understanding the request
- **PLAN**: Creating an execution plan
- **CHOOSE**: Selecting the best approach
- **ACT**: Executing the chosen action
- **REVIEW**: Evaluating the outcome

### Workflow Phases

The development workflow progresses through phases:
1. Requirements
2. Architecture
3. Scaffolding
4. Database
5. Testing
6. Deployment

---

## Endpoints

### Sessions

#### Create Session

```http
POST /v1/sessions
```

Creates a new conversation session.

**Request Body:**
```json
{
  "workflow_scope": {
    "requirements": true,
    "architecture": true,
    "scaffolding": true,
    "database": true,
    "testing": true,
    "deployment": true
  }
}
```

**Response:**
```json
{
  "correlation_id": "550e8400-e29b-41d4-a716-446655440000",
  "project_id": "550e8400-e29b-41d4-a716-446655440000",
  "message": "Session created. Send your first message to begin.",
  "created_at": "2024-01-15T10:30:00Z"
}
```

#### Get Session Status

```http
GET /v1/sessions/{correlation_id}
```

Returns full session status including phase progress and LLM analyses.

**Response:**
```json
{
  "correlation_id": "550e8400-e29b-41d4-a716-446655440000",
  "project_id": "550e8400-e29b-41d4-a716-446655440000",
  "current_phase": "requirements",
  "cognitive_phase": "THINK",
  "active_agent": "requirements_agent",
  "awaiting_human_input": false,
  "interrupt_context": null,
  "conversation_turn": 5,
  "completed_tasks": ["initial_greeting"],
  "task_queue": ["extract_requirements"],
  "workflow_scope": {"requirements": true, "architecture": true},
  "artifact_references": {},
  "requirements_phase_status": {"initial_gathered": true},
  "architecture_phase_status": null,
  "scaffolding_phase_status": null,
  "database_phase_status": null,
  "testing_phase_status": null,
  "deployment_phase_status": null,
  "goal_clarity_analysis": {"score": 0.8, "explanation": "..."},
  "requirements_coverage_analysis": null,
  "scope_boundaries_analysis": null,
  "success_criteria_analysis": null,
  "technical_constraints_analysis": null
}
```

#### List Sessions

```http
GET /v1/sessions
```

Returns all active sessions.

#### Delete Session

```http
DELETE /v1/sessions/{correlation_id}
```

Deletes a session and its associated state.

---

### Chat

#### Send Message

```http
POST /v1/sessions/{correlation_id}/messages
```

Send a message to the agent.

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `background` | boolean | `false` | Run in background, return `run_id` immediately |
| `stream` | boolean | `false` | Enable Server-Sent Events streaming |

**Request Body:**
```json
{
  "message": "I want to build an e-commerce platform",
  "stream": false
}
```

**Response (Synchronous):**
```json
{
  "correlation_id": "550e8400-e29b-41d4-a716-446655440000",
  "messages": [
    {
      "role": "ai",
      "content": "I understand you want to build an e-commerce platform...",
      "timestamp": "2024-01-15T10:31:00Z"
    }
  ],
  "current_phase": "requirements",
  "cognitive_phase": "THINK",
  "active_agent": "requirements_agent",
  "awaiting_human_input": true,
  "interrupt_context": {
    "question": "What is the expected user volume?",
    "agent": "Requirements Analyst",
    "input_type": "text"
  },
  "next_action": "gather_requirements",
  "grounded_plan_available": false
}
```

**Response (Background):**
```json
{
  "run_id": "run-abc123",
  "correlation_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "pending",
  "created_at": "2024-01-15T10:30:00Z",
  "message": "Run created, execution started in background"
}
```

#### Resume Session

```http
POST /v1/sessions/{correlation_id}/resume
```

Resume after human input request. Use when `awaiting_human_input=true`.

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `background` | boolean | `false` | Run in background, return `run_id` immediately |

**Request Body:**
```json
{
  "response": "We expect about 10,000 daily active users"
}
```

#### Get History

```http
GET /v1/sessions/{correlation_id}/history
```

Returns conversation history.

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `limit` | integer | `50` | Maximum messages to return (1-200) |

---

### Runs (Background Execution)

For long-running operations (60+ seconds), use background execution mode.

#### Get Run Status

```http
GET /v1/runs/{run_id}
```

Poll this endpoint to track execution progress.

**Response:**
```json
{
  "run_id": "run-abc123",
  "correlation_id": "550e8400-e29b-41d4-a716-446655440000",
  "run_type": "message",
  "status": "completed",
  "created_at": "2024-01-15T10:30:00Z",
  "started_at": "2024-01-15T10:30:01Z",
  "completed_at": "2024-01-15T10:31:15Z",
  "error_message": null,
  "awaiting_human_input": true,
  "interrupt_context": {
    "question": "What is the expected user volume?",
    "agent": "Requirements Analyst",
    "input_type": "text"
  },
  "current_phase": "requirements",
  "active_agent": "requirements_agent"
}
```

**Run Status Values:**
| Status | Description |
|--------|-------------|
| `pending` | Run created, waiting to start |
| `running` | Execution in progress |
| `completed` | Execution finished successfully |
| `failed` | Execution failed with error |
| `cancelled` | Execution was cancelled |

#### Cancel Run

```http
POST /v1/runs/{run_id}/cancel
```

Request cancellation of a running execution. This is cooperative cancellation.

**Request Body:**
```json
{
  "reason": "User requested cancellation"
}
```

#### List Session Runs

```http
GET /v1/sessions/{correlation_id}/runs
```

List all runs for a session.

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `limit` | integer | `20` | Maximum runs to return (1-100) |
| `offset` | integer | `0` | Pagination offset |

---

### Checkpoints

#### List Checkpoints

```http
GET /v1/sessions/{correlation_id}/checkpoints
```

Returns checkpoint history for state recovery.

**Response:**
```json
{
  "correlation_id": "550e8400-e29b-41d4-a716-446655440000",
  "checkpoints": [
    {
      "checkpoint_id": "ckpt-abc123",
      "thread_id": "550e8400-e29b-41d4-a716-446655440000",
      "parent_id": "ckpt-abc122",
      "timestamp": "2024-01-15T10:30:00Z",
      "transition_type": "requirements_confirmed",
      "version": "1"
    }
  ],
  "total": 5
}
```

#### Rollback to Checkpoint

```http
POST /v1/sessions/{correlation_id}/rollback
```

Rollback session state to a specific checkpoint.

**Request Body:**
```json
{
  "checkpoint_id": "ckpt-abc123",
  "reason": "Need to revise requirements"
}
```

---

### Cognitive Memory

#### Get Grounded Plan

```http
GET /v1/sessions/{correlation_id}/plan
```

Returns the current grounded execution plan.

#### Update Plan Progress

```http
POST /v1/sessions/{correlation_id}/plan/progress
```

Update the progress of a plan step.

**Request Body:**
```json
{
  "step_id": "step-1",
  "status": "done",
  "outcome": "Requirements successfully extracted"
}
```

#### Get Conflicts

```http
GET /v1/sessions/{correlation_id}/conflicts
```

Returns detected conflicts in the session.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `status` | string | Filter by status (DETECTED, ASKED_USER, etc.) |

#### Resolve Conflict

```http
POST /v1/sessions/{correlation_id}/conflicts/{conflict_id}/resolve
```

Resolve a detected conflict.

**Request Body:**
```json
{
  "resolution_text": "Use PostgreSQL as specified in requirements",
  "action": "resolve"
}
```

#### Get OFC Predictions

```http
GET /v1/sessions/{correlation_id}/predictions
```

Returns OFC (Orbitofrontal Cortex) predictions for learning.

#### Get Tiered Memory

```http
GET /v1/sessions/{correlation_id}/memory
```

Returns tiered conversation memory (recent, medium, ancient).

#### Get Artifacts

```http
POST /v1/sessions/{correlation_id}/artifacts
```

Retrieve project artifacts from cognitive memory.

**Request Body:**
```json
{
  "context_type": "requirements",
  "context_key": "extracted_requirements",
  "query_text": null
}
```

---

### Golden Records

#### List Golden Records

```http
GET /v1/golden-records
```

Returns pattern templates from golden records.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `lifecycle_state` | string | Filter by state (SEED, EXPERIMENTAL, PROVEN, etc.) |
| `limit` | integer | Maximum records to return |

#### Get Golden Record

```http
GET /v1/golden-records/{golden_record_id}
```

Returns a specific golden record by ID.

---

### Search

#### Search Reasoning Patterns

```http
POST /v1/search/patterns
```

Semantic search across reasoning patterns.

**Request Body:**
```json
{
  "query_text": "microservices architecture patterns",
  "limit": 5,
  "similarity_threshold": 0.7
}
```

#### Search Reasoning Chains

```http
POST /v1/search/chains
```

Semantic search across reasoning chains.

---

### System

#### Health Check

```http
GET /health
```

Basic health check.

```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00Z",
  "active_sessions": 3,
  "database_connected": true,
  "checkpointer_type": "EnhancedPostgresSaver",
  "model_type": "ChatAnthropic"
}
```

#### Liveness Probe

```http
GET /health/live
```

Kubernetes liveness probe.

#### Readiness Probe

```http
GET /health/ready
```

Kubernetes readiness probe.

#### Metrics

```http
GET /metrics
```

Prometheus metrics endpoint.

---

## Error Handling

All errors return a structured response:

```json
{
  "error": "SESSION_NOT_FOUND",
  "message": "Session with correlation_id 'abc-123' not found",
  "details": {"correlation_id": "abc-123"},
  "correlation_id": "req-456"
}
```

### Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `SESSION_NOT_FOUND` | 404 | Session does not exist |
| `SESSION_EXPIRED` | 410 | Session has expired |
| `AWAITING_INPUT` | 400 | Session awaiting human input |
| `NOT_AWAITING_INPUT` | 400 | Session not awaiting input |
| `GRAPH_INVOCATION_FAILED` | 500 | Agent execution error |
| `RUN_NOT_FOUND` | 404 | Background run not found |
| `RUN_ALREADY_COMPLETED` | 400 | Run already finished |
| `RUN_CANCELLATION_FAILED` | 400 | Could not cancel run |
| `MEMORY_NOT_INITIALIZED` | 500 | Cognitive memory not ready |
| `ARTIFACT_NOT_FOUND` | 404 | Requested artifact missing |
| `PLAN_NOT_FOUND` | 404 | No grounded plan exists |
| `CONFLICT_NOT_FOUND` | 404 | Conflict ID not found |
| `GOLDEN_RECORD_NOT_FOUND` | 404 | Golden record not found |

---

## Streaming (SSE)

When `stream=true`, the endpoint returns Server-Sent Events:

```javascript
// JavaScript example
const eventSource = new EventSource(
  `/v1/sessions/${correlationId}/messages?stream=true`
);

eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);
  
  switch (data.type) {
    case 'message':
      console.log('AI:', data.content);
      break;
    case 'interrupt':
      console.log('Question:', data.context.question);
      break;
    case 'complete':
      console.log('Done:', data.state);
      eventSource.close();
      break;
    case 'error':
      console.error('Error:', data.message);
      eventSource.close();
      break;
  }
};
```

---

## Background Execution with Supabase Realtime

For real-time status updates without polling, use Supabase Realtime:

```javascript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Subscribe to run status changes
const channel = supabase
  .channel('runs')
  .on(
    'postgres_changes',
    {
      event: 'UPDATE',
      schema: 'cognitive',
      table: 'runs',
      filter: `run_id=eq.${runId}`,
    },
    (payload) => {
      console.log('Run status:', payload.new.status);
      if (['completed', 'failed', 'cancelled'].includes(payload.new.status)) {
        channel.unsubscribe();
      }
    }
  )
  .subscribe();
```

---

## Rate Limiting

The API currently does not enforce rate limits. For production, configure rate limiting at the reverse proxy level.

---

## Running the Server

```bash
# Development
uvicorn dev_quickstart_agent.api.main:app --reload --port 8000

# Production
uvicorn dev_quickstart_agent.api.main:app --host 0.0.0.0 --port 8000 --workers 4
```

---

## Database Migrations

Before using run management features, run the Alembic migration:

```bash
alembic upgrade head
```

Then enable Supabase Realtime on the `cognitive.runs` table:

```sql
ALTER PUBLICATION supabase_realtime ADD TABLE cognitive.runs;
```

---

## See Also

- [Architecture Documentation](./architecture.md)
- [Deployment Guide](./deployment.md)
- [Error Codes Reference](./error_codes.md)
- [Grounded Planning](./grounded_planning.md)
