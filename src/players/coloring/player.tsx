"use client";

/**
 * 컬러링 — PR-14 만다라 · PR-15 자연 도안 3–5분. 담당 C(TEAM.md).
 *
 * 자산: slot COLORING_TEMPLATE — 검수 도안 SVG(PR-14 6개 · PR-15 5개, BE /assets/coloring/…). url은 assetUrl()로.
 *   metadata — region_attribute(data-region-id) · region_count · outline_id · view_box. 칠할 영역은 data-region-id로 찾는다.
 * 화면: session_ui — palette · state · storage · timer · completion_rule(PR-14), eraser · progress · recommended_duration_seconds(PR-15).
 * PR-15는 끝나면 호스트가 NOTICE 팝업을 띄운다. 도안 원본의 출처·라이선스는 확인 중이다(BE TEAM.md).
 *
 * 지금은 임시 화면(Placeholder)이다. 이 파일의 본문만 바꾸면 세션과 /dev/players 미리보기에 바로 붙는다.
 */

import { Placeholder } from "../placeholder";
import type { PlayerProps } from "../types";

export default function ColoringPlayer(props: PlayerProps) {
  return <Placeholder {...props} />;
}
