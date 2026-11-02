import assert from "node:assert/strict";
import { test } from "node:test";

import { byDay, dayKey, keyDate, monthCells, monthIndex, monthStart } from "./days.ts";

// 날짜 경계는 기기 시간대를 따른다 — 한국(UTC+9)으로 고정한다. node --test는 파일마다 프로세스가 따로라 다른 테스트에 번지지 않는다.
process.env.TZ = "Asia/Seoul";

test("dayKey uses the device time zone, not UTC", () => {
  assert.equal(dayKey(new Date("2026-11-01T14:59:00Z")), "2026-11-01"); // 23:59 KST
  assert.equal(dayKey(new Date("2026-11-01T15:30:00Z")), "2026-11-02"); // 다음 날 00:30 KST
});

test("keyDate is local midnight and round-trips through dayKey", () => {
  const date = keyDate("2026-03-09");
  assert.equal(date.getHours(), 0);
  assert.equal(dayKey(date), "2026-03-09");
});

test("month index steps across the year boundary", () => {
  const january = monthIndex(new Date(2026, 0, 15));
  assert.equal(dayKey(monthStart(january - 1)), "2025-12-01");
  assert.equal(dayKey(monthStart(january + 12)), "2027-01-01");
});

test("month cells pad the first week from Sunday", () => {
  const november = monthCells(monthIndex(new Date(2026, 10, 1))); // 2026-11-01 = 일요일
  assert.equal(november.length, 30);
  assert.equal(november[0], "2026-11-01");

  const october = monthCells(monthIndex(new Date(2026, 9, 1))); // 2026-10-01 = 목요일
  assert.deepEqual(october.slice(0, 5), [null, null, null, null, "2026-10-01"]);
  assert.equal(october.at(-1), "2026-10-31");

  const leapFebruary = monthCells(monthIndex(new Date(2028, 1, 1))); // 2028-02-01 = 화요일, 윤년
  assert.deepEqual(leapFebruary.slice(0, 3), [null, null, "2028-02-01"]);
  assert.equal(leapFebruary.at(-1), "2028-02-29");
});

test("byDay groups sessions by local start day and keeps the given order", () => {
  const sessions = [
    { id: "c", started_at: "2026-11-02T03:00:00Z" }, // 11-02 12:00 KST
    { id: "b", started_at: "2026-11-01T15:30:00Z" }, // 11-02 00:30 KST
    { id: "a", started_at: "2026-11-01T14:00:00Z" }, // 11-01 23:00 KST
  ];
  const days = [...byDay(sessions)].map(([key, list]) => [key, list.map((s) => s.id)]);
  assert.deepEqual(days, [
    ["2026-11-02", ["c", "b"]],
    ["2026-11-01", ["a"]],
  ]);
});
