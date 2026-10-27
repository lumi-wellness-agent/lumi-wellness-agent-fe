// src/lib/speech.ts의 순수 함수 — 음성 순서와 대본 자르기. Node가 .ts를 타입만 지우고 바로 읽는다.
import assert from "node:assert/strict";
import { test } from "node:test";

import { PARAGRAPH_PAUSE_MS, SENTENCE_PAUSE_MS, rankKoreanVoices, splitScript } from "./speech.ts";

const voice = (name, lang = "ko-KR") => ({ name, lang });
const names = (voices) => voices.map((v) => v.name);

test("크롬에서는 Google 한국의를 고르고 기계음 계열과 다른 언어는 뺀다", () => {
  const macChrome = [
    voice("Eddy (한국어(대한민국))"),
    voice("Yuna"),
    voice("Samantha", "en-US"),
    voice("Google 한국의"),
  ];
  assert.deepEqual(names(rankKoreanVoices(macChrome)), ["Google 한국의", "Yuna"]);
});

test("Google 한국의가 없으면 엣지 신경망 음성, 그다음 Yuna 순이다", () => {
  const edge = [
    voice("Microsoft Heami - Korean (Korean)"),
    voice("Microsoft SunHi Online (Natural) - Korean (Korea)"),
  ];
  assert.deepEqual(names(rankKoreanVoices(edge)), [
    "Microsoft SunHi Online (Natural) - Korean (Korea)",
    "Microsoft Heami - Korean (Korean)",
  ]);
  assert.deepEqual(names(rankKoreanVoices([voice("Grandma"), voice("Yuna")])), ["Yuna"]);
  // 안드로이드는 lang을 ko_KR로 주기도 한다
  assert.deepEqual(names(rankKoreanVoices([voice("한국어 대한민국", "ko_KR")])), ["한국어 대한민국"]);
});

test("대본은 문장 단위로 자르고 문단 사이를 더 오래 쉰다", () => {
  assert.deepEqual(splitScript("눈을 감으세요. 숨을 쉬세요.\n\n이제 시작합니다."), [
    { text: "눈을 감으세요.", pauseMs: SENTENCE_PAUSE_MS },
    { text: "숨을 쉬세요.", pauseMs: PARAGRAPH_PAUSE_MS },
    { text: "이제 시작합니다.", pauseMs: 0 },
  ]);
});

test("문단 안의 줄바꿈은 공백으로 보고 0.5초 같은 숫자에서는 자르지 않는다", () => {
  const chunks = splitScript("코로 들이쉬세요.\n입으로 0.5초 내쉬세요.\n\n\n");
  assert.deepEqual(
    chunks.map((c) => c.text),
    ["코로 들이쉬세요.", "입으로 0.5초 내쉬세요."],
  );
  assert.equal(chunks.at(-1).pauseMs, 0);
});
