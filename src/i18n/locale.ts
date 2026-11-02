/**
 * 화면 언어 — 한국어(기본)와 영어. 화면에 박힌 문구(버튼 · 안내 · 코드 값의 이름)만 바뀌고, BE가 보내는 질문 ·
 * 측정 문항 · 활동 대본 · 추천 이유는 BE가 정한 언어 그대로다(지금은 한국어).
 *
 * - 고른 언어는 이 브라우저에 남는다(use-locale.ts). 고른 적이 없으면 브라우저가 알려 주는 선호 언어로 정한다 —
 *   한국어면 한국어, 그 밖은 영어. 접속 국가는 보지 않는다.
 * - 문구는 쓰는 곳 옆의 messages 파일에 한국어와 영어를 나란히 둔다(defineMessages). 한국어가 기준 모양이라 영어에
 *   키를 빠뜨리거나 더하면 타입 검사(npm run typecheck)에서 걸린다.
 *
 * 이 파일은 브라우저 · React 없이 돈다(locale.test.mjs). 저장소와 훅은 use-locale.ts가 맡는다.
 */

export const LOCALES = ["ko", "en"] as const;

export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "ko";

/** 고른 언어를 남기는 localStorage 키. */
export const LOCALE_KEY = "lumi:locale";

/** 날짜 · 시각 표기(Intl.DateTimeFormat)의 언어 태그. */
export const INTL_LOCALE: Record<Locale, string> = { ko: "ko-KR", en: "en-US" };

/** 언어 이름 — 늘 그 언어 자신의 표기로 적는다(토글이 읽어 주는 이름 · 설정의 보기). */
export const LOCALE_NAMES: Record<Locale, string> = { ko: "한국어", en: "English" };

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}

/**
 * 고른 적이 없는 사람의 첫 화면 언어. 1차 서브태그만 본다 — ko · ko-KR · ko-Kore-KR이 모두 한국어이고,
 * startsWith("ko")로 자르면 kok(콘칸어)까지 한국어가 된다. 지원 언어가 둘이라 한국어가 아니면 영어다.
 */
export function browserLocale(language: string | null | undefined): Locale {
  if (!language) return DEFAULT_LOCALE;
  return language.split("-")[0].toLowerCase() === "ko" ? "ko" : "en";
}

/** 언어마다 같은 모양의 문구 묶음. */
export type Messages<T> = Readonly<Record<Locale, T>>;

/**
 * 문구 묶음을 만든다. 모양은 ko에서만 짐작하고(NoInfer) en은 그 모양 그대로여야 한다 — 영어에 키가 없거나 남으면
 * 타입 오류다. 코드 값으로 찾는 표는 `satisfies Record<코드, string>`으로 적어 키를 고정한다.
 */
export function defineMessages<T>(messages: { ko: T; en: NoInfer<T> }): Messages<T> {
  return messages;
}

/** 코드 값 → 이름. 표에 없는 값(BE가 새로 더한 코드)은 코드 그대로 보인다. */
export function nameOf(table: Readonly<Record<string, string>>, key: string): string {
  return table[key] ?? key;
}
