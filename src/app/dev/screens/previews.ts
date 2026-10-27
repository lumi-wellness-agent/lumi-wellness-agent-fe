/**
 * 화면 미리보기 목록 — 세션 화면 하나를 견본 payload로 띄운다(/dev/screens/[name]).
 * 이름은 견본 파일과 맞춘다: ask-<src/fixtures/intake/…> · measure-<src/fixtures/measure/…>.
 */

export const SCREEN_PREVIEWS = [
  { name: "ask-restate", owner: "A", title: "질문 — 입구 되묻기(관계없는 답 뒤)" },
  { name: "ask-state", owner: "A", title: "질문 — 시점(사건 전·후 · 피로 뒤 · 계기 없음)" },
  { name: "ask-state-followup", owner: "A", title: "질문 — 재질문(압박 vs 오래 이어진 집중)" },
  { name: "ask-context", owner: "A", title: "질문 — 환경 칩(장소 · 이어폰 · 시간)" },
  { name: "end-safety", owner: "A", title: "SAFETY 도움 안내" },
  { name: "measure-pre-S1", owner: "B", title: "사전 측정 S1 — SAM + BSRI" },
  { name: "measure-pre-S2", owner: "B", title: "사전 측정 S2 — SAM + STAI-6" },
  { name: "measure-pre-S3", owner: "B", title: "사전 측정 S3 — SAM + MFVAS" },
  { name: "measure-post-S1-S2", owner: "B", title: "사후 측정 S1 · S2 — SAM" },
  { name: "measure-post-S3", owner: "B", title: "사후 측정 S3 — SAM + MFVAS" },
  { name: "measure-final-S1", owner: "B", title: "종료 측정 S1 — BSRI" },
  { name: "measure-final-S2", owner: "B", title: "종료 측정 S2 — STAI-6" },
  { name: "confirm", owner: "통합", title: "평가 · 다음 단계 선택" },
  { name: "end-done", owner: "통합", title: "세션 종료 요약" },
] as const;

export type ScreenPreviewName = (typeof SCREEN_PREVIEWS)[number]["name"];
