/** 자연환경 알아차리기(ReST, PR-10) 문구 — 모드 고르기 · 영상 · 타이머. 대본은 BE content_spec 그대로다. 담당 B. */

import { defineMessages } from "@/i18n/locale";

export const REST = defineMessages({
  ko: {
    specFailed: "활동 안내를 불러오지 못했어요.",
    back: "돌아가기",
    videoSlow: "영상 로딩이 오래 걸려요. 영상 다시 불러오기를 누른 뒤 재시도해 주세요.",
    videoPlayFailed: "영상을 재생하지 못했어요. 영상 다시 불러오기를 누른 뒤 재시도해 주세요.",
    videoLoadFailed: "영상을 불러오지 못했어요. 다시 불러오거나 실제 자연환경 모드를 선택해 주세요.",
    where: "어디에서 자연을 알아차릴까요?",
    modeVideo: "자연 영상으로 하기",
    modeReal: "실제 자연환경에서 하기",
    // 따옴표 양옆이 한글이면 닫는 따옴표 뒤에서도 줄이 바뀌어 다음 줄이 조사로 시작한다 — 버튼 이름과 조사를 한 덩어리로 둔다
    noVideo: (
      <>
        지금은 영상을 준비하지 못했어요. <span className="whitespace-nowrap">&lsquo;실제 자연환경에서 하기&rsquo;로</span> 진행하거나,{" "}
        <span className="whitespace-nowrap">&lsquo;그만하기&rsquo;로</span> 다른 활동을 고를 수 있어요.
      </>
    ),
    videoAlt: "바람에 흔들리는 나무와 잎의 자연 영상",
    loadingVideo: "영상을 불러오고 있어요",
    videoSource: "영상 출처",
    silent: "음성 안내를 사용할 수 없어 화면에 대본을 표시하고 있어요.",
    reload: "영상 다시 불러오기",
    connecting: "영상 연결 중…",
    start: (minutes: number) => `시작하기 · ${minutes}분`,
    remaining: (clock: string) => `남은 시간 ${clock}`,
    lookAround: "화면을 계속 보지 않아도 괜찮아요. 주변의 자연을 편안하게 살펴보세요.",
  },
  en: {
    specFailed: "Couldn't load the activity guide.",
    back: "Go back",
    videoSlow: "The video is taking a long time to load. Tap Reload video, then try again.",
    videoPlayFailed: "Couldn't play the video. Tap Reload video, then try again.",
    videoLoadFailed: "Couldn't load the video. Reload it, or choose the real-nature mode.",
    where: "Where will you notice nature?",
    modeVideo: "Use a nature video",
    modeReal: "Do it in real nature",
    noVideo: (
      <>
        No video is ready right now. Continue with &lsquo;Do it in real nature&rsquo;, or choose &lsquo;Stop&rsquo; to pick another
        activity.
      </>
    ),
    videoAlt: "Nature video of trees and leaves swaying in the wind",
    loadingVideo: "Loading the video",
    videoSource: "Video source",
    silent: "Voice guidance isn't available, so the script is shown on screen.",
    reload: "Reload video",
    connecting: "Connecting the video…",
    start: (minutes) => `Start · ${minutes} min`,
    remaining: (clock) => `Time remaining ${clock}`,
    lookAround: "You don't need to keep looking at the screen. Take in the nature around you.",
  },
});
