"use client";

import { useState } from "react";

import DuoButton from "@/components/shared/DuoButton";
import { HeartIcon } from "@/components/shared/icons";

/**
 * Blocks the lesson when hearts hit zero. Refilling is mocked (§10) — it just
 * calls POST /api/hearts/refill and lets the learner carry on where they were.
 */
export default function OutOfHeartsModal({
  onRefill,
  onQuit,
}: {
  onRefill: () => Promise<void>;
  onQuit: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refill = async () => {
    setBusy(true);
    setError(null);
    try {
      await onRefill();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Refill failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Out of hearts"
      className="fixed inset-0 z-50 flex items-center justify-center bg-duo-bg/90 px-4 backdrop-blur-sm"
    >
      <div className="w-full max-w-sm animate-pop-in rounded-3xl border-2 border-duo-border bg-duo-card p-6 text-center">
        <div className="mb-4 flex justify-center gap-1">
          {[0, 1, 2, 3, 4].map((index) => (
            <HeartIcon key={index} className="h-7 w-7 text-duo-border" />
          ))}
        </div>

        <h2 className="mb-2 text-2xl text-duo-red">You&apos;re out of hearts!</h2>
        <p className="mb-6 text-sm text-duo-muted">
          Refill to keep going, or quit and come back later — hearts regenerate
          on their own over time.
        </p>

        {error && (
          <p className="mb-4 text-sm font-bold text-duo-red">{error}</p>
        )}

        <div className="space-y-3">
          <DuoButton
            fullWidth
            size="lg"
            disabled={busy}
            onClick={() => void refill()}
          >
            {busy ? "Refilling…" : "Refill hearts"}
          </DuoButton>
          <DuoButton variant="outline" fullWidth onClick={onQuit}>
            Quit lesson
          </DuoButton>
        </div>
      </div>
    </div>
  );
}
