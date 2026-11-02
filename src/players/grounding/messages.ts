/** 오감 그라운딩(PR-17) 문구 — 단계 진행 · 버튼. 감각 이름 · 예시 · 대본은 BE content_spec 그대로다. 담당 B. */

import { defineMessages } from "@/i18n/locale";

export const GROUNDING = defineMessages({
  ko: {
    specFailed: "감각 안내를 불러오지 못했어요.",
    back: "돌아가기",
    progress: "감각 단계 진행",
    count: (label: string, count: number) => `${label} · ${count}가지`,
    examples: (list: string) => `예: ${list}`,
    intro: "시작 안내",
    outro: "마무리 안내",
    silent: "음성을 사용할 수 없어 글로 안내하고 있어요. 자신의 속도로 진행해 주세요.",
    firstStep: "음성 없이 첫 단계로",
    finish: "마무리하기",
    nextStep: "다음 단계",
    skip: "이 단계 건너뛰기",
    replay: "안내 다시 듣기",
    skipped: (list: string) => `건너뛴 단계: ${list}`,
    closing: "마무리 안내 중…",
    next: "다음으로",
  },
  en: {
    specFailed: "Couldn't load the senses guide.",
    back: "Go back",
    progress: "Senses progress",
    count: (label, count) => `${label} · ${count} things`,
    examples: (list) => `e.g. ${list}`,
    intro: "Introduction",
    outro: "Closing",
    silent: "Voice isn't available, so the guide is shown as text. Go at your own pace.",
    firstStep: "Go to the first step without voice",
    finish: "Finish",
    nextStep: "Next step",
    skip: "Skip this step",
    replay: "Hear the guide again",
    skipped: (list) => `Skipped steps: ${list}`,
    closing: "Closing guide…",
    next: "Next",
  },
});
