"use client";

import DuoAsset from "@/components/shared/duoAssets";
import { useUser } from "@/components/shared/UserProvider";
import { STATUS_TILES, useStatusEmoji } from "@/lib/status";

/**
 * "Set your status" — the emoji pinned to your leaderboard avatar.
 *
 * Built to computed styles captured from the reference page (`.s20`-`.s34`
 * below are that capture's class names):
 *
 *   card (.s20)     368 wide, 20px padding, 2px #37464f border, 16px radius
 *   header (.s21)   space-between, 15px below
 *   heading (.s22)  19px / 700
 *   CLEAR (.s23)    15px / 700 uppercase, 0.8px tracking, #49c0f8
 *   avatar (.s27)   80x80, 2px dashed #52656d, 36.8px initial
 *   bubble (.s28)   46x46, white, 2px #37464f, radius 50% 50% 50% 16%
 *   rows (.s32)     grid of six 48px columns, 8px gap
 *
 * The tiles are the reference's own artwork rather than text emoji — two of the
 * twelve are Duo's face, which no emoji substitutes for. The sixth is the course
 * flag reused, which is why the asset numbering skips 06.
 *
 * Where the choice is kept, and why it isn't on the server, is in `lib/status.ts`.
 */
export default function StatusCard() {
  const { user } = useUser();
  const { status, setStatus } = useStatusEmoji();

  const initial = user?.name?.[0]?.toUpperCase() ?? "?";

  return (
    // .s20 — 20px padding all round, and the rail is 368 wide, so the inner
    // column comes out at the captured 328.
    <section className="rounded-2xl border-2 border-duo-border p-5">
      <div className="mb-[15px] flex items-center justify-between">
        <h2 className="text-[19px] font-bold leading-7 text-duo-text">
          Set your status
        </h2>
        <button
          type="button"
          onClick={() => setStatus(null)}
          className="text-[15px] font-bold uppercase leading-[18px] tracking-[0.8px] text-duo-link transition-opacity hover:opacity-80"
        >
          Clear
        </button>
      </div>

      {/* .s26 — the 80px avatar, centred in the 328px column, 22px above the
          first tile row. */}
      <div className="relative mx-auto mb-[22px] h-20 w-20">
        <span className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-dashed border-duo-footer text-[36.8px] font-bold text-duo-footer">
          {initial}
        </span>
        {/* .s28 — the speech bubble. Its one square-ish corner is what points it
            back at the avatar, so the radius is deliberately lopsided. */}
        <span className="absolute -right-4 -top-3 grid h-[46px] w-[46px] place-items-center overflow-hidden rounded-[50%_50%_50%_16%] border-2 border-duo-border bg-white">
          {status ? (
            <DuoAsset name={status} height={40} />
          ) : (
            <DuoAsset name="statusEmpty" height={30} />
          )}
        </span>
      </div>

      {/* .s32 — six 48px columns, 8px gap. Two rows of six. */}
      <div className="grid grid-cols-6 gap-2">
        {STATUS_TILES.map((tile) => (
          <button
            key={tile}
            type="button"
            onClick={() => setStatus(tile === status ? null : tile)}
            aria-pressed={tile === status}
            aria-label={`Set status ${STATUS_TILES.indexOf(tile) + 1} of ${STATUS_TILES.length}`}
            className={[
              "grid h-12 w-12 place-items-center rounded-xl border-2 transition-colors",
              tile === status
                ? "border-duo-blue bg-duo-blue/10"
                : "border-duo-border hover:bg-duo-card",
            ].join(" ")}
          >
            <DuoAsset name={tile} height={tile === "flag" ? 25 : 34} />
          </button>
        ))}
      </div>
    </section>
  );
}
