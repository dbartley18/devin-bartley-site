# Agent Architecture — Learning Accelerator

> **Last Updated**: 2026-03-25
> **Scope**: Agent hierarchy, orchestration pattern, state machine, tool distribution, handoff protocol, prompt design, model selection
> **Source of truth**: `learning_accelerator/agent.py` (all agent definitions), `learning_accelerator/prompts/` (agent instructions)

## 1. Orchestration Pattern (Foundation)

The Learning Accelerator uses **hierarchical state-based orchestration**.
A central orchestrator reads the user's workflow state from Firestore and
dispatches to one of five specialized sub-agents. Sub-agents do NOT invoke
each other directly — all transitions flow back through the orchestrator
via state changes.

This is a **state machine** where:
- The orchestrator is the only agent that has sub-agents
- Sub-agents change the user's `state` field via tools
- The orchestrator re-reads state on the next turn and dispatches accordingly
- Sub-agents never see each other's tools or prompts
- A `before_agent_callback` auto-identifies the user from the IAP session before the orchestrator runs

```mermaid
flowchart TD
  classDef orch fill:#1A73E8,stroke:#1557B0,color:#fff
  classDef flash fill:#34A853,stroke:#1E8E3E,color:#fff
  classDef pro fill:#FBBC04,stroke:#F9AB00,color:#333
  classDef tool fill:#f3e5f5,stroke:#7b1fa2,color:#4a148c

  subgraph Root["Root Agent — Orchestrator (gemini-2.5-flash)"]
    direction TB
    Desc["Central Router and State Dispatcher.<br/>Auto-identifies users via before_agent_callback<br/>(IAP email → Firestore lookup → session state).<br/>Evaluates workflow state, delegates to<br/>specialized sub-agents.<br/>Does NOT perform teaching, assessment,<br/>coaching, or onboarding directly."]
    RTools["Tools:<br/>find_user_by_email<br/>fetch_learning_progress<br/>set_user_workflow_state"]:::tool
  end
  Root:::orch

  subgraph Sub["Sub-Agents"]
    direction TB

    subgraph OB["onboarding_agent (gemini-2.5-flash)"]
      OBDesc["Identity Gatekeeper & Account Architect<br/>New user welcome, persona selection, account creation"]
      OBTools["Tools: find_user_by_email · create_user_account<br/>· set_user_workflow_state · update_user_profile"]:::tool
    end
    OB:::flash

    subgraph AS["assessment_agent (gemini-2.5-flash)"]
      ASDesc["Proficiency Evaluator & Learning Path Architect<br/>20-question adaptive quiz, path generation, focus modules"]
      ASTools["Tools: create_quiz_session · record_quiz_answer<br/>· complete_quiz_session · update_user_proficiency<br/>· set_user_workflow_state · create_learning_path<br/>· create_focus_module · compute_proficiency_score"]:::tool
    end
    AS:::flash

    subgraph TE["teach_agent (gemini-2.5-pro)"]
      TEDesc["Primary AI Tutor & Knowledge Validator<br/>5-phase lesson delivery, module quizzes, escalation"]
      TETools["Tools: find_user_by_email · fetch_learning_progress<br/>· fetch_next_active_module · get_module_details<br/>· begin_module_session · save_assessment_response<br/>· get_quiz_result · finish_module_session<br/>· get_module_progress · escalate_to_coach<br/>· generate_learning_visual"]:::tool
    end
    TE:::pro

    subgraph CO["coach_agent (gemini-2.5-pro)"]
      CODesc["Remediation Specialist & Learning Support<br/>Socratic method, alternative explanations, confidence rebuilding"]
      COTools["Tools: find_user_by_email · find_struggling_modules<br/>· get_module_details · save_assessment_response<br/>· get_module_progress · set_user_workflow_state<br/>· generate_learning_visual"]:::tool
    end
    CO:::pro

    subgraph EX["exploration_agent (gemini-2.5-flash)"]
      EXDesc["Advanced Topics Guide & Curriculum Extender<br/>Custom module creation for users who completed the path"]
      EXTools["Tools: find_user_by_email · fetch_learning_progress<br/>· create_exploration_module"]:::tool
    end
    EX:::flash
  end

  Root --> OB
  Root --> AS
  Root --> TE
  Root --> CO
  Root --> EX
```

### Why this matters

| Design Decision | Rationale |
|---|---|
| Orchestrator runs `before_agent_callback` to auto-identify users | IAP email → Firestore lookup → session state pre-loaded. Returning users skip "what's your email?" |
| All sub-agent prompts include `## User Context` with `{user:name?}`, `{user:email?}`, etc. | Session state is checked before calling `find_user_by_email`. Eliminates redundant tool calls |
| Orchestrator reads `user.state`, dispatches to correct agent | State-driven routing is deterministic and auditable |
| Sub-agents call `set_user_workflow_state()` to signal transitions | Explicit state writes make every transition observable in Firestore |
| Each agent has only its own tools — no shared tool pool | Least-privilege: agents can only perform actions relevant to their role |
| Prompts define handoff behavior per agent | Handoff logic lives in version-controlled markdown, not hardcoded in application code |
| Orchestrator is stateless — state lives in Firestore | No in-memory caching means every turn reads the latest truth from the database |

## 2. State Machine — How Users Flow Between Agents

The user's `state` field in Firestore is the **single source of routing truth**.
The orchestrator reads it on every turn. Sub-agents write it via
`set_user_workflow_state()` to trigger transitions.

```mermaid
stateDiagram-v2
  [*] --> unknown : find_user_by_email() returns null

  unknown --> onboarding : New user detected →<br/>Orchestrator delegates to<br/>Onboarding Agent

  onboarding --> assessing : create_user_account() +<br/>set_user_workflow_state("assessing")<br/>User confirms ready

  assessing --> learning : Assessment complete +<br/>create_learning_path() +<br/>set_user_workflow_state("learning")

  learning --> idle : finish_module_session() →<br/>module completed,<br/>more modules remain

  learning --> coaching : escalate_to_coach() →<br/>user failed quiz 2x

  learning --> completed : finish_module_session() →<br/>path_complete=True

  idle --> learning : begin_module_session() →<br/>Teach Agent starts next module

  coaching --> learning : set_user_workflow_state("learning") →<br/>Coach returns user after remediation

  idle --> completed : All modules done<br/>(edge case: last module was idle→learning→completed)

  completed --> learning : create_exploration_module() →<br/>Exploration Agent appends<br/>module, state → learning

  state "onboarding" as onboarding : Onboarding Agent
  state "assessing" as assessing : Assessment Agent
  state "learning" as learning : Teach Agent
  state "idle" as idle : Teach Agent
  state "coaching" as coaching : Coach Agent
  state "completed" as completed : Exploration Agent
```

### State-to-agent routing table

| User State | Dispatched Agent | Entry Condition |
|-----------|-----------------|-----------------|
| *(unknown)* | `onboarding_agent` | `find_user_by_email()` returns null |
| `onboarding` | `onboarding_agent` | Account not fully created yet |
| `assessing` | `assessment_agent` | Account created, quiz not complete |
| `learning` | `teach_agent` | Active module in progress |
| `idle` | `teach_agent` | Between modules, ready for next |
| `reviewing` | `teach_agent` | Re-studying failed content |
| `coaching` | `coach_agent` | Failed module 2+ times, needs support |
| `completed` | `exploration_agent` | All standard modules finished |

### Override routing (keyword-based)

The orchestrator also supports **keyword overrides** in user messages:
- "help" / "struggling" → `coach_agent` (regardless of state)
- "start" / "begin" → `onboarding_agent`
- "quiz" / "assessment" → `assessment_agent`
- "progress" / "how am I doing" → orchestrator handles directly via `fetch_learning_progress()`

## 3. Model Selection Strategy

```mermaid
flowchart LR
  classDef flash fill:#34A853,stroke:#1E8E3E,color:#fff
  classDef pro fill:#FBBC04,stroke:#F9AB00,color:#333

  subgraph FlashAgents["gemini-2.5-flash — Fast, Low Cost"]
    O["Orchestrator<br/>Routing decisions only"]:::flash
    OB2["Onboarding<br/>Conversational data collection"]:::flash
    AS2["Assessment<br/>Structured quiz presentation,<br/>tool-driven correctness"]:::flash
    EX2["Exploration<br/>Topic discussion,<br/>module creation"]:::flash
  end

  subgraph ProAgents["gemini-2.5-pro — Higher Reasoning"]
    TE2["Teach<br/>Rich content delivery,<br/>analogies, adaptive pedagogy,<br/>persona-specific examples"]:::pro
    CO2["Coach<br/>Empathetic reasoning,<br/>Socratic method,<br/>alternative explanations,<br/>confidence rebuilding"]:::pro
  end

  QGen["Question Generation<br/>(internal, not an agent)<br/>gemini-2.5-flash<br/>temp=0.7, thinking_budget=0"]:::flash

  ImgGen["Image Generation<br/>(internal, not an agent)<br/>gemini-2.5-flash-image<br/>JPEG output, 16:9 / 1:1<br/>person_generation=DONT_ALLOW"]:::flash
```

| Agent | Model | Why |
|-------|-------|-----|
| Orchestrator | Flash | Only reads state, calls tools, routes — no generation complexity |
| Onboarding | Flash | Collects name + persona, creates account — simple conversational flow |
| Assessment | Flash | Presents questions from tool responses, records answers — tool-driven, not generative |
| Teach | **Pro** | Must generate analogies, build on persona context, adapt explanations, create synthesis exercises |
| Coach | **Pro** | Must reason about *why* a user is struggling, try multiple explanation strategies, use Socratic method |
| Exploration | Flash | Discusses topics, creates modules — mostly tool-driven |
| Question Gen | Flash | Internal LLM call in `_generate_persona_question()` — structured output, not conversational |
| Image Gen | **Flash Image** | Internal LLM call in `generate_learning_visual()` — produces educational JPEG illustrations for Teach and Coach agents |

## 4. Tool Distribution Matrix

Each agent sees **only the tools it needs**. No shared tool pool.
Tools are registered via `FunctionTool()` in `agent.py`.

| Tool | Module | Orch | Onboard | Assess | Teach | Coach | Explore |
|------|--------|:----:|:-------:|:------:|:-----:|:-----:|:-------:|
| `find_user_by_email` | `user_tools` | ✅ | ✅ | | ✅ | ✅ | ✅ |
| `create_user_account` | `user_tools` | | ✅ | | | | |
| `update_user_profile` | `user_tools` | | ✅ | | | | |
| `set_user_workflow_state` | `user_tools` | ✅ | ✅ | ✅ | | ✅ | |
| `update_user_proficiency` | `user_tools` | | | ✅ | | | |
| `create_quiz_session` | `assessment_tools` | | | ✅ | | | |
| `record_quiz_answer` | `assessment_tools` | | | ✅ | | | |
| `complete_quiz_session` | `assessment_tools` | | | ✅ | | | |
| `compute_proficiency_score` | `assessment_tools` | | | ✅ | | | |
| `save_assessment_response` | `assessment_tools` | | | | ✅ | ✅ | |
| `get_quiz_result` | `assessment_tools` | | | | ✅ | | |
| `create_learning_path` | `path_tools` | | | ✅ | | | |
| `create_focus_module` | `path_tools` | | | ✅ | | | |
| `create_exploration_module` | `path_tools` | | | | | | ✅ |
| `fetch_learning_progress` | `path_tools` | ✅ | | | ✅ | | ✅ |
| `fetch_next_active_module` | `module_tools` | | | | ✅ | | |
| `get_module_details` | `module_tools` | | | | ✅ | ✅ | |
| `begin_module_session` | `progress_tools` | | | | ✅ | | |
| `finish_module_session` | `progress_tools` | | | | ✅ | | |
| `get_module_progress` | `progress_tools` | | | | ✅ | ✅ | |
| `escalate_to_coach` | `progress_tools` | | | | ✅ | | |
| `find_struggling_modules` | `progress_tools` | | | | | ✅ | |
| `generate_learning_visual` | `image_tools` | | | | ✅ | ✅ | |

**Total: 23 tool functions across 7 modules.** Internal helpers (`_helpers.py`) are not exposed to agents.

## 5. Agent Handoff Protocol

All transitions between agents follow a **minimal-friction handoff** pattern.
The source agent changes state, the orchestrator re-evaluates, and the target
agent has a **"Receiving Handoff"** section in its prompt that skips re-introductions.

```mermaid
sequenceDiagram
  participant U as User
  participant O as Orchestrator
  participant A1 as Source Agent
  participant FS as Firestore
  participant A2 as Target Agent

  U->>O: (user message)
  O->>FS: find_user_by_email() → read user.state
  O->>O: Route by state → delegate to A1

  A1->>U: Interaction (multiple turns)

  Note over A1: When work is complete:
  A1->>A1: Wait for user confirmation<br/>(never auto-transfer)
  U->>A1: "Ready" / "Let's go" / "Yes"
  A1->>FS: set_user_workflow_state(new_state)
  A1-->>O: Transfer control back

  O->>FS: Re-read user.state (changed)
  O->>O: Minimal transition message<br/>("Let me get you started on your assessment")
  O->>A2: Delegate to new agent

  Note over A2: "Receiving Handoff" prompt section:<br/>— Skip introduction<br/>— Don't re-explain who you are<br/>— Jump directly to first action<br/>— Reference context from prior agent
  A2->>U: Seamless continuation
```

### Transition rules enforced by prompts

| Rule | Enforced In | Example |
|------|------------|---------|
| **Never ask-then-immediately-transfer** | `orchestrator_agent.md` | Don't say "Ready?" and then transfer before user responds |
| **Wait for user confirmation** | All source agents | Assessment Step 9 waits for "ready" before `set_user_workflow_state("learning")` |
| **Skip re-introduction on handoff** | All target agents | "Receiving Handoff" section in every `.md` prompt |
| **Minimal orchestrator messages** | `orchestrator_agent.md` | One sentence max ("Let me get you set up") — not a paragraph |
| **Source agent doesn't normalize** | `teach_agent.md` → `coach_agent.md` | Teach escalates raw — Coach does its own assessment |

## 6. Prompt Architecture

Each agent's behavior is defined by a structured markdown prompt loaded from
`learning_accelerator/prompts/`. Prompts use a consistent format:

### Prompt structure pattern

```
## Identity
  Agent identity and personality

## Receiving Handoff
  How to behave when control arrives from another agent
  (skip intro, reference prior context)

## User Context
  Pre-loaded session state rendered via ADK template variables:
  - **Name:** {user:name?}
  - **Email:** {user:email?}
  - **State:** {user:state?}
  - **Persona:** {user:persona?}
  - **Proficiency:** {user:proficiency?}
  If Name is filled in, skip find_user_by_email.
  If blank, call it as fallback.

## Formatting & Visual Style  (Teach/Coach only)
  Emoji usage rules, text formatting, image placement

## Conversation Flow / Session Flow
  Numbered steps or phases defining the conversation flow
  Each step specifies:
    - What to say
    - What tool to call
    - What to check in the response
    - When to wait for user input
    - When to proceed

## Tools Available
  Tool references with [Tool Name](tool://tool_name) syntax

## Security
  System prompt protection, injection defense
```

### Ownership map (prompt → agent)

| Prompt File | Agent | Lines | Key Sections |
|-------------|-------|-------|-------------|
| `orchestrator_agent.md` | `learning_accelerator` (root) | ~130 | User context (state data fields), sub-agent catalog, routing rules, progress queries |
| `onboarding_agent.md` | `onboarding_agent` | ~120 | Persona selection (7 options), account creation, assessment intro |
| `assessment_agent.md` | `assessment_agent` | ~400 | User context, question loop, correctness from tool only, growth areas, focus modules, path creation |
| `teach_agent.md` | `teach_agent` | ~300 | User context, formatting & visual style, 5-phase lesson (Connect, Explore, Apply, Confirm, Close), image generation, quiz retry, escalation |
| `coach_agent.md` | `coach_agent` | ~220 | User context, formatting & visual style, gap identification, alternative explanation strategies, image generation, confidence rebuild |
| `exploration_agent.md` | `exploration_agent` | ~200 | User context, topic discovery, module creation (max 3), celebratory opening |

## 7. Assessment Agent — Deep Dive

The assessment agent has the most complex tool interaction pattern. It manages
a 20-question adaptive quiz where all questions are pre-generated, answers are
checked server-side, and feedback comes exclusively from tool responses.

### Question lifecycle

```mermaid
flowchart TD
  classDef tool fill:#e8f5e9,stroke:#2e7d32,color:#1b5e20
  classDef llm fill:#f3e5f5,stroke:#7b1fa2,color:#4a148c
  classDef agent fill:#e8f1ff,stroke:#1f6feb,color:#0b2c5c
  classDef data fill:#fff2db,stroke:#d17b00,color:#5c3200

  Create["create_quiz_session(email)"]:::tool

  subgraph Gen["Question Generation (internal, per template)"]
    T["Question template<br/>{id, level, concept,<br/>correct_answer, distractor_hints}"]:::data
    P["Persona context<br/>{role_overview, responsibilities,<br/>outputs, challenges, ai_use_cases}"]:::data
    LLM["Gemini 2.5 Flash<br/>temp=0.7, thinking_budget=0<br/><br/>OUTPUT FORMAT:<br/>QUESTION: (multi-line scenario)<br/>A) ... B) ... C) ... D) ...<br/>CORRECT: letter<br/>EXPLANATION: (multi-line)"]:::llm
    Parse["Section-based parser<br/>Captures multi-line QUESTION<br/>and multi-line EXPLANATION"]:::tool
    Shuffle["_shuffle_options()<br/>Randomize correct answer<br/>position (strip + reshuffle)"]:::tool
    Fallback["_generate_fallback_question()<br/>Generic distractors if LLM fails"]:::tool
  end

  Create --> Gen
  T --> LLM
  P --> LLM
  LLM --> Parse
  Parse -- "valid" --> Shuffle
  Parse -- "invalid" --> Fallback
  Shuffle --> Save
  Fallback --> Save

  Save["db.save_quiz_questions_batch()<br/>All 20 questions to Firestore<br/>in one write"]:::tool
  Save --> Return["Return first_question<br/>to assessment agent"]:::agent
```

### Answer recording flow

```mermaid
sequenceDiagram
  participant Agent as Assessment Agent
  participant Tool as record_quiz_answer()
  participant FS as Firestore
  participant User as User

  Agent->>User: Present question (from first_question or next_question)
  User->>Agent: "C"

  Agent->>Tool: record_quiz_answer(email, q_num=5, answer="C")
  Tool->>FS: Fetch quiz_sessions/{sid}/questions/5
  FS-->>Tool: {question, options, correct: "C", explanation: "..."}

  Tool->>Tool: Compare: user="C" == correct="C" → is_correct=true
  Tool->>FS: Save response to quiz_sessions/{sid}/responses/5
  Tool->>FS: Save to users/{uid}/assessments (initial_5)
  Tool->>FS: Update session stats (total_correct, beginner_wrong, ...)

  Tool->>Tool: Check early termination:<br/>beginner_wrong >= 4? → stop_early<br/>intermediate_wrong >= 3? → stop_early<br/>q_num >= 20? → complete<br/>else → continue

  alt next_action = "continue"
    Tool->>FS: Fetch quiz_sessions/{sid}/questions/6
    FS-->>Tool: next question data
  end

  Tool-->>Agent: {is_correct: true, correct_answer: "C",<br/>explanation: "...", next_action: "continue",<br/>next_question: {q6 data}}

  Note over Agent: CRITICAL: Agent uses is_correct,<br/>correct_answer, and explanation<br/>from this response VERBATIM.<br/>Never substitutes own knowledge.

  Agent->>User: "Correct! [next question from next_question field]"
```

### Adaptive early termination

| Section | Questions | Stop Condition | Classification |
|---------|-----------|---------------|----------------|
| Beginner | Q1–Q8 | 4+ wrong → `stop_early` | Beginner |
| Intermediate | Q9–Q14 | 3+ wrong → `stop_early` | Intermediate |
| Advanced | Q15–Q20 | Complete all → score determines | Intermediate or Advanced |

**Proficiency thresholds:** Beginner (< 45%) · Intermediate (45–75%) · Advanced (> 75%)

## 8. Teach Agent — Lesson Delivery Pattern

The teach agent runs a **5-phase pedagogical loop** for each module. It uses
`gemini-2.5-pro` for higher reasoning capability — generating analogies,
adapting to persona context, and creating synthesis exercises.

```mermaid
flowchart TD
  classDef phase fill:#e8f1ff,stroke:#1f6feb,color:#0b2c5c
  classDef decision fill:#fff2db,stroke:#d17b00,color:#5c3200
  classDef action fill:#e8f5e9,stroke:#2e7d32,color:#1b5e20

  Start["fetch_next_active_module()<br/>+ begin_module_session()"]:::action

  P1["Phase 1: Connect (1-2 min)<br/>Hook question connecting to persona"]:::phase
  P2["Phase 2: Explore (10-12 min)<br/>2-3 content chunks, each:<br/>Explain → Check Understanding → Practice"]:::phase
  P3["Phase 3: Apply (5-7 min)<br/>Synthesis exercise with<br/>persona-specific scenario"]:::phase
  P4["Phase 4: Confirm (3-5 min)<br/>3 multiple-choice questions:<br/>concept · application · judgment"]:::phase

  Start --> P1 --> P2 --> P3 --> P4

  P4 --> Check{"get_quiz_result()<br/>2-3 correct?"}:::decision

  Check -- "Passed (2-3 correct)" --> Pass["finish_module_session()<br/>Celebrate, recap, preview next"]:::action
  Check -- "Failed, 1st attempt" --> Retry["Re-explain with<br/>different angle, offer retry"]:::phase
  Retry --> P4
  Check -- "Failed, 2nd attempt" --> Escalate["escalate_to_coach()<br/>state → coaching"]:::action

  Pass --> Done{"path_complete?"}:::decision
  Done -- "No" --> Idle["state → idle<br/>Orchestrator routes to<br/>Teach for next module"]:::action
  Done -- "Yes" --> Complete["state → completed<br/>Orchestrator routes to<br/>Exploration Agent"]:::action
```

## 9. Persona Context System

Every agent has access to persona data via tool functions. Persona context is
used for question generation (assessment), lesson examples (teach), coaching
analogies (coach), and exploration suggestions (exploration).

### 7 BM&C Personas

| Persona | Title | Example AI Use Cases |
|---------|-------|---------------------|
| `communicator` | Communications Professional | Drafting press releases, social copy, sentiment monitoring |
| `coordinator` | Program/Event Coordinator | Project planning, meeting summaries, vendor research |
| `creator` | Creative Designer | Image generation, presentation design, brand assets |
| `insights` | Insights Analyst | Data analysis, survey synthesis, trend forecasting |
| `marketer` | Marketing Strategist | Campaign ideation, audience segmentation, A/B testing |
| `operator` | Operations Manager | Workflow automation, quality assurance, risk assessment |
| `strategist` | Strategy Consultant | Strategic analysis, business cases, scenario planning |

### Persona data structure (per persona)

```python
{
    "title": "...",
    "role_overview": "...",
    "also_known_as": [...],
    "key_responsibilities": [...],   # Used in question generation prompt
    "typical_outputs": [...],        # Used in question generation prompt
    "tools": [...],
    "top_challenges": [...],         # Used in question generation prompt
    "ai_use_cases": [...]            # Used in question generation prompt
}
```

## 10. Non-Goals / Guardrails

- Agents do **not** invoke each other directly — all routing is through the orchestrator via state changes.
- Sub-agents do **not** share tools — each has an explicit tool set registered in `agent.py`.
- The assessment agent does **not** determine answer correctness — it uses `is_correct` from the tool response verbatim.
- The teach agent does **not** generate quiz questions — it uses tool responses.
- The orchestrator does **not** teach, assess, coach, or onboard — it only routes.
- Agent prompts do **not** contain business logic — all correctness checking, scoring, and state transitions happen in tool code.
- Prompts do **not** reference other agents' prompts — each agent is self-contained.
