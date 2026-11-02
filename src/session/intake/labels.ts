/** intake 화면 문구 — 시작 입력의 환경 칩 · 프로필과 질문 묶음 머리말. 담당 A(TEAM.md). */

import { defineMessages, LOCALES, type Locale } from "@/i18n/locale";
import type { CareRequest, Setting } from "@/lib/api/types";

/** 지금 있는 곳. BE intake_rules.SETTING_OPTIONS와 같은 네 곳이고 칩도 이 순서다. */
export const SETTINGS: Setting[] = ["HOME", "OFFICE_CAFE", "TRANSIT", "OUTDOOR"];

/** 쓸 수 있는 시간. BE intake.MINUTES_CHOICES와 같다 — 3은 짧은 활동(미술 감상 1–2분 · 마음챙김 3분), 20은 20분 이상이다. */
export const MINUTE_CHOICES = [3, 5, 10, 20];

/**
 * 예시 문장을 누르면 같이 골라지는 여건 — 집 · 10분. 장소와 시간이 차면 BE가 환경 질문을 건너뛰어(intake_rules.
 * context_groups) 시작 → 사전 측정으로 바로 간다. 집에서는 이어폰이 후보 활동을 바꾸지 않아 묻지 않으므로 비워 둔다.
 * 세 예시가 같은 값이다 — 장소는 기분이 아니라 지금 있는 곳이라 예시마다 다르게 두지 않는다. 사실과 다를 수 있으니
 * 화면은 고른 칩을 펼쳐 보이고 고칠 수 있게 한다. 값은 SETTINGS · MINUTE_CHOICES 안의 것이어야 칩이 켜진다.
 */
export const EXAMPLE_CONTEXT: Pick<CareRequest, "setting" | "minutes_available"> = { setting: "HOME", minutes_available: 10 };

/**
 * 프로필 보기의 값. BE UserProfile은 자유 문자열이고, 선호 풍경은 사진 검색어(app/content/resolver.py)와 이미지 생성
 * 문장(app/content/image.py)에 그대로 들어가 화면 언어와 상관없이 영어로 보낸다. 화면 문구는 INTAKE_LABELS에 있다.
 */
export const SCENERY_VALUES = ["forest", "lake river", "sea", "mountain", "flowers", "sky"] as const;
export const COLOR_VALUES = ["green", "blue", "sky blue", "beige", "pink", "yellow", "purple", "black", "dark purple"] as const;

/** BE preferred_colors 상한(max_length=3). */
export const MAX_PREFERRED_COLORS = 3;

/** 피하고 싶은 색에 이것이 있으면 어두운 화면 색 세트를 쓰지 않는다(setAvoidDark, src/lib/light.ts). */
export const DARK_COLORS = ["black", "dark purple"];

export const INTAKE_LABELS = defineMessages({
  ko: {
    settings: {
      HOME: "집이나 혼자 있는 방",
      OFFICE_CAFE: "사무실·카페",
      TRANSIT: "지하철·버스",
      OUTDOOR: "밖에 나갈 수 있어요",
    } satisfies Record<Setting, string>,
    /** 질문 묶음의 머리말. 시점 질문(state · state_followup)은 질문 문장으로 충분해 비운다. */
    groups: { setting: "지금 있는 곳", earphones: "이어폰", minutes: "쓸 수 있는 시간" },
    /**
     * 첫 질문 아래 예시 문장 — 누르면 입력 칸에 채워지고(여건 칩은 EXAMPLE_CONTEXT) 고쳐 쓸 수 있다. 목표마다 하나씩
     * (S1 반추 · S2 긴장 · S3 피로), BE 단서표(data/intake_cues.json)의 표현에 시점 표현("끝났는데" · "앞두고" ·
     * "몇 시간째")을 붙였다. 시점이 분명해야 BE가 시점 질문을 건너뛴다 — "아까 …"만으로는 3번 중 2번 되물었다.
     * 목표를 고르는 칩이 아니고, 문장을 바꾸면 BE intake(scripts/plan_trial.py --text)로 목표와 질문을 다시 확인한다
     * (2026-11-01 실측: 세 문장 모두 3/3 같은 목표, 시점 질문 없음). 같은 자리의 영어 문장은 같은 목표 · 시점을
     * 옮긴 것이고 아직 BE로 재지 않았다(영어 응답을 붙일 때 같은 방법으로 잰다).
     */
    examples: ["회의 끝났는데 들은 말이 계속 생각나요", "발표 앞두고 긴장돼요", "몇 시간째 공부해서 머리가 멍해요"],
    /** 직접 쓰기 칸의 안내. 되묻기는 기분을 캐묻지 않고 상황을 가볍게 묻는다(BE READ_SYSTEM_PROMPT). */
    hints: {
      // 되묻기 문장에 예시가 이미 들어 있어(BE READ_SYSTEM_PROMPT · RESTATE_FIXED) 칸에는 다시 넣지 않는다
      restate: { label: "한두 마디면 충분해요", placeholder: "" },
      withOptions: { label: "보기에 없으면 직접 적어 주세요", placeholder: "" },
      only: { label: "한두 마디로 적어 주세요", placeholder: "" },
    },
    scenery: {
      forest: "숲",
      "lake river": "호수·강",
      sea: "바다",
      mountain: "산",
      flowers: "꽃",
      sky: "하늘",
    } satisfies Record<(typeof SCENERY_VALUES)[number], string>,
    colors: {
      green: "초록",
      blue: "파랑",
      "sky blue": "하늘색",
      beige: "베이지",
      pink: "분홍",
      yellow: "노랑",
      purple: "보라",
      black: "검정",
      "dark purple": "진한 보라",
    } satisfies Record<(typeof COLOR_VALUES)[number], string>,
  },
  en: {
    settings: {
      HOME: "At home or in a room by myself",
      OFFICE_CAFE: "Office · café",
      TRANSIT: "Subway · bus",
      OUTDOOR: "I can go outside",
    },
    groups: { setting: "Where you are now", earphones: "Earphones", minutes: "Time you have" },
    examples: [
      "The meeting's over, but I keep replaying what was said",
      "I'm nervous before my presentation",
      "I've been studying for hours and my head feels foggy",
    ],
    hints: {
      restate: { label: "A word or two is enough", placeholder: "" },
      withOptions: { label: "If it's not listed, write your own", placeholder: "" },
      only: { label: "Write it in a word or two", placeholder: "" },
    },
    scenery: {
      forest: "Forest",
      "lake river": "Lake · river",
      sea: "Sea",
      mountain: "Mountain",
      flowers: "Flowers",
      sky: "Sky",
    },
    colors: {
      green: "Green",
      blue: "Blue",
      "sky blue": "Sky blue",
      beige: "Beige",
      pink: "Pink",
      yellow: "Yellow",
      purple: "Purple",
      black: "Black",
      "dark purple": "Dark purple",
    },
  },
});

/** 질문 묶음의 머리말. 없는 묶음(시점 질문)은 undefined — 머리말을 그리지 않는다. */
export function groupLabel(groups: Readonly<Record<string, string>>, key: string): string | undefined {
  return groups[key];
}

/**
 * 앱이 넣은 예시 문장이면 지금 언어의 같은 자리 예시로 바꾼다 — 예시를 누른 뒤 언어를 바꿔도 입력 칸이 따라간다.
 * 한 글자라도 고친 글은 사용자의 글이라 그대로 둔다. 입력 칸과 보내는 문장이 같은 값을 쓴다.
 */
export function localizedExample(text: string, locale: Locale): string {
  for (const lang of LOCALES) {
    const i = INTAKE_LABELS[lang].examples.indexOf(text);
    if (i >= 0) return INTAKE_LABELS[locale].examples[i] ?? text;
  }
  return text;
}
