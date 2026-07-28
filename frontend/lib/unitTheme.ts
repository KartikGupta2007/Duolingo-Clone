/**
 * Per-unit colour, cycling like Duolingo's path does.
 *
 * These are runtime values (a unit's index decides its colour), so they're plain
 * hex applied via inline styles rather than Tailwind classes — Tailwind can only
 * generate classes it sees at build time.
 *
 * The set and order were sampled from a screen recording of the reference by
 * reading the banner's fill once a second: pink, green, orange, red, blue,
 * purple and teal all appear. An earlier guess at a "salmon" unit was wrong —
 * that was a compressed frame mid-crossfade between two of these.
 */
export interface UnitTheme {
  name: string;
  /** Banner fill and node fill. */
  base: string;
  /** The solid slab under a node / banner, a few shades down. */
  dark: string;
}

export const UNIT_THEMES: UnitTheme[] = [
  { name: "green", base: "#58CC02", dark: "#46A302" },
  { name: "pink", base: "#FF86D0", dark: "#D96AAD" },
  { name: "orange", base: "#FF9600", dark: "#CC7800" },
  { name: "red", base: "#FF4B4B", dark: "#E03131" },
  { name: "blue", base: "#1CB0F6", dark: "#1899D6" },
  { name: "purple", base: "#CE82FF", dark: "#A568CC" },
  { name: "teal", base: "#00CD9C", dark: "#00A47D" },
];

/** Colour for locked nodes — unthemed, so a locked unit reads as inert. */
export const LOCKED_NODE = { base: "#37464F", dark: "#2A363D" };

/**
 * Colour for a node whose Legendary challenge has been beaten.
 *
 * Overrides the unit colour on purpose: Legendary is an achievement on one
 * skill, not a property of its unit, so it has to stand out *against* the
 * unit's own palette rather than blend into it. Gold, matching the Legendary
 * button in the node's callout.
 */
export const LEGENDARY_NODE = { base: "#FFC800", dark: "#E5A100" };

export function unitTheme(orderIndex: number): UnitTheme {
  return UNIT_THEMES[orderIndex % UNIT_THEMES.length];
}
