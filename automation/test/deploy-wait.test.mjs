// Vercel 프로덕션 배포 대기(automation/bin/deploy-wait.mjs)를 gh 대역으로 확인한다.
import assert from "node:assert/strict";
import { test } from "node:test";

import { main } from "../bin/deploy-wait.mjs";
import { apiError, captureOutput, fakeGh, ghMissing, json, noSleep } from "./helpers.mjs";

const REPO = json({ nameWithOwner: "lumi/fe" });
const NO_DEPLOYMENT = json([]);
const DEPLOYMENT = json([{ id: 42 }]);
// 배포 상태 이력 (GitHub는 최신순으로 준다)
const history = (...states) => json(states.map((state) => ({ state })));

test("이력에 success가 있으면 성공이다 — 뒤에 inactive가 덧붙어도", async (t) => {
  const output = captureOutput(t);
  const { gh, calls } = fakeGh(REPO, DEPLOYMENT, history("inactive", "success", "in_progress"));

  assert.equal(await main(["abc123"], { gh, sleep: noSleep }), 0);
  assert.equal(output.out.at(-1), "DEPLOY_RESULT result=success");
  assert.deepEqual(calls, [
    ["repo", "view", "--json", "nameWithOwner"],
    ["api", "repos/lumi/fe/deployments?sha=abc123&environment=Production"],
    ["api", "repos/lumi/fe/deployments/42/statuses"],
  ]);
});

test("배포가 생기고 끝날 때까지 기다린다", async (t) => {
  const output = captureOutput(t);
  const { gh } = fakeGh(
    REPO,
    NO_DEPLOYMENT,
    DEPLOYMENT,
    history("in_progress"),
    DEPLOYMENT,
    history("success", "in_progress"),
  );

  assert.equal(await main(["abc123"], { gh, sleep: noSleep }), 0);
  assert.equal(output.out.at(-1), "DEPLOY_RESULT result=success");
});

for (const [states, want] of [
  [["failure", "in_progress"], "failure"],
  [["error"], "error"],
  // 종료 상태 없이 더 새 배포로 대체됐다
  [["inactive", "in_progress"], "SUPERSEDED"],
]) {
  test(`종료 상태 ${states.join(",")} → ${want}`, async (t) => {
    const output = captureOutput(t);
    const { gh } = fakeGh(REPO, DEPLOYMENT, history(...states));

    assert.equal(await main(["abc123"], { gh, sleep: noSleep }), 1);
    assert.equal(output.out.at(-1), `DEPLOY_RESULT result=${want}`);
  });
}

// 배포가 한 번도 안 생겼으면 NOT_FOUND(연동 끊김 신호), 생겼는데 안 끝났으면 TIMEOUT이다
for (const [responses, want] of [
  [[NO_DEPLOYMENT], "NOT_FOUND"],
  [[DEPLOYMENT, history("in_progress")], "TIMEOUT"],
]) {
  test(`타임아웃 구분: ${want}`, async (t) => {
    const output = captureOutput(t);
    const { gh } = fakeGh(REPO, ...responses);

    assert.equal(await main(["abc123"], { gh, sleep: noSleep, limitSeconds: 0 }), 1);
    assert.equal(output.out.at(-1), `DEPLOY_RESULT result=${want}`);
  });
}

test("레포 이름 조회 실패 → 바로 API_ERROR", async (t) => {
  const output = captureOutput(t);
  const { gh, calls } = fakeGh(apiError());

  assert.equal(await main(["abc123"], { gh, sleep: noSleep }), 1);
  assert.equal(output.out.at(-1), "DEPLOY_RESULT result=API_ERROR");
  assert.equal(calls.length, 1);
});

test("배포 상태 조회가 3회 연속 실패 → API_ERROR", async (t) => {
  const output = captureOutput(t);
  const { gh } = fakeGh(
    REPO,
    DEPLOYMENT,
    apiError(),
    DEPLOYMENT,
    apiError(),
    DEPLOYMENT,
    apiError(),
  );

  assert.equal(await main(["abc123"], { gh, sleep: noSleep }), 1);
  assert.equal(output.out.at(-1), "DEPLOY_RESULT result=API_ERROR");
});

for (const responses of [["not json"], [json({ message: "Not Found" })], [DEPLOYMENT, "{}"]]) {
  test(`형식이 다른 응답 ${JSON.stringify(responses)} → ERROR`, async (t) => {
    const output = captureOutput(t);
    const { gh } = fakeGh(REPO, ...responses);

    assert.equal(await main(["abc123"], { gh, sleep: noSleep }), 1);
    assert.equal(output.out.at(-1), "DEPLOY_RESULT result=ERROR");
  });
}

test("gh가 없으면 → ERROR", async (t) => {
  const output = captureOutput(t);
  const { gh } = fakeGh(ghMissing());

  assert.equal(await main(["abc123"], { gh, sleep: noSleep }), 1);
  assert.equal(output.out.at(-1), "DEPLOY_RESULT result=ERROR");
});

test("인자가 없으면 → usage", async (t) => {
  const output = captureOutput(t);

  assert.equal(await main([]), 2);
  assert.match(output.err.join("\n"), /usage/);
});
