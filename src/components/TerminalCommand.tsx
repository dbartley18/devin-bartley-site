"use client";

import { motion } from "framer-motion";

interface TerminalCommandProps {
  command: string;
}

export default function TerminalCommand({ command }: TerminalCommandProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.3 }}
      className="mb-3 font-mono text-sm flex items-center gap-2"
    >
      <span className="text-accent-green">❯</span>
      <span className="text-text-tertiary">$</span>
      <span className="text-text-secondary">{command}</span>
    </motion.div>
  );
}
