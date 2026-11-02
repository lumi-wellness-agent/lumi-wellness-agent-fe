"use client";

import { useEffect } from "react";
import { useLocale } from "./use-locale";

/** 화면 언어가 바뀌면 문서 언어(<html lang>)도 따라간다 — 화면 읽기 프로그램의 발음과 글꼴 처리가 맞는다. */
export function LocaleSync() {
  const locale = useLocale();
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);
  return null;
}
