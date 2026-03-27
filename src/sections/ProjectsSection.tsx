"use client";

import { knowledge } from "@/data/knowledge";
import TerminalCommand from "@/components/TerminalCommand";
import SectionCard from "@/components/SectionCard";
import ProjectCard from "@/components/ProjectCard";

function Callout({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-text-primary font-medium border-l-2 border-accent-green pl-3 my-1">
      {children}
    </p>
  );
}

const projectContent = [
  {
    id: "a2a-mesh",
    seedQuestion:
      "What happens when you rip out the orchestrator and let agents figure it out?",
    hook: "23 autonomous agents. No hardcoded pipelines. Self-organizing marketing workflows built on a self-imposed constraint: if the system can't compose itself, it's not really autonomous.",
    fullStory: (
      <>
        <p>
          The Marketing Workbench already existed as GCP Workflows. I looked
          at it and thought: what if you decomposed every agent into its own
          service, threw away the orchestrator, and forced them to discover
          each other at runtime?
        </p>
        <p>
          I gave myself one constraint: no hardcoded pipelines. If the system
          can&apos;t compose itself, it&apos;s not really autonomous.
        </p>
        <p>
          That turned into 23 Cloud Run services using A2A protocol, each
          reading each other&apos;s capability cards and deciding who to hand
          off to. I tortured myself trying to balance guardrails with a
          self-imposed anti-pattern of &ldquo;orchestration is evil.&rdquo;
        </p>
        <p>
          The hypothesis was that Gemini Enterprise could route to agents
          semantically. It couldn&apos;t. That&apos;s only possible with
          Vertex Search. So the pivot: build a front door, register it in
          Gemini Enterprise, let the mesh handle composition behind it.
        </p>
        <Callout>
          The result is a mesh that self-organizes marketing workflows. No
          pipeline. No graph. Just agents that actually negotiate.
        </Callout>
      </>
    ),
  },
  {
    id: "learning-accelerator",
    seedQuestion: "Can AI actually teach someone AI?",
    hook: "Zero pre-authored content. Every lesson, quiz, exercise, and visual generated in real time. Adding a new audience costs ~80 lines of data and zero code changes.",
    fullStory: (
      <>
        <p>
          Started as a conversation, an idea, and a simple question: can we
          use Google Gems or Custom GPTs to teach people about AI? I took it
          further.
        </p>
        <p>
          What if there&apos;s no pre-authored content at all? Every lesson,
          every quiz question, every exercise, every visual, generated in
          real time, personalized to who you are and what you do.
        </p>
        <p>
          A 6-agent state machine where the Teach agent and the Coach agent
          use fundamentally different strategies. Coach doesn&apos;t repeat
          the lesson. It rethinks the approach entirely. Socratic method,
          alternative analogies, scaffolded re-explanation.
        </p>
        <Callout>
          Adding a new audience is about 80 lines of data and zero code
          changes. That&apos;s replacing six-figure traditional course
          development with a config file.
        </Callout>
      </>
    ),
  },
  {
    id: "dev-quickstart",
    seedQuestion:
      "What if an agent bound to a graph isn't really an agent?",
    hook: "15 brain regions mapped onto a cognitive architecture. Emotional intelligence with decay rates. 68 named personas with an HR system that coaches underperformers and fires them if they don't improve.",
    fullStory: (
      <>
        <p>
          This one started as a tool to help functional people scaffold agent
          projects. Then I had the realization that changed everything: most
          agents aren&apos;t agents. They&apos;re runnable functions with LLM
          wrappers and tool decorators. That&apos;s not agency.
        </p>
        <p>
          So I pulled the orchestrator out of the graph entirely, started
          calling sub-agents &ldquo;smart tools,&rdquo; and gave the
          orchestrator actual goals, memory, and judgment. Things escalated.
        </p>
        <p>
          I ended up mapping 15 regions of the human brain onto a cognitive
          architecture. Emotional intelligence with decay rates. 68 named
          personas, each with real backgrounds, specializations, and
          performance tracking.
        </p>
        <p>
          The system has actual agent economics: error rates, user sentiment
          analysis, token consumption vs. baseline. Underperformers
          don&apos;t get fired immediately. They get coached. The system
          injects what&apos;s failing directly into their prompt at runtime.
          If issues persist, they&apos;re benched. Stay on the bench too
          long, you&apos;re terminated.
        </p>
        <p>
          When a role needs to be filled again, talent acquisition kicks in:
          an LLM spins up a new persona using the fired one&apos;s failure
          patterns as anti-patterns.
        </p>
        <Callout>
          All because I got annoyed at the word &ldquo;agent&rdquo; being
          misused.
        </Callout>
      </>
    ),
  },
  {
    id: "riva",
    seedQuestion: "We have AI. Why is job search still this manual?",
    hook: "Inverts the job search. Sources roles from your profile, shows you exactly why each one matches with grounded evidence, then handles execution. No hand-wavy AI confidence theater.",
    fullStory: (
      <>
        <p>
          Job search is still weirdly manual for something that&apos;s mostly
          pattern matching and follow-through. So Riva inverts it.
        </p>
        <p>
          It sources roles from your resume and profile, then shows you
          exactly why they&apos;re worth your time. Every recommendation
          backed by grounded evidence mapping JD requirements to actual
          resume spans. No black-box scoring. If it says you match, it shows
          you where.
        </p>
        <p>
          From there, it doesn&apos;t stop at &ldquo;good luck.&rdquo; It
          tightens your positioning, tailors your resume to the roles
          you&apos;re targeting, and aligns everything to how ATS systems
          actually evaluate candidates. Not how people think they do.
        </p>
        <p>
          Then it handles execution. Outreach is generated and tailored to
          the role and company. Follow-ups are tracked. Inbox gets scanned to
          understand where things are moving, where they&apos;re stuck, and
          what to do next.
        </p>
        <p>
          Underneath, it&apos;s not a chatbot. It&apos;s an agentic system
          managing a pipeline. Recommendations, applications, threads,
          outcomes. Everything connected, everything tracked, everything
          pushing toward an actual result.
        </p>
        <Callout>
          Determinism-tested end to end. Golden snapshots, consistency checks
          across LLM nodes, CI gating on graph changes. If it&apos;s not
          reproducible, it doesn&apos;t ship.
        </Callout>
      </>
    ),
  },
];

export default function ProjectsSection() {
  return (
    <div>
      <TerminalCommand command="ls -la ~/projects/" />
      <SectionCard
        id="projects"
        accentColor="var(--color-p10k-green)"
        className="[&>div]:p-4"
      >
        <div className="space-y-4">
          {projectContent.map((content) => {
            const project = knowledge.projects.find(
              (p) => p.id === content.id,
            )!;
            return (
              <ProjectCard
                key={project.id}
                name={project.name}
                type={project.type}
                seedQuestion={content.seedQuestion}
                hook={content.hook}
                fullStory={content.fullStory}
                stats={project.stats}
                github={project.github}
              />
            );
          })}
        </div>
      </SectionCard>
    </div>
  );
}
