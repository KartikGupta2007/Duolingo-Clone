"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";

import { useUser } from "@/components/shared/UserProvider";
import type { SkillNodeData } from "@/lib/types";
import type { UnitTheme } from "@/lib/unitTheme";

/**
 * The callout that opens when a path node is tapped.
 *
 * The reference shows four different cards depending on the node's state, and
 * they're genuinely different offers rather than one card with fields blanked
 * out, so each is its own small component and `NodePopover` only picks between
 * them:
 *
 *   locked     → why it's locked, and a dead LOCKED button
 *   available  → the lesson's name and START / CONTINUE
 *   completed  → PRACTICE for half XP, plus Legendary
 *   unit review→ the trophy node, which also offers Legendary
 *
 * Every button here navigates to the real player, Legendary included — it opens
 * the challenge in `?mode=legendary`. A skill that has already been beaten keeps
 * the button so the run can be replayed, but says so.
 */

const GOLD = "#FFC800";
const GOLD_DARK = "#E5A100";

/** Card width measured off the reference (≈294 CSS px). */
const WIDTH = 294;

function Card({
  background,
  children,
}: {
  background: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="rounded-2xl px-4 pb-4 pt-3.5 text-left shadow-lg"
      style={{ width: WIDTH, backgroundColor: background }}
    >
      {children}
    </div>
  );
}

function Title({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-[19px] font-extrabold leading-tight text-white">
      {children}
    </h3>
  );
}

/** Muted body copy — white at low opacity so it works on every unit colour. */
function Body({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-1.5 text-[15px] font-bold leading-snug text-white/70">
      {children}
    </p>
  );
}

/**
 * A chunky action button. `tone` picks the reference's two treatments: a white
 * button whose label takes the unit colour, or the gold Legendary one.
 */
function Action({
  label,
  tone,
  colour,
  href,
  onClick,
  disabled = false,
}: {
  label: string;
  tone: "light" | "gold" | "dead";
  /** The unit's colour, used as the label colour on a light button. */
  colour: string;
  href?: string;
  onClick?: () => void;
  disabled?: boolean;
}) {
  const styles = {
    light: { backgroundColor: "#FFFFFF", color: colour, boxShadow: "0 4px 0 #E5E5E5" },
    gold: { backgroundColor: GOLD, color: "#4B3200", boxShadow: `0 4px 0 ${GOLD_DARK}` },
    dead: { backgroundColor: "#42565F", color: "#8DA1AC", boxShadow: "none" },
  }[tone];

  const className = [
    "mt-3 block w-full rounded-xl py-2.5 text-center text-[15px] font-extrabold uppercase tracking-wide",
    disabled ? "cursor-not-allowed" : "transition-transform active:translate-y-[2px]",
  ].join(" ");

  if (href && !disabled) {
    return (
      <Link href={href} className={className} style={styles}>
        {label}
      </Link>
    );
  }
  return (
    <button
      type="button"
      className={className}
      style={styles}
      onClick={onClick}
      disabled={disabled}
    >
      {label}
    </button>
  );
}

export default function NodePopover({
  skill,
  theme,
  onClose,
}: {
  skill: SkillNodeData;
  theme: UnitTheme;
  onClose: () => void;
}) {
  const { user } = useUser();
  const box = useRef<HTMLDivElement>(null);

  // Dismiss on Escape or on a press anywhere outside the card. `pointerdown`
  // rather than `click` so the card closes before a tap on another node is
  // treated as opening that one.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    const onDown = (event: PointerEvent) => {
      const target = event.target as Element | null;
      if (box.current?.contains(target as Node)) return;
      // Ignore presses on this node's own button. It already toggles on click,
      // and closing here first would make that click reopen the card.
      if (target?.closest?.(`[data-node-id="${skill.id}"]`)) return;
      onClose();
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onDown);
    };
  }, [onClose, skill.id]);

  const locked = skill.status === "locked";
  const completed = skill.status === "completed";
  const href = `/lesson/${skill.id}`;
  // The challenge runs in the same player, told apart by the query string.
  const legendaryHref = `/lesson/${skill.id}?mode=legendary`;

  // Fall back to the server's defaults being absent only on first paint.
  const xpLesson = user?.xp_per_lesson ?? 10;
  const xpPractice = user?.xp_per_practice ?? 5;
  const xpLegendary = user?.legendary_xp ?? 40;

  if (locked) {
    return (
      <Shell skill={skill} colour="#37464F" boxRef={box}>
        <Card background="#37464F">
          <h3 className="text-[19px] font-extrabold leading-tight text-duo-muted">
            {skill.title}
          </h3>
          <p className="mt-1.5 text-[15px] font-bold leading-snug text-duo-muted">
            Complete all levels above to unlock this!
          </p>
          <Action label="Locked" tone="dead" colour={theme.base} disabled />
        </Card>
      </Shell>
    );
  }

  // The trophy keeps its own line whether it's done or not — in the reference
  // it's a unit-wide goal, not a lesson with a progress count.
  const isReview = skill.kind === "review";
  const body = skill.is_legendary
    ? "Legendary earned. Run it again to keep it sharp."
    : isReview
      ? "Earn Legendary on every level to unlock the final trophy!"
      : completed
        ? "Prove your proficiency with Legendary"
        : // Real counts, not decoration — a two-lesson node says "1 of 2".
          `Lesson ${Math.min(skill.lessons_completed + 1, skill.total_lessons)} of ${skill.total_lessons}`;

  const primaryLabel = completed
    ? `Practice +${xpPractice} XP`
    : `${skill.lessons_completed > 0 ? "Continue" : "Start"} +${xpLesson} XP`;

  return (
    <Shell skill={skill} colour={theme.base} boxRef={box}>
      <Card background={theme.base}>
        <Title>{skill.title}</Title>
        <Body>{body}</Body>
        <Action
          label={primaryLabel}
          tone="light"
          colour={theme.base}
          href={href}
        />
        {/* Legendary needs the skill finished first — the review node advertises
            it before then, but can't offer the run. */}
        {completed ? (
          <Action
            label={
              skill.is_legendary
                ? `Replay Legendary +${xpLegendary} XP`
                : `Legendary +${xpLegendary} XP`
            }
            tone="gold"
            colour={theme.base}
            href={legendaryHref}
          />
        ) : (
          isReview && (
            <Action
              label="Go to Legendary"
              tone="dead"
              colour={theme.base}
              disabled
            />
          )
        )}
      </Card>
    </Shell>
  );
}

/** Positioning, the pointer arrow, and the dialog role — shared by every card. */
function Shell({
  skill,
  colour,
  boxRef,
  children,
}: {
  skill: SkillNodeData;
  colour: string;
  boxRef: React.RefObject<HTMLDivElement | null>;
  children: React.ReactNode;
}) {
  return (
    <div
      ref={boxRef}
      role="dialog"
      aria-label={skill.title}
      // Sits below the node and centred on it. Lifting it above the following
      // nodes is done by SkillNode raising the whole wrapper — see the note there.
      className="absolute left-1/2 top-full -translate-x-1/2 pt-3"
    >
      {/* The pointer back up at the node, in the card's own colour. */}
      <div
        aria-hidden="true"
        className="absolute left-1/2 top-[5px] h-4 w-4 -translate-x-1/2 rotate-45 rounded-[3px]"
        style={{ backgroundColor: colour }}
      />
      {children}
    </div>
  );
}
