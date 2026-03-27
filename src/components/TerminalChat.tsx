"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import ChatMessage from "@/components/ChatMessage";
import CollapsedExchange from "@/components/CollapsedExchange";
import { getResponse, streamResponse } from "@/lib/mock-responses";

// ─── Boot sequence phases ────────────────────────────────────────────────────
type BootPhase = "typing" | "responding" | "ready";

function useBootSequence() {
  const [phase, setPhase] = useState<BootPhase>("typing");
  const [typedText, setTypedText] = useState("");
  const command = "$ whoami";

  useEffect(() => {
    if (phase !== "typing") return;
    let i = 0;
    const interval = setInterval(() => {
      if (i < command.length) {
        setTypedText(command.slice(0, i + 1));
        i++;
      } else {
        clearInterval(interval);
        // Brief pause after typing, then "execute"
        setTimeout(() => setPhase("responding"), 400);
      }
    }, 120); // Slower than before — feels like a person typing
    return () => clearInterval(interval);
  }, [phase]);

  useEffect(() => {
    if (phase !== "responding") return;
    // Bio fade-in takes ~400ms, then switch to ready
    const timer = setTimeout(() => setPhase("ready"), 1800);
    return () => clearTimeout(timer);
  }, [phase]);

  return { phase, typedText, reset: () => { setPhase("responding"); setTypedText(command); } };
}

// ─── Bio content (the "response" to $ whoami) ────────────────────────────────
function BioContent() {
  return (
    <div className="mt-6 space-y-5">
      <h1 className="text-4xl font-bold tracking-tight text-text-primary sm:text-5xl">
        Devin Bartley
      </h1>

      <p className="text-lg text-accent-green">
        Manager, AI &amp; Innovation | Deloitte
      </p>

      <div className="font-sans space-y-4">
        <p className="text-sm leading-relaxed text-text-secondary">
          Almost two decades building and rebuilding how organizations go to
          market across Wall Street, big law, advocacy, and business services
          environments. I&apos;ve led strategy, owned transformation, and built
          the systems behind it.
        </p>

        <p className="text-base text-text-primary font-medium border-l-2 border-accent-green pl-3">
          Most people sit on one side of that line. I don&apos;t.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="rounded-lg bg-bg-tertiary p-4">
            <p className="font-mono text-xs text-accent-cyan mb-1.5">Strategy</p>
            <p className="text-sm text-text-secondary">
              I understand how the business is supposed to work. Growth models,
              GTM design, operating structure.
            </p>
          </div>
          <div className="rounded-lg bg-bg-tertiary p-4">
            <p className="font-mono text-xs text-accent-purple mb-1.5">Systems</p>
            <p className="text-sm text-text-secondary">
              And I build the systems that actually make it work. Data,
              orchestration, AI, infrastructure.
            </p>
          </div>
        </div>

        <p className="text-sm leading-relaxed text-text-secondary">
          A lot of what passes as strategy breaks the second it hits execution.
          A lot of what gets built technically works, but has nothing to do with
          the business it&apos;s supposed to serve.
        </p>

        <p className="text-sm text-text-primary">
          I&apos;m not interested in either.
        </p>

        <p className="text-sm leading-relaxed text-text-secondary">
          I spend my time in that gap. Taking ideas, pushing on them, seeing if
          they actually hold up, then turning them into systems that run.
        </p>

        <p className="text-sm leading-relaxed text-text-secondary">
          Lately that&apos;s AI, agents, cognitive architectures. Not as
          concepts. As things built end to end.
        </p>

        <p className="text-base text-text-primary font-medium">
          Built with AI. One person.
        </p>
      </div>
    </div>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────
interface Exchange {
  question: string;
  answer: string;
}

interface TerminalChatProps {
  onMessageCountChange?: (count: number) => void;
  minimized?: boolean;
}

export default function TerminalChat({
  onMessageCountChange,
  minimized,
}: TerminalChatProps) {
  const [exchanges, setExchanges] = useState<Exchange[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<string | null>(null);
  const [streamingText, setStreamingText] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [inputValue, setInputValue] = useState("");

  const boot = useBootSequence();
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const cancelStreamRef = useRef<(() => void) | null>(null);

  const isIdle = exchanges.length === 0 && currentQuestion === null;
  const isReady = boot.phase === "ready";

  // Notify parent of message count changes
  useEffect(() => {
    onMessageCountChange?.(exchanges.length);
  }, [exchanges.length, onMessageCountChange]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [exchanges, streamingText, currentQuestion]);

  // Focus input when minimized
  useEffect(() => {
    if (minimized) {
      inputRef.current?.focus();
    }
  }, [minimized]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const trimmed = inputValue.trim();
      if (!trimmed || isStreaming) return;

      setInputValue("");

      // Handle clear command
      if (trimmed.toLowerCase() === "clear") {
        cancelStreamRef.current?.();
        setExchanges([]);
        setCurrentQuestion(null);
        setStreamingText("");
        setIsStreaming(false);
        boot.reset();
        return;
      }

      // Start streaming response
      setCurrentQuestion(trimmed);
      setStreamingText("");
      setIsStreaming(true);

      const responseText = getResponse(trimmed);
      let accumulated = "";

      cancelStreamRef.current = streamResponse(
        responseText,
        (char) => {
          accumulated += char;
          setStreamingText(accumulated);
        },
        () => {
          setExchanges((prev) => [
            ...prev,
            { question: trimmed, answer: accumulated },
          ]);
          setCurrentQuestion(null);
          setStreamingText("");
          setIsStreaming(false);
          cancelStreamRef.current = null;
          setTimeout(() => inputRef.current?.focus(), 50);
        },
      );
    },
    [inputValue, isStreaming, boot],
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cancelStreamRef.current?.();
    };
  }, []);

  const collapsedExchanges = exchanges.slice(0, -1);
  const latestExchange =
    exchanges.length > 0 ? exchanges[exchanges.length - 1] : null;

  return (
    <div
      ref={scrollRef}
      className={`overflow-y-auto scroll-smooth p-8 font-mono ${isIdle ? "" : "max-h-[70vh]"}`}
    >
      {/* ── $ whoami command + bio response ── */}
      {!minimized && (
        isIdle ? (
          <>
            {boot.phase !== "typing" && (
              <div className="text-sm text-text-secondary">$ whoami</div>
            )}
            {boot.phase !== "typing" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
              >
                <BioContent />
              </motion.div>
            )}
          </>
        ) : (
          <CollapsedExchange
            question="whoami"
            answerPreview="Devin Bartley | Manager, AI & Innovation | Deloitte"
            isWhoami
          />
        )
      )}

      {/* ── Collapsed older exchanges ── */}
      {collapsedExchanges.length > 0 && (
        <div className="mt-3 space-y-1">
          {collapsedExchanges.map((ex, i) => (
            <CollapsedExchange
              key={i}
              question={ex.question}
              answerPreview={ex.answer.slice(0, 80).replace(/\s+\S*$/, "...")}
            />
          ))}
        </div>
      )}

      {/* ── Latest completed exchange (full) ── */}
      {latestExchange && !isStreaming && (
        <div className="mt-4">
          <div className="text-sm text-text-secondary">
            <span className="text-accent-green">❯</span>{" "}
            {latestExchange.question}
          </div>
          <ChatMessage text={latestExchange.answer} isStreaming={false} />
        </div>
      )}

      {/* ── Currently streaming exchange ── */}
      {currentQuestion && isStreaming && (
        <div className="mt-4">
          <div className="text-sm text-text-secondary">
            <span className="text-accent-green">❯</span> {currentQuestion}
          </div>
          <ChatMessage text={streamingText} isStreaming />
        </div>
      )}

      {/* ── Input prompt ── */}
      <form onSubmit={handleSubmit} className="border-t border-border pt-3 mt-4">
        <div className="flex items-center gap-2">
          <span className="text-accent-green text-sm select-none">❯</span>

          {/* Boot phase: show typing animation in the prompt area (skip if minimized) */}
          {boot.phase === "typing" && !minimized ? (
            <span className="text-text-tertiary text-sm">
              {boot.typedText}
              <span className="cursor-blink text-accent-green">▊</span>
            </span>
          ) : !isReady || !isIdle ? (
            /* Active chat or still loading bio */
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              disabled={isStreaming || !isReady}
              placeholder=""
              className="flex-1 bg-transparent text-text-primary text-sm outline-none disabled:opacity-50"
              autoComplete="off"
              spellCheck={false}
            />
          ) : (
            /* Ready + idle: real input with custom placeholder treatment */
            <div className="flex-1 relative">
              {!inputValue && (
                <div className="absolute inset-0 flex items-center pointer-events-none">
                  <span className="cursor-blink text-accent-green text-sm">▊</span>
                  <span className="text-text-tertiary text-sm ml-1">
                    Ask anything about what I build...
                  </span>
                </div>
              )}
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                disabled={isStreaming}
                placeholder=""
                className="w-full bg-transparent text-text-primary text-sm outline-none relative z-10"
                autoComplete="off"
                spellCheck={false}
              />
            </div>
          )}
        </div>
      </form>
    </div>
  );
}
