"use client";

import DuoButton from "@/components/shared/DuoButton";

/**
 * The "UP NEXT" card at the bottom of the path.
 *
 * The seeded course has a single section, so the next one is a placeholder —
 * the card exists because the reference ends the path with it.
 */
export default function SectionEndCard({
  nextSectionNumber,
  onContinue,
}: {
  nextSectionNumber: number;
  onContinue: () => void;
}) {
  return (
    <div className="mt-6 rounded-2xl border-2 border-duo-border p-8 text-center">
      <span className="inline-block rounded-lg bg-duo-blue/15 px-3 py-1 text-xs font-extrabold uppercase tracking-widest text-duo-blue">
        Up next
      </span>

      <h2 className="mt-5 text-2xl">Section {nextSectionNumber}</h2>
      <p className="mx-auto mt-3 max-w-sm text-[17px] leading-[25px] text-duo-muted">
        Learn words, phrases, and grammar concepts for basic interactions
      </p>

      <DuoButton variant="blue" fullWidth size="lg" className="mt-7" onClick={onContinue}>
        Continue
      </DuoButton>
    </div>
  );
}
