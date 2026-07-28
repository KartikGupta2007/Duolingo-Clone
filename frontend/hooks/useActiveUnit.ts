"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Tracks which unit section currently sits under the sticky header.
 *
 * The reference page has exactly one header bar (`min-height: 82px`, sticky at
 * `top: 0`), whose title and colour become the unit you've scrolled to. That
 * needs the active unit as state, which is what this returns.
 *
 * Measuring rects on scroll (rather than an IntersectionObserver) is what makes
 * "nearest unit" expressible: the active unit is simply the last one whose top
 * has passed under the bar.
 *
 * @param count  number of sections, so the hook re-measures when units change
 * @param offset how far down the viewport the header's lower edge sits
 */
export function useActiveUnit(count: number, offset = 120) {
  const sections = useRef<Array<HTMLElement | null>>([]);
  const [activeIndex, setActiveIndex] = useState(0);

  const registerSection = useCallback(
    (index: number) => (element: HTMLElement | null) => {
      sections.current[index] = element;
    },
    [],
  );

  useEffect(() => {
    let frame = 0;

    const measure = () => {
      frame = 0;
      let next = 0;
      sections.current.forEach((element, index) => {
        if (element && element.getBoundingClientRect().top <= offset) {
          next = index;
        }
      });
      // React bails out when the value is unchanged, so this is cheap on the
      // vast majority of scroll frames.
      setActiveIndex(next);
    };

    // Coalesce bursts of scroll events into one measurement per frame.
    const onScroll = () => {
      if (frame === 0) frame = requestAnimationFrame(measure);
    };

    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      if (frame !== 0) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [count, offset]);

  return { registerSection, activeIndex };
}
