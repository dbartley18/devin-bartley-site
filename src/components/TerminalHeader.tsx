"use client";

interface TerminalHeaderProps {
  title?: string;
  messageCount?: number;
  onClose?: () => void;
  onMinimize?: () => void;
  onFullscreen?: () => void;
}

export default function TerminalHeader({
  title = "devin@bartley ~ %",
  messageCount,
  onClose,
  onMinimize,
  onFullscreen,
}: TerminalHeaderProps) {
  return (
    <div className="flex items-center gap-3 bg-bg-tertiary border-b border-border px-4 py-3 rounded-t-xl">
      <div className="group flex gap-2">
        <button
          type="button"
          onClick={onClose}
          className="w-3 h-3 rounded-full bg-accent-red flex items-center justify-center hover:brightness-110 transition-all"
        >
          <span className="hidden group-hover:block text-[9px] leading-none text-black/80 font-bold">
            ×
          </span>
        </button>
        <button
          type="button"
          onClick={onMinimize}
          className="w-3 h-3 rounded-full bg-accent-amber flex items-center justify-center hover:brightness-110 transition-all"
        >
          <span className="hidden group-hover:block text-[9px] leading-none text-black/80 font-bold">
            −
          </span>
        </button>
        <button
          type="button"
          onClick={onFullscreen}
          className="w-3 h-3 rounded-full bg-accent-green flex items-center justify-center hover:brightness-110 transition-all"
        >
          <svg
            className="hidden group-hover:block w-[7px] h-[7px]"
            viewBox="0 0 10 10"
            fill="rgba(0,0,0,0.75)"
          >
            <path d="M1 1 L5 1 L1 5Z" />
            <path d="M9 9 L5 9 L9 5Z" />
          </svg>
        </button>
      </div>
      <span className="font-nerd text-sm text-text-tertiary">{title}</span>
      {messageCount !== undefined && messageCount > 0 && (
        <span className="ml-auto font-mono text-xs text-text-tertiary">
          {messageCount} {messageCount === 1 ? "message" : "messages"}
        </span>
      )}
    </div>
  );
}
