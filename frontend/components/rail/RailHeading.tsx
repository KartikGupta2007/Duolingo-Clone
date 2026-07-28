import type { ReactNode } from "react";

/** Card title: 19px / 700 / 28px line-height, per the reference. */
export default function RailHeading({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <h2 className={`text-[19px] font-bold leading-7 text-duo-text ${className}`}>
      {children}
    </h2>
  );
}
