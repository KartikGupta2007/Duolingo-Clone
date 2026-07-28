"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAnimationControls } from "framer-motion";
import type { TargetAndTransition } from "framer-motion";

/** Derived rather than imported — framer-motion v12 renamed the type. */
type CelebrateControls = ReturnType<typeof useAnimationControls>;

/**
 * The motion vocabulary behind `AnimatedCharacter`, split into hooks so each
 * behaviour is testable and none of it is duplicated between moods.
 *
 * Everything here animates `transform` only (GPU-composited, no layout), and
 * every consumer gates on `enabled`, which is how viewport pausing and
 * `prefers-reduced-motion` switch the whole system off from one place.
 *
 * A deliberate boundary: these hooks move the *whole figure*. The character
 * SVGs are Lottie frame-0 exports — dozens to hundreds of anonymous `<g>`
 * wrappers with baked matrix transforms — so limbs and hair cannot be rigged
 * individually without re-authoring the artwork (see lib/characters.ts). The
 * one true sub-element behaviour is blinking, which works from *measured* eye
 * positions rather than SVG structure.
 */

/** How long a blink holds the lids down. */
const BLINK_MS = 120;
/** Blinks land at a random point in this window, so timing never feels metronomic. */
const BLINK_GAP_MIN_MS = 1_800;
const BLINK_GAP_MAX_MS = 4_500;
/**
 * The first blink after a character wakes lands much sooner: a viewer skimming
 * the path lingers a second or two per figure, and a first blink 2-6s out would
 * usually go unseen.
 */
const FIRST_BLINK_MIN_MS = 500;
const FIRST_BLINK_MAX_MS = 1_500;

/**
 * True while the eyes should be drawn closed. Reschedules itself with fresh
 * randomness after every blink; two characters side by side drift apart
 * naturally instead of blinking in unison.
 */
export function useBlink(enabled: boolean): boolean {
  const [closed, setClosed] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    if (!enabled) {
      setClosed(false);
      return;
    }
    let alive = true;
    let first = true;
    const schedule = () => {
      const [min, max] = first
        ? [FIRST_BLINK_MIN_MS, FIRST_BLINK_MAX_MS]
        : [BLINK_GAP_MIN_MS, BLINK_GAP_MAX_MS];
      first = false;
      const wait = min + Math.random() * (max - min);
      timers.current.push(
        setTimeout(() => {
          if (!alive) return;
          setClosed(true);
          timers.current.push(
            setTimeout(() => {
              if (!alive) return;
              setClosed(false);
              schedule();
            }, BLINK_MS),
          );
        }, wait),
      );
    };
    schedule();
    return () => {
      alive = false;
      timers.current.forEach(clearTimeout);
      timers.current = [];
    };
  }, [enabled]);

  return closed;
}

/**
 * The universal idle base: a slow lung-fill (scaleY) with a faint lift. The
 * lift is 3px — small enough that the ground shadow baked into each SVG
 * doesn't visibly detach, which is the constraint that shaped the whole idle
 * system (see globals.css `char-bob`).
 */
export function useBreathing(
  enabled: boolean,
  duration = 2.6,
): TargetAndTransition | undefined {
  if (!enabled) return undefined;
  return {
    scaleY: [1, 1.015, 1],
    y: [0, -3, 0],
    transition: { duration, repeat: Infinity, ease: "easeInOut" },
  };
}

/** A gentler drift for figures that should hover rather than breathe. */
export function useFloating(
  enabled: boolean,
  distance = 3,
  duration = 3,
): TargetAndTransition | undefined {
  if (!enabled) return undefined;
  return {
    y: [0, -distance, 0],
    transition: { duration, repeat: Infinity, ease: "easeInOut" },
  };
}

/**
 * The celebrate sequence: jump, land, squash, settle. One-shot and re-entrant
 * safe — a click mid-celebration is ignored rather than restarting the jump,
 * which is what makes mashing the character feel solid instead of glitchy.
 */
export function useCelebrate(): {
  controls: CelebrateControls;
  celebrate: () => Promise<void>;
} {
  const controls = useAnimationControls();
  const busy = useRef(false);

  const celebrate = useCallback(async () => {
    if (busy.current) return;
    busy.current = true;
    try {
      await controls.start({
        y: [0, -25, 0, 0],
        scale: [1, 1.08, 0.98, 1],
        rotate: [0, 5, -5, 0],
        transition: { duration: 0.9, times: [0, 0.42, 0.72, 1], ease: "easeInOut" },
      });
    } finally {
      busy.current = false;
    }
  }, [controls]);

  return { controls, celebrate };
}

/**
 * Hover state plus the pose it drives. The pose is returned (rather than a
 * `whileHover` prop) because the pointer target is the figure's *ink* hitbox
 * while the pose animates the layer stack above it — `whileHover` can only
 * animate the element being hovered.
 */
export function useHoverAnimation(enabled: boolean): {
  hovered: boolean;
  hoverHandlers: {
    onMouseEnter: () => void;
    onMouseLeave: () => void;
  };
  hoverPose: TargetAndTransition;
} {
  const [hovered, setHovered] = useState(false);
  const on = enabled && hovered;

  return {
    hovered: on,
    hoverHandlers: {
      onMouseEnter: () => setHovered(true),
      onMouseLeave: () => setHovered(false),
    },
    hoverPose: {
      y: on ? -8 : 0,
      rotate: on ? 2 : 0,
      scale: on ? 1.04 : 1,
      // Springy enough to feel alive, tuned to settle in roughly 0.35s.
      transition: { type: "spring", stiffness: 320, damping: 20, mass: 0.8 },
    },
  };
}
