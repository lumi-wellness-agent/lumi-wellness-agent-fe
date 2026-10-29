import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { groundReducer, initialGroundState, parseGrounding } from "./sequence.ts";
const fixture = JSON.parse(readFileSync(new URL("../../fixtures/run/PR-17.json", import.meta.url), "utf8"));
test("BE order is five senses with no timer or answer requirement", () => {
  const spec = parseGrounding(fixture.content.content_spec);
  assert.deepEqual(spec.stages.map((s) => [s.id, s.count]), [
    ["SEE", 5], ["TOUCH", 4], ["HEAR", 3], ["SMELL", 2], ["TASTE", 1],
  ]);
  assert.ok(spec.intro);
  assert.ok(spec.end);
});
test("only user actions move the sequence; skips are retained at the end", () => {
  let state = initialGroundState;
  assert.equal(state.phase, "intro");
  assert.equal(state.index, 0);
  assert.deepEqual(groundReducer(state, { type: "NEXT", total: 5 }), state);
  assert.deepEqual(groundReducer(state, { type: "INTRO_DONE" }), state);
  assert.deepEqual(groundReducer(state, { type: "SKIP", total: 5 }), state);
  state = groundReducer(state, { type: "INTRO_DONE" });
  assert.equal(state.phase, "active");
  state = groundReducer(state, { type: "NEXT", total: 5 });
  state = groundReducer(state, { type: "SKIP", total: 5 });
  assert.equal(state.index, 2);
  assert.deepEqual(state.skipped, [1]);
  for (let i = 0; i < 3; i++) state = groundReducer(state, { type: "NEXT", total: 5 });
  assert.equal(state.phase, "end");
  assert.deepEqual(state.skipped, [1]);
  assert.deepEqual(groundReducer(state, { type: "NEXT", total: 5 }), state);
});
test("invalid or duplicate stages are rejected", () => {
  for (const mutate of [
    (s) => { s.slots[0].render.stages = ["SEE", "SEE"]; },
    (s) => { s.slots[0].scripts = []; },
    (s) => { s.slots[0].scripts.find((v) => v.id === "SEE").target_count = -1; },
  ]) {
    const spec = structuredClone(fixture.content.content_spec);
    mutate(spec);
    assert.equal(parseGrounding(spec), null);
  }
});
