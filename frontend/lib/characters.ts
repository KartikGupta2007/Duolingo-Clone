/**
 * The characters that stand beside the path, and how each one moves.
 *
 * Pure data — no React. `UnitCharacter` reads it and renders; keeping the
 * choreography out of the component means adding a character or retuning a
 * motion never touches JSX.
 *
 * ## Why the motion is whole-figure
 *
 * The artwork is a set of Lottie exports captured at frame 0: each file is
 * 37–255 nested `<g>` elements with baked `matrix()` transforms and generated
 * ids (`__lottie_element_4879`). The rig — which group is an arm, and how it
 * moved — lives in the Lottie JSON, which we don't have. So limb-level
 * animation isn't recoverable from these assets; what's here animates each
 * figure as one body, the way an idle loop does.
 *
 * That's also why they're loaded as `<img>` (see UnitCharacter): a browser
 * treats an `<img>` SVG as an isolated document, so page CSS can't reach inside
 * it anyway. The trade is deliberate — ~900KB of SVG stays out of the JS bundle
 * and gets HTTP-cached.
 *
 * ## Anchors are measured, not guessed
 *
 * `originX/Y` is each figure's contact point with the ground, so a rotation
 * pivots at its feet rather than its middle — that's what makes a sway read as
 * weight shifting instead of the whole drawing tilting.
 *
 * It matters for the vertical motion too. Every figure's ground shadow is
 * painted into its own SVG, so translating the element upward lifts the shadow
 * with it and the character looks like it's floating. The bounces are therefore
 * driven by scaling about this pivot, where the shadow sits and a scale has no
 * effect — see the `char-bob` comment in globals.css.
 *
 * The numbers come from rasterising each SVG at its render size (240px) and
 * scanning the alpha channel: `originY` is the lowest painted row (the bottom of
 * the ground shadow) and `originX` the horizontal centre of the ink. Neither is
 * 50% for most of these — the figures aren't centred in their 1080 canvas.
 */

/** One per behaviour below; the value is the CSS class in globals.css. */
export type CharacterMotion =
  | "char-bob"
  | "char-breathe"
  | "char-sway"
  | "char-nod"
  | "char-dribble"
  | "char-strike"
  | "char-toss"
  | "char-roll"
  | "char-paint";

/**
 * One eye, measured off the rasterised artwork (like everything else here):
 * the eyelid AnimatedCharacter draws over it needs a position, a size and the
 * face colour immediately above the eye. Percentages of the square box.
 */
export interface EyeSpec {
  x: number;
  y: number;
  w: number;
  h: number;
  /** The face colour the closed lid takes, sampled just above the sclera. */
  color: string;
}

export interface Character {
  /** File name in `public/characters/`, without the extension. */
  name: string;
  motion: CharacterMotion;
  /**
   * Which way the artwork is drawn looking.
   *
   * A figure should face *toward* the node column, so one standing on the left
   * of the path looks right and vice versa. Where the drawing faces the wrong
   * way for its side, `UnitCharacter` mirrors it. `"forward"` means square-on
   * enough that mirroring would achieve nothing.
   */
  faces: "left" | "right" | "forward";
  /** Ground-contact point, as a percentage of the box. */
  originX: number;
  originY: number;
  /**
   * Left and right edges of the figure's ink, as a percentage of the box.
   *
   * These exist so a figure can be placed by where it *is* rather than by where
   * its box is. The transparent margin around each drawing varies wildly — from
   * 11% to 33% of the box — so one shared offset would leave the narrow figures
   * hugging the path while the padded ones floated a hundred pixels clear of it.
   * `UnitCharacter` subtracts whichever of these faces the path, which lands
   * every figure the same distance from the nodes.
   *
   * Measured the same way as originX/originY: rasterise at the render size and
   * scan the alpha channel for the first and last painted column.
   */
  inkLeft: number;
  inkRight: number;
  /** One loop of the animation. */
  duration: string;
  /**
   * Staggered so thirteen figures don't move in lockstep — and *negative*, so
   * a figure scrolled into view is already mid-cycle instead of standing still
   * through its stagger. A viewer skimming the path sees motion immediately.
   */
  delay: string;
  /**
   * Eyes that can blink, for characters where a lid overlay is *correct*.
   *
   * Found by scanning the raster for white sclera blobs containing a dark
   * pupil, then verified by eye on a debug sheet. Only five characters carry
   * them: the rest either hide their eyes (chef, painter, phone, duo-flowers),
   * wear glasses a skin-coloured lid would glitch across (campfire, scooter,
   * cook-orange), or defeated the scan (bear). No data means no blink — an
   * honest miss beats a lid on the wrong pixel.
   */
  eyes?: EyeSpec[];
}

/**
 * Order matters: a unit picks its character by index, so inserting rather than
 * appending reshuffles which character stands beside which unit.
 *
 * Motion is chosen from what each figure is doing in its pose — the athlete
 * holding a basketball bounces, the karate figure in a forward stance throws a
 * punch, the chef with a pan flips it, the scooter rider rolls.
 */
export const CHARACTERS = [
  // Duo standing, beak and eyes to the right: the plain Duolingo idle.
  { name: "duo-stand", motion: "char-bob", faces: "right", originX: 50.4, originY: 74.2, inkLeft: 32.3, inkRight: 68.8, duration: "2.3s", delay: "0s", eyes: [{ x: 62.6, y: 51.3, w: 5.8, h: 15.1, color: "rgb(137,226,25)" }] },
  // Karate stance facing right, arms up: mostly still, then a sudden strike.
  { name: "karate", motion: "char-strike", faces: "right", originX: 50.4, originY: 85.8, inkLeft: 33.3, inkRight: 67.4, duration: "3.4s", delay: "-0.3s", eyes: [{ x: 52.2, y: 38.8, w: 12.1, h: 5.3, color: "rgb(178,119,97)" }, { x: 60.6, y: 37.5, w: 8.8, h: 9.3, color: "rgb(225,142,112)" }] },
  // Seated bear, square-on and symmetric. Heaviest figure — slow, long period.
  { name: "bear", motion: "char-sway", faces: "forward", originX: 48.3, originY: 88.3, inkLeft: 23.3, inkRight: 73.6, duration: "3.8s", delay: "-0.8s" },
  // Cross-legged, looking down-right at a phone: a small scrolling nod.
  { name: "phone", motion: "char-nod", faces: "right", originX: 50.0, originY: 80.4, inkLeft: 30.6, inkRight: 69.4, duration: "2.6s", delay: "-0.2s" },
  // Duo reading a book held to its right: the same nod, slower, off-phase.
  { name: "duo-reading", motion: "char-nod", faces: "right", originX: 50.2, originY: 85.0, inkLeft: 28.1, inkRight: 72.6, duration: "3.0s", delay: "-0.9s", eyes: [{ x: 45.6, y: 47.8, w: 12.9, h: 11.1, color: "rgb(137,226,25)" }, { x: 58.9, y: 47.5, w: 8.8, h: 11.1, color: "rgb(137,226,25)" }] },
  // Mid-stride, basketball raised on the right: fastest loop, real squash.
  { name: "athlete", motion: "char-dribble", faces: "right", originX: 56.3, originY: 99.2, inkLeft: 23.3, inkRight: 89.2, duration: "1.2s", delay: "0s", eyes: [{ x: 54.7, y: 47.9, w: 9.6, h: 12.4, color: "rgb(244,143,143)" }, { x: 62.5, y: 48.2, w: 7.9, h: 12.4, color: "rgb(244,143,143)" }] },
  // Reaching right to toast a marshmallow over the fire: leans in and back.
  { name: "campfire", motion: "char-sway", faces: "right", originX: 48.3, originY: 95.8, inkLeft: 19.4, inkRight: 77.4, duration: "3.5s", delay: "-0.5s" },
  // Duo lounging, beak and lollipop to the LEFT: the laziest sway of the three.
  { name: "duo-lollipop", motion: "char-sway", faces: "left", originX: 43.1, originY: 74.2, inkLeft: 13.5, inkRight: 72.9, duration: "3.2s", delay: "-1.1s", eyes: [{ x: 39.2, y: 52.5, w: 7.1, h: 12, color: "rgb(137,226,25)" }] },
  // Looking down-right into a pan of food: a flick of the wrist.
  { name: "chef", motion: "char-toss", faces: "right", originX: 50.0, originY: 92.9, inkLeft: 22.6, inkRight: 77.8, duration: "2.5s", delay: "-0.4s" },
  // Riding, handlebars to the right: drifts along its own axis with chatter.
  { name: "scooter", motion: "char-roll", faces: "right", originX: 47.5, originY: 95.0, inkLeft: 23.3, inkRight: 71.5, duration: "2.1s", delay: "-0.6s" },
  // Lying among flowers, beak to the right: the most subtle — breathing only.
  { name: "duo-flowers", motion: "char-breathe", faces: "right", originX: 45.6, originY: 80.8, inkLeft: 19.8, inkRight: 71.9, duration: "4.0s", delay: "-0.2s" },
  // Standing, cheerful and round, turned slightly right: a quicker bob.
  { name: "cook-orange", motion: "char-bob", faces: "right", originX: 51.2, originY: 88.8, inkLeft: 28.1, inkRight: 74.3, duration: "2.1s", delay: "-0.7s" },
  // Brush to a canvas on its LEFT: short strokes, uneven rhythm.
  { name: "painter", motion: "char-paint", faces: "left", originX: 45.4, originY: 82.5, inkLeft: 10.8, inkRight: 79.9, duration: "2.2s", delay: "-0.3s" },
] as const satisfies readonly Character[];

/** The thirteen asset names, as a checkable union. */
export type CharacterName = (typeof CHARACTERS)[number]["name"];

/**
 * A concrete entry from the table — like `Character`, but with `name` kept as
 * its literal type so it feeds `AnimatedCharacter`'s `variant` without a cast.
 */
export type CharacterEntry = (typeof CHARACTERS)[number];

/** Which character stands beside a unit. Wraps, so any unit count works. */
export function characterForUnit(unitIndex: number): CharacterEntry {
  return CHARACTERS[unitIndex % CHARACTERS.length];
}

/** Lookup by asset name — AnimatedCharacter's `variant` prop resolves here. */
export function characterByName(name: CharacterName): CharacterEntry {
  const found = CHARACTERS.find((character) => character.name === name);
  // Unreachable with a CharacterName argument; guards a cast from raw data.
  if (!found) throw new Error(`Unknown character: ${name}`);
  return found;
}

/**
 * Duo himself — the first entry above. For pages that want the mascot rather
 * than a particular unit's character, like the sections overview.
 */
export const DUO = CHARACTERS[0];
