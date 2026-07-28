"use client";

import RailCard from "@/components/rail/RailCard";
import RailHeading from "@/components/rail/RailHeading";
import RailLink from "@/components/rail/RailLink";
import QuestRow from "@/components/rail/QuestRow";
import type { Quest } from "@/lib/rail";

/**
 * Renders whatever quests it's handed — it has no opinion on how they're
 * derived, so the quest source can change without touching this card.
 */
export default function DailyQuestsCard({
  quests,
  /** Where VIEW ALL goes — the quests page. */
  viewAllHref,
}: {
  quests: Quest[];
  viewAllHref: string;
}) {
  if (quests.length === 0) return null;

  return (
    // Reference trims the bottom padding, since each quest row brings its own.
    <RailCard className="pb-2">
      <div className="mb-1 flex items-center justify-between">
        <RailHeading>Daily Quests</RailHeading>
        <RailLink href={viewAllHref}>View all</RailLink>
      </div>

      {quests.map((quest) => (
        <QuestRow key={quest.id} quest={quest} />
      ))}
    </RailCard>
  );
}
