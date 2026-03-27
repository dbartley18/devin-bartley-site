"use client";

import TerminalCommand from "@/components/TerminalCommand";
import SectionCard from "@/components/SectionCard";

const links = [
  {
    command: "open",
    url: "https://github.com/dbartley18",
  },
  {
    command: "open",
    url: "https://linkedin.com/in/devinbartley",
  },
];

export default function ContactSection() {
  return (
    <div>
      <TerminalCommand command="curl -s devin.sh/connect" />
      <SectionCard id="contact" accentColor="var(--color-p10k-cyan)">
        <div className="font-mono text-sm space-y-3 mb-6">
          {links.map((link) => (
            <div key={link.url} className="flex items-center gap-2">
              <span className="text-accent-green">❯</span>
              <span className="text-text-tertiary">$</span>
              <span className="text-text-secondary">{link.command}</span>
              <a
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent-cyan hover:underline decoration-accent-cyan/30 underline-offset-2"
              >
                {link.url}
              </a>
            </div>
          ))}
          <div className="flex items-center gap-2 pt-2">
            <span className="text-accent-green">❯</span>
            <span className="text-text-tertiary">$</span>
            <span className="cursor-blink text-accent-green">▊</span>
          </div>
        </div>

        <p className="text-text-tertiary text-xs border-t border-border pt-4">
          Built with Next.js 16, Tailwind CSS 4, Framer Motion, and AI.
          Designed in a terminal. This site is recursive proof of the workflow.
        </p>
      </SectionCard>
    </div>
  );
}
