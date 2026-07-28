import DuoAsset from "@/components/shared/duoAssets";

/**
 * The gold quest bar with its reward chest.
 *
 * Built to the captured element:
 *
 *   role="progressbar" with aria-valuemin / -valuemax / -valuenow
 *   --__internal__progress-bar-height: 20px
 *   --__internal__progress-bar-value: 100%          (the fill)
 *   --web-ui_progress-bar-shine-height: 3px
 *   --web-ui_progress-bar-color: rgb(var(--color-bee))
 *
 * ## Why the label is rendered twice
 *
 * The capture has `20 / 20` twice — once on the track, and once again *inside*
 * the fill element. That isn't redundant markup: the fill clips its own copy, so
 * as it grows it progressively reveals the light-on-gold text over exactly the
 * covered part of the label and leaves the grey version showing on the rest. The
 * split is per-pixel, mid-glyph if that's where the fill happens to stop.
 *
 * The same effect here comes from a full-width overlay clipped with `clip-path`
 * rather than a nested copy sized against its parent — identical result, and it
 * avoids having to know the track's pixel width to keep the inner text from
 * sliding as the fill grows.
 *
 * The `role`/`aria-*` triple is straight from the capture. `aria-label` is the
 * one addition: without it the bar announces "20 of 20" with no clue what is at
 * 20, since the quest's name is a separate element beside it.
 */

/** Per `--__internal__progress-bar-height`. */
const BAR_HEIGHT = 20;
/** Per `--web-ui_progress-bar-shine-height`. */
const SHINE_HEIGHT = 3;

export default function QuestProgressBar({
  current,
  target,
  /** The quest's name, so the bar announces what it is measuring. */
  label,
}: {
  current: number;
  target: number;
  label?: string;
}) {
  const shown = Math.min(current, target);
  const ratio = target > 0 ? Math.min(1, current / target) : 0;
  const percent = ratio * 100;
  const text = `${shown} / ${target}`;

  // One class list, used by both copies of the label, so they sit exactly on top
  // of each other and the clip is the only thing that distinguishes them.
  const labelClass =
    "absolute inset-0 flex items-center justify-center text-[14px] font-bold uppercase tracking-[0.56px] tabular-nums";

  return (
    <div className="flex items-center">
      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={target}
        aria-valuenow={shown}
        aria-label={label}
        className="relative flex-1 rounded-l-[9px] bg-duo-border"
        style={{ height: BAR_HEIGHT }}
      >
        {/* The grey label, on the bare track. */}
        <span className={`${labelClass} text-duo-questOff`} aria-hidden="true">
          {text}
        </span>

        {/* The fill. */}
        <div
          className="absolute inset-y-0 left-0 overflow-hidden rounded-l-[9px] bg-duo-quest transition-[width] duration-500"
          style={{ width: `${percent}%` }}
        >
          {/* Shine along the top of the fill, 3px per the capture. */}
          {percent > 6 && (
            <div
              className="absolute left-[4.5px] right-0 rounded-l-full bg-white/25"
              style={{ top: SHINE_HEIGHT + 1, height: SHINE_HEIGHT }}
            />
          )}
        </div>

        {/* The dark label, clipped to the fill — this is the second copy the
            capture carries, which is what splits the text per-pixel. */}
        <span
          className={`${labelClass} text-duo-questOn`}
          style={{ clipPath: `inset(0 ${100 - percent}% 0 0)` }}
          aria-hidden="true"
        >
          {text}
        </span>
      </div>

      <DuoAsset name="questChest" className="-ml-1 block shrink-0" />
    </div>
  );
}
