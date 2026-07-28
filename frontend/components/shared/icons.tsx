// Hand-rolled inline SVGs so the project needs no icon dependency.
// All of them inherit `currentColor` and size from a `className`.

type IconProps = { className?: string };

export function FlameIcon({ className = "h-6 w-6" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        fill="currentColor"
        d="M13.2 2c.3 2.6-.9 4.2-2.3 5.7C9.3 9.4 7.6 11 7.6 14a5.4 5.4 0 0 0 10.8.3c.1-2-.7-3.5-1.7-4.8.2 1-.1 1.9-.8 2.4-.6.4-1.3.2-1.5-.5-.5-1.9.4-3.6-.2-5.6-.4-1.5-1.3-2.9-3-3.8Z"
      />
      <path
        fill="currentColor"
        opacity=".45"
        d="M10.6 14.3c0-1.5.9-2.4 1.7-3.2.5 1.2 1.6 1.8 1.6 3.4a1.9 1.9 0 0 1-3.3 1.3c-.3-.4-.4-1-.4-1.5Z"
      />
    </svg>
  );
}

export function GemIcon({ className = "h-6 w-6" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path fill="currentColor" d="M7 3h10l4 6-9 12L3 9l4-6Z" />
      <path fill="#fff" opacity=".35" d="M7 3h5l-2 6H3l4-6Z" />
    </svg>
  );
}

export function HeartIcon({ className = "h-6 w-6" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        fill="currentColor"
        d="M12 21S3.5 15.4 3.5 9.6A4.9 4.9 0 0 1 12 6.3a4.9 4.9 0 0 1 8.5 3.3C20.5 15.4 12 21 12 21Z"
      />
    </svg>
  );
}

export function StarIcon({ className = "h-6 w-6" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        fill="currentColor"
        d="m12 3 2.7 5.7 6.3.8-4.6 4.3 1.2 6.2L12 17l-5.6 3 1.2-6.2L3 9.5l6.3-.8L12 3Z"
      />
    </svg>
  );
}

export function LockIcon({ className = "h-6 w-6" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        fill="currentColor"
        d="M7 10V8a5 5 0 0 1 10 0v2h1a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h1Zm2 0h6V8a3 3 0 0 0-6 0v2Z"
      />
    </svg>
  );
}



export function TrophyIcon({ className = "h-6 w-6" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        fill="currentColor"
        d="M7 4h10v2h3v3a4 4 0 0 1-4 4h-.4A5 5 0 0 1 13 15.9V18h3v2H8v-2h3v-2.1a5 5 0 0 1-2.6-2.9H8a4 4 0 0 1-4-4V6h3V4Zm0 4H6v1a2 2 0 0 0 1 1.7V8Zm10 0v2.7A2 2 0 0 0 18 9V8h-1Z"
      />
    </svg>
  );
}



export function CheckIcon({ className = "h-6 w-6" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m5 13 4.5 4.5L19 7"
      />
    </svg>
  );
}

export function CrossIcon({ className = "h-6 w-6" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="3.2"
        strokeLinecap="round"
        d="M6 6l12 12M18 6L6 18"
      />
    </svg>
  );
}

export function SparkleIcon({ className = "h-6 w-6" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        fill="currentColor"
        d="M12 2l1.8 5.4L19 9l-5.2 1.6L12 16l-1.8-5.4L5 9l5.2-1.6L12 2Zm6 12 .9 2.6 2.6.9-2.6.9-.9 2.6-.9-2.6-2.6-.9 2.6-.9.9-2.6Z"
      />
    </svg>
  );
}



export function ArrowLeftIcon({ className = "h-6 w-6" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M20 12H4m0 0 6-6m-6 6 6 6"
      />
    </svg>
  );
}

/** Speaker with sound waves, on the guidebook's phrase cards. */
export function SpeakerIcon({ className = "h-6 w-6" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      {/* Cone: a filled body, so it reads at 24px. */}
      <path fill="currentColor" d="M11 4.5 6.2 8.6H3.4A1.4 1.4 0 0 0 2 10v4a1.4 1.4 0 0 0 1.4 1.4h2.8L11 19.5a.9.9 0 0 0 1.5-.7V5.2a.9.9 0 0 0-1.5-.7Z" />
      {/* Two waves, the nearer one shorter. */}
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        d="M16.2 9.2a4 4 0 0 1 0 5.6M19.2 6.6a8 8 0 0 1 0 10.8"
      />
    </svg>
  );
}

export function ArrowUpIcon({ className = "h-6 w-6" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 20V4m0 0 6 6m-6-6-6 6"
      />
    </svg>
  );
}

/** Ruled notebook, used on the unit banner's guidebook button. */
export function GuidebookIcon({ className = "h-6 w-6" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <rect x="4" y="3" width="16" height="18" rx="2.5" fill="currentColor" />
      <path
        stroke="#131F24"
        strokeWidth="1.8"
        strokeLinecap="round"
        d="M9 8h7M9 12h7M9 16h4"
      />
      <circle cx="6.6" cy="8" r="0.9" fill="#131F24" />
      <circle cx="6.6" cy="12" r="0.9" fill="#131F24" />
      <circle cx="6.6" cy="16" r="0.9" fill="#131F24" />
    </svg>
  );
}
