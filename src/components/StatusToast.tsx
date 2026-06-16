"use client";

import { useEffect, useState } from "react";

interface StatusToastProps {
  hasApiKey: boolean | null;
  isPreview: boolean;
  error: string | null;
  onDismissError?: () => void;
}

export function StatusToast({
  hasApiKey,
  isPreview,
  error,
  onDismissError,
}: StatusToastProps) {
  const [visibleError, setVisibleError] = useState<string | null>(null);

  useEffect(() => {
    if (error) {
      setVisibleError(error);
      const t = setTimeout(() => {
        setVisibleError(null);
        onDismissError?.();
      }, 6000);
      return () => clearTimeout(t);
    }
    setVisibleError(null);
  }, [error, onDismissError]);

  const showNoKey = hasApiKey === false && !isPreview;
  const showPreview = isPreview;
  const showError = Boolean(visibleError);

  if (!showNoKey && !showPreview && !showError) return null;

  return (
    <div className="pointer-events-none fixed left-4 top-4 z-50 flex flex-col items-start gap-1">
      {showNoKey && (
        <div className="flex items-center gap-2 font-mono text-[10px] text-foreground-muted">
          <span className="h-1.5 w-1.5 rounded-full bg-surface-border" />
          preview only · no API key
        </div>
      )}
      {showPreview && (
        <div className="font-mono text-[10px] text-violet-500/60">preview mode</div>
      )}
      {showError && (
        <div className="font-mono text-[10px] text-rose-500/80">{visibleError}</div>
      )}
    </div>
  );
}

export function useApiHealth() {
  const [hasApiKey, setHasApiKey] = useState<boolean | null>(null);

  useEffect(() => {
    fetch("/api/health")
      .then((r) => r.json())
      .then((data) => setHasApiKey(Boolean(data.hasApiKey)))
      .catch(() => setHasApiKey(false));
  }, []);

  return hasApiKey;
}
