import type { CSSProperties } from "react";

import type { Character } from "@/lib/characters";

/**
 * One character drawing, mirrored and animated but not positioned.
 *
 * Split out of `UnitCharacter` so the guidebook can show a unit's character
 * without inheriting the path's absolute placement: this owns the artwork, the
 * mirror and the idle loop, while callers own where it sits and when it runs.
 *
 * The mirror is a layer *outside* the animated one on purpose — see the note on
 * `mirrored` below.
 */
export default function CharacterArt({
  character,
  /**
   * Rendered box, in px. The figures aren't normalised — see lib/characters.
   *
   * Omit it to fill the parent instead, which the path does: its slot is the
   * reference's 299x261 box, and letting a square-canvas SVG letterbox inside
   * that centres the figure the same way the reference's `<img>` does.
   */
  size,
  /** Flip horizontally so the figure faces the other way. */
  mirrored = false,
  /** Freeze the idle loop where it is (used when off-screen). */
  paused = false,
  /**
   * Draw the measured eyelids closed. Rendered inside the idle layer so the
   * lids ride every bob and sway, and inside the mirror so a flipped figure's
   * eyes flip with it. No-op for characters without `eyes` data.
   */
  eyesClosed = false,
}: {
  character: Character;
  size?: number;
  mirrored?: boolean;
  paused?: boolean;
  eyesClosed?: boolean;
}) {
  const box = size ?? "100%";
  return (
    /* Mirroring about `originX` — the same x the animation pivots on — makes
       that point the mirror's fixed point, so the figure doesn't jump sideways
       (its ink isn't centred in the box) and the pivot still lands on its feet.
       Keeping this outside the animated layer also mirrors the motion, so a
       flipped figure lunges and rolls the way it now faces. */
    <div
      className="h-full w-full"
      style={
        mirrored
          ? {
              transform: "scaleX(-1)",
              transformOrigin: `${character.originX}% center`,
            }
          : undefined
      }
    >
      <div
        className={["char relative", character.motion, paused ? "char-paused" : ""].join(" ")}
        style={
          {
            width: box,
            height: box,
            "--char-ox": `${character.originX}%`,
            "--char-oy": `${character.originY}%`,
            "--char-dur": character.duration,
            "--char-delay": character.delay,
          } as CSSProperties
        }
      >
        {/* Each figure is drawn on a square 1080 canvas with its own padding, so
            the box is much larger than the figure you actually see. They're
            deliberately not normalised to a uniform height — in the reference
            the bear really is bigger than Duo — so one box size is applied to
            all and the natural size differences come through. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`/characters/${character.name}.svg`}
          alt=""
          loading="lazy"
          decoding="async"
          className="select-none"
          style={{ width: "100%", height: "100%" }}
        />

        {/* Eyelids: face-coloured patches over the scanned eye positions,
            scaling down from the brow like a lid rather than fading. */}
        {character.eyes?.map((eye, index) => (
          <span
            key={index}
            aria-hidden="true"
            style={{
              position: "absolute",
              left: `${eye.x - eye.w / 2}%`,
              top: `${eye.y - eye.h / 2}%`,
              width: `${eye.w}%`,
              height: `${eye.h}%`,
              backgroundColor: eye.color,
              borderRadius: "50%",
              transformOrigin: "center top",
              transform: eyesClosed ? "scaleY(1)" : "scaleY(0)",
              transition: "transform 60ms ease-out",
            }}
          />
        ))}
      </div>
    </div>
  );
}
