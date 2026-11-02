/** 기록 탭 문구 — 페이지 · 달력. 날짜 · 시각은 Intl로 그 언어의 표기를 쓴다. */

import { defineMessages } from "@/i18n/locale";

const KO_TIME = new Intl.DateTimeFormat("ko-KR", { hour: "numeric", minute: "2-digit" }); // 오후 2:12
const EN_TIME = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" }); // 2:12 PM
// 한국어는 year를 넣으면 요일 괄호가 빠져('2025년 12월 24일 수') 다른 해는 연도만 앞에 붙인다
const KO_DAY = new Intl.DateTimeFormat("ko-KR", { month: "long", day: "numeric", weekday: "short" }); // 11월 2일 (월)
const EN_DAY = new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", weekday: "short" }); // Mon, November 2
const EN_DAY_YEAR = new Intl.DateTimeFormat("en-US", { year: "numeric", month: "long", day: "numeric", weekday: "short" });
const KO_MONTH = new Intl.DateTimeFormat("ko-KR", { year: "numeric", month: "long" }); // 2026년 11월
const EN_MONTH = new Intl.DateTimeFormat("en-US", { year: "numeric", month: "long" }); // November 2026
const KO_DAY_NAME = new Intl.DateTimeFormat("ko-KR", { month: "long", day: "numeric", weekday: "long" }); // 11월 2일 월요일
const EN_DAY_NAME = new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", weekday: "long" }); // Monday, November 2

export const RECORDS = defineMessages({
  ko: {
    title: "기록",
    loading: "기록을 불러오고 있어요",
    login: {
      title: "로그인하면 한 활동을 모아 볼 수 있어요",
      guest: "게스트 체험은 기록을 남기지 않아요.",
      quick: "간편 로그인",
    },
    loadFailed: "기록을 불러오지 못했어요.",
    monthFailed: "이 달 기록을 불러오지 못했어요",
    retry: "다시 시도",
    monthLimit: (limit: number) => `이 달은 최근 세션 ${limit}개까지 보여요.`,
    empty: {
      title: "아직 기록이 없어요",
      body: "세션에서 활동을 하나 마치면 여기에 남아요.",
      start: "활동 시작하기",
    },
    dayEmpty: "이 날은 기록이 없어요.",
    noGoal: "목표 없음",
    unfinished: "마치지 않음",
    round: (minutes: number, completed: boolean) => `${minutes}분 · ${completed ? "끝까지 함" : "중간에 멈춤"}`,
    improved: "나아짐",
    unchanged: "그대로",
    compare: "시작할 때와 비교",
    time: (date: Date) => KO_TIME.format(date),
    /** 고른 날의 제목 — 11월 2일 (월), 다른 해는 2025년 11월 2일 (일). */
    dayTitle: (date: Date, otherYear: boolean) =>
      otherYear ? `${date.getFullYear()}년 ${KO_DAY.format(date)}` : KO_DAY.format(date),
    calendar: {
      label: "기록 달력",
      loading: "불러오는 중",
      previous: "이전 달",
      next: "다음 달",
      weekdays: ["일", "월", "화", "수", "목", "금", "토"],
      month: (date: Date) => KO_MONTH.format(date),
      day: (date: Date, count: number) => `${KO_DAY_NAME.format(date)}${count > 0 ? `, 기록 ${count}개` : ""}`,
    },
  },
  en: {
    title: "History",
    loading: "Loading your history",
    login: {
      title: "Sign in to see the activities you've done",
      guest: "Guest trials aren't saved.",
      quick: "Quick sign-in",
    },
    loadFailed: "Couldn't load your history.",
    monthFailed: "Couldn't load this month",
    retry: "Try again",
    monthLimit: (limit) => `Showing the latest ${limit} sessions for this month.`,
    empty: {
      title: "No history yet",
      body: "Finish an activity in a session and it will show up here.",
      start: "Start an activity",
    },
    dayEmpty: "No sessions on this day.",
    noGoal: "No goal",
    unfinished: "Not finished",
    round: (minutes, completed) => `${minutes} min · ${completed ? "Finished" : "Stopped midway"}`,
    improved: "Better",
    unchanged: "No change",
    compare: "Compared with the start",
    time: (date) => EN_TIME.format(date),
    dayTitle: (date, otherYear) => (otherYear ? EN_DAY_YEAR : EN_DAY).format(date),
    calendar: {
      label: "History calendar",
      loading: "Loading",
      previous: "Previous month",
      next: "Next month",
      weekdays: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
      month: (date) => EN_MONTH.format(date),
      day: (date, count) => `${EN_DAY_NAME.format(date)}${count > 0 ? `, ${count} ${count === 1 ? "session" : "sessions"}` : ""}`,
    },
  },
});
