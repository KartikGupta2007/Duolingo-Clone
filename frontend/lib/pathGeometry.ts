/**
 * Where every node and character sits on the path.
 *
 * Pure arithmetic over a unit's skills — no React — so the rules live in one
 * place and the components just position what they're told.
 *
 * ## The spacing rule, recovered from the reference
 *
 * Three units were captured off the real page (an in-progress unit,
 * an unreached one and a completed one). Every node wrapper carries an inline
 * `left` and `margin-top`, and the margins are *not* uniform:
 *
 *   left     0    +44.884   +70    +44.884    0     0
 *   margin  67    11.8533  20.3826 20.3826  11.8533 24
 *
 * Those numbers are a constant-chord layout. Taking `dy = 65 + margin` and
 * `dx` as the horizontal step, `hypot(dx, dy)` comes out at exactly **89.0000**
 * for all five steps in all three units. So consecutive node *centres* are
 * always 89px apart, and the vertical margin is whatever is left once the
 * horizontal step is taken:
 *
 *     margin = sqrt(89^2 - dx^2) - 65
 *
 * which reproduces 24 / 20.3826 / 11.8533 to four decimals. That's why the real
 * path reads as a smooth snake: the step length is fixed, so nodes bunch up
 * vertically exactly where they spread out horizontally. A uniform gap can't do
 * it.
 *
 * The first node instead gets 24, plus 43 more when it carries a START or JUMP
 * pill — which is the captured 67. The last node of a unit adds 24 below.
 *
 * ## Node box heights
 *
 * Duolingo computes those margins as if every node were 65px tall, then lets the
 * real boxes differ, which simply displaces everything below. Two do differ: a
 * chest is 90, and a node wearing a progress ring is 93. Both are confirmed
 * below.
 *
 * ## The character
 *
 * Its wrapper is `height: 260.765px`, spans from `calc(50% - 19px)` to 16px
 * inside the column's far edge, and is vertically centred on the **third node's
 * centre**. That last part is what the captures pin down exactly:
 *
 *   in-progress unit  ring on node 1  -> 3rd centre 289.736  capture 289.736
 *   unreached unit    no ring         -> 3rd centre 261.736  capture 261.736
 *   completed unit    chest 3rd, no pill -> 231.236          capture 231.236
 *
 * Getting all three to three decimals from one formula is the check that the
 * 93px ring box and the 90px chest are right, and it also accounts for the
 * 592x622 column the DevTools overlay reported.
 */

import type { SkillKind, SkillNodeData } from "./types";

/** Distance between consecutive node centres. The whole layout follows from it. */
export const CHORD = 89;

/** Plain node box. The disc itself is 70x65 — slightly wider than tall. */
export const NODE_HEIGHT = 65;
/** A chest is a standalone illustration rather than a disc. */
export const CHEST_HEIGHT = 90;
/** A node wearing a progress ring; the ring is what makes the box taller. */
export const RINGED_HEIGHT = 93;

/** Margin above a unit's first node, before any pill allowance. */
const FIRST_MARGIN = 24;
/** Extra room a START / JUMP HERE pill needs above its node (67 - 24). */
const PILL_CLEARANCE = 43;
/** Below a unit's last node. */
export const LAST_MARGIN_BOTTOM = 24;

/**
 * Horizontal offsets (px) that shape one unit's path, from the column centre.
 *
 * The reference draws one lobe *per unit* rather than a continuous wave: the unit
 * starts centred under its banner, bulges out to one side and returns to centre.
 * The next unit mirrors it. All three captures agree on these stops, and on the
 * side alternating unit by unit.
 */
export const UNIT_LOBE = [0, 44.884, 70, 44.884, 0, 0];

/** Even units bulge right, odd units left. */
export function lobeDirection(unitIndex: number): 1 | -1 {
  return unitIndex % 2 === 0 ? 1 : -1;
}

/** Signed horizontal offset for a node, in px from the column's centre line. */
export function lobeOffset(indexInUnit: number, unitIndex: number): number {
  return (
    lobeDirection(unitIndex) * UNIT_LOBE[indexInUnit % UNIT_LOBE.length]
  );
}

/**
 * Vertical margin above a node.
 *
 * `hasPill` adds the pill's clearance, which is only ever needed by whichever
 * node shows START or JUMP HERE.
 */
export function nodeMarginTop(indexInUnit: number, hasPill: boolean): number {
  const pill = hasPill ? PILL_CLEARANCE : 0;
  if (indexInUnit === 0) return FIRST_MARGIN + pill;

  // Horizontal step from the previous node. Unsigned: only its size matters.
  const dx = Math.abs(
    UNIT_LOBE[indexInUnit % UNIT_LOBE.length] -
      UNIT_LOBE[(indexInUnit - 1) % UNIT_LOBE.length],
  );
  // Whatever of the 89px step is left after moving sideways. Clamped because a
  // hypothetical dx > 89 has no vertical component to give back.
  const dy = dx >= CHORD ? 0 : Math.sqrt(CHORD * CHORD - dx * dx);
  return Math.max(0, dy - NODE_HEIGHT) + pill;
}

/**
 * Whether a node draws the outer progress ring.
 *
 * Every *available* node gets one, including one at zero progress — the captured
 * in-progress unit proves it: its `skill-path-level-0` node is labelled
 * "Lesson 1 of 1" with nothing finished, and still carries the ring SVG with a
 * degenerate (zero-length) progress path. So the ring is the marker for "this is
 * where you are", and the arc inside it is the part that fills in.
 *
 * That's also what makes such a node's box 93px rather than 65 (`RINGED_HEIGHT`),
 * which is what reconciles the reference's 622px column.
 */
export function hasProgressRing(skill: SkillNodeData): boolean {
  // Never a chest: it isn't played, so there is no progress for a ring to show.
  return skill.status === "available" && skill.kind !== "chest";
}

/** Laid-out height of a node's box. */
export function nodeBoxHeight(kind: SkillKind, ringed: boolean): number {
  if (kind === "chest") return CHEST_HEIGHT;
  return ringed ? RINGED_HEIGHT : NODE_HEIGHT;
}

/**
 * Distance from the top of a unit's node column to the centre of its third node,
 * which is where the reference centres that unit's character.
 *
 * Falls back to the last node when a unit has fewer than three, so a short unit
 * still places its character somewhere sensible.
 */
export function characterCentreTop(
  skills: SkillNodeData[],
  /**
   * Indices of nodes carrying a pill. A unit can have two — the current node and
   * a reachable chest — and each one adds clearance above itself, so they all
   * have to be counted or the character drifts off the third node.
   */
  pillIndices: ReadonlySet<number>,
): number {
  const target = Math.min(2, skills.length - 1);
  if (target < 0) return 0;

  let y = 0;
  for (let i = 0; i < target; i += 1) {
    y +=
      nodeMarginTop(i, pillIndices.has(i)) +
      nodeBoxHeight(skills[i].kind, hasProgressRing(skills[i]));
  }
  y += nodeMarginTop(target, pillIndices.has(target));
  return y + nodeBoxHeight(skills[target].kind, hasProgressRing(skills[target])) / 2;
}

/** A chest that's been reached but not yet opened — it offers OPEN. */
export function isClaimableChest(skill: SkillNodeData): boolean {
  return skill.kind === "chest" && skill.status === "available";
}
