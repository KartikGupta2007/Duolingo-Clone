"use client";

import { useEffect, useState } from "react";

import type { DuoAssetName } from "@/components/shared/duoAssets";

/**
 * The status emoji pinned to your leaderboard avatar.
 *
 * Cosmetic, and §4's schema has nowhere to keep it, so it lives in
 * `localStorage`. That's an honest fit: it survives a reload, it's per-browser,
 * and it needs no column. The seeded competitors have none of their own.
 *
 * Two components read it — the picker in the rail and your own leaderboard row —
 * so a `storage`-style custom event keeps them in step within the same tab.
 * `storage` alone wouldn't: the browser only fires it for *other* tabs.
 */

const STORAGE_KEY = "duo-clone:status";
const CHANGED = "duo-clone:status-changed";

/**
 * The twelve tiles, in the capture's order. The sixth is the course flag reused,
 * which is why the asset numbering skips 06.
 */
export const STATUS_TILES: DuoAssetName[] = [
  "status01",
  "status02",
  "status03",
  "status04",
  "status05",
  "flag",
  "status07",
  "status08",
  "status09",
  "status10",
  "status11",
  "status12",
];

function read(): DuoAssetName | null {
  const raw = window.localStorage.getItem(STORAGE_KEY);
  return raw && (STATUS_TILES as string[]).includes(raw)
    ? (raw as DuoAssetName)
    : null;
}

export function useStatusEmoji(): {
  status: DuoAssetName | null;
  setStatus: (next: DuoAssetName | null) => void;
} {
  const [status, setLocal] = useState<DuoAssetName | null>(null);

  // Read after mount, never during render: localStorage doesn't exist on the
  // server, and reading it in an initialiser would break hydration.
  useEffect(() => {
    setLocal(read());
    const sync = () => setLocal(read());
    window.addEventListener(CHANGED, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(CHANGED, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const setStatus = (next: DuoAssetName | null) => {
    if (next) window.localStorage.setItem(STORAGE_KEY, next);
    else window.localStorage.removeItem(STORAGE_KEY);
    setLocal(next);
    window.dispatchEvent(new Event(CHANGED));
  };

  return { status, setStatus };
}
