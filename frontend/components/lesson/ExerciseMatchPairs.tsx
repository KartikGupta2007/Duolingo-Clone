"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import PromptHeading from "@/components/lesson/PromptHeading";
import { shuffle } from "@/lib/answers";
import type { MatchPairsPayload } from "@/lib/types";

interface Props {
  payload: MatchPairsPayload;
  onAnswer: (isCorrect: boolean) => void;
}

interface Tile {
  pairIndex: number;
  text: string;
}

/**
 * Tap a word on the left and its meaning on the right to pair them.
 *
 * There is no Check button: the exercise auto-submits once every pair is
 * matched, reporting correct only if no wrong pairing was attempted along the
 * way. That keeps the `onAnswer(isCorrect)` contract identical to the other
 * types even though the interaction is quite different (§7).
 */
export default function ExerciseMatchPairs({ payload, onAnswer }: Props) {
  const leftTiles = useMemo<Tile[]>(
    () => payload.pairs.map((pair, pairIndex) => ({ pairIndex, text: pair.left })),
    [payload.pairs],
  );
  const rightTiles = useMemo<Tile[]>(
    () =>
      shuffle(
        payload.pairs.map((pair, pairIndex) => ({
          pairIndex,
          text: pair.right,
        })),
      ),
    [payload.pairs],
  );

  const [pickedLeft, setPickedLeft] = useState<number | null>(null);
  const [pickedRight, setPickedRight] = useState<number | null>(null);
  const [matched, setMatched] = useState<number[]>([]);
  const [wrongPair, setWrongPair] = useState(false);

  const madeMistake = useRef(false);
  const submitted = useRef(false);

  // Resolve a selection as soon as one tile from each column is picked.
  useEffect(() => {
    if (pickedLeft === null || pickedRight === null) return;

    if (pickedLeft === pickedRight) {
      setMatched((current) => [...current, pickedLeft]);
      setPickedLeft(null);
      setPickedRight(null);
      return;
    }

    madeMistake.current = true;
    setWrongPair(true);
    const timer = window.setTimeout(() => {
      setWrongPair(false);
      setPickedLeft(null);
      setPickedRight(null);
    }, 550);
    return () => window.clearTimeout(timer);
  }, [pickedLeft, pickedRight]);

  // All pairs matched -> report the result. Brief delay so the final pair is
  // visibly green before the feedback bar slides up.
  useEffect(() => {
    if (matched.length !== payload.pairs.length || submitted.current) return;
    submitted.current = true;
    const timer = window.setTimeout(
      () => onAnswer(!madeMistake.current),
      400,
    );
    return () => window.clearTimeout(timer);
  }, [matched, payload.pairs.length, onAnswer]);

  const tileClass = (tile: Tile, picked: number | null) => {
    if (matched.includes(tile.pairIndex)) {
      return "border-duo-green/50 bg-duo-green/15 text-duo-green/60 cursor-default";
    }
    if (picked === tile.pairIndex) {
      return wrongPair
        ? "border-duo-red bg-duo-red/15 text-duo-red"
        : "border-duo-blue bg-duo-blue/15 text-duo-blue";
    }
    return "border-duo-border bg-duo-card text-duo-text hover:bg-duo-cardHover";
  };

  const renderColumn = (
    tiles: Tile[],
    picked: number | null,
    setPicked: (value: number | null) => void,
  ) => (
    <div className="flex flex-1 flex-col gap-3">
      {tiles.map((tile) => {
        const done = matched.includes(tile.pairIndex);
        return (
          <button
            key={`${tile.pairIndex}-${tile.text}`}
            type="button"
            disabled={done || wrongPair}
            onClick={() => setPicked(tile.pairIndex)}
            className={[
              "rounded-2xl border-2 border-b-4 px-4 py-4 text-lg font-bold transition-colors",
              tileClass(tile, picked),
            ].join(" ")}
          >
            {tile.text}
          </button>
        );
      })}
    </div>
  );

  return (
    <>
      <PromptHeading>Tap the matching pairs</PromptHeading>

      <div className="flex gap-3 sm:gap-6">
        {renderColumn(leftTiles, pickedLeft, setPickedLeft)}
        {renderColumn(rightTiles, pickedRight, setPickedRight)}
      </div>

      <p className="mt-6 text-center text-sm font-bold text-duo-muted">
        {matched.length} / {payload.pairs.length} matched
      </p>
    </>
  );
}
