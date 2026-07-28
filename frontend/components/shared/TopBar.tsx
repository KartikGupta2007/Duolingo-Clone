"use client";

import DuoAsset from "@/components/shared/duoAssets";
import { formatCountdown } from "@/lib/format";
import { useUser } from "@/components/shared/UserProvider";


function Stat({
  icon,
  value,
  label,
  tone,
}: {
  icon: React.ReactNode;
  value: string | number;
  label: string;
  tone: string;
}) {
  return (
    <div
      className="flex items-center gap-1.5"
      title={label}
      aria-label={`${label}: ${value}`}
    >
      <span className={tone}>{icon}</span>
      <span className="text-base font-extrabold tabular-nums">{value}</span>
    </div>
  );
}

/**
 * Icon order is fixed by CLAUDE.md §8:
 * flag (course) -> streak flame -> gems -> hearts.
 */
export default function TopBar({ className = "" }: { className?: string }) {
  const { user } = useUser();

  return (
    <header
      className={`sticky top-0 z-30 border-b-2 border-duo-border bg-duo-bg/95 backdrop-blur ${className}`}
    >
      {/* 624 = the 592px content column + 16px padding either side, so below xl
          (where the rail is hidden and this bar carries the stats) its contents
          land on the same column edges as the page beneath it. */}
      <div className="mx-auto flex h-[70px] max-w-[624px] items-center justify-between gap-4 px-4">
        <div className="flex items-center gap-2">
          <DuoAsset name="flag" height={28} />
          <span className="hidden text-sm font-bold text-duo-muted sm:inline">
            English
          </span>
        </div>

        {user ? (
          <div className="flex items-center gap-5">
            <Stat
              icon={<DuoAsset name="streak" height={26} />}
              value={user.streak_count}
              label="Day streak"
              tone="text-duo-streak"
            />
            <Stat
              icon={<DuoAsset name="gem" height={25} />}
              value={user.gems}
              label="Gems"
              tone="text-duo-gemText"
            />
            <div className="flex items-center gap-1.5" title="Hearts">
              {/* Dimmed rather than recoloured when empty — it's the reference's
                  own artwork now, so there is no currentColor to swap. */}
              <span className={user.hearts > 0 ? "" : "opacity-40 grayscale"}>
                <DuoAsset name="heart" height={24} />
              </span>
              <span className="text-base font-extrabold tabular-nums">
                {user.hearts}
              </span>
              {/* The bar refills all at once, so this counts down to full
                  rather than to the next single heart. */}
              {user.hearts < user.max_hearts &&
                user.hearts_refill_in_seconds !== null && (
                  <span className="ml-0.5 text-xs font-bold text-duo-muted">
                    full in {formatCountdown(user.hearts_refill_in_seconds)}
                  </span>
                )}
            </div>
          </div>
        ) : (
          // Skeleton keeps the bar from collapsing on first paint.
          <div className="h-6 w-40 animate-pulse rounded-full bg-duo-card" />
        )}
      </div>
    </header>
  );
}
