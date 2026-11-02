"use client";

import { LOCALE_NAMES, LOCALES, type Locale } from "@/i18n/locale";
import { setLocale, useLocale, useMessages } from "@/i18n/use-locale";
import { UI } from "./messages";

const SHORT: Record<Locale, string> = { ko: "KO", en: "EN" };

/**
 * 화면 언어 토글 — 시작 화면 오른쪽 위(설정에는 같은 값을 고르는 칩이 있다). 고른 쪽만 칠해 지금 언어를 보인다.
 * 글자는 KO · EN 두 글자라 읽어 줄 이름은 그 언어 자신의 표기(한국어 · English)로 따로 둔다. 칸마다 터치 영역은
 * 48px이다(AGENTS.md). 세션 화면에는 두지 않는다 — 세션 중에는 언어를 바꾸지 않는다.
 */
export function LocaleToggle({ className = "" }: { className?: string }) {
  const locale = useLocale();
  const t = useMessages(UI);
  return (
    <div role="group" aria-label={t.language} className={`flex ${className}`}>
      {LOCALES.map((option) => (
        <button
          key={option}
          type="button"
          aria-pressed={option === locale}
          onClick={() => setLocale(option)}
          className="flex min-h-12 min-w-12 items-center justify-center"
        >
          <span
            aria-hidden
            className={`rounded-full px-2.5 py-1 text-caption font-bold ${option === locale ? "bg-primary-soft text-on-primary-soft" : "text-ink-muted"}`}
          >
            {SHORT[option]}
          </span>
          <span className="sr-only" lang={option}>
            {LOCALE_NAMES[option]}
          </span>
        </button>
      ))}
    </div>
  );
}
