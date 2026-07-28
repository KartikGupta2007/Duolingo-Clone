"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

/**
 * One toast surface for the whole app.
 *
 * Several places need to announce "this isn't implemented" — the sidebar's
 * placeholder rows, the Super CTA, Remove ads, the footer links. Each owning
 * its own timer and markup meant duplicated state and the possibility of two
 * toasts stacking, so the behaviour lives here once and callers just ask for it.
 */
interface ToastContextValue {
  showToast: (message: string) => void;
  /** Convenience for the most common case. */
  showUnimplemented: (feature: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const VISIBLE_MS = 2400;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState<string | null>(null);
  const timer = useRef<number | null>(null);

  const showToast = useCallback((next: string) => {
    if (timer.current !== null) window.clearTimeout(timer.current);
    setMessage(next);
    timer.current = window.setTimeout(() => setMessage(null), VISIBLE_MS);
  }, []);

  const showUnimplemented = useCallback(
    (feature: string) => showToast(`${feature} isn't implemented in this build.`),
    [showToast],
  );

  // Don't leave a timer running past unmount.
  useEffect(
    () => () => {
      if (timer.current !== null) window.clearTimeout(timer.current);
    },
    [],
  );

  return (
    <ToastContext.Provider value={{ showToast, showUnimplemented }}>
      {children}
      {message && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-24 left-1/2 z-[60] -translate-x-1/2 animate-pop-in rounded-2xl border-2 border-duo-border bg-duo-card px-5 py-3 text-sm font-bold text-duo-text shadow-lg lg:bottom-8"
        >
          {message}
        </div>
      )}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used inside <ToastProvider>");
  }
  return context;
}
