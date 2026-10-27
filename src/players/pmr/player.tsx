"use client";

/**
 * 점진적 근육 이완(PMR) 18부위 — PR-07. 담당 B(TEAM.md).
 *
 * session_ui.component가 BODY_REGION_SEQUENCE다 — 실루엣 위에서 지금 부위를 밝힌다.
 * 화면: session_ui — silhouette_base_color · active_region_color · active_region_window · back_regions · side_labels · phase_labels.
 *   색은 토큰 클래스로만 칠한다(AGENTS.md) — 명세의 색 값은 토큰에 맞춘다.
 * 음성: slots[GUIDE_AUDIO].scripts와 render — regions · phases · seconds_per_region(30초) · progression · session_timing.
 *
 * 지금은 임시 화면(Placeholder)이다. 이 파일의 본문만 바꾸면 세션과 /dev/players 미리보기에 바로 붙는다.
 */

import { Placeholder } from "../placeholder";
import type { PlayerProps } from "../types";

export default function PmrPlayer(props: PlayerProps) {
  return <Placeholder {...props} />;
}
