/**
 * Domain logic for the right rail.
 *
 * Pure functions over a `UserProfile` — no React, no fetching. The rail's
 * presentational components depend on these types rather than on the API
 * client or the user context, which keeps them trivially testable and lets the
 * data source change without touching the UI (dependency inversion).
 */

import type { UserProfile } from "./types";

/** The backend stores dates as UTC, so compare against the UTC day. */
export function utcTodayISO(now: Date = new Date()): string {
  return now.toISOString().slice(0, 10);
}

// ---------------------------------------------------------------------------
// Leaderboard gate
// ---------------------------------------------------------------------------
export interface LeaderboardUnlock {
  unlocked: boolean;
  /** Lessons still needed; 0 once unlocked. */
  lessonsRemaining: number;
}

/**
 * The gate is decided by the backend (`leaderboard_unlocked`), which also
 * enforces it on `GET /api/leaderboard`. This only works out how many lessons
 * are left so the card can say so.
 */
export function deriveLeaderboardUnlock(
  user: Pick<
    UserProfile,
    "lessons_completed" | "leaderboard_unlock_lessons" | "leaderboard_unlocked"
  >,
): LeaderboardUnlock {
  return {
    unlocked: user.leaderboard_unlocked,
    lessonsRemaining: Math.max(
      0,
      user.leaderboard_unlock_lessons - user.lessons_completed,
    ),
  };
}

// ---------------------------------------------------------------------------
// Streak calendar
// ---------------------------------------------------------------------------
export interface StreakDay {
  /** S M T W T F S — the reference's single-letter column headers. */
  letter: string;
  iso: string;
  isToday: boolean;
  /** Part of the current streak run. */
  done: boolean;
}

const DAY_MS = 86_400_000;
const LETTERS = ["S", "M", "T", "W", "T", "F", "S"];

/**
 * The current week, Sunday-first, with the streak's days marked.
 *
 * Derived rather than stored: a streak of N days ending on `last_activity_date`
 * covers exactly the N consecutive days up to it, so the ticks are real without
 * needing a per-day activity table (which §4's schema rules out).
 */
export function deriveStreakWeek(
  user: Pick<UserProfile, "streak_count" | "last_activity_date">,
  today: string = utcTodayISO(),
): StreakDay[] {
  const todayDate = new Date(`${today}T00:00:00Z`);
  const sunday = todayDate.getTime() - todayDate.getUTCDay() * DAY_MS;

  const last = user.last_activity_date
    ? new Date(`${user.last_activity_date}T00:00:00Z`).getTime()
    : null;
  const first =
    last !== null && user.streak_count > 0
      ? last - (user.streak_count - 1) * DAY_MS
      : null;

  return LETTERS.map((letter, index) => {
    const day = sunday + index * DAY_MS;
    const iso = new Date(day).toISOString().slice(0, 10);
    return {
      letter,
      iso,
      isToday: iso === today,
      done: first !== null && last !== null && day >= first && day <= last,
    };
  });
}

// ---------------------------------------------------------------------------
// Daily quests
// ---------------------------------------------------------------------------
/** Which artwork a quest row shows. Adding a kind doesn't change QuestRow. */
export type QuestKind = "xp";

export interface Quest {
  id: string;
  kind: QuestKind;
  label: string;
  current: number;
  target: number;
}

/**
 * The "Earn 10 XP" daily quest.
 *
 * We don't persist per-day XP (that would need a schema change this project's
 * scope rules out), but the value is still exact rather than mocked: a lesson
 * awards exactly `xp_per_lesson`, so if `last_activity_date` is today the
 * learner has provably earned at least that much. The figure comes from the
 * server for the same reason — it's the number `complete_lesson` really pays.
 */
export function deriveDailyQuests(
  user: Pick<UserProfile, "last_activity_date" | "xp_per_lesson">,
  today: string = utcTodayISO(),
): Quest[] {
  const practisedToday = user.last_activity_date === today;
  return [
    {
      id: "earn-xp",
      kind: "xp",
      label: `Earn ${user.xp_per_lesson} XP`,
      current: practisedToday ? user.xp_per_lesson : 0,
      target: user.xp_per_lesson,
    },
  ];
}
