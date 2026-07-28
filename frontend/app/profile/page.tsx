"use client";

import { useEffect, useState } from "react";

import RailLayout from "@/components/layout/RailLayout";
import AddFriendsPanel from "@/components/profile/AddFriendsPanel";
import FollowPanel from "@/components/profile/FollowPanel";
import RailFooter from "@/components/rail/RailFooter";
import StatsRow from "@/components/rail/StatsRow";
import DuoAsset from "@/components/shared/duoAssets";
import DuoButton from "@/components/shared/DuoButton";
import { useToast } from "@/components/shared/ToastProvider";
import { useUser } from "@/components/shared/UserProvider";
import { api } from "@/lib/api";

/**
 * The profile page, laid out to the reference: avatar banner, identity block,
 * the LinkedIn promo, then the statistics grid. Its rail differs from the other
 * pages' — Following/Followers and Add friends instead of quests and Super.
 *
 * Everything shown is real state from /api/user/me except three documented
 * stand-ins: the join date (nothing stores one — the seeded account began July
 * 2026, so the line matches reality but is a constant), the league week
 * (always "WEEK 1", because promotions and weekly history aren't implemented),
 * and Top 3 finishes (always 0, same reason).
 */

/** See the note above — the seeded account's real creation month. */
const JOINED = "July 2026";

/** Persists the LinkedIn card's dismissal, like the reference does. */
const LINKEDIN_DISMISSED_KEY = "duo-clone:linkedin-dismissed";

/**
 * The add-a-photo placeholder in the banner, matching the reference: a fluffy
 * head-and-shoulders silhouette with a hand-drawn dashed outline, cut off by
 * the banner's bottom edge.
 *
 * The fluff is a union of circles rather than one authored path, and the
 * outline trick depends on paint order: the dashed strokes are drawn first on
 * *enlarged* copies of the same circles, then the solid silhouette is painted
 * over them — the fill swallows every interior stroke, leaving only the outer
 * arcs, which reads as one loose dashed contour around the whole blob.
 */
function AvatarPlaceholder({ className = "" }: { className?: string }) {
  const FILL = "#4E7A99";
  // cx, cy, r for the fluff; the outline copies grow by OUTLINE_GAP.
  const blob: [number, number, number][] = [
    [100, 105, 52], // skull
    [66, 62, 20], // top-left tuft
    [100, 50, 22], // top tuft
    [134, 62, 20], // top-right tuft
    [52, 88, 16], // left tuft
    [148, 88, 16], // right tuft
    [38, 121, 12], // left ear
    [162, 121, 12], // right ear
  ];
  const OUTLINE_GAP = 9;

  return (
    <svg viewBox="0 0 200 186" className={className} aria-hidden="true">
      <g
        fill="none"
        stroke="#4FC3F8"
        strokeWidth="4"
        strokeLinecap="round"
        strokeDasharray="9 9"
      >
        {blob.map(([cx, cy, r], index) => (
          <circle key={index} cx={cx} cy={cy} r={r + OUTLINE_GAP} />
        ))}
        {/* Neck outline, running off the bottom edge like the reference's. */}
        <path d="M76 150v40M124 150v40" />
      </g>

      <g fill={FILL}>
        {blob.map(([cx, cy, r], index) => (
          <circle key={index} cx={cx} cy={cy} r={r} />
        ))}
        {/* Neck, continuing past the viewBox so the banner clips it. */}
        <path d="M80 130h40v56H80Z" />
      </g>

      {/* The add-a-photo plus, centred on the face. */}
      <path
        d="M100 92v40M80 112h40"
        stroke="#132430"
        strokeWidth="9"
        strokeLinecap="round"
      />
    </svg>
  );
}

function PencilIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        fill="currentColor"
        d="M16.1 3.6a2.4 2.4 0 0 1 3.4 0l.9.9a2.4 2.4 0 0 1 0 3.4L9.6 18.7l-5.3 1 1-5.3L16.1 3.6Zm-1.2 3 2.5 2.5 1.3-1.3a.9.9 0 0 0 0-1.3l-1.2-1.2a.9.9 0 0 0-1.3 0l-1.3 1.3Z"
      />
    </svg>
  );
}

/** Duo peeking out from behind a LinkedIn tile, for the promo card. */
function LinkedInArt({ className = "" }: { className?: string }) {
  return (
    <div className={`relative overflow-hidden ${className}`} aria-hidden="true">
      {/* Duo, oversized so his ink (not his transparent canvas) fills the slot —
          same measured-offsets trick as the quests banner. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/characters/duo-stand.svg"
        alt=""
        className="absolute max-w-none"
        style={{ width: 210, height: 210, left: -8, top: -62 }}
      />
      <div className="absolute left-0 top-6 grid h-14 w-14 place-items-center rounded-xl bg-[#0A66C2] text-[26px] font-extrabold text-white">
        in
      </div>
      <span className="absolute right-1 top-2 text-[13px] text-white/90">✦</span>
      <span className="absolute left-16 top-0 text-[10px] text-white/70">✦</span>
    </div>
  );
}

export default function ProfilePage() {
  const { user, loading, error, refresh } = useUser();
  const { showUnimplemented } = useToast();

  // The current-league card. Fetched only once the gate is open — before that
  // the endpoint answers 423 by design, and the card shows "None", which is
  // what the reference does for a learner not yet in a league.
  const [league, setLeague] = useState<string | null>(null);
  useEffect(() => {
    if (!user?.leaderboard_unlocked) return;
    let cancelled = false;
    api
      .leaderboard()
      .then((board) => {
        if (!cancelled) setLeague(board.league);
      })
      .catch(() => {
        // Locked or unreachable — the card simply keeps showing "None".
      });
    return () => {
      cancelled = true;
    };
  }, [user?.leaderboard_unlocked]);

  // Visible-first: most users never dismissed it, and reading localStorage
  // during render would break hydration.
  const [linkedInDismissed, setLinkedInDismissed] = useState(false);
  useEffect(() => {
    setLinkedInDismissed(
      window.localStorage.getItem(LINKEDIN_DISMISSED_KEY) === "1",
    );
  }, []);
  const dismissLinkedIn = () => {
    setLinkedInDismissed(true);
    window.localStorage.setItem(LINKEDIN_DISMISSED_KEY, "1");
  };

  const refillHearts = async () => {
    await api.refillHearts();
    await refresh();
  };

  const rail = (
    <>
      {user && <StatsRow user={user} onRefillHearts={() => void refillHearts()} />}
      <FollowPanel />
      <AddFriendsPanel />
      <RailFooter onSelect={(label) => showUnimplemented(label)} />
    </>
  );

  if (loading && !user) {
    return (
      <RailLayout rail={rail}>
        <div className="pt-6">
          <div className="h-60 animate-pulse rounded-2xl bg-duo-card" />
        </div>
      </RailLayout>
    );
  }

  if (error || !user) {
    return (
      <RailLayout rail={rail}>
        <div className="duo-panel mt-6 p-6 text-center">
          <h1 className="mb-2 text-xl">Couldn&apos;t load your profile</h1>
          <p className="mb-5 text-sm text-duo-muted">{error ?? "Unknown error"}</p>
          <DuoButton onClick={() => void refresh()}>Try again</DuoButton>
        </div>
      </RailLayout>
    );
  }

  // No separate username is stored (single mock user). The reference's handles
  // are name-derived with a numeric tail, so this one is too — name plus join
  // year keeps it distinct from the display name without inventing state.
  const handle = `${user.name.replace(/\s+/g, "")}${JOINED.split(" ")[1]}`;

  const stats: {
    icon: React.ReactNode;
    value: string | number;
    label: string;
    badge?: string;
  }[] = [
    {
      icon: <DuoAsset name="streak" height={30} />,
      value: user.streak_count,
      label: "Day streak",
    },
    {
      icon: <DuoAsset name="questBolt" height={30} />,
      value: user.xp_total,
      label: "Total XP",
    },
    {
      icon: league ? (
        <DuoAsset name="leagueBronze" height={32} />
      ) : (
        <DuoAsset name="leagueTierLocked" height={32} />
      ),
      value: league ?? "None",
      label: "Current league",
      badge: league ? "Week 1" : undefined,
    },
    {
      // Greyed medal: there is no league history to count finishes from.
      icon: (
        <DuoAsset
          name="medalGold"
          height={30}
          className="block [filter:grayscale(1)_opacity(0.55)]"
        />
      ),
      value: 0,
      label: "Top 3 finishes",
    },
  ];

  return (
    <RailLayout rail={rail}>
      <div className="pt-6">
        {/* Avatar banner. */}
        <div className="relative flex h-60 items-end justify-center overflow-hidden rounded-2xl bg-duo-card">
          <AvatarPlaceholder className="h-[186px] w-[200px] translate-y-1" />
          <button
            type="button"
            aria-label="Edit profile"
            onClick={() => showUnimplemented("Editing your profile")}
            className="absolute right-4 top-4 grid h-11 w-11 place-items-center rounded-xl border-2 border-duo-border text-duo-text transition-colors hover:bg-duo-cardHover"
          >
            <PencilIcon />
          </button>
        </div>

        {/* Identity block. */}
        <div className="border-b-2 border-duo-border pb-6 pt-5">
          <h1 className="text-[25px] font-bold leading-tight">{user.name}</h1>
          <p className="mt-0.5 text-[17px] font-medium text-duo-footer">
            {handle}
          </p>
          <p className="mt-2 text-[15px] font-medium text-duo-muted">
            Joined {JOINED}
          </p>

          <div className="mt-3 flex items-end justify-between">
            {/* Zeros are the truth: social features aren't implemented. */}
            <p className="flex gap-6 text-[15px] font-bold text-duo-blue">
              <span>0 Following</span>
              <span>0 Followers</span>
            </p>
            <DuoAsset name="flag" height={30} />
          </div>
        </div>

        {/* LinkedIn promo, dismissable like the reference's. */}
        {!linkedInDismissed && (
          <div className="relative mt-6 flex items-center gap-4 rounded-2xl bg-duo-card p-6">
            <div className="min-w-0 flex-1">
              <h2 className="max-w-[300px] text-[22px] font-bold leading-7 text-duo-text">
                Add your Duolingo Score to LinkedIn!
              </h2>
              <button
                type="button"
                onClick={() => showUnimplemented("LinkedIn sharing")}
                className="mt-4 w-full rounded-2xl bg-duo-blue py-3 text-[15px] font-extrabold uppercase tracking-[0.8px] text-white shadow-[0_4px_0_#1899D6] transition-transform active:translate-y-[2px]"
              >
                Get started
              </button>
            </div>
            <LinkedInArt className="h-[120px] w-[150px] shrink-0" />
            <button
              type="button"
              aria-label="Dismiss"
              onClick={dismissLinkedIn}
              className="absolute right-4 top-3 text-[19px] font-bold text-duo-muted transition-colors hover:text-duo-text"
            >
              ✕
            </button>
          </div>
        )}

        {/* Statistics. */}
        <h2 className="mb-4 mt-8 text-[22px] font-bold leading-tight">
          Statistics
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="relative flex items-center gap-3 rounded-2xl border-2 border-duo-border p-4"
            >
              {stat.badge && (
                <span className="absolute -top-2.5 right-4 rounded-md bg-[#FF9600] px-2 py-0.5 text-[11px] font-extrabold uppercase tracking-[0.5px] text-[#3B2500]">
                  {stat.badge}
                </span>
              )}
              <span className="flex w-9 shrink-0 justify-center">{stat.icon}</span>
              <div className="min-w-0">
                <p className="text-[19px] font-bold leading-6 tabular-nums text-duo-text">
                  {stat.value}
                </p>
                <p className="text-[15px] font-medium leading-5 text-duo-muted">
                  {stat.label}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </RailLayout>
  );
}
