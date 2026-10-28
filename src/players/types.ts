import type { ActivityContent, ContentStep } from "@/lib/api/types";

/**
 * 플레이어 계약. 활동 노드 하나(ACTIVITY 단계)를 실행하고 끝나면 onFinish를 한 번 부른다.
 * NOTICE 단계(PR-16 팝업)와 SessionReport 보내기는 호스트(player-host.tsx)가 한다.
 */
export type PlayerProps = {
  /** RUN payload의 content. 활동마다 다른 실행 방법은 content.content_spec(slots · session_ui)에 있다. */
  content: ActivityContent;
  /** 실행할 ACTIVITY 단계 — label · minutes(계획한 시간). */
  step: ContentStep;
  /** 끝까지 했으면 completed: true. 불편하거나 어지러워 멈췄으면 false와 이유(사용자 말 그대로). */
  onFinish: (result: ActivityResult) => void;
};

export type ActivityResult = { completed: true; noticeWords?: string[] } | { completed: false; stoppedReason: string };

/** 활동 노드 묶음 담당(TEAM.md). BE 활동 노드 JSON과 같은 사람이 맡는다. */
export type Owner = "A" | "B" | "C";
