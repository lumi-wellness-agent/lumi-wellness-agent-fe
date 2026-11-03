// src/session/walk-minutes.ts — 야외 보행 시작 안내의 기본 시간을 고른 시간으로 바꾼다(한국어 · 영어).
import assert from "node:assert/strict";
import { test } from "node:test";

import { withWalkMinutes } from "./walk-minutes.ts";

test("한국어와 영어 안내의 기본 시간(50분)을 고른 시간으로 바꾼다", () => {
  assert.equal(withWalkMinutes("지금부터 야외 자연 보행을 약 50분 동안 합니다.", 20), "지금부터 야외 자연 보행을 약 20분 동안 합니다.");
  assert.equal(withWalkMinutes("약50분 걸어요", 30), "약 30분 걸어요");
  assert.equal(
    withWalkMinutes("For about 50 minutes, you'll take a walk outdoors in nature.", 20),
    "For about 20 minutes, you'll take a walk outdoors in nature.",
  );
  assert.equal(withWalkMinutes(undefined, 20), undefined);
  assert.equal(withWalkMinutes("No duration here.", 20), "No duration here.");
});
