// Vercel 프로덕션 배포 대기 — main 머지 커밋의 GitHub Deployment(environment=Production) 상태를
// 폴링한다 (30초 간격, 최대 10분). 병합 커밋에는 check-run/commit-status가 붙지 않으므로
// Deployments API를 본다. Vercel이 연결된 뒤에만 의미가 있다 (automation/pipeline.md Step 3-1이 먼저 판정).
//
// 상태는 최신 1건이 아니라 **이력 전체**에서 판정한다 — 새 배포가 성공하면 GitHub가 이전 배포에
// inactive 상태를 자동으로 덧붙이므로(연속 머지), 최신 상태만 보면 성공한 배포를 놓친다.
// 배포가 한 번도 생성되지 않은 채 타임아웃되면 NOT_FOUND로 구분한다 — Production Branch 불일치·Git 연동
// 끊김 신호이므로, 진행 중일 수 있는 TIMEOUT과 다르게 처리한다.
// Node 표준 라이브러리와 gh만 쓴다 — bash·jq가 없는 Windows(PowerShell)에서도 같은 명령으로 돈다.
//
// 사용법: node automation/bin/deploy-wait.mjs <머지커밋SHA>
// 종료 마커: DEPLOY_RESULT result=success|failure|error|SUPERSEDED|NOT_FOUND|TIMEOUT|API_ERROR|ERROR
//   SUPERSEDED = 종료 상태 없이 더 새 배포로 대체됨 — 최신 프로덕션 배포에 이 커밋이 포함됐는지 확인할 것.
//   소문자 error는 Vercel 배포 상태다. 대문자 ERROR = gh 부재·응답 형식 이상·예상 못 한 예외 (fail-closed).

import { setTimeout as wait } from "node:timers/promises";

import { GhFailed, runGh, runIfMain } from "./cli.mjs";

const INTERVAL_MS = 30_000;
const LIMIT_SECONDS = 600;
const MAX_API_ERRORS = 3;

function nameWithOwner(out) {
  const { nameWithOwner } = JSON.parse(out);
  if (typeof nameWithOwner !== "string") throw new TypeError("nameWithOwner가 없다");
  return nameWithOwner;
}

// `gh api …/deployments` 응답의 최신 배포 id. 없으면 null
function latestDeployment(out) {
  const deployments = JSON.parse(out);
  if (!Array.isArray(deployments)) throw new TypeError("deployments 응답이 배열이 아니다");
  return deployments[0]?.id ?? null;
}

// `gh api …/statuses` 응답의 상태 이력
function states(out) {
  const statuses = JSON.parse(out);
  if (!Array.isArray(statuses)) throw new TypeError("statuses 응답이 배열이 아니다");
  return statuses.map((status) => status.state);
}

// 이력에 성공이 하나라도 있으면 성공이다 (뒤에 inactive가 덧붙어도). 종료 상태가 없으면 null(진행 중)
function outcome(history) {
  if (history.includes("success")) return ["success", 0];
  if (history.includes("failure")) return ["failure", 1];
  if (history.includes("error")) return ["error", 1];
  if (history.includes("inactive")) return ["SUPERSEDED", 1];
  return null;
}

// gh를 실행할 수 없거나 응답 형식이 다르면 재시도해도 소용없는 실행 환경 문제다 (fail-closed)
function environmentError(error) {
  console.log(`gh 응답을 쓸 수 없다 — ${error.message}`);
  console.log("DEPLOY_RESULT result=ERROR");
  return 1;
}

export async function main(argv, { gh = runGh, sleep = wait, limitSeconds = LIMIT_SECONDS } = {}) {
  if (argv.length !== 1) {
    console.error("usage: deploy-wait.mjs <머지커밋SHA>");
    return 2;
  }
  const [sha] = argv;
  const deadline = performance.now() + limitSeconds * 1000;
  let repo;
  try {
    repo = nameWithOwner(gh(["repo", "view", "--json", "nameWithOwner"]));
  } catch (error) {
    if (!(error instanceof GhFailed)) return environmentError(error);
    console.log("DEPLOY_RESULT result=API_ERROR");
    return 1;
  }
  let apiErrors = 0;
  let found = false;
  for (;;) {
    let result = null;
    try {
      const deployments = gh(["api", `repos/${repo}/deployments?sha=${sha}&environment=Production`]);
      const id = latestDeployment(deployments);
      if (id !== null) {
        found = true;
        result = outcome(states(gh(["api", `repos/${repo}/deployments/${id}/statuses`])));
      }
      apiErrors = 0;
    } catch (error) {
      if (!(error instanceof GhFailed)) return environmentError(error);
      // GitHub 조회 실패를 pending으로 삼키지 않는다 — 3회 연속 실패 시 API_ERROR로 종료.
      apiErrors += 1;
      console.log(`GitHub API query failed (${apiErrors}/${MAX_API_ERRORS})`);
      if (apiErrors >= MAX_API_ERRORS) {
        console.log("DEPLOY_RESULT result=API_ERROR");
        return 1;
      }
    }
    if (result !== null) {
      const [state, code] = result;
      console.log(`DEPLOY_RESULT result=${state}`);
      return code;
    }
    if (performance.now() >= deadline) {
      console.log(`DEPLOY_RESULT result=${found ? "TIMEOUT" : "NOT_FOUND"}`);
      return 1;
    }
    await sleep(INTERVAL_MS);
  }
}

await runIfMain(import.meta.url, main, "DEPLOY_RESULT");
