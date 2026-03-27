"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import TerminalCommand from "@/components/TerminalCommand";
import SectionCard from "@/components/SectionCard";
import TechBadge from "@/components/TechBadge";

const tabs = [
  {
    id: "planning",
    label: "Planning",
    content: (
      <>
        <p>
          Before I write a line of code, I&apos;ve already run the whole
          system in my head. Architecture, data flow, failure modes, where
          it&apos;ll break under load. That&apos;s what the heavy models are
          for. I throw the hardest reasoning at the best models and let them
          pressure-test the design before anything gets built.
        </p>
        <p className="mt-2">
          Opus for depth. Gemini Pro for breadth. GPT when I want a
          different perspective on the same problem. I use all three against
          each other.
        </p>
        <div className="flex flex-wrap gap-2 mt-3">
          <TechBadge name="Claude Opus 4.6" variant="purple" />
          <TechBadge name="Gemini 2.5 Pro" variant="purple" />
          <TechBadge name="GPT 5.x" variant="purple" />
        </div>
      </>
    ),
  },
  {
    id: "execution",
    label: "Execution",
    content: (
      <>
        <p>
          Five Claude Code CLI tabs in iTerm2, running at the same time.
          Main implementation, testing, docs, and two for whatever comes up.
          Sonnet for speed, but Opus is the default.
        </p>
        <p className="mt-2">
          The IDE only opens when I need to visually trace something across
          files. Most of the time, the terminal is enough.
        </p>
        <div className="flex flex-wrap gap-2 mt-3">
          <TechBadge name="Claude Sonnet 4.6" variant="cyan" />
          <TechBadge name="Claude Opus 4.6" variant="cyan" />
          <TechBadge name="too many CLI tabs" variant="cyan" />
        </div>
      </>
    ),
  },
  {
    id: "served",
    label: "Served apps",
    content: (
      <>
        <p>
          Production workloads are a different game. You&apos;re not
          optimizing for the best answer anymore, you&apos;re optimizing
          for the best answer per dollar at scale. Flash models for the
          bulk, Pro for the stuff that actually needs to think.
        </p>
        <p className="mt-2">
          Gemini wins here on cost of intelligence. For served
          applications, it&apos;s not even close.
        </p>
        <div className="flex flex-wrap gap-2 mt-3">
          <TechBadge name="Gemini 2.5 Flash" variant="green" />
          <TechBadge name="Gemini 2.5 Pro" variant="green" />
        </div>
        <p className="text-xs text-text-tertiary italic mt-2">
          Previously 2.0 Flash, until Google politely emailed me that they
          were deprecating it. RIP to a real one.
        </p>
      </>
    ),
  },
  {
    id: "tools",
    label: "Daily tools",
    content: (
      <>
        <p>
          I live in the terminal. iTerm2 with five tabs is home base.
          Claude Code CLI is the primary interface for almost everything.
          Cursor when I need AI-assisted editing in context. VSCode when I
          need to visually trace something or a plugin does the job better.
        </p>
        <p className="mt-2">
          Pulsar for quick edits. It&apos;s the spiritual successor to Atom
          since GitHub killed it. Same vibe, still works, still fast.
        </p>
        <p className="mt-2">
          I only open an IDE when I have to. Most of the time, the CLI and
          a model that understands the codebase is faster than any GUI.
        </p>
        <div className="flex flex-wrap gap-2 mt-3">
          <TechBadge name="Claude Code CLI" variant="amber" />
          <TechBadge name="iTerm2" variant="amber" />
          <TechBadge name="Cursor" variant="amber" />
          <TechBadge name="VSCode" variant="amber" />
          <TechBadge name="Pulsar" variant="amber" />
        </div>
        <p className="text-xs text-text-tertiary italic mt-2">
          Yes, Pulsar. Because Atom was perfect and GitHub had to go and
          kill it.
        </p>
      </>
    ),
  },
];

export default function TechStackSection() {
  const [active, setActive] = useState("planning");

  return (
    <div>
      <TerminalCommand command="which -a tools" />
      <SectionCard id="tech-stack" accentColor="var(--color-p10k-cyan)">
        <h3 className="font-mono text-base text-text-primary font-semibold mb-2">
          My stack
        </h3>
        <p className="font-sans text-xs text-text-tertiary mb-5">
          The model matters less than the mental model. Different models for
          different jobs.
        </p>

        {/* Tab bar */}
        <div className="flex flex-wrap gap-2 mb-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActive(tab.id)}
              className={`font-mono text-xs px-3 py-1.5 rounded-md transition-colors ${
                active === tab.id
                  ? "bg-accent-cyan/15 text-accent-cyan border border-accent-cyan/30"
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
                  className="font-sans text-sm leading-relaxed text-text-secondary"
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
