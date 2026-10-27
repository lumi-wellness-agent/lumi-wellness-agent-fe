"use client";

/**
 * 이미지 + 녹음 명상 — PR-21 실내 자연 이미지 + 약 16분 명상. 담당 A(TEAM.md).
 *
 * 자산: VISUAL_STILL(사진) + GUIDE_AUDIO(녹음 음원 /assets/audio/pr21 — 안내 음성 가운데 유일한 녹음본).
 * 재생: render — VISUAL_STILL brightness · duration_seconds · mode · pan_zoom · transition,
 *   GUIDE_AUDIO autoplay · captions · duration_seconds · playback_rate.
 * 사진 넘김은 slideshow 플레이어의 것을 가져다 쓴다. 끝나면 호스트가 NOTICE 팝업을 띄운다.
 *
 * 지금은 임시 화면(Placeholder)이다. 이 파일의 본문만 바꾸면 세션과 /dev/players 미리보기에 바로 붙는다.
 */

import { Placeholder } from "../placeholder";
import type { PlayerProps } from "../types";

export default function ImageMeditationPlayer(props: PlayerProps) {
  return <Placeholder {...props} />;
}
