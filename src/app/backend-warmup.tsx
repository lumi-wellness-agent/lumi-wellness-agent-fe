"use client";

import { useEffect } from "react";
import { BACKEND_URL } from "@/lib/api/client";
import { mockEnabled } from "@/lib/api/mock";
import { prefetchMonth } from "@/lib/api/records";
import { viewer } from "@/lib/auth";
import { monthIndex } from "@/lib/days";

/**
 * 앱을 열 때 BE를 미리 깨운다. BE(Vercel 함수)는 10분쯤 쉬면 잠들어 첫 요청이 6초쯤 걸린다(콜드 스타트) —
 * 시작 화면을 보는 동안 깨워 두면 기록 탭 · 세션 시작이 기다리지 않는다.
 * 회원이면 이번 달 활동 기록을 미리 받아(src/lib/api/records.ts) 그 요청이 깨우고, 아니면 GET /health를 부른다.
 * /health는 인증 헤더가 없어 CORS 사전 요청 없이 바로 간다. 페이지를 불러올 때마다 한 번만 한다 — 루트 레이아웃이라
 * 화면을 옮겨도 다시 마운트되지 않고, 개발 모드(StrictMode)가 effect를 두 번 돌려도 started가 막는다.
 */
let started = false;

export function BackendWarmup(): null {
  useEffect(() => {
    if (started || mockEnabled()) return; // 목업 세션(/dev)은 BE를 부르지 않는다
    started = true;
    viewer()
      .then((who) => (who && !who.anonymous ? prefetchMonth(who.id, monthIndex(new Date())) : wake()))
      .catch(wake);
  }, []);
  return null;
}

function wake(): void {
  fetch(`${BACKEND_URL}/health`, { cache: "no-store" }).catch(() => {});
}
