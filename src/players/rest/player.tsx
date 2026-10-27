"use client";

/**
 * 자연환경 알아차리기 20분(ReST 참고) — PR-10. 담당 B(TEAM.md).
 *
 * 화면: session_ui — video_mode · real_nature_mode · timer_format · timer_initial_seconds · completion_sound · controls,
 *   content_spec.session_modes(영상으로 보기 · 실제 자연에서 하기).
 * 음성: slots[GUIDE_AUDIO].scripts · render.cues(guided-timer와 같은 방식). 영상: slots[VISUAL_VIDEO].render(video_mode_only · loop).
 * 음성 안내 시점 처리는 guided-timer와 같으니 그쪽 훅을 가져다 쓴다.
 *
 * 지금은 임시 화면(Placeholder)이다. 이 파일의 본문만 바꾸면 세션과 /dev/players 미리보기에 바로 붙는다.
 */

import { Placeholder } from "../placeholder";
import type { PlayerProps } from "../types";

export default function RestPlayer(props: PlayerProps) {
  return <Placeholder {...props} />;
}
