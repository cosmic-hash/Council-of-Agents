"use client";

interface NewQuestionPillProps {
  onClick: () => void;
}

export function NewQuestionPill({ onClick }: NewQuestionPillProps) {
  return (
    <button
      onClick={onClick}
      className="rounded-full border border-surface-border bg-background px-3 py-1 font-mono text-[10px] text-foreground-muted transition-colors hover:text-foreground"
    >
      New
    </button>
  );
}
