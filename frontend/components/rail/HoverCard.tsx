"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { CSSProperties } from "react";

/**
 * A popover that opens on hover, as the reference's stat tiles do.
 *
 * Hover alone isn't enough to be usable, so three things are handled here:
 *
 * - **Crossing the gap.** There's a few px between the tile and the card; a
 *   naive `mouseleave` would close it on the way in. Closing is delayed, and
 *   entering the card cancels it.
 * - **No hover on touch.** Tapping the tile toggles it, so it works on a phone.
 * - **Keyboard.** The trigger is a button, focus opens the card and Escape or
 *   blurring away closes it, so it isn't mouse-only.
 */
export default function HoverCard({
  label,
  trigger,
  children,
  /** Aligns the card under the tile; edge tiles pull inwards to stay on screen. */
  align = "center",
  /**
   * Background for the little pointer at the top of the card. Defaults to the
   * card's own colour; the streak card overrides it because its top band is amber
   * and a dark pointer would sit on it as a notch.
   */
  caretClassName = "bg-duo-bg",
}: {
  /** Accessible name for the trigger. */
  label: string;
  trigger: React.ReactNode;
  children: React.ReactNode;
  align?: "left" | "center" | "right";
  caretClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapper = useRef<HTMLDivElement>(null);
  const id = useId();

  const cancelClose = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = null;
  };
  // Long enough to cross the gap, short enough not to feel sticky.
  const scheduleClose = () => {
    cancelClose();
    closeTimer.current = setTimeout(() => setOpen(false), 140);
  };

  useEffect(() => cancelClose, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    // A tap outside on touch devices, where there's no mouseleave to rely on.
    const onDown = (event: PointerEvent) => {
      if (!wrapper.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onDown);
    };
  }, [open]);

  const position = {
    left: "left-0",
    center: "left-1/2 -translate-x-1/2",
    right: "right-0",
  }[align];

  /**
   * Where the caret sits, which is *not* the middle of the card.
   *
   * A centred card is already the same centre as its tile, so the default
   * `left-1/2` is right. An edge-aligned card isn't: it's 320-368px wide against
   * a ~80-100px tile, so centring the caret on the card puts it a tile and a half
   * away, pointing at the neighbour. Both edge cases pin it near their own edge
   * instead.
   */
  const caretPosition: CSSProperties | undefined = {
    left: { left: 22, right: "auto" },
    center: undefined,
    right: { left: "auto", right: 22 },
  }[align];

  return (
    <div
      ref={wrapper}
      className="relative"
      onMouseEnter={() => {
        cancelClose();
        setOpen(true);
      }}
      onMouseLeave={scheduleClose}
    >
      <button
        type="button"
        aria-label={label}
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((current) => !current)}
        onFocus={() => setOpen(true)}
        // The tile lifts to a lighter background while its card is open, as in
        // the reference.
        className={`rounded-xl transition-colors ${open ? "bg-duo-card" : ""}`}
      >
        {trigger}
      </button>

      {open && (
        <div
          id={id}
          role="dialog"
          aria-label={label}
          // pt-2 is the gap the pointer crosses; it's inside the hover target so
          // the card doesn't close mid-travel.
          className={`absolute top-full z-40 pt-2 ${position}`}
        >
          {/* Pointer back up at the tile. */}
          <div
            aria-hidden="true"
            className={`absolute left-1/2 top-[3px] h-3.5 w-3.5 -translate-x-1/2 rotate-45 rounded-[3px] border-2 border-duo-border ${caretClassName}`}
            style={caretPosition}
          />
          <div className="relative overflow-hidden rounded-2xl border-2 border-duo-border bg-duo-bg shadow-xl">
            {children}
          </div>
        </div>
      )}
    </div>
  );
}
