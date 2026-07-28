// Thin fetch wrappers around the backend routes (CLAUDE.md §6). One function
// per endpoint; no business logic lives here — the server owns game state.

import type {
  ChestOpenResult,
  CoursePath,
  Explanation,
  Guidebook,
  HeartsState,
  Leaderboard,
  LegendaryResult,
  LegendaryStart,
  LessonCompleteBody,
  LessonResult,
  LessonStart,
  UserProfile,
} from "./types";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

/** Carries the HTTP status so callers can branch (e.g. 423 => skill locked). */
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      cache: "no-store",
      headers: { "Content-Type": "application/json" },
      ...init,
    });
  } catch {
    throw new ApiError(
      0,
      `Can't reach the API at ${BASE_URL}. Is the backend running?`,
    );
  }

  if (!response.ok) {
    // FastAPI puts human-readable messages in `detail`.
    let message = response.statusText || `Request failed (${response.status})`;
    try {
      const body = await response.json();
      if (typeof body?.detail === "string") message = body.detail;
    } catch {
      // Non-JSON error body — keep the status text.
    }
    throw new ApiError(response.status, message);
  }

  return (await response.json()) as T;
}

export const api = {
  me: () => request<UserProfile>("/api/user/me"),

  coursePath: () => request<CoursePath>("/api/course/path"),

  /** Skip ahead to a unit. Returns the refreshed path. */
  jumpToUnit: (unitId: number) =>
    request<CoursePath>(`/api/course/units/${unitId}/jump`, { method: "POST" }),

  /**
   * Open a reached treasure chest. Safe to call repeatedly — a chest that's
   * already open answers 200 with `claimed: false` rather than erroring.
   */
  openChest: (skillId: number) =>
    request<ChestOpenResult>(`/api/course/chest/${skillId}/open`, {
      method: "POST",
    }),

  /** A unit's key phrases and vocabulary. Static content — no gate. */
  guidebook: (unitId: number) =>
    request<Guidebook>(`/api/course/units/${unitId}/guidebook`),

  startLesson: (skillId: number) =>
    request<LessonStart>(`/api/lesson/${skillId}/start`),

  completeLesson: (lessonId: number, body: LessonCompleteBody) =>
    request<LessonResult>(`/api/lesson/${lessonId}/complete`, {
      method: "POST",
      body: JSON.stringify(body),
    }),

  /** The Legendary challenge for a completed skill. 423 until it's completed. */
  startLegendary: (skillId: number) =>
    request<LegendaryStart>(`/api/lesson/${skillId}/legendary`),

  completeLegendary: (skillId: number, body: LessonCompleteBody) =>
    request<LegendaryResult>(`/api/lesson/${skillId}/legendary/complete`, {
      method: "POST",
      body: JSON.stringify(body),
    }),

  refillHearts: () =>
    request<HeartsState>("/api/hearts/refill", { method: "POST" }),

  leaderboard: () => request<Leaderboard>("/api/leaderboard"),

  /** Optional AI hint. Falls back to a static message server-side. */
  explain: (body: {
    question: string;
    correct_answer: string;
    user_answer?: string;
  }) =>
    request<Explanation>("/api/exercise/explain", {
      method: "POST",
      body: JSON.stringify(body),
    }),
};
