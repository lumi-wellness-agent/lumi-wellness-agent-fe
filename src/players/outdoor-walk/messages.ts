/** 야외 자연 보행 문구(PR-11). 담당 C. */

import { defineMessages } from "@/i18n/locale";

export const OUTDOOR_WALK = defineMessages({
  ko: {
    title: "야외 자연 보행",
    intro: "안전한 장소에서 본인의 상태에 맞게 걸어보세요. GPS와 걸음 수는 측정하지 않습니다.",
    location: "GPS: 사용 안 함 · 걸음 수: 측정하지 않음",
    safety: "활동 전 안전 확인",
    env: "현재 주변 환경과 이동 경로가 안전합니다.",
    body: "현재 몸 상태로 활동을 진행할 수 있습니다.",
    start: "활동 시작",
    pause: "일시정지",
    resume: "재개",
    stop: "안전상 중단",
    done: "완료",
    elapsed: "경과 시간",
    remaining: "남은 시간",
    recommended: "권장 시간",
    minutes: (minutes: number) => `${minutes}분`,
  },
  en: {
    title: "Outdoor nature walk",
    intro: "Walk somewhere safe, at a pace that suits how you feel. GPS and step count aren't measured.",
    location: "GPS: not used · Steps: not measured",
    safety: "Safety check before you start",
    env: "My surroundings and route are safe right now.",
    body: "I'm physically able to do this activity right now.",
    start: "Start",
    pause: "Pause",
    resume: "Resume",
    stop: "Stop for safety",
    done: "Done",
    elapsed: "Elapsed",
    remaining: "Remaining",
    recommended: "Recommended time",
    minutes: (minutes) => `${minutes} min`,
  },
});
