"use client";

import { usePathname } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import { api } from "@/lib/api";
import type { UserProfile } from "@/lib/types";

/**
 * Holds the current learner's stats for the top bar and profile page.
 *
 * Refetches whenever the route changes, so returning to /learn after a lesson
 * shows the XP, streak and hearts the server just recalculated.
 */
interface UserContextValue {
  user: UserProfile | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  /** Merge in known-new values without waiting for a round trip. */
  patch: (values: Partial<UserProfile>) => void;
}

const UserContext = createContext<UserContextValue | null>(null);

export function UserProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setUser(await api.me());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load profile");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh, pathname]);

  const patch = useCallback((values: Partial<UserProfile>) => {
    setUser((current) => (current ? { ...current, ...values } : current));
  }, []);

  return (
    <UserContext.Provider value={{ user, loading, error, refresh, patch }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser(): UserContextValue {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used inside <UserProvider>");
  }
  return context;
}
