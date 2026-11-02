"use client";

/**
 * 지금 화면 언어(src/i18n/locale.ts). 고른 값은 React 밖(localStorage)에 있어 외부 저장소로 다룬다.
 *
 * - 고른 값이 언제나 이기고, 고른 적이 없을 때만 브라우저 선호 언어로 정한다.
 * - 서버 렌더와 첫 hydration은 늘 한국어로 그리고, 화면이 붙은 뒤 고른 언어로 한 번 다시 그린다 — 영어를 고른
 *   사람은 첫 한 프레임만 한국어를 본다(쿠키로 서버가 알게 하면 정적 페이지를 잃는다).
 * - 저장이 막힌 브라우저(사생활 보호 모드 등)에서도 이번 방문 동안은 고른 값이 남도록 메모리에도 들고 있는다.
 * - 다른 탭에서 바꾸면 storage 이벤트로 따라간다.
 */

import { useSyncExternalStore } from "react";
import { browserLocale, DEFAULT_LOCALE, isLocale, LOCALE_KEY, type Locale, type Messages } from "./locale";

let current: Locale | null = null;
const listeners = new Set<() => void>();

function stored(): Locale | null {
  try {
    const value = window.localStorage.getItem(LOCALE_KEY);
    return isLocale(value) ? value : null;
  } catch {
    return null;
  }
}

function read(): Locale {
  return stored() ?? browserLocale(window.navigator.language);
}

function subscribe(onChange: () => void): () => void {
  listeners.add(onChange);
  const onStorage = (event: StorageEvent) => {
    if (event.key !== null && event.key !== LOCALE_KEY) return;
    current = read();
    onChange();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onStorage);
  };
}

/** 같은 값을 계속 돌려줘야 해서 한 번 읽은 뒤에는 메모리 값을 쓴다. */
function snapshot(): Locale {
  current ??= read();
  return current;
}

const serverSnapshot = (): Locale => DEFAULT_LOCALE;

/** 화면 언어를 고른다. 이 브라우저에 남기고 열려 있는 화면을 모두 다시 그린다. */
export function setLocale(next: Locale): void {
  current = next;
  try {
    window.localStorage.setItem(LOCALE_KEY, next);
  } catch {
    // 저장이 막혀 있어도 이번 방문에는 바뀐 채로 쓴다
  }
  for (const listener of listeners) listener();
}

export function useLocale(): Locale {
  return useSyncExternalStore(subscribe, snapshot, serverSnapshot);
}

/** 쓰는 곳의 문구 묶음에서 지금 언어의 것. */
export function useMessages<T>(messages: Messages<T>): T {
  return messages[useLocale()];
}
