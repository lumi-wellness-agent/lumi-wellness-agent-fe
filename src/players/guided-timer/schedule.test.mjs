import assert from "node:assert/strict";
import { test } from "node:test";

import { normalizeCues } from "./schedule.ts";

test("PR-08 and PR-09 elapsed-time cues remain at their elapsed seconds", () => {
  assert.deepEqual(
    normalizeCues(
      [
        { elapsed_seconds: 0, script_id: "START" },
        { elapsed_seconds: 80, script_id: "PLACE" },
      ],
      1200,
    ),
    [
      { elapsed_seconds: 0, script_id: "START" },
      { elapsed_seconds: 80, script_id: "PLACE" },
    ],
  );
});

test("PR-06 and PR-22 remaining-time cues become elapsed-time cues", () => {
  assert.deepEqual(
    normalizeCues(
      [
        { remaining_seconds: 180, script_id: "REMAINING_180" },
        { remaining_seconds: 0, script_id: "END" },
      ],
      300,
    ),
    [
      { elapsed_seconds: 120, script_id: "REMAINING_180" },
      { elapsed_seconds: 300, script_id: "END" },
    ],
  );
});

test("out-of-range and malformed cues are ignored", () => {
  assert.deepEqual(
    normalizeCues(
      [
        { elapsed_seconds: -1, script_id: "BEFORE" },
        { remaining_seconds: 400, script_id: "AFTER" },
        { elapsed_seconds: 1, script_id: 2 },
      ],
      300,
    ),
    [],
  );
});
