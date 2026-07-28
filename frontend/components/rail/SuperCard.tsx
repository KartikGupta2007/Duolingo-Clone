"use client";

import RailCard from "@/components/rail/RailCard";
import RailHeading from "@/components/rail/RailHeading";
import { SuperBadge } from "@/components/rail/railIcons";
import DuoAsset from "@/components/shared/duoAssets";
import DuoButton from "@/components/shared/DuoButton";

/**
 * The "Try Super for free" promo.
 *
 * Presentational: it takes a callback rather than reaching for the toast or a
 * payment client itself, so the card doesn't care what subscribing means.
 */
export default function SuperCard({ onSubscribe }: { onSubscribe: () => void }) {
  return (
    <RailCard className="relative overflow-hidden">
      <DuoAsset
        name="superMascot"
        height={92}
        className="pointer-events-none absolute right-2 top-3 block"
      />

      <SuperBadge />

      {/* Right padding keeps the copy clear of the mascot. */}
      <RailHeading className="mb-2 mt-2 pr-[100px]">
        Try Super for free
      </RailHeading>

      <p className="mb-6 mt-2 text-[17px] font-medium leading-[25px] text-duo-body">
        No ads, personalized practice, and unlimited Legendary!
      </p>

      <DuoButton variant="super" fullWidth onClick={onSubscribe}>
        Try 1 week free
      </DuoButton>
    </RailCard>
  );
}
