"use client";

import { useState } from "react";

import CheckFooter from "@/components/lesson/CheckFooter";
import OptionCard from "@/components/lesson/OptionCard";
import PromptHeading from "@/components/lesson/PromptHeading";
import type { MultipleChoicePayload } from "@/lib/types";

/** Every Exercise* component takes exactly `{ payload, onAnswer }` (§7). */
interface Props {
  payload: MultipleChoicePayload;
  onAnswer: (isCorrect: boolean) => void;
}

export default function ExerciseMultipleChoice({ payload, onAnswer }: Props) {
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <>
      <PromptHeading>{payload.question}</PromptHeading>

      <div className="grid gap-3 sm:grid-cols-3">
        {payload.options.map((option, index) => (
          <OptionCard
            key={option}
            label={option}
            index={index + 1}
            selected={selected === option}
            onSelect={() => setSelected(option)}
          />
        ))}
      </div>

      <CheckFooter
        disabled={selected === null}
        onCheck={() => onAnswer(selected === payload.correct)}
      />
    </>
  );
}
