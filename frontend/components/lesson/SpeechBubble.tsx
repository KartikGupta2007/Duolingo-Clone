import DuoAsset from "@/components/shared/duoAssets";

/**
 * The "character says this sentence" bubble Duolingo shows on word-order
 * exercises. Decorative — no audio, since speech is out of scope (§10).
 */
export default function SpeechBubble({ text }: { text: string }) {
  return (
    <div className="mb-8 flex items-start gap-3">
      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border-2 border-duo-border bg-duo-card">
        <DuoAsset name="flag" height={28} />
      </div>
      <div className="relative rounded-2xl border-2 border-duo-border bg-duo-card px-4 py-3 text-lg font-bold">
        {text}
        <div className="absolute -left-[7px] top-5 h-3 w-3 rotate-45 border-b-2 border-l-2 border-duo-border bg-duo-card" />
      </div>
    </div>
  );
}
