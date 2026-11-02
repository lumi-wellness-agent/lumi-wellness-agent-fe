/** 공통 컨트롤(src/ui/) 문구. 탭 이름 · 로그인 버튼 이름은 화면에 쓰지 않고 aria-label로만 읽힌다. */

import { defineMessages } from "@/i18n/locale";

export const UI = defineMessages({
  ko: {
    language: "언어",
    tabNav: "주요 화면",
    tabs: { home: "메인", records: "기록", settings: "설정" },
    // 카카오 문구는 가이드의 완성형 이름이라 바꾸지 않는다(AGENTS.md)
    login: { google: "Google로 로그인", kakao: "카카오 로그인" },
  },
  en: {
    language: "Language",
    tabNav: "Main screens",
    tabs: { home: "Home", records: "History", settings: "Settings" },
    // 각 사 가이드의 영어 버튼 문구
    login: { google: "Sign in with Google", kakao: "Login with Kakao" },
  },
});
