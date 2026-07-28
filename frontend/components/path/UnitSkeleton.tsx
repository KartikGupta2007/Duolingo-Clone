import {
  lobeOffset,
  nodeBoxHeight,
  nodeMarginTop,
  LAST_MARGIN_BOTTOM,
} from "@/lib/pathGeometry";
import type { SkillKind } from "@/lib/types";

/**
 * A unit's node column as a pulsing placeholder — the "mock UI" the path shows
 * both while `/api/course/path` is loading and for units that haven't been
 * scrolled near yet.
 *
 * It is laid out by the *same* geometry functions as the real column
 * (`nodeMarginTop`, `nodeBoxHeight`, `lobeOffset`), so a placeholder occupies
 * exactly the pixels its unit will: when the real nodes mount, nothing on the
 * page moves. That property is what lets `LazyUnit` swap content mid-scroll
 * without the scrollbar jumping — the skeleton isn't decoration, it's a
 * size-accurate reservation.
 */

export interface SkeletonNode {
  kind: SkillKind;
  /** Part-done nodes render a taller ringed box, which changes the height. */
  ringed: boolean;
  /** Nodes carrying a START / JUMP / OPEN pill get its clearance above. */
  pill: boolean;
}

/** The seeded units' shape, for the page-level loading state (no data yet). */
export const DEFAULT_SKELETON: SkeletonNode[] = (
  ["lesson", "story", "lesson", "chest", "practice", "review"] as SkillKind[]
).map((kind, index) => ({ kind, ringed: false, pill: index === 0 }));

export default function UnitSkeleton({
  nodes,
  /** Even units bulge right, odd left — same rule as the real path. */
  unitIndex,
  /** Drawn with the separator when the unit's title is already known. */
  title,
}: {
  nodes: SkeletonNode[];
  unitIndex: number;
  title?: string;
}) {
  return (
    <div aria-hidden="true">
      {/* The separator rule, with a title bar where the name isn't known. */}
      <div className="flex items-center gap-4 py-6">
        <span className="h-0.5 flex-1 bg-duo-border" />
        {title ? (
          <h3 className="text-center text-[19px] font-bold text-duo-muted">
            {title}
          </h3>
        ) : (
          <span className="h-5 w-44 animate-pulse rounded-full bg-duo-card" />
        )}
        <span className="h-0.5 flex-1 bg-duo-border" />
      </div>

      <div className="relative flex flex-col items-center">
        {nodes.map((node, index) => {
          const height = nodeBoxHeight(node.kind, node.ringed);
          return (
            <div
              key={index}
              className="flex items-center justify-center"
              style={{
                transform: `translateX(${lobeOffset(index, unitIndex)}px)`,
                marginTop: nodeMarginTop(index, node.pill),
                marginBottom:
                  index === nodes.length - 1 ? LAST_MARGIN_BOTTOM : 0,
                height,
              }}
            >
              {node.kind === "chest" ? (
                <div className="h-[90px] w-[80px] animate-pulse rounded-2xl bg-duo-card" />
              ) : (
                <div className="h-[65px] w-[70px] animate-pulse rounded-[50%] bg-duo-card" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
