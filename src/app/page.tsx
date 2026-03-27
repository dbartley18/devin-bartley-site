"use client";

import { motion } from "framer-motion";
import { P10kPrompt } from "@/components/P10kPrompt";
import HeroSection from "@/sections/HeroSection";
import PhilosophySection from "@/sections/PhilosophySection";
import TechStackSection from "@/sections/TechStackSection";
import ProjectsSection from "@/sections/ProjectsSection";
import AIWorkflowSection from "@/sections/AIWorkflowSection";
import ContactSection from "@/sections/ContactSection";

export default function Home() {
  return (
    <main className="dot-grid min-h-screen">
      {/* Hero — wider container */}
      <div className="mx-auto max-w-[1380px] px-6 pt-24 pb-12">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-4"
        >
          <P10kPrompt
            segments={[
              { text: "~", icon: "\uF07C", bg: "var(--color-p10k-blue)" },
              { text: "devin-bartley", icon: "\uE5FF", bg: "var(--color-p10k-green)" },
              { text: "main", icon: "\uE725", bg: "var(--color-p10k-cyan)" },
            ]}
          />
        </motion.div>

        <HeroSection />
      </div>

      {/* Content sections — standard width */}
      <div className="mx-auto max-w-4xl px-6 pb-24 space-y-8">
        <PhilosophySection />
        <TechStackSection />
        <ProjectsSection />
        <AIWorkflowSection />
        <ContactSection />
      </div>
    </main>
  );
}
