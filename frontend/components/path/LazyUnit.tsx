"use client";

import type { ReactNode } from "react";

import useInView from "@/hooks/useInView";

/**
 * Defers a unit's real content until it approaches the viewport.
 *
 * The path is thirteen units (~9,000px) tall, but a first paint only needs the
 * two or three on screen — the rest is 70+ node buttons, popover wiring and
 * character slots that cost mount time while being invisible. Each deferred
 * unit renders its `placeholder` (a size-accurate `UnitSkeleton`) until the
 * observer fires, then swaps in the children and stays mounted — `hasEntered`
 * latches, so scrolling away never unmounts what the user has already seen.
 *
 * The margin is generous (900px ≈ one viewport) so the swap happens off-screen:
 * by the time a unit scrolls in, its real nodes are already there and the only
 * visible skeletons are the ones a fast flick outruns.
 */
export default function LazyUnit({
  placeholder,
  children,
}: {
  placeholder: ReactNode;
  children: ReactNode;
}) {
  const { ref, hasEntered } = useInView<HTMLDivElement>("900px");
  return <div ref={ref}>{hasEntered ? children : placeholder}</div>;
}
