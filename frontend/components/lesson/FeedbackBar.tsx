"use client";

import { useState } from "react";

import DuoButton from "@/components/shared/DuoButton";
import { CheckIcon, CrossIcon, SparkleIcon } from "@/components/shared/icons";

interface FeedbackBarProps {
  isCorrect: boolean;
  correctAnswer: string;
  isLastExercise: boolean;
  onContinue: () => void;
  /**
   * Optional AI explanation fetcher. When omitted the "Why?" button is hidden,
   * so the core lesson loop never depends on it (§2).
   */
  onExplain?: () => Promise<string>;
}

/** Fixed to the bottom of the viewport and slides up on appear (§8). */
export default function FeedbackBar({
  isCorrect,
  correctAnswer,
  isLastExercise,
  onContinue,
  onExplain,
}: FeedbackBarProps) {
  const [explanation, setExplanation] = useState<string | null>(null);
  const [loadingExplanation, setLoadingExplanation] = useState(false);

  const requestExplanation = async () => {
    if (!onExplain) return;
    setLoadingExplanation(true);
    try {
      setExplanation(await onExplain());
    } catch {
      setExplanation("Couldn't load an explanation right now.");
    } finally {
      setLoadingExplanation(false);
    }
  };

  return (
    <div
      role="status"
      aria-live="polite"
      className={[
        "fixed bottom-0 left-0 right-0 z-20 animate-slide-up border-t-2",
        isCorrect
          ? "border-duo-green/40 bg-duo-greenSoft"
          : "border-duo-red/40 bg-duo-redSoft",
      ].join(" ")}
    >
      <div className="mx-auto flex max-w-2xl flex-col gap-4 px-4 py-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span
            className={[
              "flex h-11 w-11 shrink-0 items-center justify-center rounded-full",
              isCorrect
                ? "bg-duo-green text-white"
                : "bg-duo-red text-white",
            ].join(" ")}
          >
            {isCorrect ? (
              <CheckIcon className="h-6 w-6" />
            ) : (
              <CrossIcon className="h-6 w-6" />
            )}
          </span>

          <div className="min-w-0">
            <p
              className={[
                "text-xl font-extrabold",
                isCorrect ? "text-duo-green" : "text-duo-red",
              ].join(" ")}
            >
              {isCorrect ? "Nice!" : "Correct answer:"}
            </p>

            {!isCorrect && (
              <p className="font-bold text-duo-text">{correctAnswer}</p>
            )}

            {!isCorrect && onExplain && !explanation && (
              <button
                type="button"
                onClick={() => void requestExplanation()}
                disabled={loadingExplanation}
                className="mt-1 inline-flex items-center gap-1 text-sm font-extrabold uppercase tracking-wide text-duo-blue disabled:text-duo-muted"
              >
                <SparkleIcon className="h-4 w-4" />
                {loadingExplanation ? "Thinking…" : "Why?"}
              </button>
            )}

            {explanation && (
              <p className="mt-2 max-w-lg text-sm text-duo-muted">
                {explanation}
              </p>
            )}
          </div>
        </div>

        <DuoButton
          variant={isCorrect ? "green" : "red"}
          size="lg"
          onClick={onContinue}
          className="w-full sm:w-auto sm:min-w-[190px]"
        >
          {isLastExercise ? "Finish" : "Continue"}
        </DuoButton>
      </div>
    </div>
  );
}
