# lumi-wellness-agent-fe

[한국어](README.md) · **English**

> **This file is a translation.** [README.md](README.md) (Korean) is the source of truth; where the two
> disagree, the Korean one is right. LUMI currently runs in Korean only — screen copy, questions, measures and
> activity guidance are Korean. Korean strings that are real values in the app (screen copy, voice names) are
> kept as they are, with an English gloss next to them. Linked documents marked (Korean) have no English version
> yet.

The frontend of LUMI (Light + Mind). LUMI is an AI wellness agent grounded in psychological theory and
clinical/experimental research references. It uses React · the Next.js App Router · TypeScript · Tailwind CSS v4
and deploys to Vercel. The backend is developed in
[lumi-wellness-agent-be](https://github.com/lumi-wellness-agent/lumi-wellness-agent-be).

There is a skeleton that connects every screen of the session flow (login · questions · measures · activity ·
evaluation and choice · end) and the SSE progress display to the BE session API, and the activity players are being
filled in by the BE activity node owners (A · B · C). Who fills in what is in [TEAM.md](TEAM.md) (Korean).

## User flow

```text
"오늘 상황이 어떠세요?" (How are things today?) → (if needed) up to 3 questions → pre-measure → activity recommendation · "왜 추천했나요?" (Why was this recommended?) Reference card
→ activity → post-measure → before/after comparison · next-step suggestion (end · change activity · additional session) → user's choice
→ change activity or an additional session goes back to activity recommendation; end goes to the final measure (S1 · S2 only), then finishes
```

- Start: only free text (e.g. "발표 앞두고 긴장돼요", "I'm nervous before my presentation") is required. Where you
  are now · earphones · available time are optional chips, and chip values take priority over what the BE reads
  from the text. The desired change (S1 easing repetitive thoughts · S2 easing stress and tension · S3 recovering
  attention after cognitive fatigue) is not asked; the BE intake infers it from the text and the conversation. If
  something is missing, it asks again within the session with option chips (3 questions in total). No stress
  number (0–10) is collected; the pre-measure measures the state. Tapping an example sentence below the input
  (one per goal) fills in the sentence and the circumstance chips (home · 10 minutes) together and goes to the
  measure without questions — the chips can be changed (`src/session/intake/labels.ts`).
- Measures: at pre, SAM (valence · arousal) and the goal scale (S1 BSRI · S2 STAI-6 · S3 MFVAS, a provisional
  instrument); after every activity, SAM (plus MFVAS for S3); at the end, the S1 · S2 goal scale once more. The BE
  sends the items and response scales, and the FE draws them as they are.
- Activity recommendation: one reviewed activity (protocol) comes at a time. An activity that uses several media
  together also arrives as a single validated protocol; the BE never bundles activities on its own. The player runs
  the received content's steps (ACTIVITY · NOTICE · CHOOSE) and its image · video · sound assets.
- Reference card: theory → paper DOI → population and experimental condition → results → limitations
- It shows research evidence but makes no claim of medical diagnosis or treatment efficacy.

## Getting started

Uses Node.js 24 and npm. Paths are relative to the repository root.

```bash
npm ci
cp .env.example .env
npm run dev
```

Dev server: <http://localhost:3000>

| Command | Purpose |
| --- | --- |
| `npm run dev` | dev server |
| `npm run lint` | ESLint |
| `npm run typecheck` | Next.js type generation and TypeScript check |
| `npm test` | tests for the ship gate · polling scripts, voice guidance, the SSE parser and Light of the Day (`node --test`) |
| `npm run build` | production build |
| `npm start` | runs the built server |

## Files

```text
src/app/
├─ layout.tsx        shared layout · metadata · fonts, and the script that sets the light before the first screen
├─ page.tsx          start screen (the input is in start-form.tsx)
├─ session/          session screen — switches screens by step (ASK · MEASURE · RUN · CONFIRM · END)
├─ consent/          member records consent
├─ auth/callback/    where social login returns
├─ records/          member activity history — a calendar and the session cards of the chosen day (GET /me/sessions). Guests are invited to log in
├─ settings/         screen color · logout · account deletion
├─ dev/              development only — mock session · screen · player previews (404 in production)
├─ backend-warmup.tsx wakes the BE when the app opens — members also prefetch this month's activity history (see “Backend integration”)
├─ light-sync.tsx    sets the light again on navigation · on returning to the app · every minute, and matches the browser top-bar color
└─ globals.css       Tailwind v4 and design tokens (Light of the Day)
src/session/         session state machine (use-session.ts) and screens · Reference card · progress display · copy (labels.ts)
├─ intake/           start input · questions (ASK) · SAFETY help screen — owner A
└─ measure/          measure screen (pre · post · final) — owner B
src/players/         activity players — contract (types.ts) · activity → player table (catalog.ts) · host · 10 player folders (TEAM.md)
src/ui/controls.tsx  shared buttons · chips · screen frame · spinners (progress display · photo loading) (48px touch targets · token colors)
src/ui/tab-bar.tsx   bottom tab bar — home · records · settings (tab screens only; not on the session · consent · login screens)
src/fixtures/        sample BE responses — scripts/fixtures.py builds them from BE code
src/lib/
├─ api/              BE session API — contract types · JSON/SSE client · SSE parser (test sse.test.mjs) · mock BE · activity history fetched per month (records.ts)
├─ auth.ts           Supabase login — guest (anonymous) · Google · Kakao
├─ days.ts           date math for the records calendar — days · months · a month's time range in the device time zone (test days.test.mjs)
├─ keyed-cache.ts    in-memory cache per key (user · month) — callers share an in-flight request, and a request that finishes after the entry was dropped is not kept (test keyed-cache.test.mjs)
├─ light.ts          rules that set the light by time of day · session · settings (test light.test.mjs)
├─ speech.ts         voice guidance — reads scripts with speechSynthesis, and the rules for picking a voice (test speech.test.mjs)
└─ tone.ts           end chime — Web Audio
scripts/fixtures.py  builds the samples (run with the BE .venv, TEAM.md “개발 방법”)
next.config.ts      Next.js config
postcss.config.mjs  Tailwind v4 PostCSS plugin
tsconfig.json       TypeScript config
eslint.config.mjs   ESLint config
.env.example        environment variable example
AGENTS.md           working rules for AI agents (Codex · Claude Code)
TEAM.md             per-role development guide — owners · files · contracts · order of work
.github/workflows/ci.yml   checks on PRs and main pushes (lint · typecheck · test · build)
.github/ISSUE_TEMPLATE/    issue templates (same as the BE — the ship harness uses them to write issue bodies)
automation/                ship harness (setup doc README.md + harness-neutral spec + gate · polling scripts)
```

## Design system: Light of the Day (하루의 빛)

Only the screen colors change with the time of day. Fonts (Gowun Dodum for titles, Noto Sans KR for body text),
text sizes and radii stay the same.

| Device time | Light | `<html data-light>` |
| --- | --- | --- |
| 05:00–11:59 | A Mist (물안개) | `mist` |
| 12:00–17:59 | B Sunlight (볕, default) | `sunlit` |
| 18:00–04:59 | C Moonlight (달빛) | `moonlight` |

Tokens are in `src/app/globals.css`. Per-time values live in `--lumi-*` variables and are used through the Tailwind
classes below. Color tokens work with any of `bg-` · `text-` · `border-`.

| Use | Classes |
| --- | --- |
| Page background · card · faint surface | `bg-page` · `bg-surface` · `bg-surface-muted` |
| Text · secondary text | `text-ink` · `text-ink-muted` |
| Dividers · chip and selectable-row borders · radio and secondary-button borders | `border-line` · `border-line-control` · `border-line-strong` |
| Chip and selectable-row background | `bg-control` |
| Primary button | `bg-primary` · `text-on-primary` |
| Selected chips and rows | `bg-primary-soft` · `text-on-primary-soft` · `border-indicator` · `shadow-selected` |
| Accent · progress bar | `bg-accent` · `bg-progress` |
| Session goal colors (icons · dots) | `bg-goal-s1` · `bg-goal-s2` · `bg-goal-s3` |
| Social login buttons (`src/ui/social-login.tsx`) | `bg-google` · `border-google-line` · `bg-kakao` |
| Card shadow | `shadow-card` |
| Radius | `rounded-card` 18 · `rounded-button` 14 · `rounded-chip` 12 · `rounded-row` 12 (px) |
| Text size | `text-title` 26 · `text-body` 15 · `text-caption` 13 · `text-fine` 12 (px) — `text-fine` is the reason · source text right below a photo · video · sound box |
| Title font | `font-display` (body text uses the default `font-sans`) |

- Tailwind's default palette (`bg-gray-100` etc.) is removed, because fixed colors would stay the same when the time
  of day changes. Only `white` · `black` for overlays on photos and the Kakao login color remain.
- Social login buttons are round icon buttons with the mark only, using the colors and marks from each company's
  login-button guide as they are. Google uses its light theme on the light sets and its dark theme on the dark sets;
  Kakao has no dark pair, so it is always background `#FEE500` · black symbol. The Kakao background has 1.2:1
  contrast against the light sets' page, but the black symbol signals a button, and the guide forbids other colors,
  so no border is added.
- When the phone is in dark mode, A and B switch to their dark pairs, and C is always dark. There are five color
  sets — A · A dark · B · B dark · C — all above WCAG AA contrast (4.5:1 for text, 3:1 for indicator lines and
  control borders). Check new screens in all five sets.
- The server does not know the user's local time, so the `<head>` script in `layout.tsx` sets `data-light` before
  the first screen. After that it is set again on navigation, on returning to the app and every minute while the
  app is open, so it follows a change of time of day even if the app stays open. The browser top-bar color
  (`theme-color`) matches the screen background.
- The rules below are kept by functions in `src/lib/light.ts`.
  - Colors do not change during a session, so the before/after measures are taken on the same screen. Call
    `lockLight()` when a session starts and `unlockLight()` when it ends. The locked light is used only on the
    session screen (`/session`). Leaving without finishing the session lets other screens follow the time of day,
    and returning to the session uses the locked light again. A new session does not inherit the previous
    session's light.
  - Fixing the screen color in settings calls `pickLight("mist" | "sunlit" | "moonlight")`; switching back to
    following the time of day calls `pickLight(null)`.
  - If the profile's `avoided_colors` includes black or dark purple, call `setAvoidDark(true)`; B is then used
    instead of C even in the evening and at night.
- To see another time of day, run `localStorage.setItem("lumi:light-pick", "moonlight")` in the browser devtools
  console and refresh. Undo it with `localStorage.removeItem("lumi:light-pick")`.

## Backend integration

- Local server: `http://127.0.0.1:8000`
- Health check: `GET /health`, DB check: `GET /health/db`
- Static assets: `GET /assets/…` (reviewed audio · coloring templates kept in the BE repository). Content asset URLs
  can arrive as paths relative to the BE, like `/assets/…`, so `assetUrl()` (`src/lib/api/client.ts`) prefixes the
  BE address.
- Session API: see “Session requests” below. The source of the contract is the BE README's “Session API” section,
  and the FE types are in `src/lib/api/types.ts`.

The FE calls the BE directly from the browser. The BE allows the FE origin through CORS — locally only
`http://localhost:3000` is allowed, so open `localhost:3000`, not `127.0.0.1:3000`. The BE address is
`NEXT_PUBLIC_BACKEND_URL`; if it is empty, the local BE (`http://127.0.0.1:8000`) is used. Put the production BE
address into Vercel.

The production BE is a Vercel function, so it sleeps after about 10 minutes without requests, and the first request
after that takes about 6 seconds (cold start — production logs, 2026-11-02). So when the app opens
(`src/app/backend-warmup.tsx`), members prefetch this month's activity history and that request wakes the BE, and
everyone else calls `GET /health` (it has no auth header, so it goes without a CORS preflight). The fetched history
is kept per month in tab memory only (`src/lib/api/records.ts` — it is empty after a refresh and never stored on the
device); the records tab shows it right away, then fetches this month again and replaces it. It is discarded when a
session proceeds or on logout · account deletion. Going to the records tab right after opening the app, or
refreshing on it, waits out the whole wake-up.

`NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` are used in the browser for Supabase login
(anonymous trial · Google · Kakao) (`src/lib/auth.ts`). The access token from login goes into
`Authorization: Bearer` on BE requests, and the BE verifies it with Supabase's public keys (JWKS). Both values are
meant to be public in the browser, so they live in the FE. The Supabase DB credentials and secret key, LLM keys
and content provider keys (Pixabay · Freesound · AI Horde) are managed only in the BE.

- Users who do not log in start as guests (Supabase anonymous sign-in) and leave no records. The guest login
  session is kept in sessionStorage, so closing the tab ends the trial. Turn on Anonymous Sign-Ins in the Supabase
  dashboard.
- Members log in with Google · Kakao and give records consent once at first (`/consent`, `PUT /me/consent`).
- Members pick a date on the calendar in the records tab (`/records`) to see that day's session activities. At
  first, today in the current month is selected. History is fetched one month at a time in the device time zone
  (`GET /me/sessions?since=&until=&limit=100` — up to 100 sessions started that month, newest first (the BE
  maximum), with the activity name on each round). Earlier months can be browsed only back to the response's
  `first_started_at` (the earliest record), and if it is `null`, a no-records notice is shown. Guests have no
  records and are invited to log in.
- Social login returns to `/auth/callback`. Register the local (`http://localhost:3000/auth/callback`) ·
  production · preview deployment addresses under Redirect URLs in the Supabase dashboard, Authentication → URL
  Configuration.

### Session requests

One session is one BE graph run (a LangGraph thread). The graph stops wherever user input is needed and returns
`{session_id, step, node, payload}`, and the FE picks the screen by `step` (`src/session/session-flow.tsx`).
Requests where an LLM runs before the response are received over SSE, with progress messages on screen.

| Request | What is sent | `step` received |
| --- | --- | --- |
| `POST /sessions` (SSE) | `CareRequest` — free text + environment chips + profile | `ASK` · `MEASURE` (pre) · `END` (`SAFETY`) |
| `POST /sessions/{id}/answer` (SSE) | `IntakeAnswer` — one of `answer` (the merged `set` of the chosen options), a typed `text`, or a re-ask's `skip` | `ASK` · `MEASURE` (pre) · `END` |
| `POST /sessions/{id}/measure` | `{instrument_id: {item_id: value}}` — pre (SSE) · post · final | `RUN` · `CONFIRM` · `END` |
| `POST /sessions/{id}/report` | `SessionReport` — completed or not · stop reason · 1–3 NOTICE emotion words (no scores are sent) | `MEASURE` (post — SAM, plus MFVAS for S3) |
| `POST /sessions/{id}/decision` (SSE) | `ReplanDecision` — end · change activity · additional session | `RUN` · `MEASURE` (final, S1 · S2) · `END` |
| `POST /sessions/{id}/retry` (SSE) | — | reruns from the node where a `STALLED` session stopped |
| `GET /sessions/{id}` | — | where the session is stopped now (refresh · recovery from a dropped stream) |

- Measure items come per instrument with the response scale (`scale.kind` — PICTORIAL · LIKERT · SLIDER) and the
  item text · end labels. Every received instrument must be answered, and for sliders only the items the user
  touched count as answers.
- With a safety signal (`SAFETY`), the session ends with help information instead.
- Errors are `{"detail": {code, message, …}}` and are handled as in the BE README's “Errors” table — no consent →
  the consent screen, `retryable` → `retry`, a dropped stream or a step mismatch → check where the session stopped
  again with `GET`.

## Voice guidance

Activity scripts are read with the browser's `speechSynthesis`, without recorded audio (BE README “RUN payload”).
Only PR-21 has a recorded track. The rules are kept by functions in `src/lib/speech.ts`.

- Voices are picked best first — desktop Chrome's `Google 한국의` (online) → Edge's
  `Microsoft … Online (Natural)` → Safari · iOS · Mac's `Yuna`. macOS novelty voices (Eddy · Flo etc.) are not
  used. On an error (e.g. a network error of an online voice), reading resumes from that sentence with the next
  voice.
- Scripts are read sentence by sentence (0.4 s between sentences, 1.5 s at a blank line). Chrome's online voices cut
  off when they read for more than about 15 seconds at once.
- Call `loadVoices()` when the activity screen opens, `unlockSpeech()` in the start button's `onClick` (on iOS,
  sound only plays if the first reading happens at the moment of the user's tap), `speakScript(text)` at each
  playback point, and `cancelSpeech()` when stopping or leaving the screen. Reading a new script stops the one being
  read.
- If `speakScript()` returns `false` (unsupported browser · no voice to read with · stopped midway), only the
  on-screen text is shown. Scripts whose `source_policy.tts` is `FORBIDDEN` are not read.

## Branch and PR rules

The same rules as the BE repository. Branches go feature → `main` (no `dev`).

1. Create an issue from a template (기능 구현 feature · 기능 수정 change · 오류 수정 bug fix · 리팩토링 refactoring ·
   문서 작업 docs · 기타 수정 other).
2. Branch `<type>/#<issue number>` off `main`. E.g. `feat/#12`, `chore/#13`
3. Open a PR into `main`. The title is `[type/#issue number] description`, and the body says `close #issue number`.
   It merges after CI (`check`: lint · typecheck · test · build) passes, and it is squash-merged.

The **ship harness** automates steps 1–3. After finishing a code change, call `/ship` in Claude Code or `$ship` (or
"ship" · "배포해줘", "deploy it") in Codex, and it runs validation (`npm run lint` · `npm run typecheck` ·
`npm test` · `npm run build`) → issue and branch creation → PR → CI gate → squash merge → main CI check → (when
Vercel is connected) production deployment check. The source procedure is the harness-neutral spec
`automation/ship.md` · `automation/pipeline.md` (Korean); `.claude/commands/ship.md` and
`.agents/skills/ship/SKILL.md` are the entry adapters for each harness. The polling and gate scripts
(`automation/bin/*.mjs`) use only the Node standard library, so no bash · jq is needed, and `npm test`
regression-tests `automation/test/`. Setup for a new PC (tool install and login, Codex config, Windows) is in
[`automation/README.md`](automation/README.md) (Korean).

## Vercel

Import this GitHub repository as its own Vercel project.

- Framework Preset: Next.js
- Root Directory: the repository root (`.`)
- Production Branch: `main`
- Node.js: 24.x (`engines` in `package.json`)
- Install Command: `npm ci`
- Build Command: `npm run build`

This repository is Git-connected to its Vercel project, so a merge into `main` deploys to production. PR branches
are not deployed (`git.deploymentEnabled` in `vercel.json`). Hobby creates at most 100 deployments a day
(24 hours), so building a Preview on every PR push fills the quota and blocks even `main` deployments. Check before
merging with CI (including `check`'s build) and local previews (`/dev/players/<id>`).
To require passing GitHub Actions CI for merging, set up the repository's branch rules.
