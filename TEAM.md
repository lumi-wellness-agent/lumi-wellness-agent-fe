# 역할별 개발 가이드 — FE (발표 2026-10-30, 코드 마감 10-29 목)

경로는 저장소 루트 기준입니다. 세션 흐름 화면 전부(로그인 · 질문 · 측정 · 활동 · 평가·선택 · 종료)와 SSE 진행
표시를 BE 세션 API에 연결한 뼈대가 `main`에 있고, 활동 플레이어 자리는 임시 화면(Placeholder)이 채우고
있습니다. 담당은 BE와 같습니다 — BE에서 활동 노드 JSON 21개를 A · B · C가 나눠 맡은 것처럼 FE에서도 **같은 사람이
같은 활동의 플레이어**를 맡고, BE intake를 맡은 A가 **intake 화면**을, BE measure_pre를 맡은 B가 **측정 화면**을
맡습니다. 각 담당은 **자기 폴더의 파일 본문**을 채웁니다. BE 계약의 원천은 BE README 「세션 API」와
[BE TEAM.md](https://github.com/lumi-wellness-agent/lumi-wellness-agent-be/blob/main/TEAM.md)이고, 모바일·디자인
규칙은 [AGENTS.md](AGENTS.md), 실행·검증 환경과 브랜치·PR 규칙은 [README](README.md)에 있습니다.

## 원칙

- **화면은 BE가 보낸 값으로 그린다.** 질문 화면은 `IntakeQuestion`의 문장 · 보기를, 측정 화면은 `instruments[]`의
  문항 · 척도를, 플레이어는 `content.content_spec`(슬롯별 `scripts` · `render` · `selection`과 화면 명세
  `session_ui`)을 그대로 쓴다. 활동별 시간 · 문구 · 자산이나 목표별 도구를 코드에 박지 않는다 — 바꿀 것은 BE에서 고친다.
- **라운드당 활동 하나, 플레이어는 ACTIVITY 단계 하나.** 끝나면 `onFinish`를 한 번 부른다. NOTICE 팝업(PR-16),
  "그만하기", `SessionReport` 보내기는 호스트(`src/players/player-host.tsx`)가 한다.
- **점수는 FE가 계산하지 않는다.** 측정은 받은 문항을 그대로 그리고 BE가 채점한다. 의료적 진단·치료 효능을
  말하는 문구를 쓰지 않는다.
- **불편하면 언제든 멈출 수 있다.** 호스트의 "그만하기"는 늘 보인다. 플레이어가 자체 멈춤을 두면
  `onFinish({ completed: false, stoppedReason })`로 알린다.
- **모바일 규칙(AGENTS.md).** 360×780에서 먼저, 터치 48px, 색은 토큰 클래스만, 다섯 색 세트에서 확인한다.

## 활동 노드 21개 → 플레이어 10개

화면이 같은 활동을 한 플레이어로 묶었다(`src/players/catalog.ts`). 담당은 BE 활동 노드 묶음과 같다 — A 자연 자극
감상, B 호흡·이완·명상·그라운딩, C 보행·컬러링·글쓰기·NOTICE.

| 담당 | 플레이어 | 활동 | 파일 |
| --- | --- | --- | --- |
| A | 이미지 감상 | PR-01 · 03 · 20 | `src/players/slideshow/player.tsx` |
| A | 소리·영상 감상 | PR-02 · 04 · 05 | `src/players/listening/player.tsx` |
| A | 이미지 + 녹음 명상 | PR-21 | `src/players/image-meditation/player.tsx` |
| B | 원형 타이머 음성 안내 | PR-06 · 08 · 09 · 22 | `src/players/guided-timer/player.tsx` |
| B | 자연환경 알아차리기(ReST) | PR-10 | `src/players/rest/player.tsx` |
| B | 점진적 근육 이완 | PR-07 | `src/players/pmr/player.tsx` |
| B | 오감 그라운딩 | PR-17 | `src/players/grounding/player.tsx` |
| C | NOTICE 팝업(단계 모듈) | PR-16 → PR-01 · 09 · 15 · 21의 NOTICE 단계 | `src/players/notice/notice-popup.tsx` |
| C | 컬러링 | PR-14 · 15 | `src/players/coloring/player.tsx` |
| C | 글쓰기 | PR-18 · 19 | `src/players/writing/player.tsx` |
| C | 야외 걷기 | PR-11 · 12 | `src/players/outdoor-walk/player.tsx` |

**합쳐지는 노드.**

- **PR-13은 결번이다.** E19를 PR-11에 합쳤다(측정도구·프로토콜 워크북 '프로토콜' 시트). 그래서 PR-01~22에서 21개다.
- **PR-16은 단독 활동이 아니다.** `composition`이 `STAGE_MODULE`이라 plan이 고르지 않고, NOTICE 단계가 있는
  PR-01 · 09 · 15 · 21에 `content.notice_module`로 실려 온다. 호스트가 그 단계를 팝업으로 띄운다.
- **PR-06 · 08 · 09 · 22는 한 컴포넌트다.** 네 활동의 `session_ui.component`가 모두 `CIRCULAR_SESSION_TIMER`다.
- **조합 활동은 다른 플레이어의 부품을 쓴다.** PR-21 = 사진 넘김(slideshow) + 녹음 음원 + NOTICE,
  PR-22 = 원형 타이머 + 사진 넘김(slideshow), PR-10 = 음성 안내 시점 처리(guided-timer) + 영상. 사진 넘김은 A가
  `slideshow` 폴더에서 export하고 B가 가져다 쓴다.

## 구조

```text
/ · /records · /settings   탭 화면 — 아래 탭 바(src/ui/tab-bar.tsx)로 오간다. 세션 · 동의 · 로그인 화면에는 탭 바가 없다
/            시작 화면 — 입력 칸 · 환경 칩(intake/start-input.tsx, A) + 로그인 · 시작(start-form.tsx, 통합)
  ↓ POST /sessions (SSE)                       로그인하지 않으면 게스트(익명 로그인), 회원은 처음 한 번 /consent
/session     응답의 step으로 화면을 고른다 — src/session/session-flow.tsx
  ASK        intake/ask-screen.tsx        질문: 보기 칩 · 직접 쓰기 · 되묻기("그냥 시작할게요")  A  → POST answer (SSE)
  MEASURE    measure/measure-screen.tsx   scale.kind로 그리는 측정 — 사전 · 사후 · 종료        B  → POST measure (사전만 SSE)
  RUN        run-screen.tsx               활동 소개 · "왜 추천했나요?"(Reference 카드) · 환경 안내 → 시작
               players/player-host.tsx    ACTIVITY(담당 플레이어) → NOTICE(PR-16) → SessionReport → POST report
  CONFIRM    confirm-screen.tsx           전후 비교 · 다음 단계(종료 · 활동 변경 · 추가 세션)      → POST decision (SSE)
  END        end-screen.tsx               세션 요약. SAFETY면 intake/safety-screen.tsx(A)의 도움 안내
  STALLED    session-flow.tsx             "이어서 하기"                                         → POST retry (SSE)
/records     회원 활동 기록 — 세션별 활동 · 시간 · 끝까지 했는지 · 나아졌는지                → GET /me/sessions
/settings    화면 색 · 로그아웃 · 탈퇴
/dev         목업 세션 · 화면 미리보기(/dev/screens) · 플레이어 미리보기(/dev/players) — 개발용, 운영 배포는 404
```

세션 상태는 `src/session/use-session.ts` 하나가 들고, 요청은 `src/lib/api/client.ts`(JSON · SSE · 오류)가 보낸다.
SSE 진행 문구는 `src/session/labels.ts`, 오류 처리 표는 BE README 「오류」를 따른다.

## 담당 파일과 할 일

### 공통 (통합 담당)

| 상태 | 파일 | 내용 |
| --- | --- | --- |
| 완료 | `src/lib/api/types.ts` `client.ts` `sse.ts` | BE 계약 타입 · JSON/SSE 클라이언트 · 오류(`ApiError`) · SSE 파서 테스트 |
| 완료 | `src/lib/auth.ts` `src/app/auth/callback/` `consent/` `settings/` | Supabase 로그인 — 게스트(익명, sessionStorage) · Google · 카카오, 기록 동의, 로그아웃 · 탈퇴 |
| 완료 | `src/session/`의 `intake/` · `measure/` 밖 · `src/app/session/` · `src/app/start-form.tsx` | 세션 상태 기계 · RUN · CONFIRM · END · Reference 카드 · 진행 표시 · 오류 처리 · 로그인과 시작 |
| 완료 | `src/players/types.ts` `catalog.ts` `player-host.tsx` `placeholder.tsx` | 플레이어 계약 · 활동→플레이어 표 · 단계 진행 · 그만하기 · 임시 화면 |
| 완료 | `src/lib/api/mock.ts` `src/fixtures/` `scripts/fixtures.py` `src/app/dev/` | 목업 세션 · BE 코드로 만든 견본 · 화면과 플레이어 미리보기 |
| 수 | 실제 BE 연결 | Supabase Redirect URLs · 익명 로그인 켜기 · Vercel 환경 변수, 운영 BE로 시나리오 한 바퀴 |
| 목 | 통합 실행 · 리허설 | 합류한 화면 · 플레이어로 시나리오 반복, 발표 기기(갤럭시 · 아이폰)에서 확인 |

### intake 화면 (A — BE intake와 같은 사람)

뼈대에 동작하는 기본 화면이 있다. 다듬고, BE intake를 바꾸면 화면을 함께 맞춘다(견본을 다시 만든다).

| 파일 | 할 일 |
| --- | --- |
| `src/session/intake/start-input.tsx` | "오늘 상황이 어떠세요?" 입력 · 환경 칩(장소 · 이어폰 · 시간) → `CareRequest`. 프로필(선호 색 · 풍경 · 피하고 싶은 색) 입력을 더해 `profile`로 보내고, `avoided_colors`에 검정 · 진한 보라가 있으면 `setAvoidDark(true)` |
| `src/session/intake/ask-screen.tsx` | 질문 네 가지 — 되묻기(글만 · "그냥 시작할게요"), 시점 질문 · 재질문(보기 + "잘 모르겠어요" + 직접 쓰기), 환경 칩(묶음 셋, 고르지 않은 묶음은 빠진다). 글과 보기를 함께 고르면 글만 간다는 것이 화면에서 보이게 |
| `src/session/intake/safety-screen.tsx` | SAFETY 도움 안내 — 문구와 상담 전화 번호를 발표 전에 확인 |
| `src/session/intake/labels.ts` | 칩 · 묶음 문구. BE `intake_rules`의 보기 문구와 맞춘다 |
| 확인 | `/dev/screens/ask-*` · `end-safety`, 목업 세션. 계약은 BE `app/schemas/intake.py`(질문 · 답) · `app/agent/intake_rules.py`(고정 질문 · 칩 보기) · `app/schemas/care.py`(`CareRequest`) |

### 측정 화면 (B — BE measure_pre와 같은 사람)

사전(measure_pre) · 사후 · 종료 측정이 같은 화면을 쓴다. 뼈대의 범용 렌더러가 동작하고, SAM 그림이 비어 있다.

| 파일 | 할 일 |
| --- | --- |
| `src/session/measure/`(새 파일) | SAM 그림 척도 — PICTORIAL 1~9, 쾌 · 각성 두 줄(그림 5개 + 사이 칸). 지금은 단계 슬라이더로 그린다 |
| `src/session/measure/measure-screen.tsx` | 받은 `instruments[]`를 `scale.kind`로 그린다 — 도구 목록을 하드코딩하지 않는다. LIKERT(STAI-6 4점, 문항 원문이 오면 그대로) · SLIDER(BSRI 8문항 · MFVAS 3문항 — 건드린 문항만 답으로 센다) · 문항이 많을 때 진행 표시 · 시점별 제목 |
| 확인 | `/dev/screens/measure-*`, 목업 세션. 계약은 BE `app/instruments.py`의 `present()` · `app/agent/nodes/measure.py` · `data/instruments/*.json`. 응답은 받은 도구 전부를 `{instrument_id: {item_id: value}}`로 |

### 플레이어 담당 (A · B · C, 수 오후 ~ 목 오전)

각자 표의 파일 본문을 채운다. 파일 머리말에 그 활동이 읽을 `content_spec` 칸을 적어 두었다. 시연 시나리오가
지나가는 것을 먼저 한다 — "발표 앞두고 긴장돼요" → (질문) → SAM · STAI-6 → **PR-06** → SAM → 평가 → 종료.
그다음 PR-01 · PR-02 · PR-09 · PR-21 · PR-11.

| 담당 | 먼저 할 것 | 다음 |
| --- | --- | --- |
| A | intake 화면(시연이 지나간다) | `slideshow` PR-01(사진 넘김을 컴포넌트로 꺼낸다 — PR-21 · PR-22가 쓴다), `listening` PR-02 · 05, `image-meditation` PR-21, PR-03 · 04 · 20 |
| B | SAM 그림(모든 세션의 사전 · 사후 측정) · `guided-timer` PR-06 | PR-09 · 08 · 22(같은 컴포넌트), `rest` PR-10, `pmr` PR-07, `grounding` PR-17 |
| C | `notice-popup` 마무리(기본 동작은 있다) · `outdoor-walk` PR-11 | `coloring` PR-14 · 15(검수 도안 SVG), `writing` PR-18 · 19, PR-12 |

합격 기준 — 화면은 `/dev/screens/…`, 플레이어는 `/dev/players/PR-XX`에서 360×780로 처음부터 끝까지 돌고(보낼 값이
계약과 같고, 플레이어는 그만하기 포함), 다섯 색 세트에서 보이며, `npm run lint` · `npm run typecheck` · `npm test` ·
`npm run build`가 통과한다.

### 먼저 끝난 사람 (목)

통합 담당의 파일이라 손대기 전에 통합 담당과 맞춘다.

| 파일 | 할 일 |
| --- | --- |
| `src/session/reference-card.tsx` | Reference 카드 다듬기 — 배지 색 · 근거 접기 · 원문 보기. 카드의 사실은 BE 값 그대로 |
| `src/session/confirm-screen.tsx` `end-screen.tsx` | 전후 비교와 세션 요약 다듬기 — 숫자 대신 방향(나아짐 · 그대로)이 먼저 보이게 |

## 계약

| 항목 | FE | BE 원천 |
| --- | --- | --- |
| 응답 `{session_id, step, node, payload}` | `SessionView` (`src/lib/api/types.ts`) | `app/api/sessions.py` |
| 시작 요청 | `CareRequest` — `text` + 환경 칩 + `profile` | `app/schemas/care.py` |
| intake 질문 · 답 | `IntakeQuestion` ↔ `IntakeAnswer`(`answer` · `text` · `skip` 중 하나) | `app/schemas/intake.py` |
| 측정 | `MeasurePayload` → `{instrument_id: {item_id: value}}` | `app/instruments.py` `present()` · `app/agent/nodes/measure.py` |
| 플레이어 props `{content, step, onFinish}` | `PlayerProps` (`src/players/types.ts`) | FE 계약 — 바꾸려면 통합 담당과 먼저 맞춘다 |
| RUN payload `{plan, content}` | `RunPayload` · `ActivityContent` | `app/agent/state.py` · `app/agent/nodes/executor.py` |
| 활동 실행 명세 | `content.content_spec` (형 없음) | `data/protocols/PR-*.json` |
| NOTICE 팝업 명세 | `content.notice_module` (`NoticeModule`) | `data/protocols/PR-16.json`의 `session_ui` |
| 활동 결과 | `SessionReport` `{completed, stopped_reason, notice_words}` | `app/agent/state.py` |
| Reference 카드 | `ReferenceCard` | `app/schemas/card.py` |
| 견본 | `src/fixtures/` | `scripts/fixtures.py`가 BE 코드로 만든다 |

## 개발 방법

- **BE 없이**: `npm run dev` → <http://localhost:3000/dev>. 목업 세션은 로그인 · LLM 없이 견본으로 질문부터 종료까지
  돈다. `/dev/screens/…`는 질문 · 측정 · 평가 · 종료 화면 하나를 견본으로 띄우고 BE로 보냈을 값을, `/dev/players/PR-XX`는
  그 활동의 RUN 화면을 띄우고 보낼 `SessionReport`를 보여 준다.
- **화면 크기**: 크롬 개발자 도구 기기 툴바에서 360×780(갤럭시)과 393×852(아이폰)로 본다.
- **자산**: 견본에는 외부 공급자 자산(Pixabay · Freesound · AI Horde · 시카고 미술관)이 없고 `asset_warnings`에
  이유가 있다. 검수 자산(PR-05 · 21 음원, PR-14 · 15 도안)은 BE `/assets/…`라서 BE를 로컬로 띄우면(BE에서 `make run`)
  재생된다. 외부 자산으로 확인하려면 견본 JSON의 `assets`에 URL을 잠깐 넣어 보고 커밋하지 않는다(다시 만들면 덮인다).
- **견본 다시 만들기**: BE를 최신 `main`으로 당긴 뒤
  `../lumi-wellness-agent-be/.venv/bin/python scripts/fixtures.py ../lumi-wellness-agent-be`
  (Windows: `..\lumi-wellness-agent-be\.venv\Scripts\python scripts\fixtures.py ..\lumi-wellness-agent-be`).
  intake 질문 · 측정 도구 · 활동 노드 JSON을 BE에서 바꾸면 다시 만든다.
- **소리**: 안내 음성은 `src/lib/speech.ts`(README 「안내 음성」), 종료 알림음은 `src/lib/tone.ts`의 `playTone()`.
  iOS는 사용자가 누른 순간에만 소리를 열어 준다 — RUN 화면의 "시작하기"가 `unlockSpeech()` · `unlockTone()`을
  부른다. `<audio>` · `<video>`의 `play()`는 플레이어 안의 버튼에서 부른다.
- **자산 주소**: `assetUrl(url)`(`src/lib/api/client.ts`) — BE 상대 경로에 BE 주소를 붙인다.
- **실제 BE로**: `.env`에 `NEXT_PUBLIC_BACKEND_URL` · `NEXT_PUBLIC_SUPABASE_*`를 넣고 FE를 `localhost:3000`으로 연다
  (BE CORS가 `127.0.0.1:3000`은 허용하지 않는다). 목업이 켜져 있으면 `/dev`에서 끈다.

## 작업 순서 (10/28 수 ~ 10/29 목)

1. **수** 이 뼈대를 머지한다. 전원 `git pull` → `npm ci` → `npm run dev`로 `/dev`의 목업 세션과 자기 화면 · 활동
   미리보기가 뜨는지 확인하고 시작한다.
2. **수 저녁** 통합: 실제 BE 연결(Supabase Redirect URLs에 `/auth/callback` 등록, Anonymous Sign-Ins 켜기, Vercel에
   `NEXT_PUBLIC_*` 세 값), 운영 BE로 시나리오 한 바퀴.
3. **목 오전** 화면 · 플레이어 합류(각자 PR). 먼저 끝난 사람은 Reference 카드 · 평가 · 종료 화면.
4. **목 오후** 통합 실행 · 시나리오 반복 · 리허설. **목요일 정오까지 안 오면 대체:** 화면은 뼈대의 기본 화면으로,
   플레이어는 임시 화면(시작 안내 · 경과 시간 · "다 했어요")으로 시연한다 — 세션 흐름은 그대로 끝까지 돈다.

## PR 규칙과 명령

- 이슈 → `<타입>/#<번호>` 브랜치 → `main` PR(squash). 자세한 규칙과 `/ship` 하네스는 README.
- 자기 폴더만 고친다 — 플레이어는 `src/players/<플레이어>/`, A는 `src/session/intake/`, B는 `src/session/measure/`.
  계약 파일(`src/lib/api/types.ts` · `src/players/types.ts` · `catalog.ts` · `player-host.tsx`)과 그 밖의
  `src/session/`을 바꿔야 하면 통합 담당과 먼저 맞춘다. 다른 담당의 부품이 필요하면 그 폴더에서 import하고 고치지 않는다.
- `.env`와 키는 커밋하지 않는다. FE에는 공개돼도 되는 값(`NEXT_PUBLIC_*`)만 둔다.

```bash
npm run dev         # 개발 서버 — http://localhost:3000/dev
npm run lint
npm run typecheck
npm test            # ship 게이트 · 안내 음성 · SSE 파서 · 하루의 빛
npm run build
```

## 정하지 않은 것

- **장소를 모를 때의 소리 안내.** BE intake는 장소를 끝내 모르면 조용한 실내로 가정하고 `missing_slots`에
  `setting`을 남기는데, RUN payload(`plan` · `content`)에는 실리지 않아 FE가 "소리가 나와요"를 띄울 근거가 없다.
  지금은 환경을 풀었을 때(`plan.environment_gaps`)만 안내하고 "지금은 어려워요"는 늘 보인다. BE가 plan에 실을지
  통합 담당이 A와 정한다.
- **STAI-6 · BSRI 문항 원문.** BE에서 채우기 전에는 측정 화면이 문항 ID를 보여 준다(`text: null`). 채우면 그대로 그린다(B).
- **도움 안내 번호.** SAFETY 화면(`src/session/intake/safety-screen.tsx`)의 상담 전화 번호와 문구를 발표 전에 다시
  확인한다(A).
- **원문 보관 동의 끄기 · 탈퇴 전 재인증.** 설정 화면에 아직 없다(BE README 「정하지 않은 것」).
