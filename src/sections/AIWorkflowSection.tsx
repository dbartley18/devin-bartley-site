"use client";

import TerminalCommand from "@/components/TerminalCommand";
import SectionCard from "@/components/SectionCard";

export default function AIWorkflowSection() {
  return (
    <div>
      <TerminalCommand command='history | grep "ai"' />
      <SectionCard id="ai-workflow" accentColor="var(--color-p10k-purple)">
        <div className="font-sans text-sm leading-relaxed space-y-4 max-w-2xl">
          <p className="text-text-primary font-medium font-mono text-base">
            Built all of this using AI.
          </p>

          <p className="text-text-secondary">
            Every project on this page was designed and built by one person.
            The 23-agent mesh. The generative curriculum engine. The
            brain-inspired cognitive architecture. The career co-pilot.
          </p>

          <p className="text-text-primary font-medium border-l-2 border-accent-purple pl-3">
            Not a team. Not an agency. One architect with AI as a force
            multiplier.
          </p>

          <p className="text-text-secondary">
            The leverage ratio is the point. The right mental models, the
            right tools, and the willingness to stay with a problem until it
            either breaks or becomes something real.
          </p>

          <p className="text-text-primary font-medium border-l-2 border-accent-purple pl-3">
            This portfolio site is recursive proof. You&apos;re looking at it.
          </p>
        </div>
      </SectionCard>
    </div>
  );
}
