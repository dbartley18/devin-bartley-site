// ─── Topic content (used by keyword match AND cd/cat commands) ───────────────

const topics: Record<string, string> = {
  mesh: "The Marketing Workbench started as GCP Workflows. Devin looked at it and thought: what if you decomposed every agent into its own service, threw away the orchestrator, and forced them to discover each other at runtime?\n\nThat turned into 23 Cloud Run services using A2A protocol, each reading each other's capability cards and deciding who to hand off to. No hardcoded pipelines. The system composes itself or it doesn't ship.",
  workbench: "The Marketing Workbench started as GCP Workflows. Devin looked at it and thought: what if you decomposed every agent into its own service, threw away the orchestrator, and forced them to discover each other at runtime?\n\nThat turned into 23 Cloud Run services using A2A protocol, each reading each other's capability cards and deciding who to hand off to. No hardcoded pipelines. The system composes itself or it doesn't ship.",
  aura: "Started as a tool to help functional people scaffold agent projects. Then the realization: most agents aren't agents. They're runnable functions with LLM wrappers. That's not agency.\n\nSo Devin pulled the orchestrator out of the graph, started calling sub-agents 'smart tools,' and gave the orchestrator actual goals, memory, and judgment. 15 brain regions mapped onto a cognitive architecture. 68 named personas with an HR system that coaches underperformers and fires them if they don't improve.\n\nAll because he got annoyed at the word 'agent' being misused.",
  brain: "15 regions of the human brain mapped onto a cognitive architecture. Each brain region is a distinct Python module: Prefrontal Cortex for planning, Amygdala for risk assessment, Hippocampus for vector-based memory, Wernicke's Area for language comprehension.\n\nThe orchestrator operates as a CEO consuming executive summaries from each region. Reduced token usage from ~800 to ~300 per decision while improving quality. The cognitive loop: THINK, PLAN, CHOOSE, ACT, REVIEW.",
  riva: "Job search is still weirdly manual for something that's mostly pattern matching. Riva inverts it. Sources roles from your resume and profile, then shows you exactly why each one is worth your time.\n\nEvery recommendation has grounded evidence mapping JD requirements to actual resume spans. No black-box scoring. It also handles execution: outreach, follow-ups, inbox scanning. Determinism-tested end to end. If it's not reproducible, it doesn't ship.",
  learning: "Started as a conversation, an idea, and a simple question: can we use Google Gems or Custom GPTs to teach people about AI?\n\nEvolved into a platform where every lesson, quiz, exercise, and visual is generated in real time. Zero pre-authored content. A 6-agent state machine where the Coach agent doesn't repeat the lesson — it rethinks the approach entirely. Adding a new audience costs ~80 lines of data and zero code changes.",
  stack: "Five Claude Code CLI tabs in iTerm2, running at the same time. Main implementation, testing, docs, and two for whatever comes up. Opus is the default, Sonnet for speed.\n\nThe IDE only opens when needed. Most of the time, the terminal is enough. Gemini for served applications — cost of intelligence at scale. Previously 2.0 Flash, until Google politely emailed that they were deprecating it. RIP to a real one.",
  tools: "Five Claude Code CLI tabs in iTerm2, running at the same time. Main implementation, testing, docs, and two for whatever comes up. Opus is the default, Sonnet for speed.\n\nThe IDE only opens when needed. Most of the time, the terminal is enough. Gemini for served applications — cost of intelligence at scale. Previously 2.0 Flash, until Google politely emailed that they were deprecating it. RIP to a real one.",
  philosophy: "Everything starts the same way. An idea. Sometimes it's mine, sometimes it's not; doesn't matter, it's a seed.\n\nIf it sticks, I stay with it. Turn it into a real question, push past the point where most people would stop, then pull it apart. See where it breaks, see what holds. At some point, you know whether there's actually something there or not.",
  trust: "Handoff patterns between agents accumulate recency-weighted trust scores. The weight is 0.7 — recent interactions matter more than historical ones.\n\nWhen trust hits 0.85 or higher after at least 5 successful runs, that agent pair earns delegated authority — they can invoke each other directly without PM approval. Drop below 0.60 and you're demoted back to governed mode. All scoring is pure Python, no LLM in the loop.",
  persona: "68 named personas, each with real backgrounds, specializations, and performance tracking. The system has actual agent economics: error rates, user sentiment analysis, token consumption vs. baseline.\n\nUnderperformers don't get fired immediately. They get coached — the system injects what's failing directly into their prompt at runtime. If issues persist, they're benched. Stay on the bench too long, you're terminated. When a role needs filling, an LLM spins up a new persona using the fired one's failure patterns as anti-patterns.",
};

// ─── Directory structure (for cd/ls navigation) ──────────────────────────────

const directories: Record<string, { description: string; children?: string[] }> = {
  philosophy: {
    description: "How Devin thinks — ideas, intelligence, agents, failure, systems.",
    children: ["ideas.md", "intelligence.md", "agents.md", "failure.md", "how-i-see-things.md"],
  },
  projects: {
    description: "Four production systems, all built with AI.",
    children: ["mesh/", "learning-accelerator/", "aura/", "riva/"],
  },
  stack: {
    description: "Planning, execution, served apps, daily tools.",
    children: ["planning.md", "execution.md", "served-apps.md", "daily-tools.md"],
  },
  tools: {
    description: "Planning, execution, served apps, daily tools.",
    children: ["planning.md", "execution.md", "served-apps.md", "daily-tools.md"],
  },
  mesh: {
    description: "Marketing Workbench — V3 Full Mesh. 23 autonomous agents, A2A protocol, self-organizing.",
  },
  aura: {
    description: "Brain-inspired cognitive architecture. 15 brain regions, 68 personas, emotional intelligence.",
  },
  riva: {
    description: "Agentic career intelligence. Reverse headhunter, evidence-grounded matching, determinism-tested.",
  },
  learning: {
    description: "AI learning platform. Zero pre-authored content, 6-agent state machine, adaptive pedagogy.",
  },
  trust: {
    description: "Adaptive trust scoring system inside the Marketing Workbench mesh.",
  },
  persona: {
    description: "Agent economics and the persona HR system inside Aura.",
  },
  brain: {
    description: "The 15-region computational brain architecture inside Aura.",
  },
};

// ─── Command handlers ────────────────────────────────────────────────────────

function handleLs(args: string): string {
  // ls with no args or ls ~/
  if (!args || args === "~/" || args === "~" || args === ".") {
    return `philosophy/   projects/    stack/       trust/
persona/       brain/

Type cd <folder> to explore, or just ask a question.`;
  }

  // ls of a specific directory
  const dir = args.replace(/^~?\/?/, "").replace(/\/$/, "");
  const entry = directories[dir];
  if (entry?.children) {
    return entry.children.join("   ");
  }
  if (entry) {
    return `${dir}: not a directory, but here's what it's about:\n\n${entry.description}`;
  }
  return `ls: ${args}: No such file or directory`;
}

function handleCd(args: string): string {
  if (!args || args === "~" || args === "~/") {
    return "~\n\nBack to home. Type ls to see what's here.";
  }

  // Normalize: strip ~/, leading /, trailing /
  const path = args.replace(/^~?\/?/, "").replace(/\/$/, "");

  // Handle cd projects/aura, cd projects/mesh, etc.
  const parts = path.split("/");
  const target = parts[parts.length - 1];

  // Check if it's a known topic
  if (topics[target]) {
    const dir = directories[target];
    let response = `~/` + path + `\n\n`;
    if (dir?.description) {
      response += dir.description + "\n\n";
    }
    response += topics[target];
    if (dir?.children) {
      response += "\n\n" + dir.children.join("   ");
    }
    return response;
  }

  // Check if it's a directory alias
  if (target === "projects") {
    return `~/projects\n\nmesh/                  23 agents, A2A, self-organizing\nlearning-accelerator/  Zero pre-authored content, 6-agent state machine\naura/                  15 brain regions, 68 personas, cognitive architecture\nriva/                  Reverse headhunter, evidence-grounded, determinism-tested\n\nType cd projects/<name> to explore a project.`;
  }

  // Aliases
  if (target === "learning-accelerator") {
    return handleCd("learning");
  }
  if (target === "workbench") {
    return handleCd("mesh");
  }

  return `cd: ${args}: No such file or directory. Type ls to see what's available.`;
}

function handleCat(args: string): string {
  if (!args) return "cat: missing file operand";

  const file = args.replace(/^~?\/?/, "").replace(/\.md$/, "");

  if (file === "README" || file === "readme") {
    return "Devin Bartley — Manager, AI & Innovation | Deloitte\n\nAlmost two decades building and rebuilding how organizations go to market. Strategy background, engineering execution. Built all of this using AI. One person.\n\nType ls to explore, or just ask a question.";
  }

  // Try to find the topic
  if (topics[file]) return topics[file];

  // Try nested paths like projects/aura
  const parts = file.split("/");
  const target = parts[parts.length - 1];
  if (topics[target]) return topics[target];

  return `cat: ${args}: No such file or directory`;
}

function handlePwd(): string {
  return "~/devin-bartley";
}

function handleHelp(): string {
  return `Available commands:

  ls [dir]           List topics and projects
  cd <topic>         Explore a topic or project
  cat <file>         Read a specific file
  pwd                Print working directory
  clear              Reset terminal to home
  help               Show this message
  whoami             Show bio

Or just type a question. I'll figure out what you're asking.`;
}

// ─── Main response function ──────────────────────────────────────────────────

const DEFAULT_RESPONSE =
  "Good question. Try asking about the mesh architecture, Aura, Riva, the learning accelerator, my stack, or how I think about building things. Or type ls to see what's here.";

export function getResponse(input: string): string {
  const trimmed = input.trim();
  const lower = trimmed.toLowerCase();

  // Terminal commands (exact match on command prefix)
  if (lower === "ls" || lower === "ls -la" || lower === "ls -a" || lower === "dir") {
    return handleLs("");
  }
  if (lower.startsWith("ls ")) {
    return handleLs(trimmed.slice(3).trim());
  }
  if (lower.startsWith("cd ")) {
    return handleCd(trimmed.slice(3).trim());
  }
  if (lower === "cd") {
    return handleCd("");
  }
  if (lower.startsWith("cat ")) {
    return handleCat(trimmed.slice(4).trim());
  }
  if (lower === "cat") {
    return handleCat("");
  }
  if (lower === "pwd") {
    return handlePwd();
  }
  if (lower === "help" || lower === "--help" || lower === "-h") {
    return handleHelp();
  }
  if (lower === "whoami") {
    return "Devin Bartley — Manager, AI & Innovation | Deloitte\n\nType help to see available commands, or just ask a question.";
  }
  if (lower === "sudo" || lower.startsWith("sudo ")) {
    return "Nice try.";
  }
  if (lower === "rm -rf /" || lower === "rm -rf /*") {
    return "I appreciate the enthusiasm, but no.";
  }
  if (lower === "exit" || lower === "quit") {
    return "You can close the terminal with the red button. But why would you want to leave?";
  }
  if (lower === "vim" || lower === "nano" || lower === "emacs") {
    return "I use Pulsar, actually. Because Atom was perfect and GitHub had to go and kill it.";
  }

  // Keyword match against topics
  for (const [key, value] of Object.entries(topics)) {
    if (lower.includes(key)) return value;
  }

  return DEFAULT_RESPONSE;
}

export function streamResponse(
  text: string,
  onChunk: (char: string) => void,
  onDone: () => void,
): () => void {
  let i = 0;
  const interval = setInterval(() => {
    if (i < text.length) {
      onChunk(text[i]);
      i++;
    } else {
      clearInterval(interval);
      onDone();
    }
  }, 18);
  return () => clearInterval(interval);
}
