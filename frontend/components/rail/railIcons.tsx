// Artwork used only by the right rail, drawn locally rather than hotlinked
// from Duolingo's CDN (the reference markup points at d35aaqx5ub95lt.cloudfront.net).

type IconProps = { className?: string };

/** The italic gradient SUPER wordmark on the promo card. */
export function SuperBadge({ className = "" }: IconProps) {
  return (
    <span
      className={`inline-block -skew-x-12 rounded-md bg-gradient-to-r from-[#00CFFF] via-[#CE82FF] to-[#FF4B8C] px-2 py-0.5 ${className}`}
    >
      <span className="block skew-x-12 text-[15px] font-extrabold uppercase italic tracking-wider text-white">
        Super
      </span>
    </span>
  );
}
