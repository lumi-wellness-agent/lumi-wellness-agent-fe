"use client";

/**
 * 기록 — 회원이 한 활동을 세션별로 최근 것부터 보인다(GET /me/sessions). 게스트 체험은 기록을 남기지 않아서
 * 로그인하지 않았거나 게스트면 로그인을 권한다. 목업 세션이 켜져 있으면 이 탭에서 끝낸 목업 세션을 보인다.
 * 활동마다 끝까지 했는지와 나아졌는지(improved — BE 판정 그대로)를 먼저 보이고, 점수는 마친 세션의 목표 척도만
 * 종료 화면처럼 보인다.
 */

import { useEffect, useState } from "react";
import { ApiError, meApi } from "@/lib/api/client";
import { mockEnabled, mockHistory } from "@/lib/api/mock";
import type { SessionHistory } from "@/lib/api/types";
import { authConfigured, signIn, viewer, type Provider } from "@/lib/auth";
import { DELTA_LABELS, GOAL_DOTS, GOAL_LABELS, score } from "@/session/labels";
import { Button, ButtonLink, Card, Heading, Screen } from "@/ui/controls";
import { SocialLoginButton } from "@/ui/social-login";

// 로그인 세션이 끝났다 — 다시 로그인하면 볼 수 있다(BE README 「오류」)
const RELOGIN = ["UNAUTHENTICATED", "INVALID_TOKEN", "SESSION_REVOKED"];

const WHEN = { month: "long", day: "numeric", weekday: "short", hour: "numeric", minute: "2-digit" } as const;
const THIS_YEAR = new Intl.DateTimeFormat("ko-KR", WHEN); // 10월 29일 (목) 오후 2:12
const OTHER_YEAR = new Intl.DateTimeFormat("ko-KR", { ...WHEN, year: "numeric" });

type Records =
  | { kind: "loading" }
  | { kind: "login" }
  | { kind: "failed"; message: string }
  | { kind: "loaded"; sessions: SessionHistory[] };

export default function RecordsPage() {
  const [records, setRecords] = useState<Records>({ kind: "loading" });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let current = true;
    void readRecords().then((next) => {
      if (current) setRecords(next);
    });
    return () => {
      current = false;
    };
  }, [attempt]);

  const retry = () => {
    setRecords({ kind: "loading" });
    setAttempt((n) => n + 1);
  };

  return (
    <Screen tabBar>
      <Heading>기록</Heading>
      {records.kind === "loading" && (
        <p role="status" className="text-ink-muted">
          기록을 불러오고 있어요
        </p>
      )}
      {records.kind === "login" && <LoginCard />}
      {records.kind === "failed" && (
        <Card>
          <p className="font-bold">기록을 불러오지 못했어요</p>
          <p className="mt-1 break-keep text-ink-muted">{records.message}</p>
          <Button variant="secondary" className="mt-4 w-full" onClick={retry}>
            다시 시도
          </Button>
        </Card>
      )}
      {records.kind === "loaded" &&
        (records.sessions.length === 0 ? (
          <Card>
            <p className="font-bold">아직 기록이 없어요</p>
            <p className="mt-1 break-keep text-ink-muted">세션에서 활동을 하나 마치면 여기에 남아요.</p>
            <ButtonLink href="/" variant="secondary" className="mt-4 w-full">
              활동 시작하기
            </ButtonLink>
          </Card>
        ) : (
          <>
            <ol className="flex flex-col gap-3">
              {records.sessions.map((session) => (
                <li key={session.session_id}>
                  <SessionCard session={session} />
                </li>
              ))}
            </ol>
            <p className="mt-6 text-caption text-ink-muted">LUMI는 의료적 진단이나 치료를 대신하지 않습니다.</p>
          </>
        ))}
    </Screen>
  );
}

async function readRecords(): Promise<Records> {
  if (mockEnabled()) return { kind: "loaded", sessions: mockHistory() };
  const who = await viewer();
  if (!who || who.anonymous) return { kind: "login" };
  try {
    return { kind: "loaded", sessions: await meApi.sessions() };
  } catch (e) {
    if (e instanceof ApiError && RELOGIN.includes(e.code)) return { kind: "login" };
    return { kind: "failed", message: e instanceof Error ? e.message : "기록을 불러오지 못했어요." };
  }
}

/** 로그인을 권한다. 로그인하면 이 화면으로 돌아온다(게스트 체험은 이어지지 않는다). */
function LoginCard() {
  const [error, setError] = useState<string | null>(null);
  const login = (provider: Provider) => signIn(provider, "/records").catch((e: Error) => setError(e.message));
  return (
    <Card>
      <p className="font-bold">로그인하면 한 활동을 모아 볼 수 있어요</p>
      <p className="mt-1 break-keep text-ink-muted">게스트 체험은 기록을 남기지 않아요.</p>
      {authConfigured && (
        // 버튼에 글자가 없어 무엇을 하는 버튼인지 위에 적는다(시작 화면과 같다).
        <div className="mt-4 flex flex-col items-center gap-2 text-caption text-ink-muted">
          <p>간편 로그인</p>
          <div className="flex gap-5">
            <SocialLoginButton provider="google" onClick={() => login("google")} />
            <SocialLoginButton provider="kakao" onClick={() => login("kakao")} />
          </div>
        </div>
      )}
      {error && <p className="mt-2 text-caption break-keep">{error}</p>}
    </Card>
  );
}

function SessionCard({ session }: { session: SessionHistory }) {
  const { goal, goal_scale: scale } = session;
  return (
    <Card>
      <div className="flex items-baseline justify-between gap-3 text-caption text-ink-muted">
        <time dateTime={session.started_at}>{startedAt(session.started_at)}</time>
        {!session.ended_at && <span className="shrink-0">마치지 않음</span>}
      </div>
      {goal && (
        <p className="mt-1 flex items-center gap-2 font-bold">
          <span aria-hidden className={`size-2.5 shrink-0 rounded-full ${GOAL_DOTS[goal]}`} />
          {GOAL_LABELS[goal]}
        </p>
      )}
      <ol className="mt-2 divide-y divide-line">
        {session.rounds.map((round) => (
          <li key={round.round} className="flex items-center justify-between gap-3 py-2.5">
            <div className="min-w-0">
              <p className="break-keep">{round.name ?? round.protocol_id}</p>
              <p className="text-caption text-ink-muted">
                {round.minutes}분 · {round.completed ? "끝까지 함" : "중간에 멈춤"}
              </p>
            </div>
            {round.improved !== null && (
              <span
                className={`shrink-0 rounded-chip px-2.5 py-1 text-caption font-bold ${round.improved ? "bg-primary-soft text-on-primary-soft" : "bg-surface-muted text-ink-muted"}`}
              >
                {round.improved ? "나아짐" : "그대로"}
              </span>
            )}
          </li>
        ))}
      </ol>
      {scale && (
        <div className="mt-1 border-t border-line pt-2.5">
          <p className="mb-1 text-caption font-bold text-ink-muted">시작할 때와 비교</p>
          <ul className="flex flex-col gap-1">
            {Object.entries(scale.delta).map(([key, delta]) => (
              <li key={key} className="flex justify-between gap-3">
                <span>{DELTA_LABELS[key] ?? key}</span>
                <strong className="tabular-nums">
                  {score(scale.pre[key])} → {score(scale.end[key])} ({delta > 0 ? `+${score(delta)}` : score(delta)})
                </strong>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
}

function startedAt(iso: string): string {
  const date = new Date(iso);
  return (date.getFullYear() === new Date().getFullYear() ? THIS_YEAR : OTHER_YEAR).format(date);
}
