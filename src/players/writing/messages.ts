/**
 * 긍정 경험 글쓰기 문구(PR-18). 담당 C.
 * 완료 조건(최소 글자 수)은 플레이어의 MINIMUM이고 화면 언어와 상관없이 같다 — 영어 글의 기준을 따로 둘지는 활동 노드를
 * 영어로 옮길 때 정한다.
 */

import { defineMessages } from "@/i18n/locale";

export const WRITING = defineMessages({
  ko: {
    stop: "그만하기",
    done: "완료",
    title: "강렬한 긍정 경험 글쓰기",
    intro: "살면서 가장 멋졌던 경험이나 가장 행복했던 순간을 하나 골라 보세요. 그 순간의 느낌과 생각, 감정을 떠올리며 경험을 되도록 자세히 적어 보세요.",
    restored: "이전에 작성하던 내용을 복구했습니다. 글을 다시 입력하면 활동을 이어갑니다.",
    label: "경험 기록",
    placeholder: "그때 들었던 느낌과 생각, 감정을 담아 자세히 적어 보세요.",
    length: (length: number) => `현재 ${length}자`,
    maximum: (maximum: number) => `최대 ${maximum}자`,
    minimumMet: (minimum: number) => `최소 ${minimum}자 충족 · 완료할 수 있어요.`,
    minimumNeeded: (minimum: number) => `최소 ${minimum}자 이상 작성하면 완료할 수 있어요.`,
    recommended: (minutes: number) => `권장 시간은 약 ${minutes}분이며, 시간은 완료 조건이 아닙니다.`,
  },
  en: {
    stop: "Stop",
    done: "Done",
    title: "Writing about an intensely positive experience",
    intro: "Pick one of the most wonderful experiences or happiest moments of your life. Recall the feelings, thoughts and emotions of that moment, and write about it in as much detail as you can.",
    restored: "We restored what you were writing. Start typing again to continue.",
    label: "Your experience",
    placeholder: "Write it in detail, with the feelings, thoughts and emotions you had then.",
    length: (length) => `${length} characters`,
    maximum: (maximum) => `Max ${maximum}`,
    minimumMet: (minimum) => `${minimum} characters reached · you can finish.`,
    minimumNeeded: (minimum) => `Write at least ${minimum} characters to finish.`,
    recommended: (minutes) => `The recommended time is about ${minutes} min; time isn't a condition for finishing.`,
  },
});
