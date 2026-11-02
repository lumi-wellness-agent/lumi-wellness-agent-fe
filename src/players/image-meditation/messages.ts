/** 이미지 + 녹음 명상 문구(PR-21). 재생 중 화면은 listening의 Running을 쓴다. 담당 A. */

import { defineMessages } from "@/i18n/locale";

export const MEDITATION = defineMessages({
  ko: {
    playFailed: "안내 음성을 재생하지 못했어요. 기기 소리가 켜져 있는지 확인해 주세요.",
    loadFailed: "안내 음성을 불러오지 못했어요. 사진을 바라보며 천천히 호흡하거나, '그만하기'로 다른 활동을 고를 수 있어요.",
    noGuide: "준비된 안내 음성이 없어요. 사진을 바라보며 천천히 호흡해 보세요.",
    brightness: "밝기",
    loading: "안내 음성을 불러오고 있어요",
    ready: (minutes: number) => `약 ${minutes}분 · 편한 자세로 앉아 안내를 따라가요`,
    play: "재생하기",
  },
  en: {
    playFailed: "Couldn't play the guide audio. Check that your device sound is on.",
    loadFailed: "Couldn't load the guide audio. Breathe slowly while looking at the photo, or choose 'Stop' to pick another activity.",
    noGuide: "No guide audio is ready. Try breathing slowly while looking at the photo.",
    brightness: "Brightness",
    loading: "Loading the guide audio",
    ready: (minutes) => `About ${minutes} min · sit comfortably and follow the guide`,
    play: "Play",
  },
});
