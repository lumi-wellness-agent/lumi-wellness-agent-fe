# lumi-wellness-agent-fe

LUMI(Light + Mind)의 프론트엔드입니다. LUMI는 심리학 이론·임상/실험 연구 Reference 기반 AI 웰니스 에이전트입니다.
React·Next.js App Router·TypeScript를 사용하고 Vercel에 배포합니다.
백엔드는 [lumi-wellness-agent-be](https://github.com/lumi-wellness-agent/lumi-wellness-agent-be)에서 개발합니다.

현재는 시작 화면과 개발·빌드·검증 환경을 구성한 단계입니다. 세션 화면과 API 호출은 아직 구현하지 않았습니다.

## 사용자 흐름 (기획)

```text
상태 체크인 → 사전 측정 → 활동 추천 → "왜 추천했나요?" Reference 카드 → 활동 → 사후 측정
→ 전후 비교 · 다음 단계 제안(종료 · 활동 변경 · 추가 세션) → 사용자 선택
→ 활동 변경·추가 세션이면 다시 활동 추천으로, 종료면 종료 측정(S1·S2만) 뒤 끝
```

- 상태 체크인: 자유 텍스트(예: "발표 앞두고 긴장돼요")만 필수입니다. 원하는 변화(S1 반복적 생각 완화 ·
  S2 스트레스·긴장 완화 · S3 주의력·인지 피로 회복)·가용 시간·장소(실내·실외)는 선택 칩이고, 칩 값이 BE의
  텍스트 분류보다 우선합니다. 선호 색상·풍경 등은 세션마다 다시 묻지 않는 프로필로 보냅니다. 스트레스
  수치(0~10)는 받지 않고, 상태 점수는 사전 측정이 잽니다.
- 측정: 사전에 SAM(쾌·각성)과 목표 척도(S1 BSRI · S2 STAI-6 · S3 MFVAS 임시 도구), 활동이 끝날 때마다
  SAM(S3는 + MFVAS), 종료에 S1·S2 목표 척도를 한 번 더 잽니다. 문항과 응답 척도는 BE가 보내고 FE는 그대로
  그립니다.
- 활동 추천: 한 번에 검수된 활동(프로토콜) 하나가 옵니다. 여러 매체를 함께 쓰는 활동도 검증된 프로토콜 하나로
  오고, BE가 활동을 임의로 묶지 않습니다. 플레이어는 받은 콘텐츠의 단계(ACTIVITY · NOTICE · CHOOSE)와
  이미지·영상·소리 자산을 실행합니다.
- Reference 카드: 이론 → 논문 DOI → 대상·실험 조건 → 결과 → 한계
- 연구 근거를 보여 주되 의료적 진단·치료 효능은 주장하지 않습니다.

## 시작하기

Node.js 24와 npm을 사용합니다. 경로는 저장소 루트 기준입니다.

```bash
npm ci
cp .env.example .env.local
npm run dev
```

개발 서버: <http://localhost:3000>

| 명령 | 용도 |
| --- | --- |
| `npm run dev` | 개발 서버 |
| `npm run lint` | ESLint |
| `npm run typecheck` | Next.js 타입 생성 및 TypeScript 검사 |
| `npm test` | ship 게이트·폴링 스크립트 테스트 (`node --test`) |
| `npm run build` | 프로덕션 빌드 |
| `npm start` | 빌드한 서버 실행 |

## 파일 구성

```text
src/app/
├─ layout.tsx        공통 레이아웃·메타데이터
├─ page.tsx          시작 화면
└─ globals.css       전역 스타일
next.config.ts      Next.js 설정
tsconfig.json       TypeScript 설정
eslint.config.mjs   ESLint 설정
.env.example        환경 변수 예시
.github/workflows/ci.yml   PR·main 푸시 검증 (lint · typecheck · test · build)
.github/ISSUE_TEMPLATE/    이슈 템플릿 (BE와 동일 — ship 하네스가 이슈 본문을 만들 때 쓴다)
automation/                ship 하네스 (준비 문서 README.md + 하네스 중립 명세 + 게이트·폴링 스크립트)
```

## 백엔드 연동

- 로컬 서버: `http://127.0.0.1:8000`
- 상태 확인: `GET /health`, DB 확인: `GET /health/db`
- 정적 자산: `GET /assets/…`(BE 저장소에 둔 활동 음원). 콘텐츠 자산 URL이 `/assets/…`처럼 BE 기준 상대
  경로로 올 수 있어 BE 주소를 붙여 씁니다.
- 세션 API: 아직 없습니다. 설계안은 아래 「세션 요청 (설계안)」에 요약했습니다.

`BACKEND_API_URL`은 서버 측 API 연동을 위한 예시 환경 변수입니다. 현재 코드에서는 사용하지 않습니다.
연동 구현 시 Next.js 서버 경유 또는 브라우저 직접 호출 중 방식을 정합니다.
브라우저에서 직접 호출하면 BE에 FE 도메인에 대한 CORS 설정이 필요합니다.
Supabase 접속 정보, LLM 키, 콘텐츠 공급자 키(Pixabay · Freesound · AI Horde)는 BE에서만 관리합니다.

### 세션 요청 (설계안)

BE README 「세션 API」 설계안의 요약입니다. 원본이 바뀌면 그쪽을 따르고, interrupt payload · resume 모양은
BE 노드 docstring에 있습니다. 세션 하나가 BE 그래프 실행(LangGraph thread) 하나입니다. 그래프는 사용자
입력이 필요한 곳(측정 · 활동 · 다음 단계 선택)에서 멈춰 응답을 돌려주고, FE가 다음 요청을 보내면 그 자리부터
이어 갑니다. 요청은 `sessions` · `measure` · `report` · `decision` 네 종류이고, `measure`는 측정할 때마다
(사전 · 사후 · 종료) 보냅니다.

| 순서 | 요청 | 보내는 값 | 받는 값 |
| --- | --- | --- | --- |
| 1 | `POST /sessions` | `CareRequest` — 자유 텍스트 + 칩(목표 · 가용 시간 · 장소) + 프로필 | 사전 측정 문항(SAM + 목표 척도). 세션을 열지 않으면 종료(`SAFETY` · `NO_GOAL`) |
| 2 | `POST /sessions/{id}/measure` | 사전 측정 응답 | 계획(추천 활동 · 추천 이유) · 콘텐츠 |
| 3 | `POST /sessions/{id}/report` | `SessionReport` — 완료 여부 · 중단 사유 · NOTICE 한 단어(점수는 보내지 않음) | 사후 측정 문항(SAM, S3는 + MFVAS) |
| 4 | `POST /sessions/{id}/measure` | 사후 측정 응답 | 평가(전후 비교) · 다음 단계 제안 |
| 5 | `POST /sessions/{id}/decision` | `ReplanDecision` — 종료 · 활동 변경 · 추가 세션 | 활동 변경·추가 세션이면 새 계획·콘텐츠(3부터 반복). 종료면 S1·S2는 종료 측정 문항(BSRI · STAI-6), S3는 세션 종료 |
| 6 | `POST /sessions/{id}/measure` | 종료 측정 응답(S1·S2만) | 세션 종료 |

- 측정 문항은 도구마다 응답 척도(`scale.kind` — PICTORIAL · LIKERT · SLIDER)와 문항·양끝 라벨이 함께 옵니다.
  응답은 받은 도구 전부를 `{instrument_id: {item_id: value}}`로 묶어 보냅니다.
- 안전 신호가 있으면(`SAFETY`) 세션 대신 안전 안내로 끝납니다. 목표를 정하지 못하면(`NO_GOAL`) 목표 칩을
  보여 주고 `goal`을 채워 1부터 다시 보냅니다.

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
