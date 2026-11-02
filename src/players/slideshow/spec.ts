/**
 * content_spec 읽기 도우미 — 슬롯 찾기 · render 값 꺼내기 · 자산을 장면(Slide)으로. 담당 A(TEAM.md).
 *
 * BE는 content_spec의 형을 고정하지 않는다(src/lib/api/types.ts ContentSpec). 그래서 값을 꺼낼 때 형을 확인하고,
 * 없거나 모양이 다르면 기본값을 쓴다. 활동별 숫자를 코드에 박지 않는다 — 기본값은 값이 아예 없을 때만 쓴다.
 */

import type { ActivityAsset, ActivityContent, ContentSlot } from "@/lib/api/types";
import { assetUrl } from "@/lib/api/client";
import type { SlideshowText } from "./messages";

export function findSlot(content: ActivityContent, ...names: string[]): ContentSlot | undefined {
  return content.content_spec.slots?.find((s) => names.includes(s.slot));
}

export function renderOf(slot: ContentSlot | undefined): Record<string, unknown> {
  const render = slot?.render;
  return render && typeof render === "object" ? (render as Record<string, unknown>) : {};
}

export function num(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (value && typeof value === "object" && "default" in value) return num((value as { default: unknown }).default);
  return undefined;
}

export function str(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value : undefined;
}

export function assetsOf(content: ActivityContent, ...slots: string[]): ActivityAsset[] {
  return content.assets.filter((a) => slots.includes(a.slot));
}

/**
 * BE 자산 metadata.content_factor(app/content/factors.tag) — 이 콘텐츠를 무엇으로 골랐는지.
 * source: USER(사용자 칩) · LLM(plan이 고른 값) · DEFAULT. reason은 LLM이 고른 이유 한 문장(LLM일 때만).
 */
export type ContentFactor = { axis: string; value: string; label: string; source: string; reason?: string };

export function factorOf(asset: ActivityAsset): ContentFactor | undefined {
  const raw = asset.metadata.content_factor;
  if (!raw || typeof raw !== "object") return undefined;
  const tag = raw as Record<string, unknown>;
  const [axis, value, label, source] = [str(tag.axis), str(tag.value), str(tag.label_ko), str(tag.source)];
  if (!axis || !value || !label || !source) return undefined;
  return { axis, value, label, source, reason: str(tag.reason) };
}

/**
 * 화면에 보일 장면 하나. 사진 아래 한 줄에 reason(고른 이유 — 좋아하는 풍경 · LUMI가 고른 풍경)을 왼쪽,
 * credit(사진은 작가 · 공급자, 작품은 소장처)을 오른쪽에 둔다.
 */
export type Slide = {
  url: string;
  alt: string;
  credit?: string;
  sourceUrl?: string;
  reason?: string;
};

/**
 * 고른 이유 — 사용자 칩 풍경(metadata.preferred_scenery) > 선호 색 사진(BE mix_color_photos — 4장에 1장꼴) > LLM이 고른
 * Factor. 문장은 지금 언어의 SLIDESHOW가 값(키)으로 만든다(messages.ts).
 */
function reasonOf(asset: ActivityAsset, t: SlideshowText): string | undefined {
  const scenery = str(asset.metadata.preferred_scenery);
  const liked = scenery ? t.likedScenery(scenery) : undefined;
  if (liked) return liked;
  const color = asset.metadata.preferred_color;
  if (color && typeof color === "object") {
    const tag = color as Record<string, unknown>;
    const likedColor = t.likedColor(str(tag.value) ?? "", str(tag.label_ko));
    if (likedColor) return likedColor;
  }
  // 사용자가 좋아한다고 한 것이 아니므로 "좋아하는"을 쓰지 않는다
  const factor = factorOf(asset);
  return factor?.source === "LLM" ? t.picked(factor.axis, factor.value, factor.label) : undefined;
}

export function slidesFrom(content: ActivityContent, t: SlideshowText, ...slots: string[]): Slide[] {
  const fromAssets = assetsOf(content, ...slots).map((a) => ({
    url: assetUrl(a.url),
    alt: a.title ?? t.photoAlt,
    credit: creditOf(a, t),
    sourceUrl: a.source_url ?? undefined,
    reason: reasonOf(a, t),
  }));
  if (fromAssets.length) return fromAssets;
  // 옛 응답 호환 — 자산 대신 주소만 온 경우
  return content.image_urls.map((url) => ({ url: assetUrl(url), alt: t.photoAlt }));
}

/**
 * 사진 아래 오른쪽 출처. 사진은 작가 · 공급자다. 작품(PR-20)은 작가를 작품 정보에 따로 보이므로 소장처만 둔다 —
 * 고른 이유와 한 줄에 들어가야 해서 이용 조건(공개 도메인)은 쓰지 않는다(사진도 Pixabay 이용 조건은 쓰지 않는다).
 */
function creditOf(asset: ActivityAsset, t: SlideshowText): string | undefined {
  const parts = asset.slot === "ARTWORK" ? [providerName(asset.provider, t)] : [asset.creator, providerName(asset.provider, t)];
  return parts.filter(Boolean).join(" · ") || undefined;
}

function providerName(provider: string, t: SlideshowText): string | undefined {
  const names: Record<string, string> = {
    PIXABAY: "Pixabay",
    ART_INSTITUTE_OF_CHICAGO: "Art Institute of Chicago",
    AI_HORDE: t.aiImage,
  };
  return names[provider] ?? undefined;
}
