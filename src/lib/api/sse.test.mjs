// src/lib/api/sse.ts — BE 세션 API의 SSE 본문 읽기. Node가 .ts를 타입만 지우고 바로 읽는다.
import assert from "node:assert/strict";
import { test } from "node:test";

import { createSseParser, readSse } from "./sse.ts";

const STREAM =
  'event: session\ndata: {"session_id": "s1"}\n\n' +
  ": ping\n\n" +
  'event: progress\ndata: {"node": "plan", "step": "choose_activity"}\n\n' +
  'event: result\ndata: {"session_id": "s1", "step": "RUN"}\n\n';

test("이벤트 이름과 data를 나누고 하트비트 주석은 버린다", () => {
  const events = createSseParser().push(STREAM);
  assert.deepEqual(
    events.map((e) => e.event),
    ["session", "progress", "result"],
  );
  assert.deepEqual(JSON.parse(events[1].data), { node: "plan", step: "choose_activity" });
});

test("조각나 들어와도 이벤트가 끝날 때까지 기다린다", () => {
  const parser = createSseParser();
  const seen = [];
  for (let i = 0; i < STREAM.length; i += 7) seen.push(...parser.push(STREAM.slice(i, i + 7)));
  seen.push(...parser.flush());
  assert.deepEqual(
    seen.map((e) => e.event),
    ["session", "progress", "result"],
  );
});

test("CRLF 줄바꿈이 조각 사이에서 갈라져도 빈 줄을 잘못 세지 않는다", () => {
  const parser = createSseParser();
  const first = parser.push("event: progress\r");
  const second = parser.push('\ndata: {"node": "intake_read"}\r\n\r\n');
  assert.deepEqual(first, []);
  assert.deepEqual(second, [{ event: "progress", data: '{"node": "intake_read"}' }]);
});

test("data 여러 줄은 줄바꿈으로 잇고, 끝에 빈 줄이 없어도 flush가 마지막 이벤트를 낸다", () => {
  const parser = createSseParser();
  assert.deepEqual(parser.push("event: error\ndata: a\ndata: b"), []);
  assert.deepEqual(parser.flush(), [{ event: "error", data: "a\nb" }]);
});

test("readSse는 fetch 응답 본문을 끝까지 읽는다", async () => {
  const events = [];
  await readSse(new Response(STREAM), (e) => events.push(e.event));
  assert.deepEqual(events, ["session", "progress", "result"]);
});
