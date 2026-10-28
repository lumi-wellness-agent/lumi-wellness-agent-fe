/**
 * content_spec 읽기 도우미 — 슬롯 찾기 · render 값 꺼내기 · 자산을 장면(Slide)으로. 담당 A(TEAM.md).
 *
 * BE는 content_spec의 형을 고정하지 않는다(src/lib/api/types.ts ContentSpec). 그래서 값을 꺼낼 때 형을 확인하고,
 * 없거나 모양이 다르면 기본값을 쓴다. 활동별 숫자를 코드에 박지 않는다 — 기본값은 값이 아예 없을 때만 쓴다.
 */

import type { ActivityAsset, ActivityContent, ContentSlot } from "@/lib/api/types";
import { assetUrl } from "@/lib/api/client";

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

/** 화면에 보일 장면 하나. credit은 사진 아래 작은 글씨(작가 · 출처), reason은 고른 이유(좋아하는 풍경 · LUMI가 고른 풍경)다. */
export type Slide = {
  url: string;
  alt: string;
  credit?: string;
  sourceUrl?: string;
  reason?: string;
};

/** BE 자산 metadata.preferred_scenery(app/content/resolver.SCENERY_QUERIES의 키) → 화면 문구. */
const SCENERY_NAMES: Record<string, string> = {
  forest: "숲",
  "lake river": "호수·강",
  sea: "바다",
  mountain: "산",
  flowers: "꽃",
  sky: "하늘",
};

/** LLM이 고른 Factor의 화면 이름 — 사진 · 영상은 풍경, PR-20은 작품. */
const FACTOR_NOUNS: Record<string, string> = { scenery: "풍경", art_subject: "작품" };

function reasonOf(asset: ActivityAsset): string | undefined {
  const scenery = str(asset.metadata.preferred_scenery);
  const name = scenery ? SCENERY_NAMES[scenery] : undefined;
  if (name) return `좋아하는 ${name} 풍경으로 골랐어요`;
  // 사용자가 좋아한다고 한 것이 아니므로 "좋아하는"을 쓰지 않는다
  const factor = factorOf(asset);
  const noun = factor?.source === "LLM" ? FACTOR_NOUNS[factor.axis] : undefined;
  return factor && noun ? `LUMI가 고른 ${factor.label} ${noun}이에요` : undefined;
}

export function slidesFrom(content: ActivityContent, ...slots: string[]): Slide[] {
  const fromAssets = assetsOf(content, ...slots).map((a) => ({
    url: assetUrl(a.url),
    alt: a.title ?? "자연 풍경 사진",
    credit: [a.creator, providerName(a.provider)].filter(Boolean).join(" · ") || undefined,
    sourceUrl: a.source_url ?? undefined,
    reason: reasonOf(a),
  }));
  if (fromAssets.length) return fromAssets;
  // 옛 응답 호환 — 자산 대신 주소만 온 경우
  return content.image_urls.map((url) => ({ url: assetUrl(url), alt: "자연 풍경 사진" }));
}

function providerName(provider: string): string | undefined {
  const names: Record<string, string> = {
    PIXABAY: "Pixabay",
    ART_INSTITUTE_OF_CHICAGO: "Art Institute of Chicago",
    AI_HORDE: "AI 생성 이미지",
  };
  return names[provider] ?? undefined;
}
