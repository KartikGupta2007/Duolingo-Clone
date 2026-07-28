"use client";

import { useId } from "react";

/**
 * Illustrations used only by the stat popovers.
 *
 * Duolingo's own artwork for these (the outlined streak flame, the Friend Streaks
 * pair) isn't among the assets supplied with this project, so
 * these are drawn locally to match what the reference shows — same silhouette,
 * palette and weight, not a copy of their files. They're inline rather than
 * static SVGs because each is a few hundred bytes and takes `currentColor`
 * nowhere: the colours are the illustration.
 *
 * Kept out of `icons.tsx` on purpose. That file is single-colour glyphs that
 * inherit size and colour from a className; these are multi-colour pictures with
 * fixed palettes, which is a different thing with different rules.
 */

type ArtProps = { className?: string };

/**
 * The big outlined flame in the streak card's header.
 *
 * The reference draws it as a thick white outline around an orange body with a
 * lighter inner droplet, which is what makes it read on the amber background —
 * a flat flame in the header's own orange would disappear into it.
 */
export function StreakFlameArt({ className = "h-[76px] w-[64px]" }: ArtProps) {
  return (
    <svg viewBox="0 0 100 118" className={className} aria-hidden="true">
      <path
        fill="#FF9600"
        stroke="#FFFFFF"
        strokeWidth="7"
        strokeLinejoin="round"
        d="M52 6c-6 18-20 28-29 40C14 58 10 68 10 78c0 20 18 35 40 35s40-15 40-35c0-13-7-24-17-34C61 32 52 22 52 6Z"
      />
      {/* Inner droplet — the lighter core the reference shows low and centred. */}
      <path
        fill="#FFC800"
        d="M50 56c-4 10-13 16-13 26a13 13 0 0 0 26 0c0-9-9-16-13-26Z"
      />
    </svg>
  );
}


/**
 * Duo and a friend beside a flame, for the Friend Streaks card.
 *
 * Sits on the card's orange-red, so everything here is drawn light enough to
 * hold against it.
 */
export function FriendStreakArt({ className = "h-[104px] w-[98px]" }: ArtProps) {
  return (
    <svg viewBox="0 0 98 108" className={className} aria-hidden="true">
      {/* Flame, up between the two figures. */}
      <path
        fill="#FFC800"
        stroke="#FFFFFF"
        strokeWidth="4.5"
        strokeLinejoin="round"
        d="M40 3c-3 11-10 16-15 23-4 6-5 11-5 16a20 20 0 0 0 40 0c0-7-5-14-11-21-5-6-9-11-9-18Z"
      />
      <path fill="#FF9600" d="M38 36c-3 6-8 10-8 16a8 8 0 0 0 16 0c0-6-5-10-8-16Z" />

      {/* Friend: hair behind, shoulders, face, then the fringe over the top. */}
      <path fill="#7C3AED" d="M53 66a19 19 0 0 1 38 0v42H53Z" />
      <path fill="#2E2340" d="M55 108V86a17 17 0 0 1 34 0v22Z" />
      <circle cx="72" cy="62" r="16" fill="#F0B08A" />
      <path
        fill="#7C3AED"
        d="M56 61a16 16 0 0 1 32 0c0-12-7-20-16-20s-16 8-16 20Z"
      />

      {/* Duo in front, turned toward the friend. */}
      <ellipse cx="30" cy="79" rx="25" ry="24" fill="#58CC02" />
      <ellipse cx="30" cy="100" rx="19" ry="4.5" fill="#43A303" />
      <circle cx="23" cy="72" r="8.5" fill="#FFFFFF" />
      <circle cx="39" cy="72" r="8.5" fill="#FFFFFF" />
      <circle cx="24.5" cy="73" r="4.1" fill="#3C2415" />
      <circle cx="40.5" cy="73" r="4.1" fill="#3C2415" />
      <path fill="#FF9600" d="M23 83h14l-7 8.5Z" />
    </svg>
  );
}

/**
 * One heart in the hearts card's five-pip row.
 *
 * An unfilled pip is a *pale pink* heart, not a grey one — the reference keeps
 * the heart shape visible so the row always reads as "4 of 5" rather than as
 * four hearts next to an empty hole.
 */
export function HeartPip({
  filled,
  className = "h-7 w-7",
}: ArtProps & { filled: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        fill={filled ? "#FF4B4B" : "#F8D3D3"}
        d="M12 21S3.5 15.4 3.5 9.6A4.9 4.9 0 0 1 12 6.3a4.9 4.9 0 0 1 8.5 3.3C20.5 15.4 12 21 12 21Z"
      />
      {filled && (
        <path
          fill="#FFFFFF"
          opacity=".38"
          d="M7.6 7.2c1.3 0 2.4 1 2.4 2.3S8.9 11.8 7.6 11.8 5.2 10.8 5.2 9.5s1.1-2.3 2.4-2.3Z"
        />
      )}
    </svg>
  );
}

/** A red heart with the white rim the reference gives the "refill" row. */
export function OutlinedHeartIcon({ className = "h-8 w-8" }: ArtProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        fill="#FF4B4B"
        stroke="#FFFFFF"
        strokeWidth="1.6"
        strokeLinejoin="round"
        d="M12 20.4S4.3 15.2 4.3 9.8A4.4 4.4 0 0 1 12 6.8a4.4 4.4 0 0 1 7.7 3c0 5.4-7.7 10.6-7.7 10.6Z"
      />
    </svg>
  );
}

/**
 * The Super "unlimited hearts" mark: a heart under a green-blue-purple gradient
 * with an infinity sign cut into it.
 *
 * The gradient needs a document-unique id, so it comes from `useId` rather than
 * a literal — two of these on one page with the same id would both take the
 * first one's stops.
 */
export function InfinityHeartIcon({ className = "h-8 w-8" }: ArtProps) {
  const gradientId = `infinity-heart-${useId()}`;
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#58CC02" />
          <stop offset="50%" stopColor="#1CB0F6" />
          <stop offset="100%" stopColor="#CE82FF" />
        </linearGradient>
      </defs>
      <path
        fill={`url(#${gradientId})`}
        d="M12 21S3.5 15.4 3.5 9.6A4.9 4.9 0 0 1 12 6.3a4.9 4.9 0 0 1 8.5 3.3C20.5 15.4 12 21 12 21Z"
      />
      <path
        fill="none"
        stroke="#FFFFFF"
        strokeWidth="1.5"
        strokeLinecap="round"
        d="M8.4 13.4a1.9 1.9 0 1 1 1.9-1.9 1.9 1.9 0 0 0 1.9 1.9 1.9 1.9 0 1 0-1.9-1.9 1.9 1.9 0 0 1-1.9 1.9Z"
      />
    </svg>
  );
}

/** Small gem for inline prices, sized to sit on a text baseline. */
export function GemPip({ className = "h-[19px] w-[19px]" }: ArtProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path fill="#1CB0F6" d="M7 3h10l4 6-9 12L3 9l4-6Z" />
      <path fill="#FFFFFF" opacity=".35" d="M7 3h5l-2 6H3l4-6Z" />
    </svg>
  );
}
