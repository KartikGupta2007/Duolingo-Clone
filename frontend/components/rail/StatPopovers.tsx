"use client";

import Link from "next/link";

import {
  FriendStreakArt,
  GemPip,
  HeartPip,
  InfinityHeartIcon,
  OutlinedHeartIcon,
  StreakFlameArt,
} from "@/components/rail/popoverArt";
import DuoAsset from "@/components/shared/duoAssets";
import { HeartIcon, LockIcon } from "@/components/shared/icons";
import { useToast } from "@/components/shared/ToastProvider";
import { formatCountdown } from "@/lib/format";
import { deriveStreakWeek } from "@/lib/rail";
import type { UserProfile } from "@/lib/types";

/**
 * The four cards behind the rail's stat tiles, laid out to match the reference.
 *
 * Each shows real state — the course, the streak's actual days, the gem balance,
 * the heart bar and its refill countdown. The offers inside them are Super or
 * social features (unlimited hearts, friend streaks, streak society, extra
 * courses), which CLAUDE.md §10 puts out of scope, so those rows keep the
 * reference's copy and raise a toast rather than pretending to work.
 *
 * `REFILL_GEM_PRICE` is the reference's price, shown for fidelity. The refill
 * itself is free: §6 specifies a *mocked* instant refill, and charging for it
 * would lock the only escape from an empty heart bar behind a gem grind.
 */
export const REFILL_GEM_PRICE = 350;

/** The amber band behind the streak card's header, also used for its caret. */
export const STREAK_HEADER_CLASS = "bg-duo-streakSoft";

/** Section label inside a card, e.g. "MY COURSES". */
function CardLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="border-b-2 border-duo-border px-4 py-3 text-[13px] font-extrabold uppercase tracking-[1px] text-duo-muted">
      {children}
    </p>
  );
}

/** A tappable row inside a card — used for offers and links. */
function CardRow({
  icon,
  children,
  trailing,
  onClick,
  href,
}: {
  icon?: React.ReactNode;
  children: React.ReactNode;
  trailing?: React.ReactNode;
  onClick?: () => void;
  href?: string;
}) {
  const body = (
    <>
      {icon && <span className="flex shrink-0 items-center">{icon}</span>}
      <span className="min-w-0 flex-1">{children}</span>
      {trailing && <span className="shrink-0">{trailing}</span>}
    </>
  );
  const className =
    "flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-duo-card";

  if (href) {
    return (
      <Link href={href} className={className}>
        {body}
      </Link>
    );
  }
  return (
    <button type="button" onClick={onClick} className={className}>
      {body}
    </button>
  );
}

// ---------------------------------------------------------------------------
export function CoursesPopover() {
  const { showUnimplemented } = useToast();
  return (
    <div className="w-[320px]">
      <CardLabel>My courses</CardLabel>
      <div className="border-b-2 border-duo-border">
        <CardRow
          icon={<DuoAsset name="flag" height={34} />}
          href="/learn"
        >
          <span className="text-[19px] font-extrabold text-duo-blue">English</span>
        </CardRow>
      </div>
      <CardRow
        icon={
          <span className="grid h-[34px] w-[46px] place-items-center rounded-lg border-2 border-duo-border text-xl font-extrabold text-duo-muted">
            +
          </span>
        }
        onClick={() => showUnimplemented("Adding a course")}
      >
        <span className="text-[19px] font-extrabold text-duo-text">
          Add a new course
        </span>
      </CardRow>
    </div>
  );
}

// ---------------------------------------------------------------------------
/**
 * The streak card: amber header with the day count and the week, then the
 * Friend Streaks and Streak Society offers on the card's own dark background.
 */
export function StreakPopover({ user }: { user: UserProfile }) {
  const { showUnimplemented } = useToast();
  const week = deriveStreakWeek(user);

  return (
    <div className="w-[368px]">
      {/* Amber header. Bleeds to the card's edges — HoverCard's overflow-hidden
          rounds its top corners, so it needs no radius of its own. */}
      <div className={`${STREAK_HEADER_CLASS} px-5 pb-5 pt-4`}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-[26px] leading-tight text-white">
              {user.streak_count} day streak
            </h3>
            {/* The reference's line. It's true here by construction rather than
                by luck: §4's schema keeps only `streak_count`, so there is no
                record of a longer past run — the current streak is the longest
                one this app knows about. */}
            <p className="mt-1.5 text-[17px] font-bold leading-[23px] text-white">
              You&apos;ve earned your longest streak ever!
            </p>
          </div>
          <StreakFlameArt className="mt-0.5 h-[74px] w-[62px] shrink-0" />
        </div>

        {/* The week, with the streak's days ticked. */}
        <div className="mt-4 rounded-2xl bg-duo-bg px-3 py-3.5">
          <div className="grid grid-cols-7 items-center gap-x-1 text-center">
            {week.map((day) => (
              <span
                key={day.iso}
                className={`text-[17px] font-extrabold ${
                  day.isToday ? "text-duo-streak" : "text-duo-muted"
                }`}
              >
                {day.letter}
              </span>
            ))}
            {week.map((day) => (
              <span key={`dot-${day.iso}`} className="flex justify-center pt-2">
                <span
                  className={`grid h-[34px] w-[34px] place-items-center rounded-full ${
                    day.done ? "bg-duo-streak" : "bg-duo-border/60"
                  }`}
                >
                  {day.done && (
                    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
                      <path
                        fill="none"
                        stroke="#131F24"
                        strokeWidth="3.6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M4 12.5 9.5 18 20 7"
                      />
                    </svg>
                  )}
                </span>
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="p-4">
        {/* Friend Streaks: social, which §10 excludes — placeholder only. */}
        <div className="flex items-center gap-3 rounded-2xl bg-[#F04E23] p-3">
          <FriendStreakArt className="h-[104px] w-[98px] shrink-0" />
          <div className="min-w-0 flex-1">
            <h4 className="text-[19px] leading-tight text-white">
              Friend Streaks
            </h4>
            <p className="mt-1 text-[16px] font-bold text-white">
              0 active Friend Streaks
            </p>
            <button
              type="button"
              onClick={() => showUnimplemented("Friend Streaks")}
              className="mt-2.5 w-full rounded-xl bg-white py-2.5 text-[15px] font-extrabold uppercase tracking-[0.8px] text-[#F04E23] shadow-[0_3px_0_rgba(0,0,0,0.18)]"
            >
              View list
            </button>
          </div>
        </div>

        <div className="mt-3 flex items-center gap-3 rounded-2xl border-2 border-duo-border p-4">
          <LockIcon className="h-11 w-11 shrink-0 text-duo-border" />
          <div className="min-w-0">
            <h4 className="text-[19px] leading-tight text-duo-text">
              Streak Society
            </h4>
            <p className="mt-1 text-[16px] font-medium leading-[22px] text-duo-body">
              Reach a 7 day streak to join the Streak Society and earn exclusive
              rewards.
            </p>
          </div>
        </div>

        {/* Dark label on blue, which is how the reference draws this one — the
            surrounding cards use white text, so it isn't a slip. */}
        <button
          type="button"
          onClick={() => showUnimplemented("Streak details")}
          className="mt-3 w-full rounded-2xl bg-duo-blue py-3.5 text-[16px] font-extrabold uppercase tracking-[0.8px] text-[#122024] shadow-[0_3px_0_#1899D6]"
        >
          View more
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
export function GemsPopover({ user }: { user: UserProfile }) {
  return (
    <div className="w-[344px] p-5">
      <div className="flex items-center gap-4">
        <DuoAsset name="gemChest" className="block shrink-0" />
        <div className="min-w-0">
          <h3 className="text-[26px] leading-tight text-duo-text">Gems</h3>
          <p className="mt-1 text-[17px] font-bold text-duo-body">
            You have {user.gems} gems
          </p>
          <Link
            href="/shop"
            className="mt-1.5 inline-block text-[17px] font-extrabold uppercase tracking-[0.5px] text-duo-blue"
          >
            Go to shop
          </Link>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
/** One of the three bordered offers at the bottom of the hearts card. */
function HeartRow({
  icon,
  label,
  trailing,
  onClick,
  disabled,
}: {
  icon: React.ReactNode;
  label: string;
  trailing?: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex w-full items-center gap-2.5 rounded-2xl border-2 border-duo-border px-3.5 py-3 text-left transition-colors enabled:hover:bg-duo-card disabled:opacity-50"
    >
      <span className="flex shrink-0 items-center">{icon}</span>
      {/* 14px, not 16: "UNLIMITED HEARTS" plus "FREE TRIAL" has to fit on one
          line inside the 368px card, as it does in the reference. At 16px it
          wrapped to two. */}
      <span className="min-w-0 flex-1 text-[14px] font-extrabold uppercase tracking-[0.3px] text-duo-text">
        {label}
      </span>
      {trailing && <span className="shrink-0">{trailing}</span>}
    </button>
  );
}

export function HeartsPopover({
  user,
  onRefill,
}: {
  user: UserProfile;
  onRefill: () => void;
}) {
  const { showUnimplemented } = useToast();
  const full = user.hearts >= user.max_hearts;

  return (
    <div className="w-[368px] p-5">
      <h3 className="text-center text-[26px] text-duo-text">Hearts</h3>

      <div className="mt-3.5 flex justify-center gap-2.5">
        {Array.from({ length: user.max_hearts }, (_, index) => (
          <HeartPip
            key={index}
            filled={index < user.hearts}
            className="h-7 w-7"
          />
        ))}
      </div>

      {/* "Next heart in" is literally right even though the bar refills in one
          go after 5 hours (§6, and the 5-hour rule you set) — the next heart does
          arrive then; so do the rest. The countdown keeps minutes rather than the
          reference's rounded "4 hours", since the exact value is available. */}
      <p className="mt-3.5 text-center text-[19px] font-bold text-duo-text">
        {full || user.hearts_refill_in_seconds === null ? (
          "Hearts full"
        ) : (
          <>
            Next heart in{" "}
            <span className="text-duo-red">
              {formatCountdown(user.hearts_refill_in_seconds)}
            </span>
          </>
        )}
      </p>

      <p className="mt-1.5 text-center text-[16px] font-medium text-duo-muted">
        {user.hearts <= 0
          ? "You've run out of hearts — refill to keep learning."
          : "You still have hearts left! Keep on learning"}
      </p>

      <div className="mt-4 flex flex-col gap-2.5">
        <HeartRow
          icon={<InfinityHeartIcon className="h-7 w-7" />}
          label="Unlimited hearts"
          trailing={
            <span className="text-[14px] font-extrabold uppercase tracking-[0.3px] text-duo-pink">
              Free trial
            </span>
          }
          onClick={() => showUnimplemented("Unlimited Hearts")}
        />

        <HeartRow
          icon={<OutlinedHeartIcon className="h-7 w-7" />}
          label="Refill hearts"
          trailing={
            <span className="flex items-center gap-1.5 text-[14px] font-extrabold text-duo-gemText">
              <GemPip />
              {REFILL_GEM_PRICE}
            </span>
          }
          onClick={onRefill}
          // Nothing to buy when the bar is already full.
          disabled={full}
        />

        <HeartRow
          icon={<HeartIcon className="h-7 w-7 text-duo-red" />}
          label="Practice to earn hearts"
          onClick={() => showUnimplemented("Practice to earn hearts")}
        />
      </div>
    </div>
  );
}
