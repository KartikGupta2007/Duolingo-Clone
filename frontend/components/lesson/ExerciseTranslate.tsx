"use client";

import { useMemo, useState } from "react";

import CheckFooter from "@/components/lesson/CheckFooter";
import PromptHeading from "@/components/lesson/PromptHeading";
import SpeechBubble from "@/components/lesson/SpeechBubble";
import { speak } from "@/lib/speech";
import type { TranslatePayload } from "@/lib/types";

interface Props {
  payload: TranslatePayload;
  onAnswer: (isCorrect: boolean) => void;
}

/** Word banks can repeat a word, so tokens carry an id rather than being keyed by text. */
interface Token {
  id: number;
  word: string;
}

function WordChip({
  word,
  onClick,
  ghost = false,
}: {
  word: string;
  onClick?: () => void;
  ghost?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={ghost}
      className={[
        "rounded-xl border-2 border-b-4 px-3 py-2 text-lg font-bold transition-colors",
        ghost
          ? // Placeholder left behind in the bank so the layout doesn't reflow.
            "cursor-default border-duo-border/40 bg-duo-border/20 text-transparent"
          : "border-duo-border bg-duo-card text-duo-text hover:bg-duo-cardHover",
      ].join(" ")}
    >
      {word}
    </button>
  );
}

/**
 * Word-order exercises, where the answer is assembled from a word bank.
 *
 * Tapping a tile reads that word aloud as well as moving it — this is the one
 * exercise type where the learner handles individual words, so hearing each one
 * is the point. `speak` cancels anything already playing, so tapping through the
 * bank quickly reads the latest word rather than queueing them all up.
 *
 * Kept inside this component rather than lifted into the player: the `{ payload,
 * onAnswer }` contract (§7) stays exactly as it was, and no other exercise type
 * gains behaviour it shouldn't have.
 */
export default function ExerciseTranslate({ payload, onAnswer }: Props) {
  const bank = useMemo<Token[]>(
    () => payload.word_bank.map((word, id) => ({ id, word })),
    [payload.word_bank],
  );
  const [chosen, setChosen] = useState<Token[]>([]);

  const usedIds = new Set(chosen.map((token) => token.id));

  const pick = (token: Token) => {
    speak(token.word);
    setChosen((current) => [...current, token]);
  };
  const unpick = (token: Token) => {
    speak(token.word);
    setChosen((current) => current.filter((item) => item.id !== token.id));
  };

  const check = () => {
    const answer = chosen.map((token) => token.word).join(" ");
    onAnswer(answer === payload.correct_sequence.join(" "));
  };

  return (
    <>
      <PromptHeading>Put the words in order</PromptHeading>
      <SpeechBubble text={payload.prompt} />

      {/* Answer area: ruled lines the tapped words land on. */}
      <div className="mb-10 min-h-[112px] border-y-2 border-duo-border py-4">
        <div className="flex flex-wrap gap-2">
          {chosen.map((token) => (
            <WordChip
              key={token.id}
              word={token.word}
              onClick={() => unpick(token)}
            />
          ))}
          {chosen.length === 0 && (
            <p className="py-2 text-duo-muted">Tap the words below…</p>
          )}
        </div>
      </div>

      {/* Word bank */}
      <div className="flex flex-wrap gap-2">
        {bank.map((token) =>
          usedIds.has(token.id) ? (
            <WordChip key={token.id} word={token.word} ghost />
          ) : (
            <WordChip
              key={token.id}
              word={token.word}
              onClick={() => pick(token)}
            />
          ),
        )}
      </div>

      <CheckFooter disabled={chosen.length === 0} onCheck={check} />
    </>
  );
}
