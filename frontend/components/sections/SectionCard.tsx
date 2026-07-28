import Link from "next/link";

import CharacterArt from "@/components/path/CharacterArt";
import DuoButton from "@/components/shared/DuoButton";
import { CheckIcon, LockIcon, TrophyIcon } from "@/components/shared/icons";
import { DUO } from "@/lib/characters";

/**
 * The three cards on the sections overview.
 *
 * They're separate components rather than one card with fields switched off,
 * because the reference genuinely draws three different things: a finished
 * section is a striped banner with a REVIEW button, the one you're on is a
 * progress bar with Duo describing what you'll be able to do, and a section you
 * can't reach yet is muted with no action at all.
 *
 * `Frame` is the only shared piece — the border, radius and optional stripes.
 */

/**
 * Wide diagonal banding, which the reference uses to mark a finished section.
 * Broad and low-contrast: ~60px bands at 4% white, so it reads as texture behind
 * the text rather than as hatching over it.
 */
const STRIPES =
  "repeating-linear-gradient(115deg, transparent 0 60px, rgba(255,255,255,0.04) 60px 120px)";

function Frame({
  striped = false,
  children,
}: {
  striped?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className="rounded-2xl border-2 border-duo-border p-5"
      style={striped ? { backgroundImage: STRIPES } : undefined}
    >
      {children}
    </div>
  );
}

function Heading({
  children,
  muted = false,
}: {
  children: React.ReactNode;
  muted?: boolean;
}) {
  return (
    <h2
      className={`text-[26px] leading-tight ${muted ? "text-duo-muted" : "text-duo-text"}`}
    >
      {children}
    </h2>
  );
}

/** A section the learner has finished. */
export function CompletedSectionCard({
  number,
  reviewHref,
}: {
  number: number;
  reviewHref: string;
}) {
  return (
    <Frame striped>
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <Heading>Section {number}</Heading>
          <p className="mt-2 flex items-center gap-2 text-[15px] font-extrabold uppercase tracking-[1px] text-duo-green">
            {/* A filled green disc with a white tick, as in the reference —
                not a bare tick. */}
            <span
              aria-hidden="true"
              className="grid h-[22px] w-[22px] shrink-0 place-items-center rounded-full bg-duo-green"
            >
              <CheckIcon className="h-3.5 w-3.5 text-white" />
            </span>
            Completed!
          </p>
        </div>

        <Link
          href={reviewHref}
          className="shrink-0 rounded-xl border-2 border-duo-border px-5 py-3 text-[15px] font-extrabold uppercase tracking-[1px] text-duo-blue transition-colors hover:bg-duo-card"
        >
          Review
        </Link>
      </div>
    </Frame>
  );
}

/**
 * The section in progress.
 *
 * `percent` is completed skills over total skills in the section — monotonic, and
 * it doesn't double-count practice replays the way a lesson tally would.
 */
export function ActiveSectionCard({
  number,
  percent,
  descriptor,
  continueHref,
}: {
  number: number;
  percent: number;
  /** What the learner will be able to do — the reference's Duo speech bubble. */
  descriptor: string;
  continueHref: string;
}) {
  return (
    <Frame>
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <Heading>Section {number}</Heading>

          {/* Bar with the percentage inside it and the section trophy at the end. */}
          <div className="mt-4 flex items-center gap-3">
            <div className="relative h-4 flex-1 rounded-full bg-duo-border">
              <div
                className="absolute inset-y-0 left-0 rounded-full bg-duo-green transition-[width] duration-500"
                // A sliver at 0% so the bar reads as "started", as in the reference.
                style={{ width: `${Math.max(percent, 4)}%` }}
              />
              <span className="absolute inset-0 grid place-items-center text-xs font-extrabold tabular-nums text-duo-text">
                {percent}%
              </span>
            </div>
            <TrophyIcon className="h-7 w-7 shrink-0 text-duo-border" />
          </div>

          <div className="mt-6 max-w-[260px]">
            <Link href={continueHref}>
              <DuoButton fullWidth>Continue</DuoButton>
            </Link>
          </div>
        </div>

        {/* Duo and his bubble. Decorative, so hidden from assistive tech — the
            descriptor is repeated as the bubble's own text for sighted users
            only, and the CONTINUE link already names the action. */}
        <div className="flex shrink-0 flex-col items-center">
          <p className="relative rounded-2xl border-2 border-duo-border bg-duo-card px-4 py-3 text-[17px] font-bold leading-snug text-duo-text sm:max-w-[240px]">
            {descriptor}
            <span
              aria-hidden="true"
              className="absolute left-8 top-full h-3 w-3 -translate-y-1/2 rotate-45 border-b-2 border-r-2 border-duo-border bg-duo-card"
            />
          </p>
          <div className="-mt-2 h-[190px] w-[190px]" aria-hidden="true">
            <CharacterArt character={DUO} size={190} />
          </div>
        </div>
      </div>
    </Frame>
  );
}

/** A section that doesn't exist yet. No action, because there's nothing to open. */
export function ComingSoonSectionCard({
  number,
  unitCount,
}: {
  number: number;
  /** How many units it will hold, shown the way the reference shows "6 LEVELS". */
  unitCount: number;
}) {
  return (
    <Frame>
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <Heading muted>Section {number}</Heading>
          <p className="mt-2 flex items-center gap-2 text-[15px] font-extrabold uppercase tracking-wide text-duo-muted">
            <LockIcon className="h-4 w-4" />
            Coming soon
          </p>
          {/* Deliberately doesn't say "finish Section {number - 1}" — for
              Section 3 that would point at another unwritten section. */}
          <p className="mt-3 max-w-[340px] text-[15px] font-medium leading-snug text-duo-muted">
            {unitCount} more units are being written — check back soon!
          </p>
        </div>
      </div>
    </Frame>
  );
}
