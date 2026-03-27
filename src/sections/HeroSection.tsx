"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import TerminalHeader from "@/components/TerminalHeader";
import TerminalChat from "@/components/TerminalChat";

type WindowState = "open" | "closed" | "minimized" | "fullscreen";

export default function HeroSection() {
  const [messageCount, setMessageCount] = useState(0);
  const [windowState, setWindowState] = useState<WindowState>("open");

  const handleMessageCountChange = useCallback((count: number) => {
    setMessageCount(count);
  }, []);

  const handleClose = useCallback(() => {
    setWindowState("closed");
  }, []);

  const handleMinimize = useCallback(() => {
    setWindowState((prev) => (prev === "minimized" ? "open" : "minimized"));
  }, []);

  const handleFullscreen = useCallback(() => {
    setWindowState((prev) => {
      if (prev === "open") return "fullscreen";
      if (prev === "fullscreen") return "open";
      return "open"; // closed or minimized → restore to default
    });
  }, []);

  const handleReopen = useCallback(() => {
    setWindowState("open");
  }, []);

  // Closed: greyed-out title bar, clickable to reopen
  if (windowState === "closed") {
    return (
      <motion.div
        layout
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="overflow-hidden rounded-xl border border-border bg-bg-secondary cursor-pointer"
        onClick={handleReopen}
      >
        <div className="flex items-center gap-3 bg-bg-tertiary px-4 py-3 rounded-xl">
          <div className="flex gap-2">
            <span className="w-3 h-3 rounded-full bg-text-tertiary/30" />
            <span className="w-3 h-3 rounded-full bg-text-tertiary/30" />
            <span className="w-3 h-3 rounded-full bg-text-tertiary/30" />
          </div>
          <span className="font-nerd text-sm text-text-tertiary">
            devin@bartley ~ % (closed)
          </span>
          <span className="ml-auto font-mono text-xs text-text-tertiary">
            click to reopen
          </span>
        </div>
      </motion.div>
    );
  }

  // Open, minimized, or fullscreen — all render the terminal, just differently
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2 }}
      className={`overflow-hidden rounded-xl border border-border bg-bg-secondary ${
        windowState === "fullscreen"
          ? "fixed inset-4 z-50 rounded-xl shadow-2xl shadow-black/50"
          : ""
      }`}
    >
      <TerminalHeader
        messageCount={messageCount}
        onClose={handleClose}
        onMinimize={handleMinimize}
        onFullscreen={handleFullscreen}
      />
      <TerminalChat
        onMessageCountChange={handleMessageCountChange}
        minimized={windowState === "minimized"}
      />

      {windowState === "fullscreen" && (
        <div
          className="fixed inset-0 bg-black/60 -z-10"
          onClick={() => setWindowState("open")}
        />
      )}
    </motion.div>
  );
}
