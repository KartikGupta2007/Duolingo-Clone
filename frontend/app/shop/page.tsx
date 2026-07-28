"use client";

import RailLayout from "@/components/layout/RailLayout";
import RightRail from "@/components/rail/RightRail";
import {
  InfinityHeartIcon,
  OutlinedHeartIcon,
} from "@/components/rail/popoverArt";
import { REFILL_GEM_PRICE } from "@/components/rail/StatPopovers";
import ShopRow from "@/components/shop/ShopRow";
import { GemIcon } from "@/components/shared/icons";
import { useToast } from "@/components/shared/ToastProvider";
import { useUser } from "@/components/shared/UserProvider";
import { api } from "@/lib/api";

/**
 * The shop.
 *
 * Only one item does anything real: Refill Hearts, which calls the mocked
 * instant-refill route (§6). Everything else is a Super subscription or a
 * power-up that would need its own persisted state, both out of scope (§10), so
 * they render with the reference's copy and raise a toast.
 */

/** Streak Freeze slots, matching the reference's "2 / 2 EQUIPPED". */
const STREAK_FREEZE_SLOTS = 2;

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="border-b-2 border-duo-border pb-3 text-[22px] leading-tight">
      {children}
    </h2>
  );
}

export default function ShopPage() {
  const { user, refresh } = useUser();
  const { showToast, showUnimplemented } = useToast();

  const refill = async () => {
    try {
      const state = await api.refillHearts();
      await refresh();
      showToast(`Hearts refilled — ${state.hearts} of ${state.max_hearts}.`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Couldn't refill your hearts");
    }
  };

  const heartsFull = !!user && user.hearts >= user.max_hearts;

  return (
    <RailLayout rail={<RightRail />}>
      <div className="pb-10 pt-6">
        {/* Promo banner. Decorative — the family plan is a payment feature. */}
        <div className="mb-8 overflow-hidden rounded-2xl bg-gradient-to-br from-[#164B4F] via-[#2B2E7A] to-[#4C1D6B] p-6">
          <h1 className="text-[25px] leading-tight text-white">
            Start a family plan!
          </h1>
          <p className="mt-1 text-[17px] font-medium text-white/85">
            Save on <span className="font-extrabold">Super Duolingo</span> when you
            learn with friends
          </p>
          <button
            type="button"
            onClick={() => showUnimplemented("The family plan")}
            className="mt-5 rounded-2xl bg-white px-8 py-3 text-[15px] font-extrabold uppercase tracking-wide text-[#2B2E7A] shadow-[0_4px_0_#D5D5D5]"
          >
            Learn more
          </button>
        </div>

        <section>
          <SectionHeading>Hearts</SectionHeading>

          <ShopRow
            icon={<OutlinedHeartIcon className="h-16 w-16" />}
            title="Refill Hearts"
            description="Get full hearts so you can worry less about making mistakes in a lesson"
            action={
              <span className="flex items-center gap-2">
                <span className="text-[13px] font-extrabold uppercase tracking-wide">
                  Get for:
                </span>
                <GemIcon className="h-[18px] w-[18px] text-duo-gemText" />
                {REFILL_GEM_PRICE}
              </span>
            }
            actionTone="blue"
            // Nothing to buy when the bar is already full.
            disabled={heartsFull}
            onAction={() => void refill()}
          />

          <ShopRow
            // The same mark the hearts popover uses, rather than a second
            // hand-made one — the reference draws it as a heart, not a tile.
            icon={<InfinityHeartIcon className="h-16 w-16" />}
            title="Unlimited Hearts"
            description="Never run out of hearts with Super!"
            action="Free trial"
            actionTone="pink"
            onAction={() => showUnimplemented("Unlimited Hearts")}
          />
        </section>

        <section className="mt-10">
          <SectionHeading>Power-Ups</SectionHeading>

          <ShopRow
            icon={
              <span
                aria-hidden="true"
                className="grid h-16 w-16 place-items-center rounded-2xl bg-duo-blue/20 text-3xl"
              >
                🧊
              </span>
            }
            title="Streak Freeze"
            badge={`${STREAK_FREEZE_SLOTS} / ${STREAK_FREEZE_SLOTS} equipped`}
            description="Streak Freeze allows your streak to remain in place for one full day of inactivity."
            action="Equipped"
            actionTone="muted"
            disabled
          />
        </section>
      </div>
    </RailLayout>
  );
}
