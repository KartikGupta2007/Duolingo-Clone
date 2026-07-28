"use client";

import type { CSSProperties } from "react";
import { useEffect } from "react";
import { motion, useReducedMotion } from "framer-motion";
import type { TargetAndTransition } from "framer-motion";

import CharacterArt from "@/components/path/CharacterArt";
import {
  useBlink,
  useBreathing,
  useCelebrate,
  useFloating,
  useHoverAnimation,
} from "@/hooks/characterMotion";
import useInView from "@/hooks/useInView";
import { characterByName } from "@/lib/characters";
import type { CharacterName } from "@/lib/characters";

/**
 * A living character: the path's measured-pivot idle choreography underneath,
 * with blinking, moods, and hover/click reactions layered on top.
 *
 * ## The layer stack, outermost first
 *
 *   celebrate  one-shot jump/squash sequence (imperative controls)
 *   hover      spring pose while the pointer is over the figure's ink
 *   mood       the looping mood program (thinking tilt, sad droop, …)
 *   art        CharacterArt: the SVG, its CSS idle, mirroring, and eyelids
 *
 * Transforms compose across the nested layers, so a character can be
 * mid-celebration, hovered, and breathing at once without any property fights.
 * Every layer is transform-only, so nothing here causes layout.
 *
 * ## What deliberately isn't here
 *
 * Individually rigged limbs and hair. The SVGs are Lottie frame-0 exports —
 * anonymous `<g>` soup with baked matrixes (see lib/characters.ts) — so parts
 * can't be addressed without re-authoring the artwork. The two per-part
 * behaviours that *are* real work from measurements instead: idles pivot on
 * each figure's scanned ground point, and blinks draw lids over scanned eye
 * positions. Characters whose eyes can't take a lid honestly (glasses,
 * hidden eyes) simply don't blink.
 *
 * ## Interactivity
 *
 * The pointer target is a hitbox over the figure's measured ink, not the whole
 * box — two-thirds of each canvas is transparent padding, and reacting to
 * hovers over empty air feels broken. Hover lifts; click celebrates. The
 * hitbox is pointer-only and hidden from assistive tech: it triggers a purely
 * decorative flourish, which would be noise as an announced button.
 *
 * Pauses off-screen (own observer, or the `paused` prop when the caller
 * already tracks visibility) and goes fully still under
 * `prefers-reduced-motion` — the CSS idles already obey the media query, and
 * `active` gates everything added here.
 */

export type CharacterMood =
  | "idle"
  | "happy"
  | "celebrate"
  | "thinking"
  | "sad"
  | "reading";

interface AnimatedCharacterProps {
  /** Which of the thirteen characters to draw, by asset name. */
  variant: CharacterName;
  mood?: CharacterMood;
  /** Box size in px; fills the parent when omitted. */
  size?: number;
  mirrored?: boolean;
  /** Hover-to-lift and click-to-celebrate. */
  interactive?: boolean;
  /** Overrides the internal viewport check (UnitCharacter already has one). */
  paused?: boolean;
  className?: string;
  style?: CSSProperties;
}

/** Moods whose loop replaces the idle choreography instead of riding on it. */
const CALM_MOODS: ReadonlySet<CharacterMood> = new Set([
  "thinking",
  "sad",
  "reading",
]);

export default function AnimatedCharacter({
  variant,
  mood = "idle",
  size,
  mirrored = false,
  interactive = false,
  paused,
  className = "",
  style,
}: AnimatedCharacterProps) {
  const character = characterByName(variant);
  const reduceMotion = useReducedMotion();
  const { ref, inView } = useInView<HTMLDivElement>();
  const active = !(paused ?? !inView) && !reduceMotion;

  // `eyes` is only present on entries that earned it, so the union needs a
  // presence check rather than property access.
  const canBlink = "eyes" in character && character.eyes.length > 0;
  const eyesClosed = useBlink(active && canBlink);
  const { controls, celebrate } = useCelebrate();
  const { hoverHandlers, hoverPose } = useHoverAnimation(active && interactive);

  // Mood programs, built from the shared hooks so no two moods restate a curve.
  const breathing = useBreathing(active && CALM_MOODS.has(mood), 2.8);
  const floating = useFloating(active && mood === "thinking", 2, 2);

  const moodPose: TargetAndTransition | undefined = !active
    ? undefined
    : mood === "happy"
      ? {
          scale: [1, 1.03, 1],
          rotate: [0, 1.5, 0, -1, 0],
          transition: { duration: 0.9, repeat: Infinity, ease: "easeInOut" },
        }
      : mood === "thinking"
        ? {
            ...floating,
            rotate: [-2, 3, -2],
            transition: { duration: 2.0, repeat: Infinity, ease: "easeInOut" },
          }
        : mood === "sad"
          ? {
              ...breathing,
              scaleY: [0.985, 0.998, 0.985],
              rotate: [-1, 1, -1],
              transition: { duration: 3.6, repeat: Infinity, ease: "easeInOut" },
            }
          : mood === "reading"
            ? {
                ...breathing,
                rotate: [0, 2.2, 0, -0.8, 0],
                transition: { duration: 2.4, repeat: Infinity, ease: "easeInOut" },
              }
            : undefined;

  // mood="celebrate" plays the sequence on arrival, then settles into idle.
  useEffect(() => {
    if (mood === "celebrate" && active) void celebrate();
  }, [mood, active, celebrate]);

  const box: CSSProperties = size
    ? { width: size, height: size, ...style }
    : { width: "100%", height: "100%", ...style };

  return (
    <motion.div
      ref={ref}
      animate={controls}
      className={`relative ${className}`}
      style={box}
    >
      <motion.div animate={hoverPose} className="h-full w-full">
        <motion.div
          animate={moodPose}
          className="h-full w-full"
          // Moods pivot on the figure's measured ground point, like the idles —
          // a tilt should read as weight shifting on planted feet.
          style={{
            transformOrigin: `${character.originX}% ${character.originY}%`,
          }}
        >
          <CharacterArt
            character={character}
            mirrored={mirrored}
            // Calm moods replace the idle choreography rather than stack on it.
            paused={!active || CALM_MOODS.has(mood)}
            eyesClosed={eyesClosed}
          />
        </motion.div>
      </motion.div>

      {interactive && (
        // Pointer-only, sized to the ink. Decorative — see the component note.
        <div
          aria-hidden="true"
          onMouseEnter={hoverHandlers.onMouseEnter}
          onMouseLeave={hoverHandlers.onMouseLeave}
          onClick={() => {
            if (active) void celebrate();
          }}
          className="absolute cursor-pointer"
          style={{
            left: `${character.inkLeft}%`,
            right: `${100 - character.inkRight}%`,
            top: "18%",
            bottom: `${100 - character.originY}%`,
            pointerEvents: "auto",
          }}
        />
      )}
    </motion.div>
  );
}
