"use client";

import DuoAsset from "@/components/shared/duoAssets";
import { useStatusEmoji } from "@/lib/status";
import type { LeaderboardEntry } from "@/lib/types";

/**
 * One row of the league table.
 *
 * Built to computed styles captured from the reference page (class names
 * below are from that capture):
 *
 *   row (.s54)        64px tall, 8px/24px/8px/16px padding, 16px radius
 *   your row (.s76)   the same, filled #202f36
 *   rank (.s67/.s90)  17px / 700 — #79b933 in the zone, #f1f7fb below it
 *   avatar (.s77)     48x48, 12px in from the rank, 28px before the name
 *   circle (.s78)     50% radius, 22.08px / 700 initial
 *   name (.s84)       17px / 700, left aligned
 *   XP (.s73/.s85)    17px / 500, right aligned, 10px from the edge
 *
 * Two details worth naming. The rank numeral is **not** the bright #58CC02 — the
 * capture uses a muted #79b933. It marks the **promotion zone**, not the learner:
 * the screenshots show 10th green and 16th white, and the capture's two samples
 * (a green one, a white one) both sit on the right side of that line. And avatars
 * carry **dark** text on a bright fill (`.s86` is #ffab33 on #131f24), not white
 * on colour.
 */

/** The reference's muted leaderboard green. Distinct from the path's #58CC02. */
const LEAGUE_GREEN = "#79B933";

/**
 * Avatar fill, picked from the name.
 *
 * The capture shows competitors on different bright fills (#ffab33, #49c0f8 …)
 * with dark text. There's no avatar colour to read — §4 stores name and XP only —
 * so it's hashed from the name: stable across reloads, and rarely collides.
 */
const AVATAR_FILLS = [
  "#FFAB33",
  "#49C0F8",
  "#FF4B4B",
  "#58CC02",
  "#CE82FF",
  "#FF86D0",
  "#00CD9C",
  "#FFC800",
];

function avatarFill(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) {
    hash = (hash * 31 + name.charCodeAt(i)) % 100_000;
  }
  return AVATAR_FILLS[hash % AVATAR_FILLS.length];
}

/** Ranks 1-3 wear the reference's gold / silver / bronze medal. */
const MEDALS = ["medalGold", "medalSilver", "medalBronze"] as const;

export default function LeaderboardRow({
  entry,
  /** Ranks at or above this are in the promotion zone, and numbered in green. */
  promotionRank,
}: {
  entry: LeaderboardEntry;
  promotionRank: number;
}) {
  const you = entry.is_current_user;
  const promoted = entry.rank <= promotionRank;
  const { status } = useStatusEmoji();

  return (
    <li>
      <div
        className={[
          "flex h-16 items-center rounded-2xl py-2 pl-4 pr-6",
          you ? "bg-duo-greenSoft" : "",
        ].join(" ")}
      >
        {/* Rank, or a medal for the podium. */}
        <span className="flex w-[41px] shrink-0 justify-center">
          {entry.rank <= 3 ? (
            <DuoAsset name={MEDALS[entry.rank - 1]} height={42} />
          ) : (
            <span
              className="text-[17px] font-bold leading-5"
              style={{ color: promoted ? LEAGUE_GREEN : "#F1F7FB" }}
            >
              {entry.rank}
            </span>
          )}
        </span>

        {/* .s77 — 48px avatar, 12px in, 28px before the name. */}
        <span className="relative ml-3 mr-7 h-12 w-12 shrink-0">
          {/* Your own avatar is the dashed ring, not a filled disc — the same
              treatment as the sidebar's Profile row and the status picker, which
              is how the reference marks it as yours. `.s78` in the capture has no
              fill, matching that; everyone else gets a bright disc with dark
              text (`.s86` is #ffab33 on #131f24). */}
          {you ? (
            <span
              className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-dashed text-[22.08px] font-bold"
              style={{ borderColor: LEAGUE_GREEN, color: "#D3E3C3" }}
            >
              {entry.name.slice(0, 1).toUpperCase()}
            </span>
          ) : (
            <span
              className="flex h-12 w-12 items-center justify-center rounded-full text-[22.08px] font-bold"
              style={{ backgroundColor: avatarFill(entry.name), color: "#131F24" }}
            >
              {entry.name.slice(0, 1).toUpperCase()}
            </span>
          )}

          {/* Your chosen status, in the same lopsided bubble as the picker's —
              .s81, 28px, white, bordered in the row's own fill. */}
          {you && status && (
            <span className="absolute -right-2 -top-2 grid h-7 w-7 place-items-center overflow-hidden rounded-[50%_50%_50%_16%] border-2 border-duo-greenSoft bg-white">
              <DuoAsset name={status} height={24} />
            </span>
          )}

          {/* The screenshots show a presence dot on every competitor. There's no
              presence to read, so it's decorative and left off your own avatar,
              whose bubble and fill already mark it as yours. */}
          {!you && (
            <span
              aria-hidden="true"
              className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-duo-bg bg-duo-green"
            />
          )}
        </span>

        <span
          className="min-w-0 flex-1 truncate text-left text-[17px] font-bold leading-5"
          style={{ color: you ? LEAGUE_GREEN : "#F1F7FB" }}
        >
          {entry.name}
        </span>

        <span
          className="mr-2.5 shrink-0 text-right text-[17px] font-medium leading-5"
          style={{ color: you ? LEAGUE_GREEN : "#DCE6EC" }}
        >
          {entry.xp_total} XP
        </span>
      </div>
    </li>
  );
}
