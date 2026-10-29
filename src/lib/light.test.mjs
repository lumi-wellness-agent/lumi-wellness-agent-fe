// src/lib/light.ts의 빛 정하기 — 기기 시각과 세션의 빛. 브라우저 전역은 메모리로 흉내 낸다.
import assert from "node:assert/strict";
import { beforeEach, test } from "node:test";

import { LIGHT_KEYS, applyLight, lockLight } from "./light.ts";

class MemoryStorage {
  #items = new Map();
  getItem(key) {
    return this.#items.get(key) ?? null;
  }
  setItem(key, value) {
    this.#items.set(key, String(value));
  }
  removeItem(key) {
    this.#items.delete(key);
  }
}

const install = (name, value) => Object.defineProperty(globalThis, name, { value, configurable: true, writable: true });
const at = (hour, minute = 0) => new Date(2026, 9, 29, hour, minute).getTime();

let tab; // 이 탭의 sessionStorage
let page; // location
let root; // <html>

beforeEach(() => {
  tab = new MemoryStorage();
  page = { pathname: "/" };
  root = { dataset: {} };
  install("sessionStorage", tab);
  install("localStorage", new MemoryStorage());
  install("location", page);
  install("document", { documentElement: root });
  install("getComputedStyle", () => ({ getPropertyValue: () => "" })); // theme-color는 건너뛴다
});

test("기기 시각으로 5시 물안개, 12시 볕, 18시 달빛이고 0~5시는 달빛이다", (t) => {
  t.mock.timers.enable({ apis: ["Date"] });
  const lightAt = (hour, minute) => {
    t.mock.timers.setTime(at(hour, minute));
    return applyLight(LIGHT_KEYS);
  };
  assert.equal(lightAt(4, 59), "moonlight");
  assert.equal(lightAt(5, 0), "mist");
  assert.equal(lightAt(11, 59), "mist");
  assert.equal(lightAt(12, 0), "sunlit");
  assert.equal(lightAt(17, 59), "sunlit");
  assert.equal(lightAt(18, 0), "moonlight");
});

test("세션의 빛은 세션 화면에서만 쓰고, 마치지 않고 나간 다른 화면은 시간대를 따른다", (t) => {
  t.mock.timers.enable({ apis: ["Date"], now: at(20) });
  tab.setItem(LIGHT_KEYS.session, "mist"); // 아침에 시작해 마치지 않은 세션
  assert.equal(applyLight(LIGHT_KEYS), "moonlight");
  page.pathname = "/session";
  assert.equal(applyLight(LIGHT_KEYS), "mist");
  assert.equal(root.dataset.light, "mist");
});

test("새 세션은 앞 세션의 빛을 버리고 지금 빛으로 고정한다", (t) => {
  t.mock.timers.enable({ apis: ["Date"], now: at(20) });
  tab.setItem(LIGHT_KEYS.session, "mist");
  page.pathname = "/session";
  assert.equal(lockLight(), "moonlight");
  assert.equal(tab.getItem(LIGHT_KEYS.session), "moonlight");
});
