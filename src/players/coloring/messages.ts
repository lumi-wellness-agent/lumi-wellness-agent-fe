/** 컬러링 문구(PR-14 · 15). 담당 C. */

import { defineMessages } from "@/i18n/locale";

export const COLORING = defineMessages({
  ko: {
    loadFailed: "컬러링 도안을 불러오지 못했습니다",
    resetConfirm: "현재 도안의 색칠을 모두 지울까요?",
    stop: "그만하기",
    done: "완료",
    hint: "색칠할 수 있는 영역을 누르면 활동이 시작됩니다.",
    elapsed: (clock: string) => `경과 시간 ${clock}`,
    colored: (colored: number, total: number, percent: number) => `색칠한 영역 ${colored}/${total} · ${percent}%`,
    progress: "권장 시간 진행률",
    color: (color: string) => `색상 ${color}`,
    eraser: "지우개",
    nextDesign: "다음 도안",
    reset: "초기화",
    loading: "도안을 불러오고 있어요",
  },
  en: {
    loadFailed: "Couldn't load the coloring design",
    resetConfirm: "Clear all the coloring on this design?",
    stop: "Stop",
    done: "Done",
    hint: "Tap an area you can color to start.",
    elapsed: (clock) => `Elapsed ${clock}`,
    colored: (colored, total, percent) => `Colored ${colored}/${total} · ${percent}%`,
    progress: "Progress toward the recommended time",
    color: (color) => `Color ${color}`,
    eraser: "Eraser",
    nextDesign: "Next design",
    reset: "Reset",
    loading: "Loading the design",
  },
});
