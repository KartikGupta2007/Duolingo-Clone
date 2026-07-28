"use client";

/**
 * Tappable answer card used by multiple_choice and fill_blank.
 * Thick bottom border gives the same "physical" feel as the 3D buttons.
 */
export default function OptionCard({
  label,
  index,
  selected,
  onSelect,
}: {
  label: string;
  /** 1-based number shown in the corner badge, mirroring Duolingo's hint. */
  index?: number;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={[
        "flex w-full items-center gap-3 rounded-2xl border-2 border-b-4 px-4 py-4 text-left",
        "text-lg font-bold transition-colors",
        selected
          ? "border-duo-blue bg-duo-blue/15 text-duo-blue"
          : "border-duo-border bg-duo-card text-duo-text hover:bg-duo-cardHover",
      ].join(" ")}
    >
      {index !== undefined && (
        <span
          className={[
            "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border-2 text-sm",
            selected
              ? "border-duo-blue text-duo-blue"
              : "border-duo-border text-duo-muted",
          ].join(" ")}
        >
          {index}
        </span>
      )}
      <span className="flex-1">{label}</span>
    </button>
  );
}
