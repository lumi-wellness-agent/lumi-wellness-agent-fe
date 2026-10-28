import type { Owner } from "./types";

/**
 * 플레이어 목록 — 활동 노드 21개를 화면이 같은 것끼리 묶었다. 담당은 BE 활동 노드 JSON 묶음과 같다(TEAM.md).
 *
 * - 원형 타이머 + 음성 안내는 BE session_ui.component가 같은 CIRCULAR_SESSION_TIMER다(PR-06 · 08 · 09 · 22).
 * - PR-16(감정에 이름 붙이기)은 단독 활동이 아니라 NOTICE 단계 모듈이라 여기 없다 — PR-01 · 09 · 15 · 21의
 *   NOTICE 단계를 호스트가 notice/notice-popup.tsx로 그린다.
 * - PR-13은 E19를 PR-11에 합쳐 결번이다.
 *
 * 컴포넌트 연결은 player-host.tsx에 있다. 담당은 자기 폴더의 player.tsx만 고친다.
 */
export const PLAYERS = {
  slideshow: { owner: "A", title: "이미지 감상", protocols: ["PR-01", "PR-03", "PR-20"] },
  listening: { owner: "A", title: "소리·영상 감상", protocols: ["PR-02", "PR-04", "PR-05"] },
  "image-meditation": { owner: "A", title: "이미지 + 녹음 명상", protocols: ["PR-21"] },
  "guided-timer": { owner: "B", title: "원형 타이머 음성 안내", protocols: ["PR-06", "PR-08", "PR-09", "PR-22"] },
  rest: { owner: "B", title: "자연환경 알아차리기(ReST)", protocols: ["PR-10"] },
  pmr: { owner: "B", title: "점진적 근육 이완", protocols: ["PR-07"] },
  grounding: { owner: "B", title: "오감 그라운딩", protocols: ["PR-17"] },
  coloring: { owner: "C", title: "컬러링", protocols: ["PR-14", "PR-15"] },
  writing: { owner: "C", title: "글쓰기", protocols: ["PR-18"] },
  "daily-journal": { owner: "C", title: "좋은 일 기록", protocols: ["PR-19"] },
  "outdoor-walk": { owner: "C", title: "야외 걷기", protocols: ["PR-11"] },
  "outdoor-walk-noticing": { owner: "C", title: "자연 속 걷기 + 알아차림", protocols: ["PR-12"] },
} as const satisfies Record<string, { owner: Owner; title: string; protocols: readonly string[] }>;

export type PlayerKey = keyof typeof PLAYERS;

/** 이 활동을 실행할 플레이어. ACTIVITY 단계가 없는 PR-16과 모르는 ID는 null. */
export function playerKeyFor(protocolId: string): PlayerKey | null {
  const keys = Object.keys(PLAYERS) as PlayerKey[];
  return keys.find((key) => (PLAYERS[key].protocols as readonly string[]).includes(protocolId)) ?? null;
}
