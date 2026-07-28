"use client";

import { useToast } from "@/components/shared/ToastProvider";

/**
 * The "Add friends" panel on the profile's rail.
 *
 * Both rows are honest placeholders: finding and inviting friends are social
 * features, which are out of scope, so they raise the standard toast rather
 * than pretending to work.
 */

function MagnifierIcon({ className = "h-9 w-9" }: { className?: string }) {
  return (
    <svg viewBox="0 0 36 36" className={className} aria-hidden="true">
      <circle cx="15" cy="15" r="9" fill="#DCE6EC" />
      <circle cx="15" cy="15" r="6" fill="#49C0F8" opacity=".55" />
      <rect
        x="21.5"
        y="19.5"
        width="10"
        height="5"
        rx="2.5"
        transform="rotate(45 21.5 19.5)"
        fill="#8FA3AD"
      />
    </svg>
  );
}

/** A gold envelope with Duo's head over the flap, like the reference's invite art. */
function InviteIcon({ className = "h-9 w-9" }: { className?: string }) {
  return (
    <svg viewBox="0 0 36 36" className={className} aria-hidden="true">
      <rect x="3" y="12" width="30" height="20" rx="3" fill="#FFC800" />
      <path d="M3 14l15 11 15-11v-2H3Z" fill="#E5A100" />
      {/* Duo peeking over the flap. */}
      <ellipse cx="18" cy="10" rx="8" ry="7.5" fill="#58CC02" />
      <circle cx="15" cy="9" r="2.6" fill="#FFFFFF" />
      <circle cx="21" cy="9" r="2.6" fill="#FFFFFF" />
      <circle cx="15.6" cy="9.4" r="1.2" fill="#3C2415" />
      <circle cx="20.4" cy="9.4" r="1.2" fill="#3C2415" />
      <path d="M15.5 13h5l-2.5 2.6Z" fill="#FF9600" />
    </svg>
  );
}

function ChevronIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        d="M9 6l6 6-6 6"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function AddFriendsPanel() {
  const { showUnimplemented } = useToast();

  const rows = [
    { label: "Find friends", icon: <MagnifierIcon />, feature: "Finding friends" },
    { label: "Invite friends", icon: <InviteIcon />, feature: "Inviting friends" },
  ];

  return (
    <section className="rounded-2xl border-2 border-duo-border p-5 pb-2">
      <h2 className="text-[19px] font-bold leading-7 text-duo-text">
        Add friends
      </h2>

      {rows.map((row, index) => (
        <button
          key={row.label}
          type="button"
          onClick={() => showUnimplemented(row.feature)}
          className={[
            "flex w-full items-center gap-4 py-4 text-left transition-opacity hover:opacity-80",
            index > 0 ? "border-t-2 border-duo-border" : "mt-1",
          ].join(" ")}
        >
          <span className="shrink-0">{row.icon}</span>
          <span className="min-w-0 flex-1 text-[17px] font-bold text-duo-text">
            {row.label}
          </span>
          <ChevronIcon className="h-5 w-5 shrink-0 text-duo-muted" />
        </button>
      ))}
    </section>
  );
}
