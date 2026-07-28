"use client";

import { useEffect, useState } from "react";

import RailLayout from "@/components/layout/RailLayout";
import {
  MonthlyBadgeArt,
  QuestsBannerArt,
} from "@/components/quests/questArt";
import QuestProgressBar from "@/components/rail/QuestProgressBar";
import StatsRow from "@/components/rail/StatsRow";
import DuoAsset from "@/components/shared/duoAssets";
import { LockIcon } from "@/components/shared/icons";
import { useToast } from "@/components/shared/ToastProvider";
import { useUser } from "@/components/shared/UserProvider";
import { api } from "@/lib/api";
import { questsRefreshLabel } from "@/lib/quests";
import { deriveDailyQuests } from "@/lib/rail";

/**
 * The quests page.
 *
 * The quest itself is the same one the rail shows — `deriveDailyQuests`, off the
 * server's own `xp_per_lesson` — so the two can never disagree about progress.
 * This page just gives it the reference's full-width treatment.
 *
 * The reference's second slot is a locked "more quests unlock soon" card rather
 * than a real quest, and the rail's monthly challenge is a coming-soon panel;
 * both are kept as the placeholders they are, because monthly challenges and
 * badge collections are out of scope (§10).
 */

/** The banner's purple. Sampled off the reference by eye — no asset carries it. */
const BANNER_PURPLE = "#8C58C9";

/** A clock, for the "refreshes in N hours" line. */
function ClockIcon({ className = "h-[18px] w-[18px]" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        d="M12 3a9 9 0 1 1 0 18 9 9 0 0 1 0-18Zm0 4.5V12l3.2 2.2"
      />
    </svg>
  );
}

/** The rail on this page: the stats strip plus the monthly-challenge panel. */
function QuestsRail({ onRefillHearts }: { onRefillHearts: () => void }) {
  const { user } = useUser();
  const { showUnimplemented } = useToast();

  return (
    <>
      {user && <StatsRow user={user} onRefillHearts={onRefillHearts} />}

      <section className="relative overflow-hidden rounded-2xl border-2 border-duo-border p-5">
        <MonthlyBadgeArt className="pointer-events-none absolute -right-2 top-2 h-[104px] w-[112px]" />

        <h2 className="relative max-w-[190px] text-[19px] leading-7 text-duo-text">
          Monthly challenges unlock soon!
        </h2>
        <p className="relative mt-3 max-w-[210px] text-[17px] font-medium leading-6 text-duo-body">
          Complete each month&apos;s challenge to earn exclusive badges
        </p>

        <button
          type="button"
          onClick={() => showUnimplemented("Monthly challenges")}
          className="relative mt-5 w-full rounded-2xl border-2 border-duo-border py-3.5 text-[15px] font-extrabold uppercase tracking-[0.8px] text-duo-blue transition-colors hover:bg-duo-card"
        >
          Start a lesson
        </button>
      </section>
    </>
  );
}

export default function QuestsPage() {
  const { user, refresh } = useUser();
  const { showUnimplemented } = useToast();

  /**
   * The refresh countdown, computed after mount only.
   *
   * It must not be evaluated during render. This page has no dynamic API, so
   * `next build` prerenders it to static HTML — a countdown read at render time
   * would be frozen at build time and served to everyone until the next deploy,
   * and the client's own value would then mismatch it at hydration. Verified by
   * building: `/quests` is listed as static and the emitted HTML carried the
   * literal string.
   *
   * The interval keeps a long-lived tab honest, so it can't still read "1 min"
   * hours after the UTC day rolled over and the quest itself reset.
   */
  const [refreshIn, setRefreshIn] = useState<string | null>(null);
  useEffect(() => {
    const tick = () => setRefreshIn(questsRefreshLabel());
    tick();
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, []);

  const refillHearts = async () => {
    await api.refillHearts();
    await refresh();
  };

  const quests = user ? deriveDailyQuests(user) : [];

  return (
    <RailLayout rail={<QuestsRail onRefillHearts={() => void refillHearts()} />}>
      <div className="pt-6">
        {/* Purple welcome banner, with Duo holding the reward chest. */}
        <div
          className="flex items-center gap-4 overflow-hidden rounded-2xl px-8 py-5"
          style={{ backgroundColor: BANNER_PURPLE }}
        >
          <div className="min-w-0 flex-1">
            <h1 className="text-[25px] leading-tight text-white">Welcome!</h1>
            <p className="mt-2 text-[17px] font-medium leading-6 text-white">
              Complete quests to earn rewards! Quests refresh every day.
            </p>
          </div>
          <QuestsBannerArt className="h-[190px] w-[190px] shrink-0" />
        </div>

        <div className="mb-4 mt-8 flex items-end justify-between">
          <h2 className="text-[25px] leading-tight">Daily Quests</h2>
          {/* Counted to the next UTC midnight, the same boundary the server uses
              to decide whether today's quest is done. Empty until mounted — see
              `refreshIn` — so nothing stale is baked into the static HTML. */}
          <span className="flex min-h-[20px] items-center gap-2 text-[15px] font-extrabold uppercase tracking-[0.8px] text-duo-streak">
            {refreshIn && (
              <>
                <ClockIcon />
                {refreshIn}
              </>
            )}
          </span>
        </div>

        {quests.map((quest) => (
          <div
            key={quest.id}
            className="mb-4 flex items-center gap-6 rounded-2xl border-2 border-duo-border px-6 py-6"
          >
            <DuoAsset name="questBolt" className="block shrink-0" />
            <div className="flex min-w-0 flex-1 flex-col gap-2.5">
              <p className="text-[19px] font-bold leading-6 text-duo-text">
                {quest.label}
              </p>
              <QuestProgressBar
                current={quest.current}
                target={quest.target}
                label={quest.label}
              />
            </div>
          </div>
        ))}

        {/* The reference's locked slot. Not a disabled quest — there is no second
            quest to run, so it says so rather than pretending. */}
        <button
          type="button"
          onClick={() => showUnimplemented("More daily quests")}
          className="flex w-full items-center gap-6 rounded-2xl border-2 border-duo-border px-6 py-6 text-left transition-colors hover:bg-duo-card"
        >
          <LockIcon className="h-12 w-12 shrink-0 text-duo-border" />
          <span className="text-[19px] font-bold leading-6 text-duo-muted">
            More quests unlock soon
          </span>
        </button>
      </div>
    </RailLayout>
  );
}
