"use client";

import { useState } from "react";

import CheckFooter from "@/components/lesson/CheckFooter";
import OptionCard from "@/components/lesson/OptionCard";
import PromptHeading from "@/components/lesson/PromptHeading";
import type { FillBlankPayload } from "@/lib/types";

interface Props {
  payload: FillBlankPayload;
  onAnswer: (isCorrect: boolean) => void;
}

export default function ExerciseFillBlank({ payload, onAnswer }: Props) {
  const [selected, setSelected] = useState<string | null>(null);

  // "Yo ___ una manzana" -> ["Yo ", " una manzana"]
  const [before, after] = payload.sentence.split("___");

  return (
    <>
      <PromptHeading>Fill in the blank</PromptHeading>

      <p className="mb-8 flex flex-wrap items-center gap-x-2 gap-y-3 text-2xl font-bold">
        <span>{before}</span>
        <span
          className={[
            "inline-flex min-w-[110px] justify-center rounded-xl border-2 border-b-4 px-3 py-1",
            selected
              ? "border-duo-blue bg-duo-blue/15 text-duo-blue"
              : "border-dashed border-duo-border text-duo-border",
          ].join(" ")}
        >
          {selected ?? " "}
        </span>
        <span>{after}</span>
      </p>

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
