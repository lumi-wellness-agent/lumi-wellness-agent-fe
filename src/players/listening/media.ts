/**
 * 소리 · 영상 도우미 — 음량 페이드 · 안전 상한 · 출처 표기. 담당 A(TEAM.md).
 *
 * iOS 사파리는 스크립트로 음량(volume)을 바꾸지 못한다(항상 1). 그래서 페이드와 음량 막대는 안드로이드 · 데스크톱에서만
 * 효과가 있고, iOS에서는 기기 음량 버튼으로 조절한다고 안내한다(canSetVolume).
 */

import type { ActivityAsset } from "@/lib/api/types";
import { str } from "../slideshow/spec";

/** 명세 render.volume "사용자 조절, 안전 상한 적용" — 막대 끝을 최대 음량의 80%로 둔다. */
export const MAX_VOLUME = 0.8;
export const DEFAULT_VOLUME = 0.5;

/** el의 음량을 seconds 동안 to까지 바꾼다. 돌려준 함수를 부르면 멈춘다. */
export function fadeVolume(el: HTMLMediaElement, to: number, seconds: number): () => void {
  const target = Math.max(0, Math.min(1, to));
  if (seconds <= 0) {
    el.volume = target;
    return () => {};
  }
  const from = el.volume;
  const started = performance.now();
  const timer = setInterval(() => {
    const t = Math.min(1, (performance.now() - started) / (seconds * 1000));
    el.volume = from + (target - from) * t;
    if (t >= 1) clearInterval(timer);
  }, 50);
  return () => clearInterval(timer);
}

/** 스크립트로 음량을 바꿀 수 있는 브라우저인가(iOS는 아니다). */
export function canSetVolume(): boolean {
  if (typeof document === "undefined") return true;
  const probe = document.createElement("audio");
  probe.volume = 0.5;
  return probe.volume === 0.5;
}

/** 자산 길이(초) — Freesound duration_seconds · 음원 playback_duration_seconds · 영상 source_duration_seconds. */
export function durationOf(asset: ActivityAsset): number | undefined {
  const m = asset.metadata;
  for (const key of ["playback_duration_seconds", "duration_seconds", "source_duration_seconds"]) {
    const v = m[key];
    if (typeof v === "number" && v > 0) return v;
  }
  return undefined;
}

/** 출처 한 줄 — 제목 · 만든 사람(작곡가) · 공급자 · 라이선스. CC BY 계열은 표기가 조건이라 꼭 보인다. */
export function creditOf(asset: ActivityAsset): { text: string; href?: string; license?: string; licenseHref?: string } {
  const composer = str(asset.metadata.composer);
  const provider: Record<string, string> = { PIXABAY: "Pixabay", FREESOUND: "Freesound", CURATED_ASSET_LIBRARY: "LUMI 검수 음원" };
  const parts = [asset.title, composer ?? asset.creator, provider[asset.provider]].filter(Boolean);
  return {
    text: parts.join(" · "),
    href: asset.source_url ?? undefined,
    license: asset.license ?? undefined,
    licenseHref: str(asset.metadata.license_url),
  };
}
