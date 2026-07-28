/**
 * How long until the daily quests refresh.
 *
 * Counted to the next **UTC** midnight, because that's the boundary the server
 * uses to decide whether the learner has practised today (`time_utils.today`).
 * Using the local day here instead would let the countdown hit zero while the
 * quest was still showing yesterday's progress.
 *
 * Derived, not stored — there is nothing to persist about "tomorrow".
 */
export function questsRefreshLabel(now: Date = new Date()): string {
  const midnight = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate() + 1,
  );
  const minutes = Math.max(0, Math.floor((midnight - now.getTime()) / 60_000));

  if (minutes >= 120) return `${Math.floor(minutes / 60)} hours`;
  if (minutes >= 60) return "1 hour";
  return `${Math.max(1, minutes)} min`;
}
