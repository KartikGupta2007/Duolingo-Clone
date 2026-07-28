"use client";

import { useEffect, useRef } from "react";

import DuoAsset from "@/components/shared/duoAssets";

/**
 * The gem that flies out of an opening treasure chest and into the rail's gem
 * counter.
 *
 * Rendered in a portal-less fixed layer over the whole page, because it has to
 * travel between two elements that live in different scroll containers — the
 * chest in the path, the counter in the sticky rail. Positioning it relative to
 * either would clip it.
 *
 * The motion is three beats, matching what the reference does: the gem pops up
 * out of the chest, hangs for a moment so it reads as a reward, then arcs to the
 * counter and shrinks into it. `onArrive` fires on the last frame, which is when
 * the caller refreshes the gem total — so the number ticks up exactly as the gem
 * lands rather than before it sets off.
 *
 * Driven by the Web Animations API rather than CSS keyframes because the
 * destination is only known at runtime; a Tailwind class can't hold a computed
 * translate.
 */

/** Total flight time. Long enough to read as a reward, short enough not to nag. */
const DURATION = 1150;
/** How far the gem lifts out of the chest before setting off. */
const POP_HEIGHT = 46;

export default function ChestReward({
  /** Viewport coords of the chest's centre, where the gem starts. */
  from,
  /** Viewport coords of the gem counter's centre, where it lands. */
  to,
  onArrive,
}: {
  from: { x: number; y: number };
  to: { x: number; y: number };
  onArrive: () => void;
}) {
  const gem = useRef<HTMLDivElement>(null);
  // Held in a ref so the effect can call the latest callback without re-running
  // (and restarting the flight) whenever the parent re-renders.
  const arrive = useRef(onArrive);
  arrive.current = onArrive;

  useEffect(() => {
    const node = gem.current;
    if (!node) return;

    const dx = to.x - from.x;
    const dy = to.y - from.y;

    // `prefers-reduced-motion`: skip the flight, credit the gems immediately.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      arrive.current();
      return;
    }

    const animation = node.animate(
      [
        { transform: "translate(0px, 0px) scale(0.4)", opacity: 0, offset: 0 },
        {
          transform: `translate(0px, ${-POP_HEIGHT}px) scale(1.35)`,
          opacity: 1,
          offset: 0.28,
        },
        {
          transform: `translate(${dx * 0.45}px, ${-POP_HEIGHT + dy * 0.2}px) scale(1.1)`,
          opacity: 1,
          offset: 0.6,
        },
        {
          transform: `translate(${dx}px, ${dy}px) scale(0.45)`,
          opacity: 0.9,
          offset: 1,
        },
      ],
      { duration: DURATION, easing: "cubic-bezier(0.35, 0, 0.4, 1)", fill: "forwards" },
    );

    animation.onfinish = () => arrive.current();
    return () => animation.cancel();
  }, [from.x, from.y, to.x, to.y]);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed z-50"
      // Centred on the chest; the animation moves it from here.
      style={{ left: from.x - 20, top: from.y - 20 }}
    >
      <div ref={gem}>
        <DuoAsset name="gem" height={40} />
      </div>
    </div>
  );
}
