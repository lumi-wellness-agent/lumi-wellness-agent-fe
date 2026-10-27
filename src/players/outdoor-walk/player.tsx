"use client";

/**
 * 야외 걷기 — PR-11 야외 자연 보행 · PR-12 걷기 + 좋은 것 3가지 알아차리기. 담당 C(TEAM.md).
 *
 * 시작 전 안전 확인: session_ui.safety_check. 시간: duration_options · duration_selection(PR-11) · duration_input.
 * 화면: session_ui — timer · stop_policy · self_report · post_activity_report · state_model, PR-12 noticing · voice_guide · completion_rules.
 * 음성: session_ui.tts_policy대로 speechSynthesis로 읽는다. 문구: slots[OUTDOOR_TASK].scripts, PR-12 slots[WRITING_PROMPT].
 * 화면을 끄거나 앱을 벗어나도 시간이 맞도록 시작 시각을 기준으로 잰다(clock_policy).
 *
 * 지금은 임시 화면(Placeholder)이다. 이 파일의 본문만 바꾸면 세션과 /dev/players 미리보기에 바로 붙는다.
 */

import { Placeholder } from "../placeholder";
import type { PlayerProps } from "../types";

export default function OutdoorWalkPlayer(props: PlayerProps) {
  return <Placeholder {...props} />;
}
