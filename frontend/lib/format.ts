// Small display formatters shared across components.

/**
 * Formats 17_400 -> "4h 50m", 1499 -> "25m", 45 -> "45s".
 *
 * Hours matter because the heart bar refills on a 5-hour timer — "300m" is
 * unreadable. Shared by the top bar and the hearts popover.
 */
export function formatCountdown(seconds: number): string {
  if (seconds >= 3600) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.round((seconds % 3600) / 60);
    return minutes ? `${hours}h ${minutes}m` : `${hours}h`;
  }
  if (seconds >= 60) return `${Math.ceil(seconds / 60)}m`;
  return `${seconds}s`;
}
