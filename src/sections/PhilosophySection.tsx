"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import TerminalCommand from "@/components/TerminalCommand";
import SectionCard from "@/components/SectionCard";

const tabs = [
  {
    id: "ideas",
    label: "Ideas",
    content: (
      <>
        <p>
          Everything starts the same way. An idea. Sometimes it&apos;s mine,
          sometimes it&apos;s not; doesn&apos;t matter, it&apos;s a seed.
        </p>
        <ul className="space-y-2 pl-1 my-3">
          <Bullet>&ldquo;We have AI. Why do people still manually search for jobs? Why does it take 100 applications to land 10 interviews?&rdquo;</Bullet>
          <Bullet>&ldquo;Why do we call deterministic state machines agents?&rdquo;</Bullet>
          <Bullet>&ldquo;Can AI actually teach someone AI?&rdquo;</Bullet>
          <Bullet>&ldquo;What happens if I abstract the human brain and give that to an agent system?&rdquo;</Bullet>
        </ul>
        <p>
          If it sticks, I stay with it. I turn it into a real question, push
          past the point where most people would stop, then pull it apart.
          See where it breaks, see what holds.
        </p>
        <p className="text-text-primary">
          At some point, you know whether there&apos;s actually something
          there or not.
        </p>
      </>
    ),
  },
  {
    id: "intelligence",
    label: "Intelligence",
    content: (
      <>
        <p>
          I was teaching my son how to shoot a basketball and something
          snapped into focus.
        </p>
        <p>
          He didn&apos;t need formulas. He needed reps. Miss, adjust, repeat.
        </p>
        <Callout>That loop is the learning.</Callout>
        <p>
          That&apos;s what intelligence actually looks like in the real world.
          Pattern recognition, shaped and corrected by feedback over time.
        </p>
        <p>
          Your brain isn&apos;t solving equations when you catch a ball.
          It&apos;s running a constantly updated model built from observation
          and experience.
        </p>
        <p>
          LLMs aren&apos;t doing anything fundamentally different.
          They&apos;re not &ldquo;the agent.&rdquo; They&apos;re just the
          pattern engine, the substrate.
        </p>
        <Callout>
          The agent is the layer on top: the part with goals, memory, and
          context. The part that decides what to do with all that learned
          patterning.
        </Callout>
      </>
    ),
  },
  {
    id: "agents",
    label: "Agents",
    content: (
      <>
        <p>
          Hot take: most &ldquo;agents&rdquo; aren&apos;t agents.
          They&apos;re just functions with an LLM bolted on.
        </p>
        <p>
          If it&apos;s locked into a graph with predetermined paths,
          there&apos;s no real decision-making happening. It&apos;s a
          flowchart that happens to speak English.
        </p>
        <p>Actual agency requires a few non-negotiables:</p>
        <ul className="space-y-1.5 pl-1 my-2">
          <Bullet accent="amber">Goals</Bullet>
          <Bullet accent="amber">Memory</Bullet>
          <Bullet accent="amber">Judgment</Bullet>
        </ul>
        <p>Without that, it&apos;s just executing steps, not thinking.</p>
        <Callout>
          It&apos;s an agent when it&apos;s the agent who decides when
          it&apos;s done.
        </Callout>
        <p>
          That&apos;s exactly why I pulled the orchestrator out of the graph.
          The graph is guardrails, not the brain. The brain is the thing that
          decides what to do next.
        </p>
      </>
    ),
  },
  {
    id: "failure",
    label: "Failure",
    content: (
      <>
        <p>Five experiments failed before any of this worked.</p>
        <ul className="space-y-1.5 pl-1 my-3">
          <Bullet accent="red">Personas that couldn&apos;t hold character.</Bullet>
          <Bullet accent="red">Graphs that looked clean until you actually had to debug them.</Bullet>
          <Bullet accent="red">&ldquo;Deterministic&rdquo; agents that technically worked... but weren&apos;t useful.</Bullet>
        </ul>
        <p>
          You don&apos;t learn that from docs. You only get it by running
          straight into it.
        </p>
        <Callout>
          Failure isn&apos;t some abstract &ldquo;lesson.&rdquo; It just
          exposes what&apos;s wrong so you can adjust and keep going.
        </Callout>
      </>
    ),
  },
  {
    id: "legos",
    label: "How I see things",
    content: (
      <>
        <Callout>I think in Legos.</Callout>
        <p>
          Not in the toy sense. In terms of fundamental pieces that actually
          hold up. First principles, core components, things you can trust
          not to break when pressure hits.
        </p>
        <p>Once those are clear, everything else is just how they stack.</p>
        <p>Systems, teams, org structures. Same pattern:</p>
        <ul className="space-y-1.5 pl-1 my-2">
          <Bullet>What are the real building blocks?</Bullet>
          <Bullet>How do they connect?</Bullet>
          <Bullet>Where do you need flexibility vs. rigidity?</Bullet>
          <Bullet>What happens when you start adding weight?</Bullet>
        </ul>
        <p>
          Most things break because the pieces were wrong or stacked wrong.
          Not because the execution was bad.
        </p>
        <Callout>
          Get the pieces right and the way they fit together right, everything
          else becomes a lot simpler. If you don&apos;t, you end up fighting
          it at every layer.
        </Callout>
      </>
    ),
  },
];

export default function PhilosophySection() {
  const [active, setActive] = useState("ideas");

  return (
    <div>
      <TerminalCommand command="cat ~/.philosophy" />
      <SectionCard id="philosophy" accentColor="var(--color-p10k-blue)">
        <h3 className="font-mono text-base text-text-primary font-semibold mb-5">
          How I think
        </h3>

        {/* Tab bar */}
        <div className="flex flex-wrap gap-2 mb-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActive(tab.id)}
              className={`font-mono text-xs px-3 py-1.5 rounded-md transition-colors ${
                active === tab.id
                  ? "bg-accent-green/15 text-accent-green border border-accent-green/30"
                  : "bg-bg-tertiary text-text-tertiary border border-transparent hover:text-text-secondary hover:border-border"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Active tab content */}
        <AnimatePresence mode="wait">
          {tabs.map(
            (tab) =>
              tab.id === active && (
                <motion.div
                  key={tab.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                  className="font-sans text-sm leading-relaxed text-text-secondary space-y-2.5"
                >
                  {tab.content}
                </motion.div>
              ),
          )}
        </AnimatePresence>
      </SectionCard>
    </div>
  );
}

function Callout({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-text-primary font-medium border-l-2 border-accent-green pl-3 my-3">
      {children}
    </p>
  );
}

function Bullet({
  children,
  accent = "cyan",
}: {
  children: React.ReactNode;
  accent?: "cyan" | "amber" | "red";
}) {
  const colors = {
    cyan: "text-accent-cyan",
    amber: "text-accent-amber",
    red: "text-accent-red",
  };
  return (
    <li className="flex gap-2">
      <span className={`${colors[accent]} shrink-0`}>▸</span>
      <span>{children}</span>
    </li>
  );
}
