/**
 * 플레이어 호스트 · 준비 중 화면 문구(통합 담당). 플레이어마다의 문구는 각 폴더의 messages.ts에 있다.
 * 활동 이름 · 단계 이름 · 대본은 BE가 보내는 content 그대로라 여기 없다.
 */

import { defineMessages } from "@/i18n/locale";

/**
 * 멈춘 이유 — 화면 문구와 보내는 값을 나눈다. 보내는 값(value)은 BE replan이 그대로 읽어 다음 단계를 권하므로
 * 화면 언어와 상관없이 같다(BE prompts.RECOMMEND_SYSTEM_PROMPT의 '시간이 없거나 그만하고 싶다' · '불편 · 어지러움').
 */
export const STOP_REASONS = [
  { key: "uncomfortable", value: "불편해요" },
  { key: "dizzy", value: "어지러워요" },
  { key: "noTime", value: "지금은 시간이 없어요" },
  { key: "quit", value: "그냥 그만할래요" },
] as const;

export const PLAYER = defineMessages({
  ko: {
    stop: "그만하기",
    loading: "활동을 불러오고 있어요",
    stopTitle: "여기서 멈출까요?",
    stopHint: "멈춘 이유를 고르면 다음 추천에 참고해요.",
    reasons: { uncomfortable: "불편해요", dizzy: "어지러워요", noTime: "지금은 시간이 없어요", quit: "그냥 그만할래요" },
    keepGoing: "계속할게요",
    placeholder: {
      minutes: (minutes: number) => `약 ${minutes}분`,
      notReady: "이 활동 화면은 준비 중이에요. 안내에 따라 진행한 뒤 ‘다 했어요’를 눌러 주세요.",
      done: "다 했어요",
    },
  },
  en: {
    stop: "Stop",
    loading: "Loading the activity",
    stopTitle: "Stop here?",
    stopHint: "Pick a reason and we'll take it into account for the next recommendation.",
    reasons: {
      uncomfortable: "I feel uncomfortable",
      dizzy: "I feel dizzy",
      noTime: "I don't have time right now",
      quit: "I just want to stop",
    },
    keepGoing: "Keep going",
    placeholder: {
      minutes: (minutes) => `About ${minutes} min`,
      notReady: "This activity screen isn't ready yet. Follow the guide, then tap ‘Done’.",
      done: "Done",
    },
  },
});
