"use client";

import { useEffect, useRef, useState } from "react";

import RailLayout from "@/components/layout/RailLayout";
import ChestReward from "@/components/path/ChestReward";
import LazyUnit from "@/components/path/LazyUnit";
import UnitSkeleton, { DEFAULT_SKELETON } from "@/components/path/UnitSkeleton";
import ScrollToTopButton from "@/components/path/ScrollToTopButton";
import SectionEndCard from "@/components/path/SectionEndCard";
import SkillNode from "@/components/path/SkillNode";
import UnitBanner from "@/components/path/UnitBanner";
import UnitCharacter from "@/components/path/UnitCharacter";
import UnitSeparator from "@/components/path/UnitSeparator";
import RightRail from "@/components/rail/RightRail";
import DuoButton from "@/components/shared/DuoButton";
import { useToast } from "@/components/shared/ToastProvider";
import { useUser } from "@/components/shared/UserProvider";
import { useActiveUnit } from "@/hooks/useActiveUnit";
import { api } from "@/lib/api";
import {
  characterCentreTop,
  hasProgressRing,
  isClaimableChest,
} from "@/lib/pathGeometry";
import type { CoursePath, UnitData } from "@/lib/types";

/**
 * The seeded course is a single section of units, so the section number is a
 * constant rather than a column — see the README's assumptions. A second section
 * would mean giving Unit a section FK.
 */
const SECTION_NUMBER = 1;

export default function LearnPage() {
  const [path, setPath] = useState<CoursePath | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Which node's popover is open. Held here rather than inside SkillNode so
  // opening one node necessarily closes any other — there's only ever one.
  const [openSkillId, setOpenSkillId] = useState<number | null>(null);
  // Where the chest's gem is flying from and to, while it's in flight.
  const [gemFlight, setGemFlight] = useState<{
    from: { x: number; y: number };
    to: { x: number; y: number };
  } | null>(null);
  const { showUnimplemented } = useToast();
  const { refresh: refreshUser } = useUser();

  /** True while an open request is in flight, so a double-tap can't double-fire. */
  const openingChest = useRef(false);

  // One header bar for the whole path; this decides which unit it shows.
  const { registerSection, activeIndex } = useActiveUnit(path?.units.length ?? 0);

  const load = async () => {
    try {
      setError(null);
      setPath(await api.coursePath());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load the path");
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Collect a reached treasure chest, and fly its gem to the counter.
   *
   * Driven by a tap on the chest or its OPEN tag rather than happening on its
   * own: the OPEN tag is an invitation, and opening it should be the learner's
   * move. A chest becomes tappable under the ordinary unlock rule once the three
   * nodes before it are done, so "the first three lessons are finished" needs no
   * special case.
   *
   * Order matters: the server pays out first, then the path reloads so the OPEN
   * tag drops and the next node unlocks, then the gem flies, and only when it
   * lands does the user refresh — so the total ticks up as the gem arrives
   * rather than before it sets off.
   */
  const openChest = async (skillId: number) => {
    // Guard against a second tap while the first is still in the air.
    if (gemFlight || openingChest.current) return;
    openingChest.current = true;

    try {
      const opened = await api.openChest(skillId);
      if (!opened.claimed) return;

      setPath(await api.coursePath());

      // Re-query: that re-render replaces the node, so a handle taken before it
      // would now be detached and measure as zero.
      await new Promise((resolve) => requestAnimationFrame(() => resolve(null)));
      const node = document.querySelector(`[data-node-id="${skillId}"]`);
      const counter = document.querySelector('[data-stat-target="gems"]');
      if (!node || !counter) {
        await refreshUser();
        return;
      }

      const a = node.getBoundingClientRect();
      const b = counter.getBoundingClientRect();
      setGemFlight({
        from: { x: a.left + a.width / 2, y: a.top + a.height / 2 },
        to: { x: b.left + b.width / 2, y: b.top + b.height / 2 },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't open that chest");
    } finally {
      openingChest.current = false;
    }
  };

  /**
   * "JUMP HERE?" — unlock a unit the learner hasn't reached. The endpoint hands
   * back the refreshed path, so this is one round trip and no refetch.
   */
  const jumpToUnit = async (unitId: number) => {
    try {
      setPath(await api.jumpToUnit(unitId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't jump to that unit");
    }
  };

  if (error) {
    return (
      <RailLayout rail={<RightRail />}>
        <div className="duo-panel mx-auto mt-10 max-w-md p-6 text-center">
          <h1 className="mb-2 text-xl">Couldn&apos;t load your path</h1>
          <p className="mb-5 text-sm text-duo-muted">{error}</p>
          <DuoButton onClick={() => void load()}>Try again</DuoButton>
        </div>
      </RailLayout>
    );
  }

  if (!path) {
    // A mock of the real page — banner bar plus two skeleton units laid out by
    // the actual path geometry — so the loaded path appears *in place of* the
    // mock rather than reflowing it.
    return (
      <RailLayout rail={<RightRail />}>
        <div className="pt-6">
          <div className="h-[90px] animate-pulse rounded-[13px] bg-duo-card" />
          <UnitSkeleton nodes={DEFAULT_SKELETON} unitIndex={0} />
          <UnitSkeleton nodes={DEFAULT_SKELETON} unitIndex={1} />
        </div>
      </RailLayout>
    );
  }

  const activeUnit = path.units[activeIndex] ?? path.units[0];

  /**
   * Which nodes in a unit carry a pill.
   *
   * Each one needs the pill's extra clearance above it, and the character's
   * vertical placement depends on where they land, so both read it from here
   * rather than each working it out. Kept in step with SkillNode's own condition.
   */
  const pillIndices = (unit: UnitData): Set<number> => {
    // An unreached unit offers JUMP HERE on its first node and nothing else.
    if (unit.skills.every((skill) => skill.status === "locked")) return new Set([0]);
    const out = new Set<number>();
    unit.skills.forEach((skill, index) => {
      if (skill.id === path.current_skill_id || isClaimableChest(skill)) {
        out.add(index);
      }
    });
    return out;
  };

  return (
    <RailLayout rail={<RightRail />}>
      {/* The single header bar. The reference pins one 82px bar at the top and
          swaps its content as you scroll, rather than stacking a banner per
          unit — z-30 keeps it above the nodes that slide underneath. */}
      <div className="sticky top-0 z-30 bg-duo-bg pb-2 pt-6">
        <UnitBanner
          sectionNumber={SECTION_NUMBER}
          unitNumber={activeUnit.order_index + 1}
          title={activeUnit.title}
          // Follows the bar, so the button always opens the unit you're looking at.
          guidebookHref={`/guidebook/${activeUnit.id}`}
        />
      </div>

      {path.units.map((unit, unitIndex) => {
        // A unit the learner hasn't reached at all offers a jump on its first
        // node, rather than showing six locked circles.
        const isUnreached = unit.skills.every(
          (skill) => skill.status === "locked",
        );

        const pills = pillIndices(unit);
        // The exact shape this unit will occupy, so the placeholder reserves
        // the same pixels and the swap-in can't shift the scroll position.
        const skeleton = (
          <UnitSkeleton
            title={unit.title}
            unitIndex={unit.order_index}
            nodes={unit.skills.map((skill, index) => ({
              kind: skill.kind,
              ringed: hasProgressRing(skill),
              pill: pills.has(index),
            }))}
          />
        );

        const content = (
          <>
            <UnitSeparator title={unit.title} />

            {/* No `gap` here on purpose. Each node owns the margin above it,
                because the reference's spacing isn't uniform: node centres are a
                constant 89px apart, so the vertical margin shrinks as the
                sideways step grows. See lib/pathGeometry. */}
            <div className="relative flex flex-col items-center">
              {/* One character per unit, alternating sides down the path, centred
                  on the unit's third node as the reference does. */}
              <UnitCharacter
                unitIndex={unit.order_index}
                side={unit.order_index % 2 === 0 ? "left" : "right"}
                centreTop={characterCentreTop(unit.skills, pills)}
              />

              {unit.skills.map((skill, indexInUnit) => (
                <SkillNode
                  key={skill.id}
                  skill={skill}
                  indexInUnit={indexInUnit}
                  unitIndex={unit.order_index}
                  isLastInUnit={indexInUnit === unit.skills.length - 1}
                  isCurrent={skill.id === path.current_skill_id}
                  isJumpTarget={isUnreached && indexInUnit === 0}
                  onJump={() => void jumpToUnit(unit.id)}
                  onOpenChest={() => void openChest(skill.id)}
                  isOpen={openSkillId === skill.id}
                  onToggle={() =>
                    setOpenSkillId((current) =>
                      current === skill.id ? null : skill.id,
                    )
                  }
                  onClosePopover={() => setOpenSkillId(null)}
                />
              ))}
            </div>
          </>
        );

        return (
          <section
            key={unit.id}
            ref={registerSection(unitIndex)}
            data-unit={unit.order_index + 1}
          >
            {/* The first two units carry the initial viewport, so they mount
                eagerly; everything below defers until it nears the screen. */}
            {unitIndex < 2 ? (
              content
            ) : (
              <LazyUnit placeholder={skeleton}>{content}</LazyUnit>
            )}
          </section>
        );
      })}

      {gemFlight && (
        <ChestReward
          from={gemFlight.from}
          to={gemFlight.to}
          onArrive={() => {
            setGemFlight(null);
            void refreshUser();
          }}
        />
      )}

      <SectionEndCard
        nextSectionNumber={SECTION_NUMBER + 1}
        onContinue={() => showUnimplemented("Section 2")}
      />

      <ScrollToTopButton />
    </RailLayout>
  );
}
