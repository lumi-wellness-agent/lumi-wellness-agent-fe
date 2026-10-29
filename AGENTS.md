# AGENTS.md

Codex·Claude Code 같은 AI 에이전트가 이 저장소에서 작업할 때 지키는 규칙이다. 자세한 설명은 [README](README.md)에 있고, 여기에는 매번 지켜야 할 것만 적는다.

## 스택

- Next.js 16 App Router · React 19 · TypeScript · Tailwind CSS v4. 의존성은 `npm ci`로 설치한다.
- Next.js 16은 API와 파일 규칙이 학습 데이터와 다를 수 있다. Next.js 코드를 쓰기 전에 `node_modules/next/dist/docs/`에서 해당 가이드를 읽고, 폐기 예정(deprecation) 안내를 따른다.

## 모바일 웹앱

삼성 갤럭시와 아이폰 브라우저에서 주로 쓰는 웹앱이다.

- 화면은 360×780(갤럭시)에서 먼저 만들고 393×852(아이폰)까지 확인한다.
- 버튼·칩·선택 행의 터치 영역은 48px 이상으로 한다.
- 화면 높이는 `vh` 대신 `dvh`(`min-h-dvh`)로 잡는다.
- 하단 고정 바는 `env(safe-area-inset-bottom)`만큼 아래를 비운다.
- 입력란 글자는 `globals.css`가 터치 기기에서 16px로 고정한다. iOS 사파리가 작은 입력란을 확대하지 않게 하는 설정이므로 덮어쓰지 않는다.

## 디자인 시스템: 하루의 빛

토큰과 클래스 표는 README 「디자인 시스템: 하루의 빛」에 있다.

- 색은 토큰 클래스(`bg-surface`, `text-ink`, `border-line` 등)만 쓴다. `bg-[#…]` 같은 임의 색 값이나 `style` 속성으로 색을 넣지 않는다. 그런 색은 시간대가 바뀌어도 그대로 남는다.
- Tailwind 기본 팔레트는 지웠다. `bg-gray-100` 같은 클래스는 에러 없이 무시되고 색이 칠해지지 않는다. 사진 위 오버레이용 `white`·`black`과 카카오 로그인 색만 남아 있다.
- 소셜 로그인 버튼(`src/ui/social-login.tsx`)은 예외로 각 사 가이드의 색과 마크를 쓴다. Google은 다섯 색 세트에 라이트 · 다크 테마 값(`google` · `google-line`)이 있고, 카카오(`kakao`)는 다크 짝이 없어 고정이다. 마크의 색 · 비율과 버튼 이름(`aria-label`)의 카카오 문구 '카카오 로그인'은 바꾸지 않는다.
- 반경·글자 크기·글꼴도 README 표의 토큰(`rounded-card`, `text-body`, `font-display` 등)을 먼저 쓴다.
- 색 토큰을 추가하면 `src/app/globals.css`의 다섯 색 세트(A · A 다크 · B · B 다크 · C)에 모두 값을 넣는다. 글자는 4.5:1, 표시선과 컨트롤 테두리는 3:1 대비를 넘겨야 한다.
- 새 화면은 다섯 색 세트에서 모두 확인한다. 시간대는 개발자 도구 콘솔에서 `localStorage.setItem("lumi:light-pick", "moonlight")`(`mist`·`sunlit`도 같다)를 실행하고 새로고침해 바꾸고, `localStorage.removeItem("lumi:light-pick")`로 되돌린다. 다크 짝은 개발자 도구 Rendering 패널에서 `prefers-color-scheme: dark`를 켜서 본다.
- 세션 화면은 시작할 때 `lockLight()`, 마칠 때 `unlockLight()`를 부른다(`src/lib/light.ts`). 설정·프로필과 잇는 `pickLight()`·`setAvoidDark()` 규칙은 README에 있다.

## 팀 작업

역할과 담당 파일은 [TEAM.md](TEAM.md)에 있다.

- 담당은 자기 폴더만 고친다 — 플레이어는 `src/players/<플레이어>/`, intake 화면(A)은 `src/session/intake/`,
  측정 화면(B)은 `src/session/measure/`. 계약 파일(`src/lib/api/types.ts` · `src/players/types.ts` · `catalog.ts` ·
  `player-host.tsx`)과 그 밖의 `src/session/`은 통합 담당과 먼저 맞춘다.
- 화면은 BE가 보낸 값(질문 · 측정 도구 · `content.content_spec`)으로 그리고, 활동별 시간 · 문구 · 자산이나 목표별
  도구를 코드에 박지 않는다.
- 화면은 `/dev`(목업 세션 · 화면 미리보기 · 플레이어 미리보기)에서 BE 없이 확인한다. `src/fixtures/`는
  `scripts/fixtures.py`가 만든 견본이라 손으로 고치지 않는다.

## 검증과 배포

- 변경을 마치면 `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`를 통과시킨다. CI도 같은 명령을 돌린다.
- main에 올릴 때는 ship 하네스를 쓴다. Codex는 `$ship`, Claude Code는 `/ship`이다. 브랜치·PR 규칙은 README 「브랜치·PR 규칙」에 있다.

## 이 파일

- Claude Code(v2.1.277 이상)는 저장소에 `CLAUDE.md`나 `CLAUDE.local.md`가 없을 때만 이 파일을 읽는다. 둘 중 하나를 만들어야 하면 그 첫 줄에 `@AGENTS.md`를 넣어 이 파일을 가져온다.
- `next.config.ts`의 `agentRules: false`는 `next dev`가 이 파일에 Next 안내 블록을 넣지 않게 한다. 그 블록의 내용은 위 「스택」에 옮겼다.
