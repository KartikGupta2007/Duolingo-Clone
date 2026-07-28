// Text-to-speech, via the browser's built-in Web Speech API.
//
// Chosen because it needs no backend route, no API key and no network call —
// the voices ship with the OS, so audio keeps working offline like the rest of
// the app. There is no audio in the seed data to play instead: the course is
// text, so the alternative would have been recording 250 clips.
//
// Note this is speech *output*. CLAUDE.md §10 rules out speech *recognition* and
// pronunciation grading — listening to the learner — which is a different
// feature and still isn't built.

/** Slightly under normal pace; a learner is hearing the sentence for the first time. */
const RATE = 0.95;
const LANG = "en-US";

export function isSpeechSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

/**
 * Voices load asynchronously in Chrome — the first `getVoices()` after page load
 * usually returns an empty list and fills in later. Rather than block on it, we
 * read whatever is available at speak time and fall back to the browser default,
 * which is already an English voice on an English-locale system.
 */
function pickVoice(): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis.getVoices();
  if (voices.length === 0) return null;
  return (
    voices.find((v) => v.lang === LANG && v.localService) ??
    voices.find((v) => v.lang === LANG) ??
    voices.find((v) => v.lang.startsWith("en")) ??
    null
  );
}

/**
 * Speak `text`, cancelling anything already speaking.
 *
 * Cancelling first is what makes a second press *restart* rather than queue —
 * `speechSynthesis.speak` appends to a queue by default, so without this a
 * double tap would say the sentence twice in a row.
 */
export function speak(text: string): void {
  if (!isSpeechSupported() || !text.trim()) return;

  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = LANG;
  utterance.rate = RATE;
  const voice = pickVoice();
  if (voice) utterance.voice = voice;
  window.speechSynthesis.speak(utterance);
}

export function cancelSpeech(): void {
  if (!isSpeechSupported()) return;
  window.speechSynthesis.cancel();
}
