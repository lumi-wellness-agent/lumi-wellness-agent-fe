import assert from "node:assert/strict";
import { test } from "node:test";

import { keyedCache } from "./keyed-cache.ts";

function deferred() {
  let resolve;
  const promise = new Promise((res) => {
    resolve = res;
  });
  return { promise, resolve };
}

test("a pending request is shared and its value is saved under that key", async () => {
  const calls = [];
  const reply = deferred();
  const cache = keyedCache((key) => {
    calls.push(key);
    return reply.promise;
  });
  const first = cache.load("u1");
  const second = cache.load("u1"); // 미리 받기가 가는 중에 기록 탭이 열렸다
  assert.equal(first, second);
  assert.deepEqual(calls, ["u1"]);
  reply.resolve(["s1"]);
  assert.deepEqual(await first, ["s1"]);
  assert.deepEqual(cache.saved("u1"), ["s1"]);
  assert.equal(cache.saved("u2"), null);
});

test("loading again after a finished request asks again and replaces the saved value", async () => {
  let n = 0;
  const cache = keyedCache(async () => ++n);
  assert.equal(await cache.load("u1"), 1);
  assert.equal(await cache.load("u1"), 2);
  assert.equal(cache.saved("u1"), 2);
});

test("forget drops the saved value and does not save a request that finishes afterwards", async () => {
  const reply = deferred();
  const cache = keyedCache(() => reply.promise);
  const pending = cache.load("u1");
  cache.forget(); // 세션을 시작했다 — 가고 있던 기록은 옛것이다
  reply.resolve("stale");
  assert.equal(await pending, "stale"); // 기다리던 쪽은 값을 받는다
  assert.equal(cache.saved("u1"), null);
});

test("forget drops every key", async () => {
  const cache = keyedCache(async (key) => `records-${key}`);
  await cache.load("u1|2026-10");
  await cache.load("u1|2026-11");
  cache.forget();
  assert.equal(cache.saved("u1|2026-10"), null);
  assert.equal(cache.saved("u1|2026-11"), null);
});

test("a failed request keeps the saved value and the next load asks again", async () => {
  let fail = false;
  const cache = keyedCache(async () => {
    if (fail) throw new Error("down");
    return "ok";
  });
  assert.equal(await cache.load("u1"), "ok");
  fail = true;
  await assert.rejects(cache.load("u1"), /down/);
  assert.equal(cache.saved("u1"), "ok");
  fail = false;
  assert.equal(await cache.load("u1"), "ok");
});

test("each key keeps its own value and its own pending request", async () => {
  const replies = { "u1|2026-10": deferred(), "u1|2026-11": deferred() };
  const cache = keyedCache((key) => replies[key].promise);
  const october = cache.load("u1|2026-10");
  const november = cache.load("u1|2026-11"); // 달을 넘겼다 — 앞 달 요청과 따로 간다
  assert.notEqual(october, november);
  replies["u1|2026-11"].resolve("nov");
  replies["u1|2026-10"].resolve("oct");
  assert.deepEqual([await october, await november], ["oct", "nov"]);
  assert.equal(cache.saved("u1|2026-10"), "oct");
  assert.equal(cache.saved("u1|2026-11"), "nov");
  assert.equal(cache.saved("u2|2026-11"), null);
});
