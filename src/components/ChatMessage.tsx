"use client";

interface ChatMessageProps {
  text: string;
  isStreaming: boolean;
}

export default function ChatMessage({ text, isStreaming }: ChatMessageProps) {
  return (
    <div className="bg-bg-tertiary rounded-lg border-l-2 border-accent-green p-4 mt-3">
      <p className="text-accent-green text-xs font-mono mb-2">devin.ai</p>
      <div className="text-text-secondary text-sm font-sans leading-relaxed whitespace-pre-wrap">
        {text}
        {isStreaming && (
          <span className="cursor-blink text-accent-green">▊</span>
        )}
      </div>
    </div>
  );
}
