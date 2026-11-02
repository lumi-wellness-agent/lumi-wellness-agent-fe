import assert from "node:assert/strict";
import { test } from "node:test";

import { errorText } from "./errors.ts";
import { browserLocale, defineMessages, isLocale, nameOf } from "./locale.ts";

test("browser language picks Korean only for the ko primary subtag", () => {
  for (const tag of ["ko", "ko-KR", "KO-kr", "ko-Kore-KR"]) assert.equal(browserLocale(tag), "ko");
  for (const tag of ["en-US", "en", "ja-JP", "kok-IN", "zh-Hans"]) assert.equal(browserLocale(tag), "en");
  assert.equal(browserLocale(undefined), "ko"); // 서버 렌더 · 언어를 모르는 브라우저는 기본 언어
  assert.equal(browserLocale(""), "ko");
});

test("only the two supported locales are accepted", () => {
  assert.equal(isLocale("ko"), true);
  assert.equal(isLocale("en"), true);
  for (const value of ["EN", "en-US", "", null, undefined, 1]) assert.equal(isLocale(value), false);
});

test("defineMessages keeps both languages and nameOf falls back to the code", () => {
  const labels = defineMessages({ ko: { goals: { S1: "반추" } }, en: { goals: { S1: "Rumination" } } });
  assert.equal(labels.en.goals.S1, "Rumination");
  assert.equal(nameOf(labels.ko.goals, "S1"), "반추");
  assert.equal(nameOf(labels.ko.goals, "S9"), "S9");
});

test("error text: Korean keeps the original message, English picks by code", () => {
  const apiError = Object.assign(new Error("세션이 없습니다."), { code: "SESSION_NOT_FOUND" });
  assert.equal(errorText(apiError, "ko", "실패"), "세션이 없습니다.");
  assert.equal(errorText(apiError, "en", "Failed"), "We couldn't find this session.");
  const http = Object.assign(new Error("서버 오류가 났어요."), { code: "HTTP_502" });
  assert.equal(errorText(http, "en", "Failed"), "Something went wrong on the server.");
  assert.equal(errorText(new Error("게스트로 시작하지 못했습니다."), "en", "Couldn't start."), "Couldn't start.");
  assert.equal(errorText(new Error("Invalid login credentials"), "en", "Failed"), "Invalid login credentials");
  assert.equal(errorText("nope", "ko", "실패"), "실패");
});
