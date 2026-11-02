/**
 * 오류 문장. 한국어 화면은 오류가 들고 온 문장을 그대로 보인다 — BE · API 클라이언트 · 로그인이 한국어로 쓴 문장이
 * 이 표보다 자세하다(STEP_MISMATCH의 단계 이름 등). 영어 화면은 코드(BE README 「오류」 표 · src/lib/api/client.ts)로
 * 문장을 고르고, 코드가 없는 오류는 문장에 한글이 없을 때만(Supabase 등 영어 메시지) 그대로 보인다.
 */

import type { Locale } from "./locale";

const HANGUL = /[가-힣]/;

const EN_BY_CODE: Record<string, string> = {
  UNAUTHENTICATED: "You need to sign in.",
  INVALID_TOKEN: "Your sign-in has expired or doesn't match. Please sign in again.",
  SESSION_REVOKED: "You've signed out or this account was deleted. Please sign in again.",
  CONSENT_REQUIRED: "Please agree to session records first.",
  MEMBERS_ONLY: "Guest trials aren't recorded. Sign in to see your history.",
  INVALID_RANGE: "The date range isn't valid.",
  SESSION_NOT_FOUND: "We couldn't find this session.",
  SESSION_EXPIRED: "This session was idle for too long. Please start a new one.",
  STEP_MISMATCH: "This step has already moved on.",
  INVALID_ANSWER: "Some answers are missing or out of range.",
  PLAN_REJECTED: "We couldn't put an activity together.",
  LLM_UNAVAILABLE: "The recommendation model isn't responding right now.",
  AGENT_UNAVAILABLE: "The session service isn't ready.",
  AUTH_UNAVAILABLE: "We couldn't check your sign-in right now.",
  INTERNAL: "Something went wrong on the server.",
  NETWORK: "Couldn't reach the server. Please check your internet connection.",
  STREAM_CLOSED: "The response was cut off.",
  VALIDATION: "The request didn't match the expected format.",
};

const EN_SERVER = "Something went wrong on the server.";

/** 화면에 보일 오류 문장. fallback은 그 화면의 '…하지 못했어요' 문장(지금 언어)이다. */
export function errorText(error: unknown, locale: Locale, fallback: string): string {
  const message = error instanceof Error ? error.message : "";
  if (locale === "ko") return message || fallback;
  const code = typeof error === "object" && error !== null && "code" in error ? String(error.code) : "";
  if (code in EN_BY_CODE) return EN_BY_CODE[code];
  if (code.startsWith("HTTP_")) return EN_SERVER;
  return message && !HANGUL.test(message) ? message : fallback;
}
