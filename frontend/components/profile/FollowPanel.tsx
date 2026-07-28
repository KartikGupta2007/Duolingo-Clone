"use client";

import { useState } from "react";

import AnimatedCharacter from "@/components/characters/AnimatedCharacter";
import type { CharacterName } from "@/lib/characters";

/**
 * The FOLLOWING / FOLLOWERS panel on the profile's rail.
 *
 * Both tabs show the same connect prompt: social features are out of scope, so
 * there are no lists to render — this is the reference's own empty state. The
 * tabs still switch (and are real tabs to assistive tech) for fidelity.
 */
const TABS = ["Following", "Followers"] as const;

/**
 * The crowd illustration, composed from the path's own character artwork.
 *
 * The reference draws a lineup of Duolingo characters here; these files are
 * that artwork, already shipped for the path. Each SVG is a square canvas in
 * which the figure occupies only ~a third of the width (see lib/characters.ts),
 * so the boxes overlap heavily to bring the *figures* shoulder to shoulder.
 */
const CROWD: CharacterName[] = [
  "painter",
  "phone",
  "karate",
  "athlete",
  "bear",
  "cook-orange",
];
// 100 + 5 x (100 - 56) = 320px, which exactly fits the panel's inner width —
// the boxes are mostly transparent margin, so they may NOT be clipped, and an
// overflowing row was cropping the outer figures.
const CROWD_BOX = 100;
const CROWD_OVERLAP = -56;

export default function FollowPanel() {
  const [active, setActive] = useState<(typeof TABS)[number]>("Following");

  return (
    <section className="rounded-2xl border-2 border-duo-border">
      <div role="tablist" className="flex border-b-2 border-duo-border">
        {TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            role="tab"
            aria-selected={tab === active}
            onClick={() => setActive(tab)}
            className={[
              "-mb-[2px] flex-1 border-b-2 py-3.5 text-[15px] font-bold uppercase tracking-[0.8px] transition-colors",
              tab === active
                ? "border-duo-blue text-duo-blue"
                : "border-transparent text-duo-text hover:text-duo-blue",
            ].join(" ")}
          >
            {tab}
          </button>
        ))}
      </div>

      {active === "Followers" ? (
        // The reference's followers tab is a bare sentence, not the crowd.
        <p
          role="tabpanel"
          className="py-16 text-center text-[19px] font-medium text-duo-body"
        >
          No followers yet
        </p>
      ) : (
      <div role="tabpanel" className="px-3 pb-7 pt-5 text-center">
        <div aria-hidden="true">
          <div className="flex items-end justify-center">
            {CROWD.map((name, index) => (
              // Each figure keeps its own idle rhythm and blink clock (the
              // per-character delays in lib/characters.ts stagger them), so
              // the crowd reads as alive rather than choreographed.
              <AnimatedCharacter
                key={name}
                variant={name}
                size={CROWD_BOX}
                className="pointer-events-none shrink-0"
                style={{ marginLeft: index === 0 ? 0 : CROWD_OVERLAP }}
              />
            ))}
          </div>
          {/* The grey floor the reference stands them on. */}
          <div className="mx-auto -mt-2 h-1.5 w-[86%] rounded-full bg-duo-border" />
        </div>

        <p className="mx-auto mt-5 max-w-[290px] px-3 text-[17px] font-medium leading-6 text-duo-body">
          Learning is more fun and effective when you connect with others.
        </p>
      </div>
      )}
    </section>
  );
}
