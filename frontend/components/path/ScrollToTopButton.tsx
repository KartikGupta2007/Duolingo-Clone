"use client";

import { useEffect, useState } from "react";

import { ArrowUpIcon } from "@/components/shared/icons";

/**
 * The floating jump-to-top control. The path is long (13 units), so it appears
 * once the learner has scrolled past roughly one viewport.
 *
 * Positioned with `sticky`, not `fixed`, and rendered as the last child of the
 * content column. In the reference it lines up with the right edge of the node
 * column — not the right edge of the window — and `sticky` gets that for free at
 * every viewport width, because the column itself is the containing block. A
 * `fixed` element would need a hardcoded offset that only holds at one width and
 * drifts into the rail at others.
 *
 * The negative bottom margin cancels its own height so it overlays the end of
 * the path instead of adding a gap below the section-end card.
 */
export default function ScrollToTopButton() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 600);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    // Wrapper stays in the layout (so `sticky` has something to stick within)
    // but never eats clicks aimed at the path behind it.
    <div className="pointer-events-none sticky bottom-7 z-30 -mb-12 flex justify-end">
      <button
        type="button"
        aria-label="Back to top"
        // Hidden by opacity rather than unmounted, so showing it can't shift the
        // page and it fades in the way the reference does.
        aria-hidden={!visible}
        tabIndex={visible ? 0 : -1}
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        // 48px circle, from the reference.
        className={[
          "flex h-12 w-12 items-center justify-center rounded-full",
          "border-2 border-duo-border bg-duo-bg text-duo-blue",
          "transition-[opacity,background-color] duration-200 hover:bg-duo-card",
          visible ? "pointer-events-auto opacity-100" : "opacity-0",
        ].join(" ")}
      >
        <ArrowUpIcon className="h-6 w-6" />
      </button>
    </div>
  );
}
