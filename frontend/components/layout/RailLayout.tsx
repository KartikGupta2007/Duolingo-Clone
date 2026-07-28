import type { ReactNode } from "react";

/**
 * Two-column page: main content plus a sticky right rail.
 *
 * Mirrors the reference's outer container — `row-reverse` with a 48px gap, so
 * the rail is early in the DOM (and in the tab order after the nav) while
 * painting on the right. The rail is dropped below `xl`, where there isn't room
 * for 256px of sidebar plus 368px of rail; the top bar carries the stats there.
 *
 * Every page outside the lesson player uses this, so the 592px content column
 * lands in the same place throughout.
 *
 * **Pages must supply their own top padding** (`pt-6`, or a sticky header that
 * includes it). There is deliberately none here, because `/learn`'s header is
 * sticky and needs the padding inside the sticky box rather than above it — but
 * that means a page without any starts flush against the viewport top at `xl`,
 * where the top bar is hidden, and 24px out of line with the rail's `top-6`.
 */
export default function RailLayout({
  children,
  rail,
}: {
  children: ReactNode;
  rail: ReactNode;
}) {
  return (
    // 592 (content) + 48 (gap) + 368 (rail) + 48 (padding) = 1056, all from the
    // reference's measured widths.
    <div className="mx-auto flex w-full max-w-[1056px] flex-row-reverse justify-center gap-12 px-6 pb-28 lg:pb-6">
      <aside className="hidden w-[368px] shrink-0 xl:block">
        <div className="sticky top-6 flex flex-col gap-4">{rail}</div>
      </aside>

      <div className="w-full min-w-0 max-w-[592px]">{children}</div>
    </div>
  );
}
