// Turning an exercise into plain text, for the AI hint and for speech.
//
// Lives here rather than in the lesson page so both callers read the same
// mapping, and so adding an exercise type means updating one switch.

import type { Exercise } from "./types";

/** Best available human-readable prompt for an exercise, for the AI hint. */
export function promptOf(exercise: Exercise): string {
  switch (exercise.type) {
    case "multiple_choice":
      return exercise.payload.question;
    case "fill_blank":
      return exercise.payload.sentence;
    case "translate":
    case "type_answer":
      return exercise.payload.prompt;
    case "match_pairs":
      return "Match each word to its meaning";
  }
}

/**
 * What to read aloud for an exercise, or `null` when there's nothing to read.
 *
 * Deliberately the *question* only, never the answer — a `fill_blank` says
 * "blank" where the gap is rather than filling it in, which would hand the
 * learner the answer. `match_pairs` returns null: it's a grid of tiles with no
 * sentence, so reading the instruction aloud would add nothing, and the audio
 * button is hidden for it instead.
 */
export function speechTextFor(exercise: Exercise): string | null {
  switch (exercise.type) {
    case "multiple_choice":
      return exercise.payload.question;
    case "fill_blank":
      // "___" would otherwise be read out as three underscores.
      return exercise.payload.sentence.replace(/_{2,}/g, " blank ");
    case "translate":
    case "type_answer":
      return exercise.payload.prompt;
    case "match_pairs":
      return null;
  }
}
