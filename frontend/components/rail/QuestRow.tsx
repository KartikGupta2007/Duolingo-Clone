import QuestProgressBar from "@/components/rail/QuestProgressBar";
import DuoAsset, { type DuoAssetName } from "@/components/shared/duoAssets";
import type { Quest, QuestKind } from "@/lib/rail";

/**
 * One quest: artwork, label, progress bar.
 *
 * Artwork is looked up from `quest.kind`, so adding a new quest type means adding
 * an entry here rather than editing the rendering logic. The bolt is the
 * reference's own `images/goals` asset rather than a drawn substitute.
 */
const QUEST_ARTWORK: Record<QuestKind, DuoAssetName> = {
  xp: "questBolt",
};

export default function QuestRow({ quest }: { quest: Quest }) {
  return (
    <div className="flex items-center py-5">
      <span className="mr-[22px] flex shrink-0 items-center">
        <DuoAsset name={QUEST_ARTWORK[quest.kind]} height={40} />
      </span>

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <p className="text-[17px] font-bold leading-6 text-duo-text">
          {quest.label}
        </p>
        <QuestProgressBar
          current={quest.current}
          target={quest.target}
          label={quest.label}
        />
      </div>
    </div>
  );
}
