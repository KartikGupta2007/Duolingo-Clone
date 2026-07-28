"use client";

import { useState } from "react";

import CheckFooter from "@/components/lesson/CheckFooter";
import PromptHeading from "@/components/lesson/PromptHeading";
import { normalize } from "@/lib/answers";
import type { TypeAnswerPayload } from "@/lib/types";

interface Props {
  payload: TypeAnswerPayload;
  onAnswer: (isCorrect: boolean) => void;
}

export default function ExerciseTypeAnswer({ payload, onAnswer }: Props) {
  const [value, setValue] = useState("");

  const submit = () => {
    if (!value.trim()) return;
    // Case- and punctuation-insensitive, like real Duolingo typing exercises.
    onAnswer(normalize(value) === normalize(payload.correct));
  };

  return (
    <>
      <PromptHeading>{payload.prompt}</PromptHeading>

      <input
        // eslint-disable-next-line jsx-a11y/no-autofocus
        autoFocus
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") submit();
        }}
        placeholder="Type your answer…"
        aria-label={payload.prompt}
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        className="w-full rounded-2xl border-2 border-duo-border bg-duo-card px-5 py-4 text-xl font-bold text-duo-text outline-none transition-colors placeholder:font-normal placeholder:text-duo-muted focus:border-duo-blue"
      />
      <p className="mt-3 text-sm text-duo-muted">
        Capitalisation and punctuation don&apos;t matter —{" "}
        <span className="font-bold">Hello!</span> also matches{" "}
        <span className="font-bold">hello</span>.
      </p>

      <CheckFooter disabled={!value.trim()} onCheck={submit} />
    </>
  );
}
