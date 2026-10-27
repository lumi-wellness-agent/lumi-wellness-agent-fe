"use client";

/**
 * 소리·영상 감상 — PR-02 자연 영상 + 자연음 · PR-04 자연음 · PR-05 이완 음악. 담당 A(TEAM.md).
 *
 * 자산: VISUAL_VIDEO · SOUNDSCAPE(PR-02), SOUNDSCAPE(PR-04), MUSIC(PR-05 — 검수 음원 3곡, metadata.is_default).
 * 재생: render — duration_seconds · fade_in_seconds · fade_out_seconds · loop · volume, PR-05 start_seconds · stop_seconds,
 *   PR-02 영상 autoplay · controls · reduce_motion. 출처 표시는 slots[].attribution.
 * iOS는 사용자가 누른 순간에 play()를 불러야 소리가 난다 — 플레이어 안의 재생 버튼에서 시작한다.
 *
 * 지금은 임시 화면(Placeholder)이다. 이 파일의 본문만 바꾸면 세션과 /dev/players 미리보기에 바로 붙는다.
 */

import { Placeholder } from "../placeholder";
import type { PlayerProps } from "../types";

export default function ListeningPlayer(props: PlayerProps) {
  return <Placeholder {...props} />;
}
