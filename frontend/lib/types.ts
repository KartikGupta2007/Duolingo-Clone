// Mirrors backend/app/schemas.py one-for-one. If a field changes there, change
// it here — these two files are the contract between the halves of the app.

export type ExerciseType =
  | "multiple_choice"
  | "translate"
  | "match_pairs"
  | "fill_blank"
  | "type_answer";

export type SkillStatus = "locked" | "available" | "completed";

/** Which artwork a path node shows. Mirrors backend SkillKind. */
export type SkillKind = "lesson" | "story" | "chest" | "practice" | "review";

export interface UserProfile {
  id: number;
  name: string;
  xp_total: number;
  streak_count: number;
  hearts: number;
  max_hearts: number;
  gems: number;
  last_activity_date: string | null;
  /** Seconds until the whole bar refills; null when already full. */
  hearts_refill_in_seconds: number | null;
  lessons_completed: number;
  /** XP the server awards, so labels never hardcode a number that could drift. */
  xp_per_lesson: number;
  xp_per_practice: number;
  /** Legendary's reward, length and mistake allowance. */
  legendary_xp: number;
  /** Gems a treasure chest pays out. */
  leaderboard_unlock_lessons: number;
  leaderboard_unlocked: boolean;
}

export interface SkillNodeData {
  id: number;
  title: string;
  order_index: number;
  status: SkillStatus;
  kind: SkillKind;
  total_lessons: number;
  lessons_completed: number;
  progress: number; // 0.0 -> 1.0
  /** True once this skill's Legendary challenge has been beaten. */
  is_legendary: boolean;
}

export interface UnitData {
  id: number;
  title: string;
  order_index: number;
  skills: SkillNodeData[];
}

/** A unit's guidebook, derived server-side from that unit's own exercises. */
export interface Guidebook {
  unit_number: number;
  /** Unit title without its category prefix — the phrase-list heading. */
  topic: string;
  key_phrases: string[];
}

export interface CoursePath {
  units: UnitData[];
  current_skill_id: number | null;
}

// --- Exercise payloads (CLAUDE.md §5) -------------------------------------
export interface MultipleChoicePayload {
  question: string;
  options: string[];
  correct: string;
}

export interface TranslatePayload {
  prompt: string;
  word_bank: string[];
  correct_sequence: string[];
}

export interface MatchPairsPayload {
  pairs: { left: string; right: string }[];
}

export interface FillBlankPayload {
  sentence: string;
  options: string[];
  correct: string;
}

export interface TypeAnswerPayload {
  prompt: string;
  correct: string;
}

export type ExercisePayload =
  | MultipleChoicePayload
  | TranslatePayload
  | MatchPairsPayload
  | FillBlankPayload
  | TypeAnswerPayload;

// A discriminated union on `type` — narrowing this is what lets the lesson
// player pick the right component with no casts.
export type Exercise =
  | { id: number; type: "multiple_choice"; payload: MultipleChoicePayload }
  | { id: number; type: "translate"; payload: TranslatePayload }
  | { id: number; type: "match_pairs"; payload: MatchPairsPayload }
  | { id: number; type: "fill_blank"; payload: FillBlankPayload }
  | { id: number; type: "type_answer"; payload: TypeAnswerPayload };

export interface LessonStart {
  lesson_id: number;
  skill_title: string;
  is_practice: boolean;
  hearts: number;
  exercises: Exercise[];
}

export interface LessonCompleteBody {
  correct_count: number;
  mistake_count: number;
}

export interface LessonResult {
  xp_earned: number;
  xp_total: number;
  hearts: number;
  hearts_lost: number;
  streak_count: number;
  accuracy: number;
  is_perfect: boolean;
  /** True when this was a replay of an already-finished skill (half XP). */
  skill_completed: boolean;
  unlocked_skill_title: string | null;
}

/**
 * A Legendary challenge. Keyed on the skill rather than a lesson, because it
 * draws its questions from every lesson in the skill.
 */
export interface LegendaryStart {
  skill_title: string;
  hearts: number;
  /** Mistakes allowed while still earning the badge. */
  mistake_allowance: number;
  exercises: Exercise[];
}

export interface LegendaryResult {
  xp_earned: number;
  xp_total: number;
  hearts: number;
  hearts_lost: number;
  streak_count: number;
  accuracy: number;
  is_perfect: boolean;
  /** False when the run went over the allowance: XP paid, badge withheld. */
  legendary_earned: boolean;
  was_already_legendary: boolean;
  mistake_allowance: number;
}

/** Opening a unit's treasure chest. `claimed` is false if there was nothing to open. */
export interface ChestOpenResult {
  claimed: boolean;
  unlocked_skill_title: string | null;
}

export interface HeartsState {
  hearts: number;
  max_hearts: number;
}

export interface LeaderboardEntry {
  rank: number;
  user_id: number;
  name: string;
  xp_total: number;
  is_current_user: boolean;
}

/** The league table plus the header the reference shows above it. */
export interface Leaderboard {
  league: string;
  /** Tiers drawn in the header; the first is current, the rest locked. */
  /** Ranks at or above this advance — the PROMOTION ZONE divider sits under it. */
  promotion_rank: number;
  /** Whole days until the league week closes. */
  days_remaining: number;
  entries: LeaderboardEntry[];
}

export interface Explanation {
  explanation: string;
}
