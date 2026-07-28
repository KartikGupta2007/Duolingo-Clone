"use client";

import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import ExerciseFillBlank from "@/components/lesson/ExerciseFillBlank";
import ExerciseMatchPairs from "@/components/lesson/ExerciseMatchPairs";
import ExerciseMultipleChoice from "@/components/lesson/ExerciseMultipleChoice";
import ExerciseTranslate from "@/components/lesson/ExerciseTranslate";
import ExerciseTypeAnswer from "@/components/lesson/ExerciseTypeAnswer";
import FeedbackBar from "@/components/lesson/FeedbackBar";
import LessonCompleteModal from "@/components/lesson/LessonCompleteModal";
import OutOfHeartsModal from "@/components/lesson/OutOfHeartsModal";
import ProgressBar from "@/components/lesson/ProgressBar";
import DuoButton from "@/components/shared/DuoButton";
import { CrossIcon, HeartIcon } from "@/components/shared/icons";
import SpeakButton from "@/components/shared/SpeakButton";
import { useUser } from "@/components/shared/UserProvider";
import { api } from "@/lib/api";
import { correctAnswerText } from "@/lib/answers";
import { promptOf, speechTextFor } from "@/lib/exerciseText";
import { cancelSpeech, speak } from "@/lib/speech";
import type {
  Exercise,
  LegendaryResult,
  LegendaryStart,
  LessonResult,
  LessonStart,
} from "@/lib/types";

/**
 * The lesson player, which also runs Legendary challenges (`?mode=legendary`).
 *
 * Owns progress, hearts and feedback state; every exercise type plugs in
 * through the same `{ payload, onAnswer }` contract, so this component doesn't
 * branch on type for anything except which component to render (§7).
 *
 * The two modes are a tagged union rather than a boolean flag, because they
 * differ in more than presentation: a lesson is fetched and submitted by
 * `lesson_id`, a Legendary run by `skill_id` (it draws from every lesson in the
 * skill, so no single lesson identifies it). Everything between loading and
 * submitting is shared, which is why it's one component and not two.
 */
type Phase = "answering" | "feedback";

/** What's being played. Both shapes carry exercises, hearts and the titles. */
type Run =
  | { mode: "lesson"; data: LessonStart }
  | { mode: "legendary"; data: LegendaryStart };

type Outcome =
  | { mode: "lesson"; result: LessonResult }
  | { mode: "legendary"; result: LegendaryResult };

export default function LessonPage() {
  const params = useParams<{ skillId: string }>();
  const skillId = Number(params.skillId);
  const router = useRouter();
  const search = useSearchParams();
  const isLegendary = search.get("mode") === "legendary";
  const { refresh } = useUser();

  const [run, setRun] = useState<Run | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [index, setIndex] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [mistakeCount, setMistakeCount] = useState(0);
  const [hearts, setHearts] = useState(0);
  const [phase, setPhase] = useState<Phase>("answering");
  const [lastCorrect, setLastCorrect] = useState(false);
  const [outOfHearts, setOutOfHearts] = useState(false);
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Guards against a double submit for one exercise — match_pairs auto-submits
  // from an effect, and React may re-run effects in development StrictMode.
  const acceptingAnswer = useRef(true);

  useEffect(() => {
    if (!Number.isFinite(skillId)) {
      setLoadError("Invalid skill id");
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const next: Run = isLegendary
          ? { mode: "legendary", data: await api.startLegendary(skillId) }
          : { mode: "lesson", data: await api.startLesson(skillId) };
        if (cancelled) return;
        setRun(next);
        setHearts(next.data.hearts);
      } catch (err) {
        if (!cancelled) {
          setLoadError(
            err instanceof Error ? err.message : "Failed to load the lesson",
          );
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [skillId, isLegendary]);

  // Reaching zero hearts always blocks the lesson, whether the learner spent
  // them here or arrived with an empty bar.
  useEffect(() => {
    if (run && hearts <= 0) setOutOfHearts(true);
  }, [run, hearts]);

  const exercises = run?.data.exercises ?? [];
  const exercise: Exercise | undefined = exercises[index];
  const isLastExercise = index === exercises.length - 1;
  const spoken = exercise ? speechTextFor(exercise) : null;

  // Read the question as it appears. Keyed on the exercise id, so it fires once
  // per question — showing feedback doesn't change it, so it won't repeat when
  // the answer is checked.
  //
  // Some browsers (Safari especially) refuse to start speech without a user
  // gesture on the page; the button below is the fallback when that happens.
  // Keyed on the position, not the exercise id: a Legendary run can serve the
  // same exercise twice, and keying on the id would skip reading it the second
  // time.
  useEffect(() => {
    if (spoken) speak(spoken);
  }, [index, spoken]);

  // Stop mid-sentence audio when leaving the lesson.
  useEffect(() => cancelSpeech, []);

  const submitRun = useCallback(
    async (correct: number, mistakes: number) => {
      if (!run) return;
      const body = { correct_count: correct, mistake_count: mistakes };
      try {
        setSubmitError(null);
        setOutcome(
          run.mode === "legendary"
            ? {
                mode: "legendary",
                result: await api.completeLegendary(skillId, body),
              }
            : {
                mode: "lesson",
                result: await api.completeLesson(run.data.lesson_id, body),
              },
        );
        await refresh();
      } catch (err) {
        setSubmitError(
          err instanceof Error ? err.message : "Failed to save your progress",
        );
      }
    },
    [run, skillId, refresh],
  );

  /** The single entry point every exercise type calls when it's submitted. */
  const handleAnswer = useCallback((isCorrect: boolean) => {
    if (!acceptingAnswer.current) return;
    acceptingAnswer.current = false;

    setLastCorrect(isCorrect);
    if (isCorrect) {
      setCorrectCount((count) => count + 1);
    } else {
      setMistakeCount((count) => count + 1);
      setHearts((current) => Math.max(0, current - 1));
    }
    setPhase("feedback");
  }, []);

  const handleContinue = () => {
    if (isLastExercise) {
      void submitRun(correctCount, mistakeCount);
      return;
    }
    setIndex((current) => current + 1);
    setPhase("answering");
    acceptingAnswer.current = true;
  };

  const handleRefill = async () => {
    const state = await api.refillHearts();
    setHearts(state.hearts);
    setOutOfHearts(false);
    await refresh();
  };

  // ---------------------------------------------------------------- states
  if (loadError) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="duo-panel max-w-md p-6 text-center">
          <h1 className="mb-2 text-xl">Can&apos;t start this lesson</h1>
          <p className="mb-6 text-sm text-duo-muted">{loadError}</p>
          <Link href="/learn">
            <DuoButton>Back to path</DuoButton>
          </Link>
        </div>
      </div>
    );
  }

  if (!run || !exercise) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-duo-border border-t-duo-green" />
      </div>
    );
  }

  if (outcome) {
    return (
      <LessonCompleteModal
        result={outcome.result}
        legendary={
          outcome.mode === "legendary"
            ? {
                earned: outcome.result.legendary_earned,
                allowance: outcome.result.mistake_allowance,
                alreadyEarned: outcome.result.was_already_legendary,
              }
            : undefined
        }
        onContinue={() => router.push("/learn")}
      />
    );
  }

  // ------------------------------------------------------------------ view
  return (
    <div className="min-h-screen pb-32">
      <header className="mx-auto flex max-w-2xl items-center gap-4 px-4 py-5">
        <Link
          href="/learn"
          aria-label="Quit lesson"
          className="text-duo-muted transition-colors hover:text-duo-text"
        >
          <CrossIcon className="h-7 w-7" />
        </Link>

        <ProgressBar value={index} total={exercises.length} />

        <div className="flex shrink-0 items-center gap-1.5">
          <HeartIcon
            className={`h-6 w-6 ${hearts > 0 ? "text-duo-red" : "text-duo-border"}`}
          />
          <span className="font-extrabold tabular-nums">{hearts}</span>
        </div>
      </header>

      <div className="mx-auto max-w-2xl px-4 pt-4">
        {run.mode === "legendary" ? (
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <p className="inline-block rounded-full border-2 border-duo-purple/60 bg-duo-purple/10 px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-duo-purple">
              Legendary · {run.data.skill_title}
            </p>
            {/* The allowance is the rule that makes this a challenge, so it's on
                screen rather than buried in a tooltip. */}
            <p className="text-xs font-bold text-duo-muted">
              {mistakeCount > run.data.mistake_allowance
                ? "Too many mistakes for the badge — finish for the XP."
                : `${run.data.mistake_allowance - mistakeCount} of ${run.data.mistake_allowance} mistakes left`}
            </p>
          </div>
        ) : (
          run.data.is_practice && (
            <p className="mb-4 inline-block rounded-full border-2 border-duo-gold/50 bg-duo-gold/10 px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-duo-gold">
              Practice · {run.data.skill_title}
            </p>
          )
        )}

        {submitError && (
          <div className="mb-4 rounded-2xl border-2 border-duo-red/40 bg-duo-redSoft px-4 py-3 text-sm font-bold text-duo-red">
            {submitError}{" "}
            <button
              onClick={() => void submitRun(correctCount, mistakeCount)}
              className="underline"
            >
              Retry
            </button>
          </div>
        )}

        {/* Replays the question. Owned by the player rather than the exercise
            components, so their `{ payload, onAnswer }` contract stays intact
            (§7). Absent for match_pairs, which has no sentence to read. */}
        {spoken && <SpeakButton text={spoken} className="mb-5" />}

        {/* `key` remounts the component per exercise, so each one starts with
            clean local state instead of inheriting the previous answer. */}
        <div key={`${exercise.id}-${index}`}>
          {exercise.type === "multiple_choice" && (
            <ExerciseMultipleChoice
              payload={exercise.payload}
              onAnswer={handleAnswer}
            />
          )}
          {exercise.type === "translate" && (
            <ExerciseTranslate
              payload={exercise.payload}
              onAnswer={handleAnswer}
            />
          )}
          {exercise.type === "match_pairs" && (
            <ExerciseMatchPairs
              payload={exercise.payload}
              onAnswer={handleAnswer}
            />
          )}
          {exercise.type === "fill_blank" && (
            <ExerciseFillBlank
              payload={exercise.payload}
              onAnswer={handleAnswer}
            />
          )}
          {exercise.type === "type_answer" && (
            <ExerciseTypeAnswer
              payload={exercise.payload}
              onAnswer={handleAnswer}
            />
          )}
        </div>
      </div>

      {phase === "feedback" && (
        <FeedbackBar
          isCorrect={lastCorrect}
          correctAnswer={correctAnswerText(exercise)}
          isLastExercise={isLastExercise}
          onContinue={handleContinue}
          onExplain={
            lastCorrect
              ? undefined
              : async () => {
                  // The `onAnswer(isCorrect)` contract deliberately doesn't
                  // surface what the learner typed, so only the prompt and the
                  // correct answer are sent.
                  const { explanation } = await api.explain({
                    question: promptOf(exercise),
                    correct_answer: correctAnswerText(exercise),
                  });
                  return explanation;
                }
          }
        />
      )}

      {outOfHearts && (
        <OutOfHeartsModal
          onRefill={handleRefill}
          onQuit={() => router.push("/learn")}
        />
      )}
    </div>
  );
}
