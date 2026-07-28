# Duolingo Clone

A functional clone of the Duolingo web app: a gamified language-learning platform with a
skill path, a lesson player covering five exercise types, XP / streak / hearts / gems
mechanics, treasure chests, Legendary challenges, per-unit guidebooks, a league
leaderboard, a quests page, a shop, and persistent per-user progress.

Built as an SDE fullstack internship assignment. The visual reference is the real
Duolingo web app; wherever possible, layout numbers were measured from captured computed
styles rather than eyeballed.

---

## Tech stack

| Layer      | Choice                              | Notes                                          |
|------------|-------------------------------------|------------------------------------------------|
| Frontend   | Next.js 15 (App Router), React 19, TypeScript 5 | Client components for all interactive surfaces |
| Styling    | Tailwind CSS 3                      | Palette sampled from the reference             |
| Backend    | Python, FastAPI, Pydantic v2        | Pydantic models double as the API contract     |
| Database   | SQLite via SQLAlchemy 2             | File-based; zero setup                         |
| Auth       | None (by design)                    | Single seeded learner, user id 1               |
| AI (optional) | Anthropic API                    | One isolated route for wrong-answer hints      |

---

## Quick start

### 1. Backend (port 8000)

```bash
cd backend
python -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
pip install -r requirements.txt
python seed.py                    # builds the SQLite DB: course, units, lessons, users
uvicorn app.main:app --reload --port 8000
```

Interactive API docs: <http://localhost:8000/docs>

Optional `backend/.env` (see `.env.example`):

```
ANTHROPIC_API_KEY=...     # only for POST /api/exercise/explain; app works without it
CORS_ORIGINS=http://localhost:3000,https://your-frontend.example
```

### 2. Frontend (port 3000)

```bash
cd frontend
npm install
npm run dev
```

`frontend/.env` (see `.env.example`):

```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### Production build

```bash
cd frontend && npm run build && npm start     # stop the dev server first — they share .next
```

The backend runs under any ASGI server, e.g. `uvicorn app.main:app --host 0.0.0.0 --port 8000`.
SQLite needs a persistent disk on the host (Render/Railway); set `DATABASE_URL` to point the
file at the mounted path, and `CORS_ORIGINS` at the deployed frontend origin.

Re-running `python seed.py` is idempotent — it rebuilds content deterministically (fixed
shuffle seed), so a rebuilt database is byte-comparable.

---

## Architecture

```
backend/
  app/
    main.py          FastAPI app, CORS (env-driven), router wiring, health check
    database.py      engine/session; DATABASE_URL overridable for hosted disks
    models.py        SQLAlchemy models — the schema below
    schemas.py       Pydantic request/response models (the API contract)
    time_utils.py    naive-UTC now/today, used everywhere consistently
    routers/         thin HTTP handlers: user, course, lesson, hearts,
                     leaderboard, explain (optional AI)
    services/
      progress.py    ALL game-state rules: XP, hearts, streak, unlock, chest,
                     Legendary, leaderboard gate + league table
      guidebook.py   derives each unit's guidebook from its own exercises
      ai.py          Claude call + static fallback for the hint route
  seed.py            idempotent seeding (drop/recreate), 13-unit English course
  seed_content.py    the authored curriculum data

frontend/
  app/               routes: learn (path), lesson/[skillId] (player, also runs
                     Legendary via ?mode=legendary), guidebook/[unitId],
                     sections, quests, shop, leaderboard, profile
  components/        path/ (nodes, popovers, characters, chest reward flight),
                     lesson/ (five Exercise* components + player chrome),
                     rail/ (right rail: stats, popovers, quests, status),
                     leaderboard/, quests/, shop/, shared/ (nav, top bar, assets)
  lib/               api.ts (fetch wrappers), types.ts (mirrors schemas.py),
                     pathGeometry.ts (the path's measured layout rules),
                     rail.ts / quests.ts / status.ts / speech.ts / format.ts
  hooks/             useInView (lazy loading), useActiveUnit (sticky header)
  public/duo/        the reference's own SVG artwork, served locally
  public/characters/ 13 unit-character SVGs with per-figure idle animations
```

Design rules the codebase follows:

- **Game state is server-authoritative.** XP, hearts, streak, unlocking, chest payouts and
  Legendary badges are all computed in `services/progress.py`. The frontend renders what
  the API returns; it never does game arithmetic.
- **One exercise contract.** Every `Exercise*` component receives exactly
  `{ payload, onAnswer }`, so the lesson player doesn't branch on type for anything except
  which component to mount.
- **Derived over stored.** Hearts regenerate lazily on read (no cron); the streak calendar,
  guidebooks, quest countdowns and the league week are computed from existing fields
  rather than persisted.
- **Assets are local.** The reference's SVGs (logo, nav icons, path glyphs, chests, medals,
  status tiles) are downloaded into `public/duo/`, so the app renders offline and doesn't
  hotlink another site's CDN.

---

## Database schema

Static course content (seeded) and mutable user state:

```
User (one row)      Course            Unit              Skill
 - id                - id              - id              - id
 - name              - title           - course_id FK    - unit_id FK
 - xp_total                            - title           - title
 - streak_count                        - order_index     - order_index
 - last_activity_date                                    - kind (lesson|story|chest|
 - hearts                                                        practice|review)
 - hearts_last_refill_at
 - gems

Lesson              Exercise                       UserSkillProgress
 - id                - id                           - id
 - skill_id FK       - lesson_id FK                 - user_id FK
 - order_index       - order_index                  - skill_id FK
                     - type (5-value enum)          - status (locked|available|completed)
                     - payload (JSON, per type)     - times_completed
                                                    - is_legendary
```

Relationships: `Course 1—N Unit 1—N Skill 1—N Lesson 1—N Exercise`;
`User N—N Skill` through `UserSkillProgress` (unique per user+skill).

Exercises use a single JSON `payload` column instead of five near-identical tables; the
five payload shapes are documented in `schemas.py` and mirrored in `lib/types.ts`.
`is_legendary` is the one field added beyond the original brief — the Legendary badge has
to survive a reload, and no existing column can carry it.

Two deliberate minimalism rules keep the contract tight. The users table holds exactly
one row: leaderboard competitors are static constants in `services/progress.py`, since
only the real learner's XP ever changes. And every field in `schemas.py` is consumed by
the frontend — the mirror types were stripped field-by-field with `tsc` re-run to prove
which ones the UI touches, and the ~30 that compiled away cleanly were removed
end-to-end.

---

## API overview

All routes act as the default learner (user id 1). Full schemas at `/docs`.

| Method | Route                                     | Purpose |
|--------|-------------------------------------------|---------|
| GET    | `/`                                       | Health check |
| GET    | `/api/user/me`                            | Profile + live game state (XP, streak, hearts + refill countdown, gems, counters, tunable XP/gem rates) |
| GET    | `/api/course/path`                        | Units/skills tree with per-skill status, progress and Legendary flag |
| POST   | `/api/course/units/{unit_id}/jump`        | "JUMP HERE?" — unlock a unit's first node without back-filling |
| GET    | `/api/course/units/{unit_id}/guidebook`   | Key phrases derived from the unit's own exercises |
| POST   | `/api/course/chest/{skill_id}/open`       | Open a reached treasure chest (idempotent; pays gems once) |
| GET    | `/api/lesson/{skill_id}/start`            | Ordered exercises for the skill's next (or practice) lesson |
| POST   | `/api/lesson/{lesson_id}/complete`        | Apply XP/gems/hearts/streak/unlock for a finished lesson |
| GET    | `/api/lesson/{skill_id}/legendary`        | The Legendary challenge (423 until the skill is completed) |
| POST   | `/api/lesson/{skill_id}/legendary/complete` | Score a Legendary run; badge only within the mistake allowance |
| POST   | `/api/hearts/refill`                      | Mocked instant refill |
| GET    | `/api/leaderboard`                        | League table + header (423 until 2 lessons are done) |
| POST   | `/api/exercise/explain`                   | Optional AI hint for a wrong answer; static fallback without a key |

---

## Game rules

- **XP** — 10 per lesson, 5 for practising an already-completed skill, +5 no-mistake
  bonus, 40 for a Legendary run.
- **Hearts** — 5 max; one lost per mistake. An empty-to-full reset happens 5 hours after
  the bar was last full, computed lazily on read.
- **Streak** — same day: unchanged; yesterday: +1; older: reset to 1.
- **Unlocking** — completing a skill flips the next one (by order) from locked to
  available. A unit's chest becomes available like any node and pays **15 gems** when
  opened; opening it is a click, not automatic, and it never counts as a lesson.
- **Legendary** — 16 questions pooled from *every* lesson in the skill, hardest types
  first, with multiple-choice/fill-blank questions hardened into type-the-answer. Up to
  3 mistakes still earn the badge; more pays the XP but withholds it.
- **Leaderboard** — opens after 2 completed lessons (enforced server-side). Ranked by
  total XP; top 15 are the promotion zone; the league week ends Sunday (UTC).
- **Daily quest** — "Earn 10 XP", satisfied by any lesson today; refreshes at UTC
  midnight, the same boundary the server uses for the streak.

---

## Assumptions & scope

Deliberate simplifications, per the assignment brief:

- **Single hardcoded user, no auth.** Every request is learner id 1.
- **One course** (English), 13 seeded units in one section; sections 2+ are shown as
  "coming soon".
- **Leaderboard ranks total XP**, not weekly XP — the schema has no per-week counter. The
  competitors are static constants (name + XP), not database rows: they never change, so
  storing them bought nothing.
- **The status emoji** on the leaderboard is stored in `localStorage` (cosmetic;
  per-browser by design).
- **Placeholders stay honest.** Super/payments, friend streaks, monthly challenges,
  letters/practice hubs and "add a course" render with the reference's copy but raise a
  "not implemented in this build" toast instead of pretending to work.
- **Speech** uses the browser's built-in `speechSynthesis` — no external TTS. Some
  browsers require one user gesture before audio starts; the replay button covers that.
- **Artwork** is Duolingo's own published SVG assets, cached locally for an educational,
  non-commercial clone; the remaining illustrations are hand-drawn approximations.

---

## Verification

- `tsc --noEmit` and `next build` pass clean; all 10 routes prerender or render on demand.
- Backend behaviour (XP totals, heart timing, chest idempotency, Legendary allowance,
  leaderboard gate) was exercised end-to-end against the running API during development,
  including failure paths (400 over-reporting, 404 unknown ids, 423 locked/gated).
