import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { parsePmr, positionAt, skipDelta } from "./timeline.ts";

const spec = JSON.parse(readFileSync(new URL("../../fixtures/run/PR-07.json", import.meta.url), "utf8")).content.content_spec;
const timeline = parsePmr(spec);

test("BE PMR fixture supplies all region scripts and a coherent activity duration", () => {
  assert.ok(timeline);
  assert.equal(timeline.regions.length, 18);
  assert.equal(timeline.total, 540);
  assert.equal(timeline.regions[0].id, "RIGHT_HAND_FOREARM");
  assert.equal(timeline.regions.at(-1).id, "LEFT_FOOT");
});

test("phase boundaries release tension on time and reset for the next region", () => {
  const phaseAt = seconds => timeline.phases[positionAt(timeline, seconds).phaseIndex].phase;
  assert.equal(phaseAt(9.99), "INSTRUCTION");
  assert.equal(phaseAt(10), "TENSE");
  assert.equal(phaseAt(14.99), "TENSE");
  assert.equal(phaseAt(15), "RELAX");
  assert.equal(phaseAt(25), "TRANSITION");
  assert.equal(positionAt(timeline, 30).regionIndex, 1);
  assert.equal(phaseAt(30), "INSTRUCTION");
  // A delayed timer observes the current phase, never a stale tension phase.
  assert.equal(phaseAt(19), "RELAX");
});

test("skipping advances exactly one region and skipping the last reaches completion", () => {
  assert.equal(12 + skipDelta(timeline, 12), 30);
  assert.equal(30 + skipDelta(timeline, 30), 60);
  const end = 533 + skipDelta(timeline, 533);
  assert.equal(end, 540);
  assert.equal(positionAt(timeline, end).done, true);
  assert.equal(positionAt(timeline, 1000).remaining, 0);
});

test("missing scripts and overlapping phases prevent an executable timeline", () => {
  const missing = structuredClone(spec);
  missing.slots[0].scripts.region_scripts.pop();
  assert.equal(parsePmr(missing), null);
  const overlap = structuredClone(spec);
  overlap.slots[0].render.phases[1].start_seconds = 9;
  assert.equal(parsePmr(overlap), null);
});
