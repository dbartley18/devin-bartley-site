"use client";

interface CollapsedExchangeProps {
  question: string;
  answerPreview: string;
  isWhoami?: boolean;
}

export default function CollapsedExchange({
  question,
  answerPreview,
  isWhoami,
}: CollapsedExchangeProps) {
  const prefix = isWhoami ? "$" : "❯";
  return (
    <div className="text-text-tertiary text-xs font-mono truncate">
      <span>{prefix} {question}</span>
      <span className="mx-1">→</span>
      <span>{answerPreview}</span>
    </div>
  );
}
