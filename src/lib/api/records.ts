/**
 * 활동 기록(GET /me/sessions)을 달마다 이 탭의 메모리에 받아 둔다(keyedCache — 키는 주인과 달).
 * 기록 탭 달력은 기기 시간대의 한 달씩 묻는다(since 이상 · until 미만, src/lib/days.ts의 monthRange).
 * BE(Vercel 함수)는 10분쯤 쉬면 잠들어 첫 요청이 6초쯤 걸린다(콜드 스타트). 그래서 앱을 열 때 이번 달을 미리 받아
 * 함수를 깨우고(src/app/backend-warmup.tsx), 기록 탭은 받아 둔 달을 바로 보인다. 이번 달은 탭을 열 때마다 새로 받아
 * 바꾸고, 지난 달은 바뀌지 않으므로 한 번 받은 것을 쓴다(src/app/records/page.tsx).
 * 세션을 진행하면 이번 달 기록이 늘어나므로(src/session/use-session.ts), 로그아웃 · 탈퇴하면(설정) 모두 버린다.
 * 목업 세션(/dev)은 이 탭에서 끝낸 목업 기록을 같은 모양으로 돌려준다.
 */

import { monthRange } from "@/lib/days";
import { keyedCache } from "@/lib/keyed-cache";
import { meApi } from "./client";
import { mockHistory } from "./mock";
import type { SessionHistoryPage } from "./types";

/** 한 달에 받는 세션 수 — BE 최대(GET /me/sessions?limit=). 넘으면 그 달은 최근 것만 보인다. */
export const MONTH_LIMIT = 100;

/** 목업 세션 기록의 주인. 회원 기록의 주인은 사용자 ID다. */
export const MOCK_OWNER = "mock";

// 요청 주인은 토큰이 정한다. 키의 주인은 다른 사용자의 기록을 꺼내지 않게 하는 데만 쓴다
const months = keyedCache<SessionHistoryPage>((key) => {
  const [owner, month] = key.split("|");
  return fetchMonth(owner, Number(month));
});
let owner: string | null = null; // 받아 둔 기록의 주인 — 기록 탭이 로그인 확인을 기다리지 않고 그린다

const keyOf = (who: string, month: number) => `${who}|${month}`;

export function savedOwner(): string | null {
  return owner;
}

/** 받아 둔 달. month는 days.ts의 monthIndex다. */
export function savedMonth(who: string, month: number): SessionHistoryPage | null {
  return months.saved(keyOf(who, month));
}

/** 그 달을 새로 받는다. 같은 달 요청이 가고 있으면 같이 기다린다. */
export function loadMonth(who: string, month: number): Promise<SessionHistoryPage> {
  owner = who;
  return months.load(keyOf(who, month));
}

/** 앱을 열 때 미리 받는다. 실패하면 기록 탭이 다시 받으며 알린다. */
export function prefetchMonth(who: string, month: number): void {
  loadMonth(who, month).catch(() => {});
}

export function forgetRecords(): void {
  owner = null;
  months.forget();
}

async function fetchMonth(who: string, month: number): Promise<SessionHistoryPage> {
  const { since, until } = monthRange(month);
  if (who !== MOCK_OWNER) return meApi.sessions({ limit: MONTH_LIMIT, since, until });
  const all = mockHistory(); // 최근 것부터
  const from = Date.parse(since);
  const to = Date.parse(until);
  return {
    sessions: all.filter((s) => Date.parse(s.started_at) >= from && Date.parse(s.started_at) < to).slice(0, MONTH_LIMIT),
    first_started_at: all.at(-1)?.started_at ?? null,
  };
}
