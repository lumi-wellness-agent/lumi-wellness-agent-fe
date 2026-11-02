/**
 * 이미지 감상 문구(PR-01 · 03 · 20) — 장면 아래 고른 이유 · 시간 · 버튼. 담당 A(TEAM.md).
 * 고른 이유의 풍경 · 색 · 작품 주제 이름은 BE 자산 메타데이터의 값(키)으로 고른다 — BE의 label_ko는 한국어라 영어
 * 화면에서는 쓰지 않는다. 모르는 값이면 이유 문장을 붙이지 않는다.
 */

import { defineMessages } from "@/i18n/locale";

const KO_SCENERY: Record<string, string> = {
  forest: "숲",
  "lake river": "호수·강",
  sea: "바다",
  mountain: "산",
  flowers: "꽃",
  sky: "하늘",
};
// '좋아하는 ○○'의 영어 — 셀 수 있는 풍경은 복수로 둔다
const EN_LIKED_SCENERY: Record<string, string> = {
  forest: "forests",
  "lake river": "lakes and rivers",
  sea: "the sea",
  mountain: "mountains",
  flowers: "flowers",
  sky: "the sky",
};
const EN_FACTOR: Record<string, string> = {
  forest: "Forest",
  "lake river": "Lake and river",
  sea: "Sea",
  mountain: "Mountain",
  meadow: "Meadow",
  waterscape: "Waterscape",
  landscape: "Landscape",
};
const EN_COLORS: Record<string, string> = {
  green: "green",
  blue: "blue",
  "sky blue": "sky-blue",
  beige: "beige",
  pink: "pink",
  yellow: "yellow",
  purple: "purple",
  black: "black",
  "dark purple": "dark purple",
};
const KO_NOUNS: Record<string, string> = { scenery: "풍경", art_subject: "작품" };
const EN_NOUNS: Record<string, string> = { scenery: "scenery", art_subject: "artwork" };

export const SLIDESHOW = defineMessages({
  ko: {
    /** 사용자가 칩으로 고른 풍경(metadata.preferred_scenery). */
    likedScenery: (value: string) => (KO_SCENERY[value] ? `좋아하는 ${KO_SCENERY[value]} 풍경으로 골랐어요` : undefined),
    /** 선호 색 사진(BE mix_color_photos — 4장에 1장꼴). label은 BE의 label_ko다. */
    likedColor: (value: string, label: string | undefined) => (label ? `좋아하는 ${label} 색감으로 골랐어요` : undefined),
    /** LLM이 고른 Factor — 사용자가 좋아한다고 한 것이 아니므로 "좋아하는"을 쓰지 않는다. */
    picked: (axis: string, value: string, label: string) => (KO_NOUNS[axis] ? `LUMI가 고른 ${label} ${KO_NOUNS[axis]}이에요` : undefined),
    photoAlt: "자연 풍경 사진",
    aiImage: "AI 생성 이미지",
    empty: "사진을 준비하지 못했어요. 이 화면을 바라보며 천천히 쉬어 가세요.",
    failed: "이미지를 불러오지 못했어요. 이 화면을 바라보며 천천히 쉬어 가세요.",
    loading: "사진을 불러오고 있어요",
    loadingArtwork: "작품을 불러오고 있어요",
    remainingLabel: "남은 시간",
    remaining: (clock: string) => `남은 시간 ${clock}`,
    done: "다 봤어요",
    next: "다음으로",
    resume: "이어서 보기",
    pause: "잠깐 멈추기",
  },
  en: {
    likedScenery: (value) => (EN_LIKED_SCENERY[value] ? `Because you like ${EN_LIKED_SCENERY[value]}` : undefined),
    likedColor: (value) => (EN_COLORS[value] ? `Because you like ${EN_COLORS[value]} tones` : undefined),
    picked: (axis, value) => (EN_FACTOR[value] && EN_NOUNS[axis] ? `${EN_FACTOR[value]} ${EN_NOUNS[axis]} picked by LUMI` : undefined),
    photoAlt: "Nature photo",
    aiImage: "AI-generated image",
    empty: "We couldn't get the photos ready. Rest slowly while looking at this screen.",
    failed: "We couldn't load the image. Rest slowly while looking at this screen.",
    loading: "Loading the photos",
    loadingArtwork: "Loading the artwork",
    remainingLabel: "Time remaining",
    remaining: (clock) => `${clock} left`,
    done: "All done",
    next: "Next",
    resume: "Keep watching",
    pause: "Pause",
  },
});

export type SlideshowText = (typeof SLIDESHOW)["ko"];
