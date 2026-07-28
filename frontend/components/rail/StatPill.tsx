import type { ReactNode } from "react";

/**
 * One stat in the rail's top row: icon + value.
 *
 * Takes only what it renders — no user object — so it can show any stat.
 * Reference: 12px radius, ~10px left / 16px right padding, and a value colour
 * that matches its icon rather than plain white.
 */
export default function StatPill({
  icon,
  value,
  label,
  valueClassName = "text-duo-text",
  /** Marks this pill as a target something can animate into — see ChestReward. */
  target,
}: {
  icon: ReactNode;
  value: number | string;
  /** Announced to screen readers, since the icon alone carries the meaning. */
  label: string;
  valueClassName?: string;
  target?: string;
}) {
  return (
    <div
      className="flex items-center rounded-xl py-1 pl-[10px] pr-4"
      aria-label={`${label}: ${value}`}
      data-stat-target={target}
    >
      <span className="mr-[10px] flex shrink-0 items-center">{icon}</span>
      <span
        className={`text-[15px] font-bold tabular-nums ${valueClassName}`}
      >
        {value}
      </span>
    </div>
  );
}
