// src/session/intake/label-width.ts — 보기 문구의 화면 폭(한글 두 칸)으로 한 줄에 나란히 놓을지 정한다.
import assert from "node:assert/strict";
import { test } from "node:test";

import { isShortLabel, labelWidth } from "./label-width.ts";

test("한글은 두 칸, 그 밖은 한 칸으로 센다", () => {
  assert.equal(labelWidth("있어요"), 6);
  assert.equal(labelWidth("20분 이상"), 9);
  assert.equal(labelWidth("I have them"), 11);
});

test("환경 칩의 이어폰 · 시간 보기는 두 언어 모두 짧고, 장소 보기는 길다", () => {
  for (const label of ["있어요", "없어요", "3분", "20분 이상", "잘 모르겠어요"]) assert.ok(isShortLabel(label), label);
  for (const label of ["I have them", "I don't", "3 min", "20 min or more"]) assert.ok(isShortLabel(label), label);
  for (const label of ["집이나 혼자 있는 방", "밖에 나갈 수 있어요", "At home or in a room by myself", "I can go outside"]) {
    assert.ok(!isShortLabel(label), label);
  }
});
