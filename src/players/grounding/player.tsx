"use client";

/**
 * 오감 그라운딩(5-4-3-2-1) — PR-17. 담당 B(TEAM.md).
 *
 * 화면: session_ui — current_stage_and_count · answer_entry · eye_closing_optional · timer_limit · controls · completion_reporting.
 * 진행: slots[GUIDE_AUDIO].render — stages · timing_mode · next · skip · hard_time_limit(시간으로 끝내지 않는다).
 * 적은 답은 서버로 보내지 않는다(SessionReport에 칸이 없다).
 *
 * 지금은 임시 화면(Placeholder)이다. 이 파일의 본문만 바꾸면 세션과 /dev/players 미리보기에 바로 붙는다.
 */

import { Placeholder } from "../placeholder";
import type { PlayerProps } from "../types";

export default function GroundingPlayer(props: PlayerProps) {
  return <Placeholder {...props} />;
}
