"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import RailLayout from "@/components/layout/RailLayout";
import RightRail from "@/components/rail/RightRail";
import {
  ActiveSectionCard,
  ComingSoonSectionCard,
  CompletedSectionCard,
} from "@/components/sections/SectionCard";
import { ArrowLeftIcon } from "@/components/shared/icons";
import { api } from "@/lib/api";
import type { CoursePath } from "@/lib/types";

/**
 * The sections overview, behind the unit banner's back arrow.
 *
 * The course is one real section (see the README's assumptions), so this shows
 * that section's true state and two placeholders. The placeholders are honest
 * rather than fake progress: they say "coming soon" and offer no action, because
 * there is nothing seeded behind them.
 */

/**
 * What Section 1 gets you. Written to match what's actually taught — greetings,
 * introductions, food, family, colours, numbers, travel, home, work, weather and
 * hobbies — rather than a generic CEFR blurb.
 */
const SECTION_ONE_DESCRIPTOR =
  "I can greet people, introduce myself, order food and talk about my family, work and weekend.";

/** Units each unwritten section is planned to hold. */
const PLANNED_UNITS_PER_SECTION = 13;

export default function SectionsPage() {
  const [path, setPath] = useState<CoursePath | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const next = await api.coursePath();
        if (!cancelled) setPath(next);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Couldn't load the course");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const back = (
    <Link
      href="/learn"
      className="flex items-center gap-3 pb-4 text-[17px] font-bold text-duo-muted transition-colors hover:text-duo-text"
    >
      <ArrowLeftIcon className="h-5 w-5" />
      Back
    </Link>
  );

  if (error) {
    return (
      <RailLayout rail={<RightRail />}>
        <div className="pt-6">
          {back}
          <p className="rounded-2xl border-2 border-duo-border p-6 text-duo-body">
            {error}
          </p>
        </div>
      </RailLayout>
    );
  }

  if (!path) {
    return (
      <RailLayout rail={<RightRail />}>
        <div className="pt-6">
          {back}
          <div className="h-40 animate-pulse rounded-2xl bg-duo-card" />
        </div>
      </RailLayout>
    );
  }

  // Percent of the section that's done, by skills rather than lessons: practice
  // replays bump the lesson tally without advancing anything, so a lesson-based
  // percentage could exceed 100.
  const skills = path.units.flatMap((unit) => unit.skills);
  const completed = skills.filter((skill) => skill.status === "completed").length;
  const percent = skills.length
    ? Math.round((completed / skills.length) * 100)
    : 0;
  const sectionFinished = completed === skills.length && skills.length > 0;

  return (
    <RailLayout rail={<RightRail />}>
      <div className="pt-6">
        {back}

        <hr className="border-t-2 border-duo-border" />

        <div className="flex flex-col gap-4 py-6">
          {sectionFinished ? (
            <CompletedSectionCard number={1} reviewHref="/learn" />
          ) : (
            <ActiveSectionCard
              number={1}
              percent={percent}
              descriptor={SECTION_ONE_DESCRIPTOR}
              continueHref="/learn"
            />
          )}

          <ComingSoonSectionCard number={2} unitCount={PLANNED_UNITS_PER_SECTION} />
          <ComingSoonSectionCard number={3} unitCount={PLANNED_UNITS_PER_SECTION} />
        </div>
      </div>
    </RailLayout>
  );
}
