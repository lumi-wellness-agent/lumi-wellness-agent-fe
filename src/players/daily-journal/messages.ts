/** 좋은 일 기록 문구(PR-19). 담당 C. */

import { defineMessages } from "@/i18n/locale";

export const JOURNAL = defineMessages({
  ko: {
    stop: "그만하기",
    submit: "제출하기",
    title: "오늘의 좋은 일 기록",
    intro: "오늘 어떤 좋은 일이 있었나요? 그 일이 왜 좋았는지도 함께 적어 보세요.",
    entries: "오늘의 기록",
    placeholder: (n: number) => `${n}번째 좋은 일`,
    count: (count: number) => `공백만 입력한 칸은 기록으로 인정하지 않습니다. ${count}/3개 입력`,
    recommended: (minutes: number) => `권장 시간은 약 ${minutes}분이며, 완료 조건은 아닙니다.`,
  },
  en: {
    stop: "Stop",
    submit: "Submit",
    title: "Good things today",
    intro: "What good things happened today? Write down why they were good, too.",
    entries: "Today's entries",
    placeholder: (n) => `Good thing ${n}`,
    count: (count) => `Boxes with only spaces don't count. ${count}/3 filled`,
    recommended: (minutes) => `The recommended time is about ${minutes} min; it isn't a condition for finishing.`,
  },
});
