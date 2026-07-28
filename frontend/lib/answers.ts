// Answer-checking helpers used by the exercise components.
//
// Note these are *presentation* concerns only — grading a single exercise is
// local to the player. The authoritative state changes (XP, hearts, streak)
// happen server-side in POST /api/lesson/{id}/complete.

import type { Exercise } from "./types";

/**
 * Lowercase, collapse whitespace, drop punctuation and accents.
 *
 * Real Duolingo grades typed answers leniently, so "  Hello! " matches "hello".
 * Accent folding is kept even though this course is English — it costs nothing
 * and stops a pasted "café" from being marked wrong.
 */
export function normalize(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[¿?¡!.,;:]/g, "")
    .replace(/\s+/g, " ");
}

/** The answer to show in the red feedback bar when the learner gets it wrong. */
export function correctAnswerText(exercise: Exercise): string {
  switch (exercise.type) {
    case "multiple_choice":
    case "fill_blank":
      return exercise.payload.correct;
    case "type_answer":
      return exercise.payload.correct;
    case "translate":
      return exercise.payload.correct_sequence.join(" ");
    case "match_pairs":
      return exercise.payload.pairs
        .map((pair) => `${pair.left} = ${pair.right}`)
        .join(", ");
  }
}

/** Fisher–Yates. Used to shuffle the right-hand column of match_pairs. */
export function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}
