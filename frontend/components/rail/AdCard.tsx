"use client";

import RailCard from "@/components/rail/RailCard";
import RailLink from "@/components/rail/RailLink";

/**
 * The promo slot at the bottom of the rail.
 *
 * The real page fills this with an ad iframe; there's no ad network here, so it
 * holds the equivalent house copy and keeps the "REMOVE ADS" affordance the
 * reference puts at the bottom.
 */
export default function AdCard({
  onRemoveAds,
  onLearnMore,
}: {
  onRemoveAds: () => void;
  onLearnMore: () => void;
}) {
  return (
    <RailCard>
      <div className="flex flex-col items-center text-center text-[17px] font-bold leading-5 text-duo-text">
        <p className="py-6">
          Ads help keep this course free.{" "}
          <button
            type="button"
            onClick={onLearnMore}
            className="inline-block underline"
          >
            Learn more
          </button>
        </p>

        <RailLink onClick={onRemoveAds} className="mt-5">
          Remove ads
        </RailLink>
      </div>
    </RailCard>
  );
}
