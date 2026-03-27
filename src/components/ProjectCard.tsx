"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface ProjectCardProps {
  name: string;
  type: "work" | "personal";
  seedQuestion: string;
  hook: string;
  fullStory: React.ReactNode;
  stats: Record<string, string | number>;
  github?: string;
}

const MAX_COLLAPSED_STATS = 3;

export default function ProjectCard({
  name,
  type,
  seedQuestion,
  hook,
  fullStory,
  stats,
  github,
}: ProjectCardProps) {
  const [expanded, setExpanded] = useState(false);
  const borderColor =
    type === "work" ? "border-l-accent-green" : "border-l-accent-purple";
  const typeLabel = type === "work" ? "Work" : "Personal";

  const statEntries = Object.entries(stats);
  const collapsedStats = statEntries.slice(0, MAX_COLLAPSED_STATS);
  const overflowStats = statEntries.slice(MAX_COLLAPSED_STATS);

  return (
    <div
      onClick={() => setExpanded((prev) => !prev)}
      className={`bg-bg-tertiary/50 border border-border rounded-xl border-l-4 ${borderColor} p-6 cursor-pointer hover:border-border-hover transition-colors`}
    >
      {/* Collapsed: hook only */}
      <div className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h3 className="font-mono text-lg font-semibold text-text-primary">
                {name}
              </h3>
              <span className="text-xs font-sans text-text-tertiary border border-border rounded px-1.5 py-0.5">
                {typeLabel}
              </span>
            </div>
            <p className="font-sans text-sm italic text-accent-cyan">
              &ldquo;{seedQuestion}&rdquo;
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {github && (
              <a
                href={github}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="text-text-tertiary hover:text-accent-cyan text-sm transition-colors"
              >
                GitHub
              </a>
            )}
            <span className="text-text-tertiary text-xs">
              {expanded ? "▾" : "▸"}
            </span>
          </div>
        </div>

        <p className="font-sans text-sm text-text-secondary leading-relaxed">
          {hook}
        </p>

        <div className="flex flex-wrap gap-2">
          {collapsedStats.map(([key, value]) => (
            <span
              key={key}
              className="text-xs font-sans bg-bg-tertiary text-accent-amber rounded-full px-2.5 py-0.5"
            >
              {key}: {value}
            </span>
          ))}
          {!expanded && overflowStats.length > 0 && (
            <span className="text-xs font-sans text-text-tertiary px-2.5 py-0.5">
              +{overflowStats.length} more
            </span>
          )}
        </div>
      </div>

      {/* Expanded: full story */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="mt-4 pt-4 border-t border-border font-sans text-sm leading-relaxed text-text-secondary space-y-3">
              {fullStory}
            </div>

            {overflowStats.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {overflowStats.map(([key, value]) => (
                  <span
                    key={key}
                    className="text-xs font-sans bg-bg-tertiary text-accent-amber rounded-full px-2.5 py-0.5"
                  >
                    {key}: {value}
                  </span>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
