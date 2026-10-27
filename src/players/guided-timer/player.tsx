"use client";

/**
 * 원형 타이머 음성 안내 — PR-06 주기적 한숨 호흡 · PR-08 유도 심상 · PR-09 마음챙김 · PR-22 사진 보며 호흡. 담당 B(TEAM.md).
 *
 * 네 활동의 content_spec.session_ui.component가 모두 CIRCULAR_SESSION_TIMER다 — 한 컴포넌트로 만든다.
 * 화면: session_ui — timer · controls · completion · status, PR-06 · 22 center_orb · outer_wave, PR-08 · 09 imagery_image_or_video.
 * 음성: slots[GUIDE_AUDIO].scripts(대본)와 render.cues(재생 시점) · before_timer · silence_between_cues.
 *   speech.ts — 화면을 열 때 loadVoices(), 시점마다 speakScript(text), 멈추면 cancelSpeech(). source_policy.tts가 FORBIDDEN이면 읽지 않는다.
 * 종료음: render.countdown_sound · completion_sound — tone.ts의 playTone()(시작 버튼에서 호스트가 unlockTone()을 불렀다).
 * PR-22 배경 사진(VISUAL_STILL count · seconds_each)은 slideshow(A)의 사진 넘김을 쓴다. PR-09는 끝나면 NOTICE가 이어진다.
 *
 * 지금은 임시 화면(Placeholder)이다. 이 파일의 본문만 바꾸면 세션과 /dev/players 미리보기에 바로 붙는다.
 */

import { Placeholder } from "../placeholder";
import type { PlayerProps } from "../types";

export default function GuidedTimerPlayer(props: PlayerProps) {
  return <Placeholder {...props} />;
}
