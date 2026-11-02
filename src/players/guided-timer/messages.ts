/** 원형 타이머 음성 안내 문구(PR-06 · 08 · 09 · 22) — 상태 · 버튼 · 사진 칸. 대본은 BE content_spec 그대로다. 담당 B. */

import { defineMessages } from "@/i18n/locale";

export const GUIDED_TIMER = defineMessages({
  ko: {
    remaining: (clock: string) => `남은 시간 ${clock}`,
    preparing: "안내를 준비하고 있어요.",
    speaking: "안내 음성을 재생하고 있어요.",
    started: "편안한 속도로 이어가세요. 불편하면 언제든 멈출 수 있어요.",
    ready: "준비되면 시작을 눌러 주세요.",
    noSpeech: "이 브라우저에서 안내 음성을 재생할 수 없어 화면 안내만 표시합니다.",
    preparingButton: "준비 중",
    start: "시작",
    afterEnd: "활동이 끝나면 다음 단계로 이동합니다.",
    photoArea: "자연 사진 준비 영역",
    photo: (n: number) => `자연 풍경 사진 ${n}`,
    photoFailed: "자연 사진을 불러오지 못했어요.",
    photoPreparing: "자연 사진을 준비하고 있어요.",
  },
  en: {
    remaining: (clock) => `Time remaining ${clock}`,
    preparing: "Getting the guide ready.",
    speaking: "Playing the voice guide.",
    started: "Keep going at a comfortable pace. You can stop anytime if it feels uncomfortable.",
    ready: "Tap Start when you're ready.",
    noSpeech: "This browser can't play the voice guide, so the guide is shown on screen only.",
    preparingButton: "Getting ready",
    start: "Start",
    afterEnd: "When the activity ends, you'll move to the next step.",
    photoArea: "Nature photo area",
    photo: (n) => `Nature photo ${n}`,
    photoFailed: "Couldn't load the nature photos.",
    photoPreparing: "Getting the nature photos ready.",
  },
});
