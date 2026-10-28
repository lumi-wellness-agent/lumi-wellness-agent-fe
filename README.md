# lumi-wellness-agent-fe

LUMI(Light + Mind)의 프론트엔드입니다. LUMI는 심리학 이론·임상/실험 연구 Reference 기반 AI 웰니스 에이전트입니다.
React·Next.js App Router·TypeScript·Tailwind CSS v4를 사용하고 Vercel에 배포합니다.
백엔드는 [lumi-wellness-agent-be](https://github.com/lumi-wellness-agent/lumi-wellness-agent-be)에서 개발합니다.

세션 흐름 화면 전부(로그인 · 질문 · 측정 · 활동 · 평가·선택 · 종료)와 SSE 진행 표시를 BE 세션 API에 연결한 뼈대가
있고, 활동 플레이어는 BE 활동 노드 담당(A · B · C)이 채우는 중입니다. 누가 무엇을 채우는지는 [TEAM.md](TEAM.md)에 있습니다.

## 사용자 흐름

```text
"오늘 상황이 어떠세요?" → (필요하면) 질문 최대 3회 → 사전 측정 → 활동 추천 · "왜 추천했나요?" Reference 카드
→ 활동 → 사후 측정 → 전후 비교 · 다음 단계 제안(종료 · 활동 변경 · 추가 세션) → 사용자 선택
→ 활동 변경·추가 세션이면 다시 활동 추천으로, 종료면 모든 목표에서 SAM 종료 측정 뒤 끝
```

- 시작: 자유 텍스트(예: "발표 앞두고 긴장돼요")만 필수입니다. 지금 있는 곳 · 이어폰 · 쓸 수 있는 시간은 선택
  칩이고, 칩 값이 BE가 문장에서 읽은 값보다 우선합니다. 원하는 변화(S1 반복적 생각 완화 · S2 스트레스·긴장 완화 ·
  S3 주의력·인지 피로 회복)는 묻지 않고 BE intake가 문장과 대화로 추론합니다. 부족하면 세션 안에서 보기 칩으로
  다시 묻습니다(질문 합계 3회). 스트레스 수치(0~10)는 받지 않고, 상태 점수는 사전 측정이 잽니다.
- 측정(MVP): 모든 목표에서 사전·활동 후·종료 시 SAM(쾌·각성)만 받습니다. STAI-6·BSRI는 BE 데이터에 `TODO`로
  남기고 화면에 보내지 않습니다. SAM 변화는 기분 참고값이며 목표 증상의 직접 측정이나 임상 점수가 아닙니다.
  문항과 응답 척도는 BE가 보내고 FE는 활성 척도만 그립니다.
- 활동 추천: 한 번에 검수된 활동(프로토콜) 하나가 옵니다. 여러 매체를 함께 쓰는 활동도 검증된 프로토콜 하나로
  오고, BE가 활동을 임의로 묶지 않습니다. 플레이어는 받은 콘텐츠의 단계(ACTIVITY · NOTICE · CHOOSE)와
  이미지·영상·소리 자산을 실행합니다.
- Reference 카드: 이론 → 논문 DOI → 대상·실험 조건 → 결과 → 한계
- 연구 근거를 보여 주되 의료적 진단·치료 효능은 주장하지 않습니다.

## 시작하기

Node.js 24와 npm을 사용합니다. 경로는 저장소 루트 기준입니다.

```bash
npm ci
cp .env.example .env
npm run dev
```

개발 서버: <http://localhost:3000>

| 명령 | 용도 |
| --- | --- |
| `npm run dev` | 개발 서버 |
| `npm run lint` | ESLint |
| `npm run typecheck` | Next.js 타입 생성 및 TypeScript 검사 |
| `npm test` | ship 게이트·폴링 스크립트, 안내 음성, SSE 파서 테스트 (`node --test`) |
| `npm run build` | 프로덕션 빌드 |
| `npm start` | 빌드한 서버 실행 |

## 파일 구성

```text
src/app/
├─ layout.tsx        공통 레이아웃·메타데이터·글꼴, 첫 화면 전에 빛을 정하는 스크립트
├─ page.tsx          시작 화면 (입력은 start-form.tsx)
├─ session/          세션 화면 — step(ASK · MEASURE · RUN · CONFIRM · END)에 따라 화면을 바꾼다
├─ consent/          회원 기록 동의
├─ auth/callback/    소셜 로그인에서 돌아오는 곳
├─ settings/         화면 색 · 로그아웃 · 탈퇴
├─ dev/              개발용 — 목업 세션 · 화면 · 플레이어 미리보기 (운영 배포에서는 404)
├─ light-sync.tsx    앱으로 돌아오면 빛을 다시 정하고 브라우저 상단 색을 맞춤
└─ globals.css       Tailwind v4와 디자인 토큰 (하루의 빛)
src/session/         세션 상태 기계(use-session.ts)와 화면들 · Reference 카드 · 진행 표시 · 문구(labels.ts)
├─ intake/           시작 입력 · 질문(ASK) · SAFETY 도움 안내 — 담당 A
└─ measure/          측정 화면(사전 · 사후 · 종료) — 담당 B
src/players/         활동 플레이어 — 계약(types.ts) · 활동→플레이어 표(catalog.ts) · 호스트 · 플레이어 폴더 10개 (TEAM.md)
src/ui/controls.tsx  공통 버튼 · 칩 · 화면 틀 (터치 48px · 토큰 색)
src/fixtures/        BE 응답 견본 — scripts/fixtures.py가 BE 코드로 만든다
src/lib/
├─ api/              BE 세션 API — 계약 타입 · JSON/SSE 클라이언트 · SSE 파서(테스트 sse.test.mjs) · 목업 BE
├─ auth.ts           Supabase 로그인 — 게스트(익명) · Google · 카카오
├─ light.ts          시간대·세션·설정에 따라 빛을 정하는 규칙
├─ speech.ts         안내 음성 — 대본을 speechSynthesis로 읽고 음성을 고르는 규칙 (테스트 speech.test.mjs)
└─ tone.ts           종료 알림음 — Web Audio
scripts/fixtures.py  견본 만들기 (BE .venv로 실행, TEAM.md 「개발 방법」)
next.config.ts      Next.js 설정
postcss.config.mjs  Tailwind v4 PostCSS 플러그인
tsconfig.json       TypeScript 설정
eslint.config.mjs   ESLint 설정
.env.example        환경 변수 예시
AGENTS.md           AI 에이전트(Codex·Claude Code) 작업 규칙
TEAM.md             역할별 개발 가이드 — 담당 · 파일 · 계약 · 작업 순서
.github/workflows/ci.yml   PR·main 푸시 검증 (lint · typecheck · test · build)
.github/ISSUE_TEMPLATE/    이슈 템플릿 (BE와 동일 — ship 하네스가 이슈 본문을 만들 때 쓴다)
automation/                ship 하네스 (준비 문서 README.md + 하네스 중립 명세 + 게이트·폴링 스크립트)
```

## 디자인 시스템: 하루의 빛

시간대에 따라 화면 색만 바꿉니다. 글꼴(제목 고운돋움, 본문 Noto Sans KR), 글자 크기, 반경은 하나입니다.

| 기기 시각 | 빛 | `<html data-light>` |
| --- | --- | --- |
| 05:00~11:59 | A 물안개 | `mist` |
| 12:00~17:59 | B 볕 (기본값) | `sunlit` |
| 18:00~04:59 | C 달빛 | `moonlight` |

토큰은 `src/app/globals.css`에 있습니다. 시간대별 값은 `--lumi-*` 변수에 두고 아래 Tailwind 클래스로 씁니다.
색 토큰은 `bg-` · `text-` · `border-` 어디에나 붙일 수 있습니다.

| 쓰임 | 클래스 |
| --- | --- |
| 페이지 배경 · 카드 · 옅은 면 | `bg-page` · `bg-surface` · `bg-surface-muted` |
| 글자 · 보조 글자 | `text-ink` · `text-ink-muted` |
| 구분선 · 칩과 선택 행 테두리 · 라디오와 보조 버튼 테두리 | `border-line` · `border-line-control` · `border-line-strong` |
| 칩과 선택 행 바탕 | `bg-control` |
| 주요 버튼 | `bg-primary` · `text-on-primary` |
| 선택한 칩과 행 | `bg-primary-soft` · `text-on-primary-soft` · `border-indicator` · `shadow-selected` |
| 강조 · 진행 막대 | `bg-accent` · `bg-progress` |
| 세션 목표 색 (아이콘·점) | `bg-goal-s1` · `bg-goal-s2` · `bg-goal-s3` |
| 카드 그림자 | `shadow-card` |
| 반경 | `rounded-card` 18 · `rounded-button` 14 · `rounded-chip` 12 · `rounded-row` 12 (px) |
| 글자 크기 | `text-title` 26 · `text-body` 15 · `text-caption` 13 (px) |
| 제목 글꼴 | `font-display` (본문은 기본 `font-sans`) |

- Tailwind 기본 팔레트(`bg-gray-100` 등)는 지웠습니다. 고정 색은 시간대가 바뀌어도 그대로 남기 때문입니다.
  사진 위 오버레이용으로 `white` · `black`만 남겼습니다.
- 휴대폰이 다크 모드면 A와 B는 어두운 짝으로 바뀌고 C는 늘 어둡습니다. 색 세트는 A · A 다크 · B · B 다크 · C
  다섯 개이고, 모두 WCAG AA 대비(글자 4.5:1, 표시선과 컨트롤 테두리 3:1)를 넘습니다. 새 화면은 다섯 세트에서 모두 확인합니다.
- 서버는 사용자의 시각을 모르므로 `layout.tsx`의 `<head>` 스크립트가 첫 화면 전에 `data-light`를 정합니다.
  앱으로 돌아오면 다시 정하고, 브라우저 상단 색(`theme-color`)을 화면 배경에 맞춥니다.
- 아래 규칙은 `src/lib/light.ts`의 함수로 지킵니다.
  - 세션 중에는 색을 바꾸지 않습니다. 감상 전후 측정을 같은 화면에서 하기 위해서입니다. 세션을 시작할 때
    `lockLight()`, 마칠 때 `unlockLight()`를 부릅니다.
  - 설정에서 화면 색을 고정하면 `pickLight("mist" | "sunlit" | "moonlight")`, 시간대 따라로 되돌리면
    `pickLight(null)`을 부릅니다.
  - 프로필 `avoided_colors`에 검정이나 진한 보라가 있으면 `setAvoidDark(true)`를 부릅니다. 저녁·밤에도 C 대신
    B를 씁니다.
- 다른 시간대를 보려면 브라우저 개발자 도구 콘솔에서 `localStorage.setItem("lumi:light-pick", "moonlight")`를
  실행하고 새로고침합니다. `localStorage.removeItem("lumi:light-pick")`로 되돌립니다.

## 백엔드 연동

- 로컬 서버: `http://127.0.0.1:8000`
- 상태 확인: `GET /health`, DB 확인: `GET /health/db`
- 정적 자산: `GET /assets/…`(BE 저장소에 둔 검수 음원 · 컬러링 도안). 콘텐츠 자산 URL이 `/assets/…`처럼 BE 기준
  상대 경로로 올 수 있어 `assetUrl()`(`src/lib/api/client.ts`)로 BE 주소를 붙여 씁니다.
- 세션 API: 아래 「세션 요청」. 계약의 원천은 BE README 「세션 API」이고, FE 타입은 `src/lib/api/types.ts`에 있습니다.

FE는 브라우저에서 BE를 바로 부릅니다. BE가 FE 오리진을 CORS로 허용합니다 — 로컬은 `http://localhost:3000`만
허용하므로 `127.0.0.1:3000`이 아니라 `localhost:3000`으로 엽니다. BE 주소는 `NEXT_PUBLIC_BACKEND_URL`이고,
비어 있으면 로컬 BE(`http://127.0.0.1:8000`)를 씁니다. Vercel에는 운영 BE 주소를 넣습니다.

`NEXT_PUBLIC_SUPABASE_URL`과 `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`는 브라우저에서 Supabase 로그인(익명 체험 · Google · Kakao)에 씁니다
(`src/lib/auth.ts`). 로그인으로 받은 access token을 BE 요청의 `Authorization: Bearer`에 붙이면 BE가 Supabase 공개 키(JWKS)로 검증합니다.
둘 다 브라우저에 공개되는 것을 전제로 한 값이라 FE에 둡니다.
Supabase DB 접속 정보와 secret key, LLM 키, 콘텐츠 공급자 키(Pixabay · Freesound · AI Horde)는 BE에서만 관리합니다.

- 로그인하지 않은 사용자는 게스트(Supabase 익명 로그인)로 시작하고 기록을 남기지 않습니다. 게스트 로그인 세션은
  sessionStorage에 둬서 탭을 닫으면 체험이 끝납니다. Supabase 대시보드에서 Anonymous Sign-Ins를 켭니다.
- 회원은 Google · 카카오로 로그인하고 처음 한 번 기록 동의(`/consent`, `PUT /me/consent`)를 거칩니다.
- 소셜 로그인은 `/auth/callback`으로 돌아옵니다. Supabase 대시보드 Authentication → URL Configuration의 Redirect
  URLs에 로컬(`http://localhost:3000/auth/callback`) · 운영 · 프리뷰 배포 주소를 등록합니다.

### 세션 요청

세션 하나가 BE 그래프 실행(LangGraph thread) 하나입니다. 그래프는 사용자 입력이 필요한 곳에서 멈춰
`{session_id, step, node, payload}`를 돌려주고, FE는 `step`으로 화면을 고릅니다(`src/session/session-flow.tsx`).
응답 전에 LLM이 도는 요청은 SSE로 받아 진행 문구를 띄웁니다.

| 요청 | 보내는 값 | 받는 `step` |
| --- | --- | --- |
| `POST /sessions` (SSE) | `CareRequest` — 자유 텍스트 + 환경 칩 + 프로필 | `ASK` · `MEASURE`(사전) · `END`(`SAFETY`) |
| `POST /sessions/{id}/answer` (SSE) | `IntakeAnswer` — 고른 보기의 `set`을 합친 `answer`, 직접 쓴 `text`, 되묻기의 `skip` 중 하나 | `ASK` · `MEASURE`(사전) · `END` |
| `POST /sessions/{id}/measure` | `{instrument_id: {item_id: value}}` — 사전(SSE) · 사후 · 종료 | `RUN` · `CONFIRM` · `END` |
| `POST /sessions/{id}/report` | `SessionReport` — 완료 여부 · 중단 사유 · NOTICE 감정 단어 1~3개(점수는 보내지 않음) | `MEASURE`(사후 — SAM, S3는 + MFVAS) |
| `POST /sessions/{id}/decision` (SSE) | `ReplanDecision` — 종료 · 활동 변경 · 추가 세션 | `RUN` · `MEASURE`(종료 SAM, 모든 목표) · `END` |
| `POST /sessions/{id}/retry` (SSE) | — | `STALLED`에서 멈춘 노드부터 다시 |
| `GET /sessions/{id}` | — | 지금 멈춘 자리(새로고침 · 끊긴 스트림 복구) |

- 측정 payload에는 `instruments[]`와 `required_instrument_ids`가 옵니다. FE는 `enabled !== false`이고 `status !== TODO`인
  도구만 표시하고 필수 응답을 `{instrument_id: {item_id: value}}`로 보냅니다. 현재 MVP의 필수 도구는 SAM 하나입니다.
- 안전 신호가 있으면(`SAFETY`) 세션 대신 도움 안내로 끝납니다.
- 오류는 `{"detail": {code, message, …}}`이고 BE README 「오류」 표대로 다룹니다 — 동의가 없으면 동의 화면,
  `retryable`이면 `retry`, 스트림이 끊기거나 단계가 어긋나면 `GET`으로 멈춘 자리를 다시 봅니다.

## 안내 음성

활동 대본은 녹음 음원 없이 브라우저 `speechSynthesis`로 읽습니다(BE README 「RUN 페이로드」). 녹음 음원은 PR-21만
있습니다. 규칙은 `src/lib/speech.ts`의 함수로 지킵니다.

- 음성은 좋은 순서로 고릅니다 — 데스크톱 크롬의 `Google 한국의`(온라인) → 엣지의 `Microsoft … Online (Natural)`
  → 사파리 · iOS · 맥의 `Yuna`. macOS의 기계음 계열(Eddy · Flo 등)은 쓰지 않습니다. 오류가 나면(온라인 음성의
  네트워크 오류 등) 다음 음성으로 그 문장부터 다시 읽습니다.
- 대본은 문장 단위로 나눠 읽습니다(문장 사이 0.4초, 빈 줄 사이 1.5초). 크롬 온라인 음성은 한 번에 15초쯤 넘게
  읽으면 끊깁니다.
- 활동 화면을 열 때 `loadVoices()`, 시작 버튼 `onClick`에서 `unlockSpeech()`(iOS는 사용자가 누른 순간에 처음
  읽어야 소리가 납니다), 재생 시점마다 `speakScript(text)`, 멈추거나 화면을 떠날 때 `cancelSpeech()`를 부릅니다.
  새 대본을 읽으면 읽던 대본은 멈춥니다.
- `speakScript()`가 `false`면(지원하지 않는 브라우저 · 읽을 음성 없음 · 중간에 멈춤) 화면 문구만 보여 줍니다.
  대본의 `source_policy.tts`가 `FORBIDDEN`이면 읽지 않습니다.

## 브랜치·PR 규칙

BE 레포와 같은 규칙입니다. feature → `main`으로 올립니다 (`dev` 없음).

1. 이슈를 템플릿(기능 구현 · 기능 수정 · 오류 수정 · 리팩토링 · 문서 작업 · 기타 수정)으로 만듭니다.
2. `main`에서 `<타입>/#<이슈 번호>` 브랜치를 만듭니다. 예: `feat/#12`, `chore/#13`
3. `main`으로 PR을 올립니다. 제목은 `[타입/#이슈 번호] 설명`이고 본문에 `close #이슈 번호`를 적습니다.
   CI(`check`: lint · typecheck · test · build)를 통과해야 머지하고, squash merge합니다.

위 1~3을 자동화한 것이 **ship 하네스**입니다. 코드 수정을 끝낸 뒤 Claude Code에서는 `/ship`, Codex에서는
`$ship`(또는 "ship"·"배포해줘")으로 부르면 검증(`npm run lint`·`npm run typecheck`·`npm test`·`npm run build`) →
이슈·브랜치 생성 → PR → CI 게이트 → squash 머지 → main CI 확인 → (Vercel 연결 시) 프로덕션 배포 확인까지
진행합니다. 절차 원본은 하네스 중립 명세 `automation/ship.md`·`automation/pipeline.md`이고,
`.claude/commands/ship.md`와 `.agents/skills/ship/SKILL.md`는 각 하네스의 진입 어댑터입니다. 폴링·게이트
스크립트(`automation/bin/*.mjs`)는 Node 표준 라이브러리만 써서 bash·jq가 필요 없고, `automation/test/`를
`npm test`로 회귀 검증합니다. 처음 쓰는 PC에서 할 준비(도구 설치·로그인, Codex 설정, Windows)는
[`automation/README.md`](automation/README.md)에 있습니다.

## Vercel

이 GitHub 저장소를 별도 Vercel 프로젝트로 Import합니다.

- Framework Preset: Next.js
- Root Directory: 저장소 루트 (`.`)
- Production Branch: `main`
- Node.js: 24.x (`package.json`의 `engines`)
- Install Command: `npm ci`
- Build Command: `npm run build`

이 저장소는 Vercel 프로젝트에 Git 연동돼 있어 `main`에 머지하면 프로덕션으로 배포됩니다.
GitHub Actions의 CI 통과를 머지 조건으로 사용하려면 저장소의 브랜치 규칙을 설정합니다.
