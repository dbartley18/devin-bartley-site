"use client";

const glowClasses = {
  green: "hover:glow-green",
  cyan: "hover:glow-cyan",
  purple: "hover:glow-purple",
  amber: "hover:shadow-[0_0_20px_rgba(245,158,11,0.3)]",
} as const;

interface TechBadgeProps {
  name: string;
  variant?: "green" | "cyan" | "purple" | "amber";
}

export default function TechBadge({ name, variant = "green" }: TechBadgeProps) {
  return (
    <span
      className={`inline-block bg-bg-tertiary text-text-secondary text-sm font-sans rounded-full px-3 py-1 transition-shadow ${glowClasses[variant]}`}
    >
      {name}
    </span>
  );
}
