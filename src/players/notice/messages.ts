/** PR-16 감정 알아차리기 팝업 문구. 안내 문장 · 제목은 BE가 보내면 그것을 쓰고(content.notice_module · notice_prompt), 없을 때만 이 문구다. */

import { defineMessages } from "@/i18n/locale";

export const NOTICE = defineMessages({
  ko: {
    start: "감정이나 분위기를 1~3개의 짧은 단어로 입력해 주세요. 이 활동에는 정답이 있지 않습니다.",
    title: "감정 알아차리기",
    proceed: "진행하기",
    skip: "건너뛰기",
    input: (n: number) => `감정 또는 분위기 ${n}`,
    firstPlaceholder: "예: 차분한 기분",
    morePlaceholder: "더 적어도 괜찮아요",
    invalid: (minWords: number, maxWords: number) => `한 칸 이상 ${minWords}~${maxWords}단어로 입력해 주세요.`,
    done: "완료",
  },
  en: {
    start: "Write how you feel or the mood you're in, in 1–3 short words. There's no right answer.",
    title: "Notice your feelings",
    proceed: "Continue",
    skip: "Skip",
    input: (n) => `Feeling or mood ${n}`,
    firstPlaceholder: "e.g. calm",
    morePlaceholder: "You can add more",
    invalid: (minWords, maxWords) => `Fill in at least one box with ${minWords}–${maxWords} words.`,
    done: "Done",
  },
});
