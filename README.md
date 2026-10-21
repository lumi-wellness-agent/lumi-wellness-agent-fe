# lumi-wellness-agent-fe

LUMI(Light + Mind)의 프론트엔드입니다. LUMI는 심리학 이론·임상/실험 연구 Reference 기반 AI 웰니스 에이전트입니다.
React·Next.js App Router·TypeScript를 사용하고 Vercel에 배포합니다.
백엔드는 [lumi-wellness-agent-be](https://github.com/lumi-wellness-agent/lumi-wellness-agent-be)에서 개발합니다.

현재는 시작 화면과 개발·빌드·검증 환경을 구성한 단계입니다. 세션 화면과 API 호출은 아직 구현하지 않았습니다.

## 사용자 흐름 (기획)

```text
상태 체크인 → 세션 추천 → "왜 추천했나요?" Reference 카드 → 감상 → 전후 반응 기록
→ 종료 · 활동 변경 · 추가 세션 제안 → 사용자 선택 (활동 변경·추가 세션이면 다시 세션 추천으로)
```

- 세션 추천: 단일 세션(S1·S2·S3 중 하나), 동시 복합(호환되는 활동 병행), 순차 복합(2~3개 활동 연계)
  중 하나로 옵니다. 플레이어가 형태에 맞춰 실행합니다.
- 상태 체크인: 현재 스트레스 수준(0~10)과 원하는 변화(S1 반복적 생각 완화 · S2 스트레스·긴장 완화 ·
  S3 주의력·인지 피로 회복)는 필수, 선호 색상·풍경 등은 선택
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
.github/workflows/ci.yml   PR·main 푸시 검증 (lint · typecheck · build)
```

## 백엔드 연동

- 로컬 서버: `http://127.0.0.1:8000`
- 상태 확인: `GET /health`, DB 확인: `GET /health/db`
- 세션 API는 아직 없습니다. 설계안은 BE README의 '세션 API'에 있습니다. 세션 하나가 요청 세 종류
  (시작 → 사후 측정 보고 → 다음 단계 선택)로 나뉘고, 활동 변경·추가 세션이면 새 계획이 다시 옵니다.

`BACKEND_API_URL`은 서버 측 API 연동을 위한 예시 환경 변수입니다. 현재 코드에서는 사용하지 않습니다.
연동 구현 시 Next.js 서버 경유 또는 브라우저 직접 호출 중 방식을 정합니다.
브라우저에서 직접 호출하면 BE에 FE 도메인에 대한 CORS 설정이 필요합니다.
Supabase 접속 정보와 LLM 키는 BE에서만 관리합니다.

## Vercel

이 GitHub 저장소를 별도 Vercel 프로젝트로 Import합니다.

- Framework Preset: Next.js
- Root Directory: 저장소 루트 (`.`)
- Production Branch: `main`
- Node.js: 24.x (`package.json`의 `engines`)
- Install Command: `npm ci`
- Build Command: `npm run build`

현재 이 저장소에 대한 Vercel 프로젝트 연결은 설정하지 않았습니다.
Git 연동을 연결하면 팀원은 커밋·푸시만으로 프리뷰/운영 배포를 사용할 수 있습니다.
GitHub Actions의 CI 통과를 머지 조건으로 사용하려면 저장소의 브랜치 규칙을 설정합니다.
