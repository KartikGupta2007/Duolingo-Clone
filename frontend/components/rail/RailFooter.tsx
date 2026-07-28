"use client";

/**
 * The corporate link row under the rail.
 * Reference: #52656D, 13px / 700, uppercase, wrapping and centred.
 */
const LINKS = [
  "About",
  "Blog",
  "Store",
  "Efficacy",
  "Careers",
  "Investors",
  "Terms",
  "Privacy",
] as const;

export default function RailFooter({
  onSelect,
}: {
  onSelect: (label: string) => void;
}) {
  return (
    <ul className="mx-[10px] mb-1 mt-4 flex list-none flex-wrap justify-center">
      {LINKS.map((label) => (
        <li key={label} className="mx-[10px] mb-3">
          <button
            type="button"
            onClick={() => onSelect(label)}
            className="text-[13px] font-bold uppercase leading-4 text-duo-footer transition-colors hover:text-duo-muted"
          >
            {label}
          </button>
        </li>
      ))}
    </ul>
  );
}
