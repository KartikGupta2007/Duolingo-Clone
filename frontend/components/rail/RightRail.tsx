"use client";

import AdCard from "@/components/rail/AdCard";
import DailyQuestsCard from "@/components/rail/DailyQuestsCard";
import RailFooter from "@/components/rail/RailFooter";
import StatsRow from "@/components/rail/StatsRow";
import SuperCard from "@/components/rail/SuperCard";
import UnlockLeaderboardsCard from "@/components/rail/UnlockLeaderboardsCard";
import { useToast } from "@/components/shared/ToastProvider";
import { useUser } from "@/components/shared/UserProvider";
import { api } from "@/lib/api";
import { deriveDailyQuests, deriveLeaderboardUnlock } from "@/lib/rail";

/**
 * Composition root for the rail.
 *
 * This is the only component here that touches context — it reads the user,
 * turns it into the shapes the cards expect via the pure helpers in lib/rail,
 * and wires the callbacks. Everything below it is presentational, which is what
 * makes the cards reusable and testable in isolation.
 */
export default function RightRail() {
  const { user, refresh } = useUser();
  const { showToast, showUnimplemented } = useToast();

  /** Instant heart refill from the hearts popover. Mocked — see §6. */
  const refillHearts = async () => {
    try {
      const state = await api.refillHearts();
      await refresh();
      showToast(`Hearts refilled — ${state.hearts} of ${state.max_hearts}.`);
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Couldn't refill your hearts",
      );
    }
  };

  // Nothing to show until the profile lands; the rail is supplementary, so a
  // skeleton would be more noise than the empty space it replaces.
  if (!user) return null;

  const quests = deriveDailyQuests(user);
  const { unlocked, lessonsRemaining } = deriveLeaderboardUnlock(user);

  return (
    <>
      <StatsRow user={user} onRefillHearts={() => void refillHearts()} />

      <SuperCard onSubscribe={() => showUnimplemented("Super")} />

      {!unlocked && (
        <UnlockLeaderboardsCard lessonsRemaining={lessonsRemaining} />
      )}

      {/* VIEW ALL is a real link now that /quests exists — it used to toast that
          the page wasn't implemented, which stopped being true. */}
      <DailyQuestsCard quests={quests} viewAllHref="/quests" />

      <AdCard
        onRemoveAds={() => showUnimplemented("Removing ads")}
        onLearnMore={() => showUnimplemented("That page")}
      />

      <RailFooter onSelect={(label) => showUnimplemented(label)} />
    </>
  );
}
