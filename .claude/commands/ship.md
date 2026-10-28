# /ship — 코드 변경 배포 자동화 (Claude Code 어댑터)

이 명령은 하네스 중립 배포 워크플로우의 **Claude Code 진입점**이다. 절차 원본은 `automation/ship.md`(+ `automation/pipeline.md`)에 있다.

## 실행

`automation/ship.md`를 읽고 Preflight → Phase 1~5를 그대로 실행한다. Phase 4에서 `automation/pipeline.md`를 읽어 배포한다.
사용자 인자(예: `/ship feat 상태 체크인 화면 추가`)는 `automation/ship.md`의 Phase 1 규칙대로 처리한다.

## Claude Code 하네스 설정 (원본 명세에 주입)

- **폴링 모드**: CI·Vercel 체크 대기는 `automation/bin/`의 폴링 스크립트(`pr-gate.mjs`·`run-wait.mjs`·`deploy-wait.mjs`)를 `node`로 **`run_in_background: true` Bash**에서 실행한다. 포그라운드 `sleep` 차단·Monitor 도구 금지. 메인 세션이 직접 수행하고 서브에이전트에 위임하지 않는다. 스크립트 완료 시 세션이 자동 재호출된다. (`automation/pipeline.md` 「폴링 실행 규칙」의 Claude Code 모드)
- **디자인 시스템 동기화** (원본 Phase 5): 아티팩트는 `LUMI 디자인 시스템`(https://claude.ai/artifact/XaXoyJuT4dHb3WmyRNy8t2)이다.
  - `Artifact` 도구로 `project/tokens.json`을 읽는다. 도구가 없거나 읽을 수 없으면(소유자 계정이 아니다) 건너뛰고 최종 보고에 한 줄 남긴다.
  - `meta.ref`(`main@<sha>`)가 마지막으로 맞춘 커밋이다. `git fetch origin main` 뒤 `git diff --quiet <sha> origin/main -- src/app/globals.css src/lib/light.ts`가 0으로 끝나면 할 일이 없다. 차이가 있거나 그 커밋을 찾지 못하면 맞춘다.
  - 읽고 합친다 — 바뀐 값만 고치고 파일을 통째로 다시 쓰지 않는다. `tokens.json` 값은 `origin/main`의 `globals.css`를 따르고, 코드에 아직 없는 토큰(간격·크기·`light-*`)은 그대로 둔다. 표기만 다른 같은 값(`rgb(236 234 248 / 0.42)`와 `rgba(236, 234, 248, 0.42)`)은 아티팩트 표기를 유지한다. 토큰을 더하거나 이름을 바꿨으면 `project/components/bundle.css`·`project/README.md`를, 시간대가 바뀌었으면 `project/1-day-light.md`를 함께 고친다. 값이 같아도 `meta.ref`·`meta.synced`와 `project/design-system.json`의 `lastChange`는 새로 쓴다.
  - 게시 전에 `Artifact list`(`scope: "files"`)로 경로 목록을 받는다 — 게시가 건드리는 기존 경로는 이 세션에서 목록으로 봤거나 읽은 것이어야 한다. 고친 파일만 게시한다.
  - 게시 권한 승인이 사용자 확인을 겸한다. 거절되면 그대로 보고하고 마친다.
- **Co-Author 트레일러**: `automation/pipeline.md` Step 1-1 커밋 메시지 끝에 현재 세션의 시스템 규칙이 지정하는 `Co-Authored-By:` 트레일러를 붙인다.
- **PR 본문 서명**: Step 1-4 PR 본문 끝에 `🤖 Generated with [Claude Code](https://claude.com/claude-code)`를 붙인다.
- **안전 규칙**: 「민감 파일 커밋 금지」는 커밋 전 `automation/bin/sensitive-gate.mjs` 실행으로 기계 검사하고, PreToolUse 훅(`.claude/settings.json` → `automation/hooks/validate-git-sensitive.sh`)이 `git add/commit/push`를 추가로 자동 차단한다 — 이중 방어로 작동한다.
