"use client";

import { SpeakerIcon } from "@/components/shared/icons";
import { speak } from "@/lib/speech";

/**
 * Reads a phrase aloud. Pressing it again restarts from the beginning, because
 * `speak` cancels whatever is in flight before queueing.
 *
 * Styled as the reference's filled blue tile beside a lesson prompt.
 */
export default function SpeakButton({
  text,
  className = "",
}: {
  text: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      // Announced as an action, not decoration — it's the fallback for anyone
      // whose browser refused to start the audio on its own.
      aria-label="Play audio"
      title="Play audio"
      onClick={() => speak(text)}
      className={[
        "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
        "bg-duo-blue text-white shadow-[0_3px_0_#1899D6]",
        "transition-transform active:translate-y-[2px]",
        className,
      ].join(" ")}
    >
      <SpeakerIcon className="h-6 w-6" />
    </button>
  );
}
