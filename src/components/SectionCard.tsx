"use client";

import { motion } from "framer-motion";

interface SectionCardProps {
  id: string;
  children: React.ReactNode;
  className?: string;
  accentColor?: string;
}

export default function SectionCard({
  id,
  children,
  className,
  accentColor,
}: SectionCardProps) {
  return (
    <motion.section
      id={id}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className={`bg-bg-secondary border border-border rounded-xl overflow-hidden hover:border-border-hover transition-colors ${className ?? ""}`}
    >
      {accentColor && (
        <div className="h-0.5" style={{ backgroundColor: accentColor }} />
      )}
      <div className="p-8">{children}</div>
    </motion.section>
  );
}
