/**
 * intake 화면 문구 — 시작 입력 · 질문(ASK) · SAFETY 도움 안내. 담당 A(TEAM.md).
 * 질문 문장과 보기는 BE가 보내서(intake_rules.py) 여기 없다. 칩 · 예시 문장은 labels.ts에 있다.
 */

import { defineMessages } from "@/i18n/locale";

export const INTAKE = defineMessages({
  ko: {
    start: {
      question: "오늘 상황이 어떠세요?",
      placeholder: "한두 마디면 충분해요",
      examples: "이렇게 써도 돼요",
      context: "지금 여건 알려 주기 (선택)",
      picked: (count: number) => ` · ${count}개 고름`,
      earphones: { yes: "있어요", no: "없어요" },
      minutes: (minutes: number) => (minutes === 20 ? "20분 이상" : `${minutes}분`),
      profile: "내 취향 알려 주기 (선택)",
      remembered: "이 기기에 기억해 두고 다음에도 써요.",
      likedScenery: "좋아하는 풍경",
      likedColors: (max: number) => `좋아하는 색 (${max}개까지)`,
      avoidedColors: "불편한 색",
    },
    ask: {
      next: "다음",
      skip: "건너뛸게요",
      turn: (turn: number, max: number) => `질문 ${turn} / ${max}`,
      textWins: "직접 쓴 글로 답할게요. 고른 보기는 보내지 않아요.",
    },
    safety: {
      title: "지금은 혼자 감당하지 않으셨으면 해요",
      body: "들려주신 이야기가 걱정돼요. 지금 마음을 함께 나눌 수 있는 곳에 연락해 주세요. LUMI는 위기 상황을 돕기 어려워 활동을 추천하지 않았어요.",
      /** 2026-10 기준 국내 상담 전화(safety-screen.tsx의 HELP_LINES와 같은 순서). 문구와 번호는 발표 전에 다시 확인한다. */
      lines: {
        suicide: "자살예방 상담전화",
        crisis: "정신건강 위기상담 전화",
        emergency: "긴급 구조 · 구급",
        police: "경찰",
      },
      allDay: "24시간",
      /** 번호 목록 위의 한 줄 — 한국어 화면은 국내 번호가 당연해 비운다 */
      region: "",
      home: "처음으로",
    },
  },
  en: {
    start: {
      question: "How are things today?",
      placeholder: "A word or two is enough",
      examples: "You could write something like",
      context: "Your setting (optional)",
      picked: (count) => ` · ${count} selected`,
      earphones: { yes: "I have them", no: "I don't" },
      minutes: (minutes) => (minutes === 20 ? "20 min or more" : `${minutes} min`),
      profile: "What you like (optional)",
      remembered: "We'll remember this on this device for next time.",
      likedScenery: "Scenery you like",
      likedColors: (max) => `Colors you like (up to ${max})`,
      avoidedColors: "Colors that bother you",
    },
    ask: {
      next: "Next",
      skip: "Skip",
      turn: (turn, max) => `Question ${turn} of ${max}`,
      textWins: "We'll answer with what you typed. The options you picked won't be sent.",
    },
    safety: {
      title: "Please don't carry this alone right now",
      body: "We're worried about what you shared. Please reach out to someone who can be with you in this right now. LUMI can't help in a crisis, so it didn't recommend an activity.",
      // 영어 화면도 국내 번호다(2026-11-02 결정) — 이름만 옮긴다
      lines: {
        suicide: "Suicide prevention line",
        crisis: "Mental health crisis line",
        emergency: "Emergency rescue · ambulance",
        police: "Police",
      },
      allDay: "24h",
      region: "Phone lines in Korea",
      home: "Back to start",
    },
  },
});
