"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import RailLayout from "@/components/layout/RailLayout";
import AnimatedCharacter from "@/components/characters/AnimatedCharacter";
import RightRail from "@/components/rail/RightRail";
import { ArrowLeftIcon, SpeakerIcon } from "@/components/shared/icons";
import { api } from "@/lib/api";
import { characterForUnit } from "@/lib/characters";
import { cancelSpeech, speak } from "@/lib/speech";
import type { Guidebook } from "@/lib/types";

/** Hero figure size. The reference draws it around 170px wide. */
const CHARACTER_SIZE = 170;

/** Blue section label above each list, e.g. "KEY PHRASES". */
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-sm font-extrabold uppercase tracking-[1px] text-duo-blue">
      {children}
    </p>
  );
}

/**
 * One phrase card.
 *
 * Hugs its text rather than filling the column — in the reference a short phrase
 * makes a short card. The whole card is the play button, so the icon stays a
 * plain `<SpeakerIcon>`; nesting a button inside a button isn't valid HTML.
 */
function PhraseCard({ text }: { text: string }) {
  return (
    <button
      type="button"
      aria-label={`Play audio: ${text}`}
      onClick={() => speak(text)}
      className="relative flex w-fit max-w-full items-center gap-3 rounded-xl border-2 border-duo-border px-4 py-3 text-left transition-colors hover:bg-duo-card"
    >
      <SpeakerIcon className="h-6 w-6 shrink-0 text-duo-blue" />
      {/* Duolingo dots the phrase to hint that it can be inspected. */}
      <span className="border-b border-dotted border-duo-border pb-0.5 text-[17px] font-medium text-duo-text">
        {text}
      </span>
    </button>
  );
}

export default function GuidebookPage() {
  const params = useParams<{ unitId: string }>();
  const unitId = Number(params.unitId);

  const [book, setBook] = useState<Guidebook | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Don't let a phrase keep talking after navigating away.
  useEffect(() => cancelSpeech, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const next = await api.guidebook(unitId);
        if (!cancelled) setBook(next);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Couldn't load the guidebook",
          );
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [unitId]);

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

  if (!book) {
    return (
      <RailLayout rail={<RightRail />}>
        <div className="pt-6">
          {back}
          <div className="h-40 animate-pulse rounded-2xl bg-duo-card" />
        </div>
      </RailLayout>
    );
  }

  // The same figure that stands beside this unit on the path, so the guidebook
  // reads as belonging to it. Derived from the unit index, exactly as there.
  const character = characterForUnit(book.unit_number - 1);

  return (
    <RailLayout rail={<RightRail />}>
      <div className="pt-6">
        {back}

        <hr className="border-t-2 border-duo-border" />

        {/* Hero: character beside the title */}
        <header className="flex items-center gap-6 py-6">
          <div
            className="shrink-0"
            style={{ width: CHARACTER_SIZE, height: CHARACTER_SIZE }}
            aria-hidden="true"
          >
            <AnimatedCharacter
              variant={character.name}
              size={CHARACTER_SIZE}
              // A guidebook is the unit's reading material, so its character
              // reads along; clicking still celebrates.
              mood="reading"
              interactive
            />
          </div>
          <div className="min-w-0">
            <h1 className="text-[28px] leading-tight">
              Unit {book.unit_number} Guidebook
            </h1>
            <p className="mt-2 text-[17px] font-medium text-duo-body">
              Explore grammar tips and key phrases for this unit
            </p>
          </div>
        </header>

        <hr className="border-t-2 border-duo-border" />

        <section className="pt-6">
          <SectionLabel>Key phrases</SectionLabel>
          <h2 className="mt-2 text-[25px] leading-tight">{book.topic}</h2>

          <div className="mt-6 flex flex-col gap-3 pb-10">
            {book.key_phrases.map((phrase) => (
              <PhraseCard key={phrase} text={phrase} />
            ))}
          </div>
        </section>
      </div>
    </RailLayout>
  );
}
