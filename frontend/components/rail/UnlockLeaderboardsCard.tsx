import RailCard from "@/components/rail/RailCard";
import RailHeading from "@/components/rail/RailHeading";
import DuoAsset from "@/components/shared/duoAssets";

/**
 * Shown while the leaderboard is still gated.
 *
 * The lesson count is real — the backend decides the gate and reports how many
 * lessons are done — so the copy changes as the learner advances and the card
 * disappears once it's earned.
 */
export default function UnlockLeaderboardsCard({
  lessonsRemaining,
}: {
  lessonsRemaining: number;
}) {
  const lessonWord = lessonsRemaining === 1 ? "lesson" : "lessons";

  return (
    <RailCard>
      <RailHeading className="mb-6">Unlock Leaderboards!</RailHeading>

      {/* Reference uses a 82px icon column with the copy beside it. */}
      <div className="grid grid-cols-[82px_1fr] items-center">
        <DuoAsset name="leagueLocked" height={56} />
        <p className="pl-2 text-[17px] font-medium leading-[25px] text-duo-body">
          Complete {lessonsRemaining} more {lessonWord} to start competing
        </p>
      </div>
    </RailCard>
  );
}
