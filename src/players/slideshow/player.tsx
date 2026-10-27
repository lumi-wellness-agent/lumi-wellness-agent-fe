"use client";

/**
 * 이미지 감상 — PR-01 자연 사진 · PR-03 스트레스 전 자연 장면 · PR-20 온라인 예술 감상. 담당 A(TEAM.md).
 *
 * 자산: content.assets 중 slot VISUAL_STILL(PR-01 · 03) · ARTWORK(PR-20). url은 assetUrl()로 감싼다.
 * 재생: content_spec.slots[].render — PR-01 count · seconds_each · transition · pan_zoom, PR-03 duration_minutes,
 *   PR-20 duration_seconds · iiif_size · zoom · show_metadata(작품 정보와 attribution을 보여 준다).
 * PR-01은 끝나면 호스트가 NOTICE 팝업을 띄운다 — 이 플레이어는 onFinish({ completed: true })만 부른다.
 * 사진 넘김은 PR-21(이미지 + 명상) · PR-22(B, 사진 보며 호흡)도 쓰므로 컴포넌트로 따로 꺼내 둔다.
 *
 * 지금은 임시 화면(Placeholder)이다. 이 파일의 본문만 바꾸면 세션과 /dev/players 미리보기에 바로 붙는다.
 */

import { Placeholder } from "../placeholder";
import type { PlayerProps } from "../types";

export default function SlideshowPlayer(props: PlayerProps) {
  return <Placeholder {...props} />;
}
