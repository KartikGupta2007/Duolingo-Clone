"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { useToast } from "@/components/shared/ToastProvider";
import { useUser } from "@/components/shared/UserProvider";

/**
 * The left nav, built to computed styles captured from the reference page
 * (the `.sN` class names in the table are from that capture).
 *
 * Every number here comes from that capture rather than from eyeballing:
 *
 * | part            | reference                                              |
 * |-----------------|--------------------------------------------------------|
 * | rail (`.s1`)    | 256px wide, 16px side padding, right border 2px #52656d |
 * | logo block(`.s2`)| 92px tall: 32px above, 30px below, 16px extra left     |
 * | wordmark (`.s3`)| 128 x 30                                               |
 * | list (`.s5`)    | column, 8px gap                                        |
 * | row (`.s6`)     | 52px tall                                              |
 * | row inner (`.s8`)| 4px/8px padding, 12px radius; active adds #202f36 fill |
 * |                 | and a 2px #3f85a7 border                               |
 * | icon (`.s9/.s10`)| 32x32, 6px in from the row, 20px before the label     |
 * | label(`.s11/13`)| 15px/700 uppercase, 0.8px tracking, 25px line          |
 * |                 | active #49c0f8, otherwise #dce6ec                      |
 * | avatar (`.s15`) | 32x32, 2px dashed #52656d, 14.72px/700 initial         |
 *
 * The icons and the wordmark are the reference's own SVGs, served from
 * `public/duo/` rather than hotlinked, so the app still renders offline and
 * doesn't depend on someone else's CDN staying up. The wordmark being a *path*
 * SVG is also what makes the logo's letterforms exact — it's set in Duolingo's
 * proprietary `duolingo-sans`, which can't be obtained, so no amount of font
 * tuning would have matched it as text.
 *
 * Only Learn, Leaderboards, Quests, Shop and Profile have real pages. Letters,
 * Practice and More are shown for fidelity but are placeholders — §10 of
 * CLAUDE.md puts those features out of scope, and a nav row that silently does
 * nothing is worse than one that says so.
 */

/** Rendered size of every nav icon, per `.s10`. */
const ICON = 32;

interface NavItem {
  label: string;
  /** File in `public/duo/`; the profile row draws an initial instead. */
  icon?: string;
  /** Present means it's a real route; absent means placeholder. */
  href?: string;
  /** Also shown in the mobile tab bar (which can't fit all eight). */
  onMobile?: boolean;
}

const ITEMS: NavItem[] = [
  { label: "Learn", href: "/learn", icon: "nav-learn", onMobile: true },
  { label: "Letters", icon: "nav-letters" },
  { label: "Practice", icon: "nav-practice", onMobile: true },
  {
    label: "Leaderboards",
    href: "/leaderboard",
    icon: "nav-leaderboards",
    onMobile: true,
  },
  { label: "Quests", href: "/quests", icon: "nav-quests" },
  { label: "Shop", href: "/shop", icon: "nav-shop" },
  { label: "Profile", href: "/profile", onMobile: true },
  { label: "More", icon: "nav-more", onMobile: true },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user } = useUser();
  const { showUnimplemented } = useToast();

  const initial = user?.name?.[0]?.toUpperCase() ?? "?";
  const isActive = (href?: string) => !!href && pathname.startsWith(href);

  /**
   * The dashed-ring avatar on the Profile row (`.s15`), plus the unread dot the
   * reference shows over it.
   */
  const avatar = (size: number, fontSize: number) => (
    <span className="relative inline-flex shrink-0">
      <span
        style={{ width: size, height: size, fontSize }}
        className="inline-flex items-center justify-center rounded-full border-2 border-dashed border-duo-footer font-bold text-duo-footer"
      >
        {initial}
      </span>
      <span
        aria-hidden="true"
        className="absolute right-0 top-0 h-2.5 w-2.5 rounded-full border-2 border-duo-bg bg-duo-red"
      />
    </span>
  );

  const iconImage = (name: string, size: number) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`/duo/${name}.svg`}
      alt=""
      width={size}
      height={size}
      style={{ width: size, height: size }}
      className="block"
    />
  );

  // --- desktop row ---------------------------------------------------------
  const Row = ({ item }: { item: NavItem }) => {
    const active = isActive(item.href);

    const inner = (
      <span
        className={[
          // 4px/8px padding and a 12px radius, per .s8/.s12.
          "flex min-h-[52px] w-full items-center rounded-xl border-2 px-2 py-1 transition-colors",
          active
            ? "border-[#3f85a7] bg-duo-greenSoft"
            : // The reference's inactive row has no border at all, which shifts
              // its contents 2px when a row becomes active. A transparent one
              // holds the same geometry and is indistinguishable otherwise.
              "border-transparent hover:bg-duo-card",
        ].join(" ")}
      >
        {/* .s9 is a 38px slot with 20px after it; .s10 sits 6px in. */}
        <span className="mr-5 flex shrink-0 items-center pl-1.5">
          {item.icon ? iconImage(item.icon, ICON) : avatar(ICON, 14.72)}
        </span>
        <span
          className={[
            "text-[15px] font-bold uppercase leading-[25px] tracking-[0.8px]",
            active ? "text-duo-link" : "text-duo-body",
          ].join(" ")}
        >
          {item.label}
        </span>
      </span>
    );

    return item.href ? (
      <Link href={item.href} className="block">
        {inner}
      </Link>
    ) : (
      <button
        type="button"
        onClick={() => showUnimplemented(item.label)}
        className="block w-full text-left"
      >
        {inner}
      </button>
    );
  };

  // --- mobile tab ---------------------------------------------------------
  const Tab = ({ item }: { item: NavItem }) => {
    const active = isActive(item.href);
    const inner = (
      <>
        <span className="flex h-7 items-center justify-center">
          {item.icon ? iconImage(item.icon, 28) : avatar(26, 12)}
        </span>
        <span
          className={`text-[10px] font-bold uppercase tracking-[0.5px] ${
            active ? "text-duo-link" : "text-duo-body"
          }`}
        >
          {item.label}
        </span>
      </>
    );

    return item.href ? (
      <Link
        href={item.href}
        aria-label={item.label}
        className="flex flex-1 flex-col items-center gap-1 py-2.5"
      >
        {inner}
      </Link>
    ) : (
      <button
        type="button"
        aria-label={item.label}
        onClick={() => showUnimplemented(item.label)}
        className="flex flex-1 flex-col items-center gap-1 py-2.5"
      >
        {inner}
      </button>
    );
  };

  return (
    <>
      {/* Desktop rail (.s1). z-40 rather than the reference's 210, so toasts and
          the lesson modals still come out on top of it. */}
      <nav className="fixed left-0 top-0 z-40 hidden h-screen w-[256px] flex-col overflow-y-auto border-r-2 border-duo-footer bg-duo-bg px-4 [scrollbar-width:none] lg:flex">
        {/* .s2 — 32px above the wordmark, 30px below, 16px extra on the left. */}
        <div className="shrink-0 pb-[30px] pl-4 pt-8">
          <Link href="/learn" className="block" aria-label="Duolingo — home">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/duo/logo.svg"
              alt="Duolingo"
              width={128}
              height={30}
              style={{ width: 128, height: 30 }}
            />
          </Link>
        </div>

        {/* .s5 — 8px between rows. */}
        <div className="flex flex-col gap-2">
          {ITEMS.map((item) => (
            <Row key={item.label} item={item} />
          ))}
        </div>
      </nav>

      {/* Mobile tab bar — the eight rows can't fit, so it carries the five
          most-used destinations, as the real app does. */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 flex border-t-2 border-duo-border bg-duo-bg lg:hidden">
        {ITEMS.filter((item) => item.onMobile).map((item) => (
          <Tab key={item.label} item={item} />
        ))}
      </nav>
    </>
  );
}
