"use client";

/**
 * 글쓰기 — PR-18 강렬한 긍정 경험 글쓰기 20분 · PR-19 세 가지 좋은 일 기록. 담당 C(TEAM.md).
 *
 * 화면: session_ui — prompt · input · timer · persistence · privacy(PR-18), entry · date · challenge(PR-19).
 * 문구: slots[WRITING_PROMPT].scripts. PR-18 지시문은 E14 실험 조건 지시문을 옮긴 것이다(한국어 문구 검수 중).
 * 쓴 글은 서버로 보내지 않는다(SessionReport에 칸이 없다) — 기기에만 둘지, 지울지는 session_ui.privacy를 따른다.
 *
 * 지금은 임시 화면(Placeholder)이다. 이 파일의 본문만 바꾸면 세션과 /dev/players 미리보기에 바로 붙는다.
 */

import { Placeholder } from "../placeholder";
import type { PlayerProps } from "../types";

export default function WritingPlayer(props: PlayerProps) {
  return <Placeholder {...props} />;
}
