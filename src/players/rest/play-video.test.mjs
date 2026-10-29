import assert from "node:assert/strict";
import test from "node:test";
import { playVideo } from "./play-video.ts";

test("metadata-only video starts directly without a canplay event", async () => {
  let calls = 0;
  const video = { readyState: 1, muted: false, play: () => { calls++; return Promise.resolve(); }, pause: () => {} };
  const promise = playVideo(video, new AbortController().signal);
  assert.equal(calls, 1);
  assert.equal(video.muted, true);
  await promise;
});
test("a never-settling play times out and pauses instead of blocking forever", async () => {
  let pauses = 0;
  const video = { muted: false, play: () => new Promise(() => {}), pause: () => { pauses++; } };
  await assert.rejects(playVideo(video, new AbortController().signal, 10), /VIDEO_START_TIMEOUT/);
  assert.equal(pauses, 1);
});
test("rejected play can be retried", async () => {
  const video = { muted: false, play: () => Promise.reject(new Error("network")), pause: () => {} };
  await assert.rejects(playVideo(video, new AbortController().signal), /VIDEO_START_FAILED/);
  video.play = () => Promise.resolve();
  await playVideo(video, new AbortController().signal);
});
test("leaving cancels pending play and a late result cannot pause a newer retry", async () => {
  let resolveFirst;
  let pauses = 0;
  const controller = new AbortController();
  const video = { muted: false, play: () => new Promise((resolve) => { resolveFirst = resolve; }), pause: () => { pauses++; } };
  const first = playVideo(video, controller.signal);
  controller.abort();
  await assert.rejects(first, /VIDEO_START_CANCELLED/);
  assert.equal(pauses, 1);
  video.play = () => Promise.resolve();
  await playVideo(video, new AbortController().signal);
  resolveFirst();
  await Promise.resolve();
  assert.equal(pauses, 1);
});
