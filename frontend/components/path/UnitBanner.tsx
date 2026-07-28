"use client";

import Link from "next/link";

import { ArrowLeftIcon, GuidebookIcon } from "@/components/shared/icons";
import { unitTheme } from "@/lib/unitTheme";

/**
 * The single header bar above the path.
 *
 * Geometry is taken from the reference's computed styles: 16px padding, 13px
 * radius, a two-row grid (24px / 28px with a 6px gap) and the guidebook button
 * spanning both rows. Its title and colour follow whichever unit you've
 * scrolled to — the caller owns that, this just renders it.
 */
export default function UnitBanner({
  sectionNumber,
  unitNumber,
  title,
  guidebookHref,
}: {
  sectionNumber: number;
  unitNumber: number;
  title: string;
  /** Where the GUIDEBOOK button goes — the unit whose bar is currently shown. */
  guidebookHref: string;
}) {
  const theme = unitTheme(unitNumber - 1);

  return (
    <div
      className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1.5 rounded-[13px] p-4 text-white transition-colors duration-200"
      style={{ backgroundColor: theme.base, boxShadow: `0 4px 0 ${theme.dark}` }}
    >
      {/* The whole "Section N, Unit N" row is the back control, as in the
          reference — it steps out of the path to the sections overview. */}
      <Link
        href="/sections"
        className="flex min-w-0 items-center gap-2 text-base font-bold leading-6 opacity-70 transition-opacity hover:opacity-100"
      >
        <ArrowLeftIcon className="h-4 w-4 shrink-0" />
        <span className="truncate">
          Section {sectionNumber}, Unit {unitNumber}
        </span>
      </Link>

      <Link
        href={guidebookHref}
        // Spans both text rows, as in the reference grid.
        className="col-start-2 row-start-1 row-end-3 flex shrink-0 items-center gap-3 rounded-2xl border-2 border-white/30 bg-black/15 py-3 pl-3 pr-3.5 text-[15px] font-bold uppercase tracking-[0.8px] text-white transition-colors hover:bg-black/25"
      >
        <GuidebookIcon className="h-6 w-6" />
        <span className="hidden sm:inline">Guidebook</span>
      </Link>

      <h2 className="col-start-1 truncate text-[22px] font-bold leading-7">
        {title}
      </h2>
    </div>
  );
}
