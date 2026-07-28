"use client";

import NodePopover from "@/components/path/NodePopover";
import DuoAsset, { type DuoAssetName } from "@/components/shared/duoAssets";
import {
  hasProgressRing,
  isClaimableChest,
  lobeOffset,
  nodeBoxHeight,
  nodeMarginTop,
  LAST_MARGIN_BOTTOM,
} from "@/lib/pathGeometry";
import { LEGENDARY_NODE, LOCKED_NODE, unitTheme } from "@/lib/unitTheme";
import type { SkillKind, SkillNodeData, SkillStatus } from "@/lib/types";

/**
 * One node on the path.
 *
 * All of its placement — the horizontal lobe offset, the margin above it, the
 * height of its box — comes from `lib/pathGeometry`, which documents how those
 * rules were recovered from the captured reference units. The short version: node
 * centres are a constant 89px apart, so the vertical margin shrinks as the
 * sideways step grows.
 */

// The disc from the reference: 70 x 65, i.e. slightly wider than tall.
const NODE_WIDTH = 70;

/**
 * The progress ring. The reference draws it in a 0-100 viewBox with the track
 * from r=50 to r=42 — an 8/100 stroke — and makes the node's box 93px tall, which
 * is where `RINGED_HEIGHT` comes from.
 */
const RING_BOX = 93;

/**
 * Fill behind the START / JUMP HERE pill.
 *
 * Sampled off the reference crop, which shows a solid slate card with no rim —
 * lighter than `duo-card` and close to the ring's own grey. `duo-card` plus a
 * border read as a thin outline instead, which the reference doesn't have.
 */
const PILL_BG = "#2B3A42";
const RING_STROKE = 8;
const RING_RADIUS = 46;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

/**
 * Which glyph a node shows, and whether that file needs forcing to white.
 *
 * The reference ships one glyph per role. Its locked glyphs are grey (#52656D)
 * and its available/completed ones are white, but it has no *available* story,
 * practice or review glyph — those states never appear in the capture. Rather
 * than draw substitutes, the grey file is reused and inverted to white, which is
 * exactly the same artwork in the colour the state calls for.
 */
function glyphFor(
  kind: SkillKind,
  status: SkillStatus,
  isJumpTarget: boolean,
): { name: DuoAssetName; forceWhite: boolean } {
  if (isJumpTarget) return { name: "nodeJump", forceWhite: false };

  if (status === "completed") {
    return kind === "review"
      ? { name: "nodeReviewDone", forceWhite: false }
      : { name: "nodeDone", forceWhite: false };
  }

  const locked = status === "locked";
  if (kind === "lesson") {
    return locked
      ? { name: "nodeLesson", forceWhite: false }
      : { name: "nodeLessonActive", forceWhite: false };
  }

  const byKind: Record<Exclude<SkillKind, "lesson" | "chest">, DuoAssetName> = {
    story: "nodeStory",
    practice: "nodePractice",
    review: "nodeReview",
  };
  const name = byKind[kind as Exclude<SkillKind, "lesson" | "chest">];
  return { name, forceWhite: !locked };
}

interface SkillNodeProps {
  skill: SkillNodeData;
  /** Position within its own unit — the lobe restarts at every unit. */
  indexInUnit: number;
  /**
   * Zero-based unit index. Picks the node's colour, and which way the unit's
   * lobe bulges: even units go right, odd units left.
   */
  unitIndex: number;
  /** Adds the 24px the reference puts below a unit's last node. */
  isLastInUnit: boolean;
  /** The single node that gets the floating START pill. */
  isCurrent: boolean;
  /**
   * This node is the entry point of a unit the learner hasn't reached, so it
   * offers "JUMP HERE?" instead of being drawn as locked.
   */
  isJumpTarget?: boolean;
  onJump?: () => void;
  /** Collect a reached treasure chest. Only ever set on a claimable chest. */
  onOpenChest?: () => void;
  /** Whether this node's popover is the one currently open. */
  isOpen?: boolean;
  /** Toggle this node's popover. The path owns which one is open, so opening a
   *  second node closes the first. */
  onToggle?: () => void;
  onClosePopover?: () => void;
}

export default function SkillNode({
  skill,
  indexInUnit,
  unitIndex,
  isLastInUnit,
  isCurrent,
  isJumpTarget = false,
  onJump,
  onOpenChest,
  isOpen = false,
  onToggle,
  onClosePopover,
}: SkillNodeProps) {
  const locked = skill.status === "locked";
  const completed = skill.status === "completed";
  const theme = unitTheme(unitIndex);
  const reachable = !locked || isJumpTarget;

  const offset = lobeOffset(indexInUnit, unitIndex);
  // A reached chest offers OPEN whether or not it's the *current* node — the
  // current node is the first available skill, which is often a lesson further
  // back up the path.
  const claimable = isClaimableChest(skill);
  const hasPill = isJumpTarget || isCurrent || claimable;
  const ringed = hasProgressRing(skill);
  const marginTop = nodeMarginTop(indexInUnit, hasPill);
  const boxHeight = nodeBoxHeight(skill.kind, ringed);

  // The chest is a standalone illustration, not a coloured circle — the
  // reference gives it its own 80x90 artwork with nothing behind it, and a
  // different file once the unit is finished.
  const isChestArt = skill.kind === "chest" && !isJumpTarget;

  /**
   * An unlocked chest does nothing when clicked.
   *
   * It's a reward marker, not a lesson — there is nothing to start, so a popover
   * offering to would be a dead end. The reference agrees: its chest button
   * carries `disabled` in both the unopened and opened states. A *locked* chest
   * keeps its callout, since "complete the levels above to unlock this" is real
   * information.
   */
  /**
   * An *opened* chest does nothing when tapped.
   *
   * It's a spent reward marker — there is nothing left to collect, so a callout
   * offering to would be a dead end, and the reference's opened chest carries
   * `disabled` too. The other two states do respond: a claimable chest opens
   * (see `onOpenChest`), and a locked one explains why it's locked.
   */
  const isInertChest = isChestArt && completed;

  // A jump target is locked but still reachable, so it takes the unit's colour.
  // A Legendary skill outranks both — the badge is the point of it.
  const colours = skill.is_legendary
    ? LEGENDARY_NODE
    : reachable
      ? theme
      : LOCKED_NODE;
  const glyph = glyphFor(skill.kind, skill.status, isJumpTarget);

  const circle = isChestArt ? (
    <div
      className={
        reachable
          ? "transition-transform duration-75 hover:brightness-110 active:translate-y-[3px]"
          : "cursor-not-allowed"
      }
    >
      {/* Grey only while locked. The reference uses its gold chest for both the
          reachable and the opened state — what tells them apart is the OPEN pill,
          not the artwork. */}
      <DuoAsset name={locked ? "chestClosed" : "chestOpen"} />
    </div>
  ) : (
    <div
      className={[
        "relative flex items-center justify-center rounded-[50%]",
        "transition-[transform,box-shadow,filter] duration-75",
        reachable
          ? "hover:brightness-110 active:translate-y-[3px]"
          : "cursor-not-allowed",
      ].join(" ")}
      style={{
        width: NODE_WIDTH,
        height: 65,
        backgroundColor: colours.base,
        boxShadow: `0 6px 0 ${colours.dark}`,
      }}
    >
      {/* Lighter top face. The reference nodes aren't flat discs — they have a
          highlight inset from the top with a darker rim showing at the bottom. */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-[5px] top-[4px] bottom-[12px] rounded-[50%] bg-white/20"
      />
      <DuoAsset
        name={glyph.name}
        className={`relative block ${glyph.forceWhite ? "[filter:brightness(0)_invert(1)]" : ""}`}
      />
    </div>
  );

  // Nodes carry no visible label in the reference — the unit banner and
  // separator name the content. The title stays available to assistive tech and
  // on hover so nothing is lost.
  const label = isJumpTarget
    ? `Jump ahead to ${skill.title}`
    : `${skill.title} — ${
        locked
          ? "locked"
          : `${skill.lessons_completed} of ${skill.total_lessons} lessons complete`
      }`;

  /**
   * The floating pill above a node: START on the current one, JUMP HERE? on a
   * jump target. `aria-hidden`, as in the reference — the button's own label
   * already says what it does, so announcing "START" adds noise.
   */
  const pill = (text: string, colour: string, onPress?: () => void) => (
    <div
      aria-hidden="true"
      className={`absolute -top-10 z-10 animate-float-pill ${
        onPress ? "cursor-pointer" : "pointer-events-none"
      }`}
      // The chest's OPEN tag is part of its hit area, so tapping the tag opens
      // the chest just as tapping the chest does. Still aria-hidden: the button
      // below carries the accessible name, and this would only duplicate it.
      onClick={onPress}
    >
      {/* 17px text with 16/12px padding, giving the ~90x45 card the reference
          crop measures. Its label takes the unit's colour, so the pill above a
          pink unit reads pink. */}
      <div
        className="relative whitespace-nowrap rounded-xl px-4 py-3 text-[17px] font-extrabold uppercase tracking-wide leading-5"
        style={{ color: colour, backgroundColor: PILL_BG }}
      >
        {text}
        {/* The tail. Sits just far enough down to touch the ring's top edge, as
            in the reference, rather than floating clear of it. */}
        <div
          className="absolute left-1/2 top-full h-3 w-3 -translate-x-1/2 -translate-y-1.5 rotate-45 rounded-[2px]"
          style={{ backgroundColor: PILL_BG }}
        />
      </div>
    </div>
  );

  return (
    <div
      // Lets the open popover tell "pressed my own node" apart from
      // "pressed somewhere else", and doubles as a test hook.
      data-node-id={skill.id}
      className="relative flex flex-col items-center justify-center"
      style={{
        // The lobe. Not a Tailwind class because it's a per-node number.
        transform: `translateX(${offset}px)`,
        marginTop,
        marginBottom: isLastInUnit ? LAST_MARGIN_BOTTOM : 0,
        height: boxHeight,
        // The translateX above makes this wrapper its own stacking context, so a
        // z-index on the popover inside it can't lift it over the *following*
        // nodes — they'd paint straight across the open card. Raising the whole
        // wrapper is what actually works. 20 stays under the sticky unit banner
        // (z-30), so the card slides beneath the header rather than over it.
        zIndex: isOpen ? 20 : undefined,
      }}
    >
      {isJumpTarget
        ? pill("Jump here?", theme.base)
        : claimable
          ? // Collected, not started — so OPEN rather than START, and tapping it
            // is what opens the chest.
            pill("Open", theme.base, onOpenChest)
          : isCurrent
            ? pill("Start", theme.base)
            : null}

      <div className="relative flex items-center justify-center">
        {/* The outer ring, on every available node — see hasProgressRing. The
            track is always drawn; the coloured arc is the part that fills as
            lessons are finished, so a freshly-unlocked node shows an empty ring
            rather than nothing. Locked and completed nodes have none: a ring in
            the node's own colour would just read as a halo. Derived from status
            and the lesson counts, so §4 needs no extra column. */}
        {ringed && (
          <svg
            width={RING_BOX}
            height={RING_BOX}
            viewBox="0 0 100 100"
            className="absolute -rotate-90"
            aria-hidden="true"
          >
            <circle
              cx="50"
              cy="50"
              r={RING_RADIUS}
              fill="none"
              stroke="#37464F"
              strokeWidth={RING_STROKE}
            />
            <circle
              cx="50"
              cy="50"
              r={RING_RADIUS}
              fill="none"
              stroke={colours.base}
              strokeWidth={RING_STROKE}
              strokeLinecap="round"
              strokeDasharray={RING_CIRCUMFERENCE}
              strokeDashoffset={
                RING_CIRCUMFERENCE * (1 - Math.min(skill.progress, 1))
              }
              className="transition-[stroke-dashoffset] duration-500"
            />
          </svg>
        )}

        {isJumpTarget ? (
          <button type="button" onClick={onJump} aria-label={label} title={label}>
            {circle}
          </button>
        ) : isInertChest ? (
          // Disabled rather than a button with no handler, so it also stops
          // taking focus and announces itself correctly.
          <button type="button" disabled aria-label={label} title={label}>
            {circle}
          </button>
        ) : claimable ? (
          <button
            type="button"
            onClick={onOpenChest}
            aria-label={`Open ${skill.title}`}
            title="Open"
          >
            {circle}
          </button>
        ) : (
          // Every node — locked ones included — opens a popover rather than
          // navigating. The popover carries the action, which is what lets a
          // locked node explain itself instead of being inert.
          <button
            type="button"
            onClick={onToggle}
            aria-label={label}
            aria-expanded={isOpen}
            title={label}
          >
            {circle}
          </button>
        )}
      </div>

      {isOpen && !isJumpTarget && (
        <NodePopover
          skill={skill}
          theme={theme}
          onClose={() => onClosePopover?.()}
        />
      )}
    </div>
  );
}
