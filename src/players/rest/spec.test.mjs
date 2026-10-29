import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { parseRest, cueAt, clock } from "./spec.ts";
const fixture = JSON.parse(readFileSync(new URL("../../fixtures/run/PR-10.json", import.meta.url), "utf8"));
test("BE schedule covers both modes and elapsed boundaries", () => {
  const spec = parseRest(fixture.content.content_spec);
  assert.equal(spec.seconds, 1200);
  assert.equal(spec.cues.length, 14);
  assert.equal(spec.modes.length, 2);
  assert.equal(spec.loop, true);
  assert.equal(cueAt(spec.cues, 0).id, "START");
  assert.equal(cueAt(spec.cues, 89.9).id, "START");
  assert.equal(cueAt(spec.cues, 90).id, "BODY");
  assert.equal(cueAt(spec.cues, 1085).id, "RETURN");
  assert.equal(cueAt(spec.cues, 1160).id, "END");
  assert.equal(clock(1200), "20:00");
  assert.equal(clock(-2), "00:00");
});
test("missing scripts, duplicate times and cues beyond activity are rejected", () => {
  for (const mutate of [
    (s) => { s.slots[0].scripts = []; },
    (s) => { s.slots[0].render.cues[1].elapsed_seconds = 0; },
    (s) => { s.slots[0].render.cues[1].elapsed_seconds = 1200; },
  ]) {
    const spec = structuredClone(fixture.content.content_spec);
    mutate(spec);
    assert.equal(parseRest(spec), null);
  }
});
