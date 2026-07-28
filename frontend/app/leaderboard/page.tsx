"use client";

import Link from "next/link";
import { Fragment, useEffect, useState } from "react";

import RailLayout from "@/components/layout/RailLayout";
import LeaderboardRow from "@/components/leaderboard/LeaderboardRow";
import StatsRow from "@/components/rail/StatsRow";
import StatusCard from "@/components/rail/StatusCard";
import DuoAsset from "@/components/shared/duoAssets";
import DuoButton from "@/components/shared/DuoButton";
import { useUser } from "@/components/shared/UserProvider";
import { ApiError, api } from "@/lib/api";
import type { Leaderboard } from "@/lib/types";

/**
 * The league table.
 *
 * Laid out to the reference: the tier shields, the league name, how many advance
 * and how long is left, then the ranked rows with a PROMOTION ZONE divider under
 * the cut-off.
 *
 * Everything in the header is server-derived rather than decorative — the league
 * name, the number who advance and the days remaining all come from
 * `/api/leaderboard`, so the divider can't disagree with the copy above it.
 */

/** The rail here is the stats strip plus the status picker, not the path's cards. */
function LeaderboardRail({ onRefillHearts }: { onRefillHearts: () => void }) {
  const { user } = useUser();
  return (
    <>
      {user && <StatsRow user={user} onRefillHearts={onRefillHearts} />}
      <StatusCard />
    </>
  );
}

/**
 * The tier strip.
 *
 * Ten tiers, per the capture's `grid-template-columns: 80px 52px x9` with a 28px
 * gap — the one you're in, then nine locked ones — laid out in an 828px row that
 * is absolutely positioned inside a 592px column with `overflow: hidden`.
 *
 * The offset is the part that matters: the row sits so the **active tier is
 * centred in the column**, i.e. `left: 50% - 40px`. Everything after it runs off
 * the right edge, and the arithmetic lands the 4th locked tier at x=604 in a
 * 592px column — which is exactly why the reference shows the bronze shield plus
 * precisely three locked ones and no more. Left-aligning the row instead shows
 * seven, which is what gave it away.
 */
const LOCKED_TIERS = 9;
const ACTIVE_TIER_WIDTH = 80;

function TierStrip() {
  return (
    <div className="relative h-[91px] overflow-hidden">
      <div
        className="absolute top-0 flex h-full items-center gap-7"
        style={{ left: `calc(50% - ${ACTIVE_TIER_WIDTH / 2}px)` }}
      >
        <DuoAsset name="leagueBronze" />
        {Array.from({ length: LOCKED_TIERS }, (_, i) => (
          <DuoAsset key={i} name="leagueTierLocked" />
        ))}
      </div>
    </div>
  );
}

export default function LeaderboardPage() {
  const { user, refresh } = useUser();
  const [board, setBoard] = useState<Leaderboard | null>(null);
  const [error, setError] = useState<string | null>(null);
  // The backend answers 423 until enough lessons are done; that's a distinct
  // state, not a failure, so it gets its own screen.
  const [locked, setLocked] = useState(false);

  const load = async () => {
    try {
      setError(null);
      setLocked(false);
      setBoard(await api.leaderboard());
    } catch (err) {
      if (err instanceof ApiError && err.status === 423) {
        setLocked(true);
        return;
      }
      setError(
        err instanceof Error ? err.message : "Failed to load the leaderboard",
      );
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const refillHearts = async () => {
    await api.refillHearts();
    await refresh();
  };

  const rail = <LeaderboardRail onRefillHearts={() => void refillHearts()} />;

  if (locked) {
    const required = user?.leaderboard_unlock_lessons ?? 2;
    const remaining = Math.max(0, required - (user?.lessons_completed ?? 0));

    return (
      <RailLayout rail={rail}>
        <div className="mt-6 rounded-2xl border-2 border-duo-border p-8 text-center">
          <DuoAsset name="leagueLocked" height={80} className="mx-auto block" />
          <h1 className="mt-5 text-2xl">Unlock Leaderboards!</h1>
          <p className="mx-auto mt-3 max-w-sm text-[17px] leading-[25px] text-duo-body">
            Complete {remaining} more {remaining === 1 ? "lesson" : "lessons"} to
            start competing against other learners.
          </p>
          <Link href="/learn" className="mt-7 inline-block">
            <DuoButton size="lg">Back to learning</DuoButton>
          </Link>
        </div>
      </RailLayout>
    );
  }

  if (error) {
    return (
      <RailLayout rail={rail}>
        <div className="duo-panel mt-6 p-6 text-center">
          <h1 className="mb-2 text-xl">Couldn&apos;t load the leaderboard</h1>
          <p className="mb-5 text-sm text-duo-muted">{error}</p>
          <DuoButton onClick={() => void load()}>Try again</DuoButton>
        </div>
      </RailLayout>
    );
  }

  return (
    <RailLayout rail={rail}>
      {/* .s41 — the whole header, 24px in from the top and centred. */}
      <div className="pt-6 text-center">
        <TierStrip />

        {/* .s47 — 25px/700, 24 above and 20 below. */}
        <h1 className="mb-5 mt-6 text-[25px] font-bold leading-5">
          {board ? `${board.league} League` : "League"}
        </h1>

        {board && (
          <>
            {/* .s48 — 19px/500 in #dce6ec. */}
            <p className="mb-[5px] px-3 text-[19px] font-medium leading-5 text-duo-body">
              Top {board.promotion_rank} advance to the next league
            </p>
            {/* .s50 — 17px/500 in #ffc700. */}
            <p className="mb-4 text-[17px] font-medium leading-5 text-duo-quest">
              {board.days_remaining === 0
                ? "Last day"
                : `${board.days_remaining} ${
                    board.days_remaining === 1 ? "day" : "days"
                  }`}
            </p>
          </>
        )}

        <div className="border-t-2 border-duo-border pt-2 text-left">
          {!board ? (
            <ul className="space-y-2">
              {[0, 1, 2, 3, 4].map((index) => (
                <li
                  key={index}
                  className="h-[68px] animate-pulse rounded-2xl bg-duo-card"
                />
              ))}
            </ul>
          ) : (
            <ol className="space-y-1">
              {board.entries.map((entry, index) => (
                // A Fragment, not a wrapping <li>: LeaderboardRow *is* the <li>,
                // and nesting one inside another is invalid HTML and breaks
                // hydration. The divider is its own list item instead.
                <Fragment key={entry.user_id}>
                  <LeaderboardRow
                    entry={entry}
                    promotionRank={board.promotion_rank}
                  />
                  {/* Sits *after* the last promoted rank, and only when somebody
                      is actually below it. */}
                  {entry.rank === board.promotion_rank &&
                    index < board.entries.length - 1 && (
                      // .s88 — 15px/700 uppercase with 0.8px tracking, 15px of
                      // padding above and below, and a 24px arrow 15px either
                      // side of the label.
                      <li className="mb-2.5 flex items-center justify-center py-[15px] text-[15px] font-bold uppercase leading-5 tracking-[0.8px] text-[#79B933]">
                        <DuoAsset name="promoArrow" className="mx-[15px] block" />
                        Promotion zone
                        <DuoAsset name="promoArrow" className="mx-[15px] block" />
                      </li>
                    )}
                </Fragment>
              ))}
            </ol>
          )}
        </div>
      </div>
    </RailLayout>
  );
}
