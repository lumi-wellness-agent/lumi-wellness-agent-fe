/** 측정 화면 문구. 담당 B(TEAM.md). 문항 · 지시문 · 양끝 라벨은 BE가 보내는 도구 그대로라 여기 없다. */

import { defineMessages } from "@/i18n/locale";

export const MEASURE = defineMessages({
  ko: {
    titles: {
      PRE: "시작하기 전에 지금 상태를 알려 주세요",
      POST: "활동을 마친 지금은 어떤가요?",
      FINAL: "마치기 전에 한 번 더 알려 주세요",
    },
    next: (answered: number, total: number) => `다음 (${answered}/${total})`,
    afterRound: (round: number) => `${round}번째 활동 뒤`,
    pendingItem: (id: string) => `문항 ${id} — 원문 준비 중`,
    notChosen: "아직 고르지 않음",
  },
  en: {
    titles: {
      PRE: "Before you start, tell us how you feel right now",
      POST: "How do you feel now that you've finished?",
      FINAL: "One more check before you finish",
    },
    next: (answered, total) => `Next (${answered}/${total})`,
    afterRound: (round) => `After activity ${round}`,
    pendingItem: (id) => `Item ${id} — text coming soon`,
    notChosen: "Not chosen yet",
  },
});
