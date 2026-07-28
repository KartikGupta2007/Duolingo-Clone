"use client";

import DuoButton from "@/components/shared/DuoButton";
import { FlameIcon, GemIcon, StarIcon } from "@/components/shared/icons";
import type { LegendaryResult, LessonResult } from "@/lib/types";

/** One of the coloured summary tiles Duolingo shows on the results screen. */
function StatTile({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <div className={`rounded-2xl border-2 p-[2px] ${color}`}>
      <p className="pt-1 text-center text-[11px] font-extrabold uppercase tracking-widest text-duo-bg/80">
        {label}
      </p>
      <div className="mt-[2px] flex items-center justify-center gap-1.5 rounded-xl bg-duo-bg px-4 py-2.5">
        <span className="text-inherit">{icon}</span>
        <span className="text-lg font-extrabold">{value}</span>
      </div>
    </div>
  );
}

/**
 * The results screen, shared by lessons and Legendary runs.
 *
 * Takes the union of the two result shapes rather than a fabricated
 * lesson-shaped object, so the lesson-only fields have to be narrowed before use
 * and a Legendary run can't accidentally claim it unlocked something.
 */
export default function LessonCompleteModal({
  result,
  /** Present only for a Legendary run. */
  legendary,
  onContinue,
}: {
  result: LessonResult | LegendaryResult;
  legendary?: { earned: boolean; allowance: number; alreadyEarned: boolean };
  onContinue: () => void;
}) {
  // Lesson-only fields. A Legendary run finishes no lesson and unlocks nothing,
  // so both are absent from its result.
  const skillCompleted = "skill_completed" in result && result.skill_completed;
  const unlockedTitle =
    "unlocked_skill_title" in result ? result.unlocked_skill_title : null;

  const headline = legendary
    ? legendary.earned
      ? "Legendary!"
      : "Challenge complete"
    : result.is_perfect
      ? "Perfect lesson!"
      : "Lesson complete!";

  const subline = legendary
    ? legendary.earned
      ? legendary.alreadyEarned
        ? "Legendary held — you stayed inside the allowance again."
        : "You beat the challenge and earned Legendary on this skill."
      : `More than ${legendary.allowance} mistakes, so the badge stays locked — the XP is yours though.`
    : skillCompleted
      ? "You finished this skill."
      : "Nice work — keep the streak going.";

  return (
    <div className="fixed inset-0 z-40 flex flex-col items-center justify-center bg-duo-bg px-4">
      <div className="w-full max-w-md animate-pop-in text-center">
        <div className="mb-6 text-6xl" aria-hidden="true">
          {legendary ? (legendary.earned ? "👑" : "💪") : result.is_perfect ? "🏆" : "🎉"}
        </div>

        <h1
          className={`mb-2 text-3xl ${
            legendary && legendary.earned ? "text-duo-purple" : "text-duo-gold"
          }`}
        >
          {headline}
        </h1>
        <p className="mb-8 text-duo-muted">{subline}</p>

        <div className="mb-6 grid grid-cols-3 gap-3">
          <StatTile
            label="Total XP"
            value={`${result.xp_earned}`}
            icon={<StarIcon className="h-5 w-5 text-duo-gold" />}
            color="border-duo-gold bg-duo-gold"
          />
          <StatTile
            label="Accuracy"
            value={`${result.accuracy}%`}
            icon={<GemIcon className="h-5 w-5 text-duo-blue" />}
            color="border-duo-blue bg-duo-blue"
          />
          <StatTile
            label="Streak"
            value={`${result.streak_count}`}
            icon={<FlameIcon className="h-5 w-5 text-[#FF9600]" />}
            color="border-[#FF9600] bg-[#FF9600]"
          />
        </div>

        {result.is_perfect && (
          <p className="mb-4 text-sm font-bold text-duo-green">
            +{result.xp_earned} XP includes a no-mistakes bonus.
          </p>
        )}

        {unlockedTitle && (
          <div className="mb-6 rounded-2xl border-2 border-duo-green/40 bg-duo-greenSoft px-4 py-3 text-sm font-bold text-duo-green">
            🔓 New skill unlocked: {unlockedTitle}
          </div>
        )}

        {result.hearts_lost > 0 && (
          <p className="mb-6 text-sm text-duo-muted">
            You lost {result.hearts_lost}{" "}
            {result.hearts_lost === 1 ? "heart" : "hearts"} — {result.hearts}{" "}
            left.
          </p>
        )}

        <DuoButton size="lg" fullWidth onClick={onContinue}>
          Continue
        </DuoButton>
      </div>
    </div>
  );
}
