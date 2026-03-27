// ─── Type Definitions ────────────────────────────────────────────────────────

export interface Identity {
  name: string;
  title: string;
  org: string;
  tagline: string;
  background: string[];
}

export interface PhilosophyEntry {
  key: string;
  quote: string;
}

export interface StratosExperiment {
  id: number;
  name: string;
  objective: string;
  finding: string;
  challenge: string;
  coreInsight: string;
}

export interface StratosThread {
  tagline: string;
  repoUrl: string;
  intro: string;
  journeyPreamble: string;
  experiments: StratosExperiment[];
  lightbulbMoment: {
    analogy: string;
    thesis: string;
    elaboration: string;
    intelligenceCycle: string;
    producedInsights: string[];
  };
  architecture: {
    dualMemory: string;
    ganLoop: string;
    personaHub: string;
  };
  voice: string;
}

export interface OriginStory {
  projectId: string;
  title: string;
  story: string;
}

export interface TechStack {
  personal: {
    coding: string[];
    llm: string[];
    favoriteModels: string[];
    planning: string;
    execution: string;
    servedApps: string;
  };
  work: {
    coding: string[];
    sameModelPreferences: boolean;
  };
}

export interface Project {
  id: string;
  name: string;
  type: "work" | "personal";
  oneLiner: string;
  whatItIs: string;
  architecture: string;
  keyDetails: string[];
  stats: Record<string, string | number>;
  github?: string;
}

export interface AiWorkflow {
  headline: string;
  planning: string;
  execution: string;
  philosophy: string;
  meta: string;
}

export interface KnowledgeBase {
  identity: Identity;
  philosophy: PhilosophyEntry[];
  stratosThread: StratosThread;
  originStories: OriginStory[];
  techStack: TechStack;
  projects: Project[];
  aiWorkflow: AiWorkflow;
}

// ─── Knowledge Base ──────────────────────────────────────────────────────────

export const knowledge: KnowledgeBase = {
  identity: {
    name: "Devin Bartley",
    title: "Manager, AI & Innovation",
    org: "Deloitte",
    tagline: "I think in architecture, I build with AI.",
    background: [
      "Deep business strategy, marketing, martech background",
      "Highly technical — picked up software engineering easily",
      "Leads AI & Transformation for Deloitte (technical strategy)",
      "Leads engineers for agentic builds",
      "\"Weird unicorn\" — strategy mind + engineering execution",
      "One person with the right mental models and the right tools",
    ],
  },

  philosophy: [
    {
      key: "core_belief",
      quote:
        "Everything great started with a simple idea. Those that don't progress to great is due to an unwillingness to pressure test.",
    },
    {
      key: "on_failure",
      quote:
        "Failure isn't bad. It's the collection of additional variables to adjust approach.",
    },
    {
      key: "first_principles",
      quote:
        "Knowledge is like Legos. Concepts build on one another. Understand first principles, stack into endless configurations.",
    },
    {
      key: "brain_obsession",
      quote:
        "Obsessed with the brain and how it works — built an entire agent architecture modeled on neuroscience.",
    },
    {
      key: "on_intelligence",
      quote:
        "Intelligence isn't magic — it's pattern recognition refined by feedback.",
    },
    {
      key: "on_agents",
      quote:
        "LLMs aren't the agent — they're the substrate for experience. Most 'agents' are mislabeled — they're LLM-powered tools with deterministic capabilities. The real agent is the orchestrator with goals, memory, and judgment.",
    },
    {
      key: "on_ai",
      quote:
        "Built ALL of these systems using AI. A strategist who weaponized AI as a force multiplier.",
    },
    {
      key: "on_architecture",
      quote:
        "Systems thinking is the meta-skill. Every project starts with architecture — the code writes itself after that.",
    },
    {
      key: "on_ideas",
      quote:
        "Every single project started with a seed of an idea. A frustration, a question, a 'what if.' The architecture emerged from pressure-testing that idea.",
    },
    {
      key: "on_building",
      quote:
        "We didn't build it to sell it. We mapped it because we know we'd use it.",
    },
  ],

  stratosThread: {
    tagline: "Transform Brand Moments into Market Action.",
    repoUrl: "https://github.com/dbartley18/Stratos",
    intro:
      "Stratos is a strategic vision document — not a product, but an externalization of how Devin thinks. It's a whitepaper on \"Agentic GTM Orchestration\" that reveals the intellectual thread connecting all four projects. Stratos wasn't launched — it isn't even built yet. It emerged because we needed something that didn't exist.",
    journeyPreamble:
      "Devin spent years building BDR playbooks, CRM systems, lead management processes, demand generation programs. Same friction every time: disconnected systems, abundant but inactive data, manual processes, team silos with endless handoffs. Market moments happen in real-time but teams can't respond at that speed.",
    experiments: [
      {
        id: 1,
        name: "Multi-Agent Persona Systems",
        objective:
          "Create realistic executive personas (CFO, CMO, CTO) that could simulate decision-making across industries and company sizes.",
        finding:
          "LLMs could embody personas effectively with proper context and constraints, but behavioral consistency required explicit memory systems — agents without memory produced inconsistent responses.",
        challenge:
          "Agents exhibited \"generic executive\" behavior without sufficient persona-specific constraints; maintaining personality consistency across longer interactions proved difficult.",
        coreInsight:
          "Personas need to be 'memories' rather than 'prompts' — stable behavioral patterns that persist across interactions.",
      },
      {
        id: 2,
        name: "Orchestration Graphs",
        objective:
          "Create dynamic workflow systems that could adapt and reason about process optimization.",
        finding:
          "Static workflows break at edge cases — dynamic graphs could adapt and self-heal. The most effective graphs had \"meta-nodes\" that could reason about the graph structure itself.",
        challenge:
          "Graph complexity grew exponentially; debugging dynamic self-modifying graphs was extremely difficult.",
        coreInsight:
          "Orchestration needs to be 'cognitive' — not just routing decisions, but reasoning about the decision-making process itself.",
      },
      {
        id: 3,
        name: "Deterministic Agents",
        objective:
          "Create agents that operate autonomously within strict business constraints while exhibiting intelligent behavior.",
        finding:
          "Agents performed best with clear boundaries rather than open-ended freedom. The sweet spot was \"bounded creativity\" — freedom to innovate within specific parameters.",
        challenge:
          "Too many constraints = robotic; too few = unpredictable. Defining the right boundaries required deep domain expertise.",
        coreInsight:
          "Intelligence isn't about unlimited freedom — it's about sophisticated reasoning within appropriate constraints.",
      },
      {
        id: 4,
        name: "LLM-Based Cognition with Tiered Memory",
        objective:
          "Build cognitive architectures mirroring human thinking with distinct memory systems.",
        finding:
          "The distinction between memory tiers was crucial for decision quality. Different decisions required different memory access patterns.",
        challenge:
          "Memory systems required careful curation to avoid noise; balancing persistence with adaptability was technically complex.",
        coreInsight:
          "LLMs aren't cognitive agents by themselves — they become cognitive when paired with appropriate memory architectures.",
      },
      {
        id: 5,
        name: "GAN-Inspired Modeling",
        objective:
          "Use adversarial training principles to model buyer behavior patterns.",
        finding:
          "Adversarial validation significantly improved synthetic persona quality. Multiple validation rounds created increasingly sophisticated responses.",
        challenge:
          "Training discriminators required substantial real-world behavioral data; system could overfit to specific patterns.",
        coreInsight:
          "Synthetic validation works, but only when grounded in substantial real-world behavioral data and iterative refinement.",
      },
    ],
    lightbulbMoment: {
      analogy:
        "Teaching his son to shoot a basketball: \"He didn't need equations — he needed feedback. Watch the arc, adjust angle and force, repeat until muscle memory forms.\"",
      thesis:
        "LLMs aren't the agent — they're the substrate for experience.",
      elaboration:
        "The agent is the system that knows what to do with that experience. LLMs don't lack intelligence — they're trained on more patterns than any one person could ever live. What they need is structure to apply those patterns toward a goal. Judgment isn't generated — it's orchestrated.",
      intelligenceCycle:
        "Pattern → Response → Feedback → Adjustment → Reuse",
      producedInsights: [
        "Aura's brain architecture — removing the orchestrator from the graph, treating sub-agents as smart tools.",
        "The Marketing Workbench mesh — decomposing agents, using A2A for emergent composition.",
        "The Learning Accelerator's pedagogy — the 5-phase cognitive loop mirrors Stratos's Think → Plan → Choose → Act → Review.",
      ],
    },
    architecture: {
      dualMemory:
        "Execution State (Postgres — working + short-term) and Cognitive Memory (PGVector — long-term semantic embeddings). Only the orchestrator has direct access to both systems. Smart tools operate statelessly, relying on the orchestrator to route relevant context.",
      ganLoop:
        "Generator Agent (creates variants) → Simulation Agent (tests against synthetic executive personas) → Discriminator Agent (ranks response strength) → Coordinator Agent (selects best path). This isn't campaign automation. It's proactive, validated decisioning.",
      personaHub:
        "Inspired by Tencent's latent persona modeling. We don't need to train a custom model. We need to structure the prompts, select the right behavioral parameters, and evaluate response fit.",
    },
    voice:
      "Precise, confident without posturing, technically grounded but strategically elevated. Uses \"we\" not \"I.\" Avoids buzzwords. Em-dashes liberally. Direct but not blunt. Conviction backed by evidence, not assertion.",
  },

  originStories: [
    {
      projectId: "riva",
      title: "Why does job search still suck?",
      story:
        "Started from frustration: busy senior people don't have time to manually search LinkedIn. Why are we searching for jobs when we have AI systems? The \"Reverse Headhunter\" concept — AI finds you, not the other way around — came from that single question.",
    },
    {
      projectId: "dev-quickstart",
      title:
        "What if I could make it easier for non-engineers to go from idea to scaffolded agent project?",
      story:
        "The most fascinating evolution. Started as a LangGraph-based system to help functional people within orgs build agents. Then a realization: \"I hate LangGraph. An agent bound to a graph isn't an agent — it's a runnable function with an LLM wrapper and access to runnable functions with tool decorators.\" Started calling those smart tools. Then the lightbulb: if you lean into smart tools (what most call sub-agents) but remove the orchestrator from the graph, you can build a true agent with access to sub-agents treated as tools. The brain architecture, the emotional intelligence, the persona system — everything else came in time, building on that core insight.",
    },
    {
      projectId: "learning-accelerator",
      title: "Can we use Custom GPTs to teach people about AI?",
      story:
        "Started with an idea from Mark K (team leader): could we use Google Gems or Custom GPTs to teach people about AI? That seed question evolved into a full generative curriculum engine with zero pre-authored content, a 6-agent state machine, adaptive pedagogy, and persona-specific learning paths.",
    },
    {
      projectId: "a2a-mesh",
      title: "What if you decomposed each agent and used A2A?",
      story:
        "The Marketing Workbench already existed as a product (workflows running in GCP). Devin's idea: decompose each agent, rip out the orchestrator, use A2A protocol, deploy via Gemini Enterprise. The hypothesis was that Gemini Enterprise would be smart enough to call agents using semantic mapping. It couldn't — that's only possible with Vertex Search. So the pivot: build a front door as a surface, register that front door in Gemini Enterprise, and let the mesh handle composition behind it.",
    },
  ],

  techStack: {
    personal: {
      coding: ["Cursor", "Claude Code CLI (iTerm2 — 5 tabs)"],
      llm: ["ChatGPT (history)", "prefers Claude", "Ollama"],
      favoriteModels: ["Claude", "Gemini"],
      planning: "Claude Opus 4.6 + Gemini 2.5 Pro + GPT 5.x",
      execution: "Sonnet 4.6 + Opus 4.6",
      servedApps:
        "Gemini for served apps (cost of intelligence)",
    },
    work: {
      coding: [
        "Claude Code CLI (5 iTerm2 tabs)",
        "VSCode + GitHub Copilot",
      ],
      sameModelPreferences: true,
    },
  },

  projects: [
    {
      id: "a2a-mesh",
      name: "Marketing Workbench — V3 Full Mesh",
      type: "work" as const,
      oneLiner:
        "A self-organizing multi-agent mesh where 23 autonomous AI agents discover each other, negotiate handoffs, and compose marketing workflows without hardcoded pipelines.",
      whatItIs:
        "Enterprise marketing platform built for Deloitte. Users issue natural-language requests in Gemini Enterprise and the system decomposes, plans, executes, and delivers complex multi-step marketing outputs automatically.",
      architecture:
        "Full mesh — every agent is both an A2A server and client. No hub-and-spoke. Composition is emergent: agents read each other's capability cards at startup, use LLMs to reason about handoffs. Adding a new agent = drop a JSON card + deploy a Cloud Run service. Mesh auto-discovers within 5 minutes. Evolved from V1 hub-and-spoke to V3 full mesh.",
      keyDetails: [
        "Intent Router (Gemini 2.5 Pro): Classifies user intent, builds dependency graph via topological sort (Kahn's algorithm)",
        "PM Agent (Gemini 2.5 Pro): Central planning authority with 15 tools. Validates handoffs, tracks progress. Does NOT relay content — agents brief each other directly",
        "23 specialist agents across 3 domains + 1 shared MCP tool server = 24 Cloud Run services",
        "Three workflow domains: Eminence Content (5 agents), Brand Naming (7 agents), Campaign Planning (8 agents)",
        "Emergent composition via extended agent cards with x-mesh extension declaring produces, requires, feedsInto, parallelizable, humanCheckpoint",
        "Living execution plans — any specialist can propose plan mutations via propose_plan_update with 5 structural validation gates in pure Python",
        "Adaptive trust scoring: recency-weighted (RECENCY_WEIGHT=0.7). Trust >= 0.85 + >= 5 runs = delegated authority. Trust < 0.60 = governed mode",
        "Cross-workflow composition via resolve_goal_agents backward-chaining through artifact catalog dependency graph",
        "Real-time SSE streaming with dedup. Dual tracing: correlation_id (domain) linked to OTel trace_id (infra) via span attributes. W3C traceparent propagated",
        "Cloud SQL PostgreSQL, 7 migrations. 5 learning tables track composition patterns, outcomes, capabilities, user profiles, preferences",
        "GCP us-central1, Terraform-managed with reusable Cloud Run modules, IAM service-to-service auth, PSC-only Cloud SQL",
      ],
      stats: {
        Stack: "GCP, Cloud Run, Cloud SQL, MCP, Terraform",
        Framework: "A2A + Google ADK",
        Models: "Gemini 2.5 Pro/Flash",
        Services: "24 Cloud Run",
        Agents: "23 autonomous",
        ADRs: "37+ documented",
      },
    },
    {
      id: "learning-accelerator",
      name: "Learning Accelerator",
      type: "work" as const,
      oneLiner:
        "An AI learning platform that generates every lesson, quiz, exercise, and visual in real time — zero pre-authored content. Adding a new audience = ~80 lines of data, zero code changes.",
      whatItIs:
        "Enterprise AI learning platform for Deloitte's marketing & communications org. Teaches employees about AI/LLMs through fully conversational, personalized experiences. Replaces $50K-200K traditional course development.",
      architecture:
        "6-agent state machine. Orchestrator (Gemini 2.5 Flash) routes to Onboarding, Assessment, Teach (Gemini 2.5 Pro), Coach (Pro), and Exploration agents. Agents never communicate directly — all transitions flow through Firestore state changes, deterministic and auditable.",
      keyDetails: [
        "5-phase pedagogical model per lesson: Connect, Explore, Apply, Confirm, Close",
        "Adaptive assessment: 20 pre-generated questions with early termination. Section-based: Beginner (Q1-8), Intermediate (Q9-14), Advanced (Q15-20)",
        "7 persona-specific tracks (Communicator, Coordinator, Creator, Insights, Marketer, Operator, Strategist) — each gets a unique 5-module Week 3 track (35 scaffolds total)",
        "4 generative data layers: 7 persona definitions, 20 question templates, module scaffolds, prompt instructions. ~1,700 lines of scaffolding produces unlimited personalized curriculum",
        "Coach Agent triggered after 2 failed quiz attempts — Socratic method, alternative analogies, scaffolded re-explanation",
        "Cloud IAP with Google Workspace SSO. HMAC-SHA256 pseudonymization with Cloud KMS envelope encryption, multi-key rotation",
        "Vertex AI Agent Engine (Cloud Run), Firestore, Cloud KMS, GCS with 30-day lifecycle, OpenTelemetry, Cloud Trace",
      ],
      stats: {
        Stack: "Vertex AI Agent Engine, Firestore, Cloud KMS",
        Framework: "Google ADK",
        Models: "Gemini 2.5 Pro + Flash",
        Agents: "6-agent state machine",
        Personas: "7 learner profiles",
        "New audience": "~80 lines, 0 code changes",
      },
    },
    {
      id: "dev-quickstart",
      name: "Aura",
      type: "personal" as const,
      oneLiner:
        "A brain-inspired cognitive architecture with 15 neuroscience-mapped regions (16th in progress) that automates the full software development lifecycle — from requirements through deployment.",
      whatItIs:
        "Not a chatbot or code generator. A cognitive architecture that thinks, plans, learns, remembers, assesses risk, and delegates execution like a senior developer. Each brain region is a distinct Python module with biologically-analogous functions.",
      architecture:
        "16-region computational brain. 15 regions implemented (VTA in progress). All brain regions are free-floating (not bound to LangGraph nodes), coordinated by a cognitive orchestrator. CEO model: the orchestrator operates as a CEO consuming executive summaries, not an analyst parsing raw data. Reduced orchestrator token usage from ~800+ to ~300 per decision while improving decision quality. Cognitive loop: THINK → PLAN → CHOOSE → ACT → REVIEW.",
      keyDetails: [
        "16 brain regions: Prefrontal Cortex (executive planning), Cerebral Cortex (reasoning), Thalamus (input gating), Basal Ganglia (action selection), Amygdala (risk assessment), Hippocampus (memory/pgvector), Wernicke's (language), Angular Gyrus (semantic understanding), Cerebellum (code quality), ACC (conflict monitoring), Insular Cortex (self-awareness), Posterior Cingulate (meta-cognition), Retrosplenial Cortex (memory-action bridge), Entorhinal Cortex (insight extraction), VTA (reinforcement learning, in progress), OFC (outcome prediction)",
        "Dual-store memory: Working Memory (PostgresSaver/LangGraph checkpoints, 1-10ms) + Long-Term Memory (PGVector + HNSW, 10-100ms semantic search with LLM reranking at 50+ stored projects)",
        "9 specialized agents covering full SDLC: Requirements → Data Modeling → API Design → Architecture → Database → Scaffolding → Testing → Deployment → Human Interaction",
        "Emotional intelligence: 5 persistent emotions (Frustration, Confidence, Anxiety, Excitement, Distrust) with natural decay rates and hard behavioral gates at extreme states",
        "68 named personas with HR system: YAML inheritance, StaffingEngine scoring (affinity 40% + performance 50% + exploration 10%), lifecycle SEED → EXPERIMENTAL → PROVEN → EVOLVED, underperformers benched/fired with LLM-assisted recruiting",
        "Model distillation pipeline: DistillationCollector → QualityJudge → TrainingExporter (score >= 0.8) → InferenceRouter with confidence-based fallback and 6-phase rollout",
        "Artifact registry: 12+ artifacts across 8 SDLC phases with pre/post-conditions and cascade invalidation",
      ],
      stats: {
        Stack: "LangGraph, PostgreSQL, pgvector, FastAPI",
        Framework: "LangGraph + custom cognitive layer",
        Models: "Claude + Gemini",
        "Brain regions": 15,
        Personas: "68 with HR system",
        "Emotions": "5 with decay rates",
      },
      github: "https://github.com/dbartley18/Aura",
    },
    {
      id: "riva",
      name: "Riva — Agentic Career Intelligence",
      type: "personal" as const,
      oneLiner:
        "An agentic career co-pilot with a \"Reverse Headhunter\" that proactively sources roles, generates evidence-grounded match explanations, and produces ATS-safe resume variants — all with determinism-tested LangGraph orchestration.",
      whatItIs:
        "Full-stack career intelligence platform for senior/executive job seekers. Inverts the typical job search: instead of pasting JDs, the system proactively sources opportunities from your profile and resume. Each opportunity becomes a \"Case\" with tailored artifacts.",
      architecture:
        "Monorepo with domain boundaries. apps/api (FastAPI, 13 routers), apps/worker (ARQ background workers via Redis), apps/web (Next.js 15 + React 19 + Three.js 3D visualization), packages/core (Pydantic schemas), packages/graphs (LangGraph orchestration), packages/llm (multi-provider abstraction for 6 providers), packages/connectors (RSS, pluggable registry), packages/storage (SQLAlchemy repositories), packages/analytics (event tracking, feature flags, LLM telemetry).",
      keyDetails: [
        "10 LangGraph node categories: ats, comp, explain, features, normalize, outreach, rank, sources, synthesis, pulse. 4 main flows: recommendations, ats_variant, outreach, explain",
        "Determinism as first-class concern: Temperature <= 0.2, golden snapshot tests assert two-call determinism on every LLM node, dedicated CI workflow gates PRs",
        "Evidence-first explainability: every recommendation requires 3+ grounded evidence chips mapping JD requirements to resume spans. 80% JD line coverage target",
        "Multi-provider LLM abstraction: OpenAI, Anthropic, Google, Together, Azure, OpenRouter via single config toggle in riva.toml",
        "3D radar visualization: Three.js/React Three Fiber for career fit dimensions with unit, integration, a11y, and Playwright e2e tests",
        "Profile-driven config: TOML profiles (local/dev/staging/prod) with Pydantic-typed settings, feature flags per environment, runtime profile switching",
        "Observability: OpenTelemetry on FastAPI, Prometheus + Grafana dashboards + alert rules (p95 > 2s), Langfuse/LangSmith LLM telemetry, structlog",
        "Full ops: Helm charts, Docker Compose, Alembic migrations, pre-commit hooks (ruff, black, mypy strict)",
      ],
      stats: {
        Stack: "FastAPI, LangGraph, Supabase, Redis",
        Framework: "LangGraph + ARQ workers",
        Models: "6 providers (OpenAI, Anthropic, Google, Together, Azure, OpenRouter)",
        "Evidence": "3+ grounded chips per match",
        "Determinism": "Golden snapshot tested",
        "P95 latency": "< 2s",
      },
      github: "https://github.com/dbartley18/Riva",
    },
  ],

  aiWorkflow: {
    headline: "Built ALL of this using AI",
    planning: "Claude Opus 4.6 + Gemini 2.5 Pro + GPT 5.x",
    execution: "Sonnet 4.6 + Opus 4.6, 5 Claude Code CLI tabs in iTerm2",
    philosophy:
      "I think in architecture, I build with AI. One person with the right mental models and the right tools.",
    meta: "This portfolio site itself was built using AI — it's recursive proof of the workflow.",
  },
};

// ─── Prompt Serializer ───────────────────────────────────────────────────────

function xmlTag(tag: string, content: string, attrs?: Record<string, string>): string {
  const attrStr = attrs
    ? " " + Object.entries(attrs).map(([k, v]) => `${k}="${v}"`).join(" ")
    : "";
  return `<${tag}${attrStr}>\n${content}\n</${tag}>`;
}

function serializeIdentity(id: Identity): string {
  return [
    `Name: ${id.name}`,
    `Title: ${id.title}`,
    `Organization: ${id.org}`,
    `Tagline: "${id.tagline}"`,
    "",
    "Background:",
    ...id.background.map((b) => `- ${b}`),
  ].join("\n");
}

function serializePhilosophy(entries: PhilosophyEntry[]): string {
  return entries.map((e) => `${e.key}: "${e.quote}"`).join("\n");
}

function serializeTechStack(stack: TechStack): string {
  return [
    "Personal:",
    `  Coding: ${stack.personal.coding.join(", ")}`,
    `  LLM: ${stack.personal.llm.join(", ")}`,
    `  Favorite models: ${stack.personal.favoriteModels.join(", ")}`,
    `  Planning: ${stack.personal.planning}`,
    `  Execution: ${stack.personal.execution}`,
    `  Served apps: ${stack.personal.servedApps}`,
    "",
    "Work:",
    `  Coding: ${stack.work.coding.join(", ")}`,
    "  Same model preferences as personal",
  ].join("\n");
}

function serializeProject(project: Project): string {
  const statsLines = Object.entries(project.stats)
    .map(([k, v]) => `  ${k}: ${v}`)
    .join("\n");

  return [
    `Type: ${project.type}`,
    `One-liner: ${project.oneLiner}`,
    "",
    `What it is: ${project.whatItIs}`,
    "",
    `Architecture: ${project.architecture}`,
    "",
    "Key details:",
    ...project.keyDetails.map((d) => `- ${d}`),
    "",
    "Stats:",
    statsLines,
    ...(project.github ? [`\nGitHub: ${project.github}`] : []),
  ].join("\n");
}

function serializeAiWorkflow(wf: AiWorkflow): string {
  return [
    wf.headline,
    `Planning: ${wf.planning}`,
    `Execution: ${wf.execution}`,
    `Philosophy: "${wf.philosophy}"`,
    `Meta: ${wf.meta}`,
  ].join("\n");
}

function serializeStratosThread(st: StratosThread): string {
  const experiments = st.experiments
    .map(
      (e) =>
        [
          `Experiment ${e.id}: ${e.name}`,
          `  Objective: ${e.objective}`,
          `  Finding: ${e.finding}`,
          `  Challenge: ${e.challenge}`,
          `  Core insight: "${e.coreInsight}"`,
        ].join("\n"),
    )
    .join("\n\n");

  return [
    `Tagline: "${st.tagline}"`,
    `Repository: ${st.repoUrl}`,
    "",
    st.intro,
    "",
    st.journeyPreamble,
    "",
    experiments,
    "",
    "Lightbulb moment:",
    `  ${st.lightbulbMoment.analogy}`,
    `  Thesis: "${st.lightbulbMoment.thesis}"`,
    `  ${st.lightbulbMoment.elaboration}`,
    `  Intelligence cycle: ${st.lightbulbMoment.intelligenceCycle}`,
    "",
    "This insight produced:",
    ...st.lightbulbMoment.producedInsights.map((i) => `- ${i}`),
    "",
    "Conceptual architecture:",
    `  Dual memory: ${st.architecture.dualMemory}`,
    `  GAN loop: ${st.architecture.ganLoop}`,
    `  Persona hub: ${st.architecture.personaHub}`,
    "",
    `Voice: ${st.voice}`,
  ].join("\n");
}

function serializeOriginStories(stories: OriginStory[]): string {
  return stories
    .map(
      (s) =>
        [`Project: ${s.projectId}`, `Seed question: "${s.title}"`, s.story].join("\n"),
    )
    .join("\n\n");
}

export function serializeForPrompt(): string {
  const kb = knowledge;

  const sections = [
    xmlTag("identity", serializeIdentity(kb.identity)),
    xmlTag("philosophy", serializePhilosophy(kb.philosophy)),
    xmlTag("stratos_thread", serializeStratosThread(kb.stratosThread)),
    xmlTag("origin_stories", serializeOriginStories(kb.originStories)),
    xmlTag("tech_stack", serializeTechStack(kb.techStack)),
    xmlTag(
      "projects",
      kb.projects
        .map((p) => xmlTag("project", serializeProject(p), { name: p.id }))
        .join("\n\n"),
    ),
    xmlTag("ai_workflow", serializeAiWorkflow(kb.aiWorkflow)),
  ];

  return xmlTag("knowledge_base", sections.join("\n\n"));
}
