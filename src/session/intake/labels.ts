/** intake 화면 문구 — 시작 입력의 환경 칩과 질문 묶음 머리말. 담당 A(TEAM.md). */

import type { Setting } from "@/lib/api/types";

/** 지금 있는 곳. BE intake_rules.SETTING_OPTIONS와 같은 네 곳이다. */
export const SETTING_LABELS: Record<Setting, string> = {
  HOME: "집이나 혼자 있는 방",
  OFFICE_CAFE: "사무실·카페",
  TRANSIT: "지하철·버스",
  OUTDOOR: "밖에 나갈 수 있어요",
};

/** 쓸 수 있는 시간. 추천이 바뀌는 경계(BE intake.MINUTES_CHOICES) — 20은 20분 이상이다. */
export const MINUTE_CHOICES = [5, 10, 20];

/** 질문 묶음의 머리말. 시점 질문(state · state_followup)은 질문 문장으로 충분해 비운다. */
export const GROUP_LABELS: Record<string, string> = {
  setting: "지금 있는 곳",
  earphones: "이어폰",
  minutes: "쓸 수 있는 시간",
};
