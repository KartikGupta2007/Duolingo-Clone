import type { ReactNode } from "react";

/**
 * One purchasable row in the shop: artwork, copy, and an action on the right.
 *
 * Takes only what it renders, so the shop page decides what each row *is* — the
 * row itself never knows whether an item is real or a placeholder.
 */
export default function ShopRow({
  icon,
  title,
  badge,
  description,
  action,
  actionTone = "blue",
  disabled = false,
  onAction,
}: {
  icon: ReactNode;
  title: string;
  /** Small green pill after the title, e.g. "2 / 2 EQUIPPED". */
  badge?: string;
  description: string;
  action: ReactNode;
  actionTone?: "blue" | "pink" | "muted";
  disabled?: boolean;
  onAction?: () => void;
}) {
  const tone = {
    blue: "border-duo-border text-duo-blue",
    pink: "border-duo-border text-duo-pink",
    muted: "border-duo-border text-duo-muted",
  }[actionTone];

  return (
    // 24px vertical padding and a 64px icon, from the reference: its one-line
    // rows measure ~118px tall and its two-line rows ~140px, against 98/111
    // here before this. The row height is icon-led, so the icon size is doing
    // most of that work — see the shop page, which sets it.
    <div className="flex items-center gap-4 border-b-2 border-duo-border py-6">
      <span className="flex shrink-0 items-center justify-center">{icon}</span>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-[19px] leading-tight text-duo-text">{title}</h3>
          {badge && (
            <span className="rounded-md bg-duo-green/15 px-2 py-0.5 text-[13px] font-extrabold uppercase tracking-wide text-duo-green">
              {badge}
            </span>
          )}
        </div>
        {/* 17px on normal leading: the reference's description lines sit ~26px
            apart, which 15px/snug (20.6px) rendered far too tight. */}
        <p className="mt-1 text-[17px] font-medium leading-normal text-duo-body">
          {description}
        </p>
      </div>

      <button
        type="button"
        onClick={onAction}
        disabled={disabled}
        className={`shrink-0 rounded-xl border-2 px-5 py-3 text-[15px] font-extrabold uppercase tracking-wide transition-colors ${tone} enabled:hover:bg-duo-card disabled:opacity-50`}
      >
        {action}
      </button>
    </div>
  );
}
