"use client";

import AnimatedCharacter from "@/components/characters/AnimatedCharacter";
import useInView from "@/hooks/useInView";
import { characterForUnit } from "@/lib/characters";

/**
 * The character's box, taken verbatim from the captured units.
 *
 * All three carry `height: 260.765px` and a width that pairs with their inset so
 * the far edge always lands 16px inside the column:
 *
 *   left: calc(50% - 19px);  width: calc(50% + 3px)   -> ends at 100% - 16px
 *   left: calc(50% - 14px);  width: calc(50% - 2px)   -> ends at 100% - 16px
 *
 * So the box starts a little *past* the centre line, overlapping the path, and
 * runs to a fixed 16px margin. The inset is 19px in two of the three captures
 * and 14px in the other, which is per-character data the capture is too small to
 * derive a rule for — 19 is used.
 *
 * The overlap is safe because the box is mostly transparent padding and sits
 * behind the nodes (`-z-10`), and because the character always stands on the side
 * opposite the unit's lobe, where nodes only reach 35px from centre.
 */
const BOX_HEIGHT = 260.765;
const INNER_INSET = 19;
const OUTER_MARGIN = 16;

/**
 * The animated character that stands beside a unit's nodes.
 *
 * In the reference every unit has one, alternating between the left and right of
 * the node column and looping an idle. Which character appears, and how it
 * moves, is data — see `lib/characters.ts`, which also explains why the motion
 * is whole-figure rather than rigged limbs. The drawing itself lives in
 * `CharacterArt`; this component owns placement and when the loop runs.
 *
 * ## Loading
 *
 * The artwork loads as a plain `<img>` rather than inlined JSX: the files total
 * ~900KB of SVG (149KB gzipped) and would otherwise land in the JS bundle, and
 * this way the browser caches them separately from the app code.
 *
 * Two layers of laziness on top of that, because the path is ~9,000px tall:
 *
 * 1. The `<img>` isn't created at all until the slot nears the viewport
 *    (`hasEntered`), so a first paint fetches two or three files rather than
 *    thirteen. `loading="lazy"` stays on as a native backstop.
 * 2. The idle animation only runs while the figure is actually on screen
 *    (`inView`), so off-screen characters cost nothing per frame.
 *
 * The wrapper keeps its 240px box whether or not the image has mounted, so the
 * observer always has something to measure and nothing shifts on load.
 */
export default function UnitCharacter({
  unitIndex,
  /** Which side of the node column to stand on. */
  side,
  /**
   * Distance from the top of the node column to the point the figure is centred
   * on — the third node's centre, which is what the captures show. Computed by
   * `characterCentreTop`, because only the path knows the unit's nodes.
   */
  centreTop,
}: {
  unitIndex: number;
  side: "left" | "right";
  centreTop: number;
}) {
  const character = characterForUnit(unitIndex);
  const { ref, inView, hasEntered } = useInView<HTMLDivElement>();

  // Face the path: standing left of the column means looking right, and the
  // other way round. Square-on figures are left alone.
  const shouldFace = side === "left" ? "right" : "left";
  const mirrored =
    character.faces !== "forward" && character.faces !== shouldFace;

  // `calc(50% - 19px)` on the near side, running to 16px inside the far edge —
  // so the width is whatever is left between them.
  const near = side === "left" ? "right" : "left";

  return (
    <div
      ref={ref}
      // Decorative; later-in-tree nodes paint above it, and the wrapper is
      // pointer-inert except the ink hitbox inside AnimatedCharacter.
      aria-hidden="true"
      style={{
        height: BOX_HEIGHT,
        // Spans the near inset through to OUTER_MARGIN inside the far edge:
        // (100% - 16) - (50% - 19) = 50% + 3, which is the captured width.
        width: `calc(50% + ${INNER_INSET - OUTER_MARGIN}px)`,
        [near]: `calc(50% - ${INNER_INSET}px)`,
        top: centreTop,
      }}
      // No negative z-index: the wrapper renders before the nodes in the DOM,
      // and both are positioned with auto z, so the nodes paint above it by
      // tree order alone. Negative z pushed this into a layer the column
      // itself out-ranked for hit-testing, which silently ate the figure's
      // hover/click hitbox.
      className="pointer-events-none absolute -translate-y-1/2"
    >
      {hasEntered && (
        // No explicit size: fill the box, and let each square-canvas SVG
        // letterbox itself inside it, which centres the figure exactly as the
        // reference's 299x261 `<img>` does. The wrapper above is
        // pointer-events-none; the animated stack re-enables the pointer only
        // over the figure's ink, so hovers and click-to-celebrate work without
        // this decorative layer ever swallowing a path tap.
        <AnimatedCharacter
          variant={character.name}
          mirrored={mirrored}
          interactive
          // Holds its place in the loop rather than resetting it.
          paused={!inView}
        />
      )}
    </div>
  );
}
