/**
 * Decoration for the quests page.
 *
 * Neither of these was among the captured assets, so both are composed from
 * pieces this project already has rather than invented wholesale: the banner
 * reuses Duo and the treasure chest, and the badge is drawn around the existing
 * quest bolt.
 */

import DuoAsset from "@/components/shared/duoAssets";

type ArtProps = { className?: string };

/** Four-pointed sparkles, as the reference scatters around the banner's Duo. */
function Sparkle({ className = "" }: ArtProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        fill="#FFFFFF"
        d="M12 0c.7 6.4 4.9 10.6 11.3 11.3C16.9 12 12.7 16.2 12 22.6 11.3 16.2 7.1 12 .7 11.3 7.1 10.6 11.3 6.4 12 0Z"
        opacity=".9"
      />
    </svg>
  );
}

/**
 * Duo holding up a treasure chest, for the purple welcome banner.
 *
 * Composed rather than a single file: `duo-stand.svg` plus the path's open chest,
 * with the chest lifted above him.
 *
 * The odd numbers below are why this needs explaining. `duo-stand.svg` is a
 * square canvas on which Duo occupies only ~36.5% of the width and ~42% of the
 * height (measured by alpha-scanning — see `lib/characters.ts`), so rendering it
 * at slot size draws a tiny Duo in a large transparent box. To get the ~118px
 * figure the reference shows, the image has to be **324px** and then offset so
 * the ink — not the box — lands in the slot:
 *
 *   ink at 324px:  x 105..223, bottom y 240
 *   offset -69/-56 puts it at x 36..154, y 47..184 inside a 190x190 slot
 *
 * which centres him and stands him on the slot's floor, leaving room for the
 * chest above his head rather than on it.
 */
const DUO_BOX = 324;
const DUO_OFFSET_X = -69;
const DUO_OFFSET_Y = -56;

export function QuestsBannerArt({ className = "" }: ArtProps) {
  return (
    <div className={`relative overflow-hidden ${className}`} aria-hidden="true">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/characters/duo-stand.svg"
        alt=""
        // max-w-none matters: Tailwind's preflight caps images at `max-width:
        // 100%`, which would shrink this 324px image to the 190px slot and undo
        // the whole point of oversizing it.
        className="absolute max-w-none"
        style={{
          width: DUO_BOX,
          height: DUO_BOX,
          left: DUO_OFFSET_X,
          top: DUO_OFFSET_Y,
        }}
      />
      {/* Above his head and a touch to the right, as the reference holds it. */}
      <DuoAsset
        name="chestOpen"
        height={56}
        className="absolute left-[84px] top-0 block"
      />
      <Sparkle className="absolute left-3 top-16 h-4 w-4" />
      <Sparkle className="absolute right-2 top-7 h-3 w-3" />
      <Sparkle className="absolute left-[58px] top-2 h-2.5 w-2.5" />
    </div>
  );
}

/**
 * The gold badge on the monthly-challenge card: a coin struck with the quest
 * bolt, over a soft green leaf like the reference's.
 */
export function MonthlyBadgeArt({ className = "h-[104px] w-[112px]" }: ArtProps) {
  return (
    <svg viewBox="0 0 112 104" className={className} aria-hidden="true">
      {/* Leaf behind the coin. */}
      <path
        fill="#7DD635"
        d="M62 6c22-4 42 8 46 26-16 6-24 20-26 34-12-4-22-14-24-28-2-12-2-24 4-32Z"
        opacity=".85"
      />
      <circle cx="52" cy="60" r="38" fill="#E5A100" />
      <circle cx="52" cy="56" r="34" fill="#FFC800" />
      <circle cx="52" cy="56" r="27" fill="#FFD900" />
      {/* The same bolt the quest rows use, struck into the coin. */}
      <path
        fill="#FF9600"
        d="M60 32 44 56c-.7 1 0 2.4 1.2 2.4h6.4l-2.6 13.4L65 47.6c.7-1 0-2.4-1.2-2.4h-6.4L60 32Z"
      />
    </svg>
  );
}
