"use client";

import HoverCard from "@/components/rail/HoverCard";
import StatPill from "@/components/rail/StatPill";
import {
  CoursesPopover,
  GemsPopover,
  HeartsPopover,
  STREAK_HEADER_CLASS,
  StreakPopover,
} from "@/components/rail/StatPopovers";
import DuoAsset from "@/components/shared/duoAssets";
import type { UserProfile } from "@/lib/types";

/**
 * The stats strip at the top of the rail.
 *
 * Order is fixed by CLAUDE.md §8 — flag (course) → streak → gems → hearts —
 * which is also what the reference markup does. Each value takes its icon's
 * colour, as in the real UI.
 *
 * Every tile opens a card on hover; the cards live in `StatPopovers`, so this
 * component stays a row of four triggers. The outer tiles align their cards
 * inwards so neither runs off the edge of the 368px rail.
 */
export default function StatsRow({
  user,
  onRefillHearts,
}: {
  user: UserProfile;
  /** Instant heart refill, owned by the rail so the profile can refresh after. */
  onRefillHearts: () => void;
}) {
  return (
    <div className="mb-2 flex items-center justify-between">
      <HoverCard label="Your courses" align="left" trigger={
        <StatPill
          icon={<DuoAsset name="flag" />}
          value={user.xp_total}
          label="Total XP"
          valueClassName="text-duo-text text-base"
        />
      }>
        <CoursesPopover />
      </HoverCard>

      {/* The streak card's top band is amber, so its pointer matches it. */}
      <HoverCard label="Your streak" caretClassName={STREAK_HEADER_CLASS} trigger={
        <StatPill
          icon={<DuoAsset name="streak" />}
          value={user.streak_count}
          label="Day streak"
          valueClassName="text-duo-streak"
        />
      }>
        <StreakPopover user={user} />
      </HoverCard>

      <HoverCard label="Your gems" trigger={
        <StatPill
          icon={<DuoAsset name="gem" />}
          value={user.gems}
          label="Gems"
          valueClassName="text-duo-gemText"
          target="gems"
        />
      }>
        <GemsPopover user={user} />
      </HoverCard>

      <HoverCard label="Your hearts" align="right" trigger={
        <StatPill
          icon={<DuoAsset name="heart" />}
          value={user.hearts}
          label={`Hearts out of ${user.max_hearts}`}
          valueClassName="text-duo-heartText"
        />
      }>
        <HeartsPopover user={user} onRefill={onRefillHearts} />
      </HoverCard>
    </div>
  );
}
