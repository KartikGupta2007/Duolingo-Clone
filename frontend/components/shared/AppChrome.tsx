"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import Sidebar from "@/components/shared/Sidebar";
import TopBar from "@/components/shared/TopBar";

/**
 * Decides how much shell to draw around a page.
 *
 * The lesson player is deliberately chrome-free (like Duolingo's) so nothing
 * competes with the exercise.
 *
 * Pages own their own width and padding; the shell only owns the sidebar
 * offset. Every page outside the lesson player now uses `RailLayout`, which is
 * what keeps the 592px content column in the same place as you navigate.
 */

/**
 * Routes that render `RailLayout`. The rail already shows the stats strip at
 * `xl` and up, so the top bar has to stand down on these pages or they appear
 * twice; below `xl` the rail is hidden and the top bar takes over. Keyed on the
 * route because the shell can't see which layout a page chose — so a new
 * rail-using page belongs in this list.
 */
const RAIL_ROUTES = [
  "/learn",
  "/guidebook",
  "/sections",
  "/shop",
  "/profile",
  "/leaderboard",
  "/quests",
];

export default function AppChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  if (pathname.startsWith("/lesson")) {
    return <>{children}</>;
  }

  const railCarriesStats = RAIL_ROUTES.some((route) =>
    pathname.startsWith(route),
  );

  // Left padding matches the fixed sidebar's 256px width.
  return (
    <div className="lg:pl-[256px]">
      <Sidebar />
      <TopBar className={railCarriesStats ? "xl:hidden" : ""} />
      <main>{children}</main>
    </div>
  );
}
