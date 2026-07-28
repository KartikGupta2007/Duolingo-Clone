"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface InView<T extends Element> {
  /** Attach to the element to watch. */
  ref: (node: T | null) => void;
  /** True only while the element is within `rootMargin` of the viewport. */
  inView: boolean;
  /** Latches true the first time it comes into view, and stays true. */
  hasEntered: boolean;
}

/**
 * Tracks whether an element is near the viewport.
 *
 * Two flags rather than one, because the path needs both behaviours and they
 * differ:
 *
 * - `hasEntered` gates *loading*. Once an image has been fetched, unmounting it
 *   on scroll-away would only make it re-fetch and flash on the way back, so
 *   this latches.
 * - `inView` gates *animating*. A looping transform on an off-screen element
 *   still costs compositor work every frame, and the path is ~9,000px tall with
 *   thirteen characters on it, so all but the visible two or three should idle.
 *
 * `rootMargin` deliberately extends past the viewport: work starts slightly
 * before the element is visible, so it's decoded and mid-loop by the time it
 * actually scrolls in.
 */
export default function useInView<T extends Element>(
  rootMargin = "300px",
): InView<T> {
  const [inView, setInView] = useState(false);
  const [hasEntered, setHasEntered] = useState(false);
  const observer = useRef<IntersectionObserver | null>(null);

  const ref = useCallback(
    (node: T | null) => {
      observer.current?.disconnect();
      if (!node) return;

      // No IntersectionObserver (SSR, or a browser old enough to lack it):
      // show everything rather than withholding content behind a feature check.
      if (typeof IntersectionObserver === "undefined") {
        setInView(true);
        setHasEntered(true);
        return;
      }

      observer.current = new IntersectionObserver(
        ([entry]) => {
          setInView(entry.isIntersecting);
          if (entry.isIntersecting) setHasEntered(true);
        },
        { rootMargin },
      );
      observer.current.observe(node);
    },
    [rootMargin],
  );

  // The ref callback disconnects on re-attach; this covers plain unmount.
  useEffect(() => () => observer.current?.disconnect(), []);

  return { ref, inView, hasEntered };
}
