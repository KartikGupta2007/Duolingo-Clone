"use client";

interface ProgressBarProps {
  /** Exercises answered so far. */
  value: number;
  /** Total exercises in the lesson. */
  total: number;
}

export default function ProgressBar({ value, total }: ProgressBarProps) {
  const percent = total > 0 ? Math.min(100, (value / total) * 100) : 0;

  return (
    <div
      className="h-4 w-full overflow-hidden rounded-full bg-duo-border"
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={total}
      aria-label="Lesson progress"
    >
      <div
        className="h-full rounded-full bg-duo-green transition-[width] duration-300 ease-out"
        style={{ width: `${percent}%` }}
      >
        {/* Duolingo's subtle inner highlight along the top of the fill. */}
        {percent > 8 && (
          <div className="mx-2 mt-1 h-1 rounded-full bg-white/40" />
        )}
      </div>
    </div>
  );
}
