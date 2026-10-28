/** intake 화면 문구 — 시작 입력의 환경 칩 · 프로필과 질문 묶음 머리말. 담당 A(TEAM.md). */

import type { Setting } from "@/lib/api/types";

/** 지금 있는 곳. BE intake_rules.SETTING_OPTIONS와 같은 네 곳이다. */
export const SETTING_LABELS: Record<Setting, string> = {
  HOME: "집이나 혼자 있는 방",
  OFFICE_CAFE: "사무실·카페",
  TRANSIT: "지하철·버스",
  OUTDOOR: "밖에 나갈 수 있어요",
};

/** 쓸 수 있는 시간. BE intake.MINUTES_CHOICES와 같다 — 3은 짧은 활동(미술 감상 1–2분 · 마음챙김 3분), 20은 20분 이상이다. */
export const MINUTE_CHOICES = [3, 5, 10, 20];

/** 질문 묶음의 머리말. 시점 질문(state · state_followup)은 질문 문장으로 충분해 비운다. */
export const GROUP_LABELS: Record<string, string> = {
  setting: "지금 있는 곳",
  earphones: "이어폰",
  minutes: "쓸 수 있는 시간",
};

/**
 * 첫 질문 아래 예시 문장 — 누르면 입력 칸에 채워지고 고쳐 쓸 수 있다. 목표마다 하나씩, BE 단서표
 * (data/intake_cues.json)의 표현으로 만들었다(S1 반추 · S2 긴장 · S3 피로). 목표를 고르는 칩이 아니다.
 */
export const EXAMPLE_TEXTS = [
  "발표가 끝났는데 계속 생각나요",
  "발표 앞두고 긴장돼요",
  "몇 시간째 공부해서 머리가 멍해요",
];

/** 직접 쓰기 칸의 안내. 되묻기는 기분을 캐묻지 않고 상황을 가볍게 묻는다(BE READ_SYSTEM_PROMPT). */
export const FREE_TEXT_HINTS = {
  // 되묻기 문장에 예시가 이미 들어 있어(BE READ_SYSTEM_PROMPT · RESTATE_FIXED) 칸에는 다시 넣지 않는다
  restate: { label: "한두 마디면 충분해요", placeholder: "" },
  withOptions: { label: "보기에 없으면 직접 적어 주세요", placeholder: "" },
  only: { label: "한두 마디로 적어 주세요", placeholder: "" },
};

/**
 * 프로필 보기 — 화면 문구(한국어) → 보낼 값. BE UserProfile은 자유 문자열이고, 선호 풍경은 사진 검색어
 * (app/content/resolver.py)와 이미지 생성 문장(app/content/image.py)에 그대로 들어가 영어로 보낸다.
 */
export const SCENERY_CHOICES = [
  { label: "숲", value: "forest" },
  { label: "호수·강", value: "lake river" },
  { label: "바다", value: "sea" },
  { label: "산", value: "mountain" },
  { label: "꽃", value: "flowers" },
  { label: "하늘", value: "sky" },
];

export const COLOR_CHOICES = [
  { label: "초록", value: "green" },
  { label: "파랑", value: "blue" },
  { label: "하늘색", value: "sky blue" },
  { label: "베이지", value: "beige" },
  { label: "분홍", value: "pink" },
  { label: "노랑", value: "yellow" },
  { label: "보라", value: "purple" },
  { label: "검정", value: "black" },
  { label: "진한 보라", value: "dark purple" },
];

/** BE preferred_colors 상한(max_length=3). */
export const MAX_PREFERRED_COLORS = 3;

/** 피하고 싶은 색에 이것이 있으면 어두운 화면 색 세트를 쓰지 않는다(setAvoidDark, src/lib/light.ts). */
export const DARK_COLORS = ["black", "dark purple"];
