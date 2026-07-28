/**
 * The reference's own SVG artwork — the wordmark, the eight nav icons, the course
 * flag and the three stat icons.
 *
 * Sourced from asset URLs captured off the reference page, but **downloaded
 * into `public/duo/`** rather than hotlinked: the app then still
 * renders with no network, doesn't depend on someone else's CDN staying up, and
 * gets ordinary static-asset caching on whatever host it's deployed to.
 *
 * ## Why the logo is a picture and not styled text
 *
 * The wordmark is set in `duolingo-sans`, a licensed font that isn't obtainable —
 * the captured styles name it on every rule, and Nunito is this project's
 * substitute for body text. But the logo doesn't need the font: the
 * reference serves it as a *path* SVG, so using that file reproduces the
 * letterforms exactly, which no amount of font-matching on live text could.
 *
 * ## Sizes
 *
 * Each entry's `aspect` is its file's real viewBox ratio, so width is derived
 * rather than typed in twice and can't drift from the artwork:
 *
 *   logo    283.4 x 66.4  ->  30px tall gives 128.0px wide  (sample: 128 x 30)
 *   flag-en     70 x 54   ->  23.9143 tall gives 31.0 wide  (sample: 31 x 23.9143)
 *
 * Both land exactly on the numbers in the capture, which is the check that the
 * heights below are the ones the reference actually uses. The nav icons are
 * square at 32px (`.s10`). The capture gives no size for streak/gem/heart, so
 * those heights are measured off the reference screenshot instead.
 */

const ASSETS = {
  logo: { file: "logo", aspect: 283.4 / 66.4, height: 30 },

  navLearn: { file: "nav-learn", aspect: 1, height: 32 },
  navLetters: { file: "nav-letters", aspect: 1, height: 32 },
  navPractice: { file: "nav-practice", aspect: 1, height: 32 },
  navLeaderboards: { file: "nav-leaderboards", aspect: 1, height: 32 },
  navQuests: { file: "nav-quests", aspect: 1, height: 32 },
  navShop: { file: "nav-shop", aspect: 1, height: 32 },
  navMore: { file: "nav-more", aspect: 1, height: 32 },

  flag: { file: "flag-en", aspect: 70 / 54, height: 23.9143 },
  streak: { file: "streak", aspect: 25 / 30, height: 30 },
  gem: { file: "gem", aspect: 24 / 30, height: 29 },
  heart: { file: "heart", aspect: 34 / 34, height: 27 },

  // Path-node glyphs. These sit *on* a coloured disc rather than being the disc,
  // which is why the per-unit colour cycle survives using them: the reference
  // reuses one glyph file across every unit and colours the button underneath.
  // The three "white" ones ship white; the rest ship grey (#52656D) for locked
  // nodes and get forced white when their node is reachable — see SkillNode.
  nodeLessonActive: { file: "node-lesson-active", aspect: 42 / 34, height: 34 },
  nodeDone: { file: "node-done", aspect: 42 / 34, height: 34 },
  nodeReviewDone: { file: "node-review-done", aspect: 42 / 34, height: 34 },
  nodeJump: { file: "node-jump", aspect: 42 / 34, height: 34 },
  nodeStory: { file: "node-story", aspect: 42 / 34, height: 34 },
  nodeLesson: { file: "node-lesson", aspect: 31 / 29, height: 29 },
  nodePractice: { file: "node-practice", aspect: 42 / 34, height: 34 },
  nodeReview: { file: "node-review", aspect: 42 / 34, height: 34 },

  // Whole illustrations, not glyphs — 80x90, which is the size this project was
  // already drawing its own chest at.
  chestClosed: { file: "chest-closed", aspect: 80 / 90, height: 90 },
  chestOpen: { file: "chest-open", aspect: 80 / 90, height: 90 },

  // The gems card's chest-of-gems, from the captured element markup.
  gemChest: { file: "gem-chest", aspect: 1, height: 80 },
  superMascot: { file: "super-mascot", aspect: 121 / 116, height: 86 },
  leagueLocked: { file: "league-locked", aspect: 40 / 46, height: 56 },

  // --- Leaderboard, from the captured reference markup ----------------------
  // The header is ten tiers: the one you're in at 80x91, then nine locked ones
  // at 52x58 (`grid-template-columns: 80px 52px x9`, 28px gap).
  leagueBronze: { file: "league-bronze", aspect: 53 / 59, height: 91 },
  leagueTierLocked: { file: "league-tier-locked", aspect: 47 / 52, height: 58 },
  // Ranks 1-3. Identified by colour: #FFC800 gold, #C2D1DD silver, #CD7900 bronze.
  medalGold: { file: "medal-gold", aspect: 41 / 42, height: 42 },
  medalSilver: { file: "medal-silver", aspect: 41 / 42, height: 42 },
  medalBronze: { file: "medal-bronze", aspect: 41 / 42, height: 42 },
  promoArrow: { file: "promo-arrow", aspect: 1, height: 24 },

  // The twelve status tiles. The sixth is the course flag, reused — which is why
  // the numbering skips 06.
  status01: { file: "status-01", aspect: 42 / 28, height: 42 },
  status02: { file: "status-02", aspect: 1, height: 44 },
  status03: { file: "status-03", aspect: 49 / 50, height: 44 },
  status04: { file: "status-04", aspect: 48 / 50, height: 44 },
  status05: { file: "status-05", aspect: 51 / 50, height: 44 },
  status07: { file: "status-07", aspect: 38 / 25, height: 42 },
  status08: { file: "status-08", aspect: 50 / 51, height: 44 },
  status09: { file: "status-09", aspect: 1, height: 44 },
  status10: { file: "status-10", aspect: 51 / 50, height: 44 },
  status11: { file: "status-11", aspect: 67 / 68, height: 44 },
  status12: { file: "status-12", aspect: 1, height: 44 },

  // Daily-quest artwork, from the element capture (`images/goals/...`).
  questBolt: { file: "quest-bolt", aspect: 1, height: 48 },
  questChest: { file: "quest-chest", aspect: 34 / 36, height: 36 },
  statusEmpty: { file: "status-empty", aspect: 38 / 37, height: 36 },
} as const;

export type DuoAssetName = keyof typeof ASSETS;

export default function DuoAsset({
  name,
  /** Overrides the reference height; width still follows the artwork's aspect. */
  height,
  /** Empty by default — these sit next to their own label almost everywhere. */
  alt = "",
  className = "block",
}: {
  name: DuoAssetName;
  height?: number;
  alt?: string;
  className?: string;
}) {
  const asset = ASSETS[name];
  const h = height ?? asset.height;
  return (
    // A plain <img> rather than next/image: these are a few hundred bytes each
    // and already vector, so there is nothing for the optimiser to do.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`/duo/${asset.file}.svg`}
      alt={alt}
      width={Math.round(h * asset.aspect)}
      height={Math.round(h)}
      style={{ height: h, width: h * asset.aspect }}
      className={className}
    />
  );
}
