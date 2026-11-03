"use client";

/**
 * 기록 — 회원이 한 활동을 달력으로 보인다(GET /me/sessions). 게스트 체험은 기록을 남기지 않아서
 * 로그인하지 않았거나 게스트면 로그인을 권한다. 목업 세션이 켜져 있으면 이 탭에서 끝낸 목업 세션을 보인다.
 * 처음에는 이번 달 달력에서 오늘을 고르고, 기록은 기기 시간대의 한 달씩 받는다(src/lib/api/records.ts). 이번 달은
 * 열 때마다 새로 받아 바꾸고(앱을 열 때 미리 받아 둔 것이 있으면 먼저 보인다), 지난 달은 넘겨 볼 때 한 번 받는다.
 * 날짜를 누르면 달력 아래에 그날 시작한 세션 카드가 보인다. 카드는 목표와 시작 시각만 보이게 접어 두고, 누르면
 * 펼친다. 펼치면 활동마다 끝까지 했는지와 나아졌는지(improved — BE 판정 그대로)를 먼저 보이고, 점수는 마친 세션의
 * 목표 척도만 종료 화면처럼 보인다.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { errorText } from "@/i18n/errors";
import { nameOf } from "@/i18n/locale";
import { useLocale, useMessages } from "@/i18n/use-locale";
import { ApiError } from "@/lib/api/client";
import { mockEnabled } from "@/lib/api/mock";
import { forgetRecords, loadMonth, MOCK_OWNER, MONTH_LIMIT, savedMonth, savedOwner } from "@/lib/api/records";
import type { SessionHistory, SessionHistoryPage } from "@/lib/api/types";
import { authConfigured, signIn, viewer, type Provider } from "@/lib/auth";
import { byDay, dayKey, keyDate, monthIndex } from "@/lib/days";
import { GOAL_DOTS, LABELS, score } from "@/session/labels";
import { Button, ButtonLink, Card, Heading, Screen } from "@/ui/controls";
import { SocialLoginButton } from "@/ui/social-login";
import { APP } from "../messages";
import { RecordCalendar } from "./calendar";
import { RECORDS } from "./messages";

// 로그인 세션이 끝났다 — 다시 로그인하면 볼 수 있다(BE README 「오류」)
const RELOGIN = ["UNAUTHENTICATED", "INVALID_TOKEN", "SESSION_REVOKED"];

// 누구의 기록을 보이나 — 회원은 사용자 ID, 목업 세션은 MOCK_OWNER
type Access = { kind: "checking" } | { kind: "login" } | { kind: "ready"; owner: string };

export default function RecordsPage() {
  // 다른 탭에서 옮겨 왔으면 받아 둔 기록의 주인으로 바로 그린다. 이 화면을 새로 열면(서버 렌더 · hydration) 아직 없다
  const [access, setAccess] = useState<Access>(() => {
    const owner = savedOwner();
    return owner ? { kind: "ready", owner } : { kind: "checking" };
  });
  const toLogin = useCallback(() => setAccess({ kind: "login" }), []);
  const t = useMessages(RECORDS);
  const disclaimer = useMessages(APP).disclaimer;

  useEffect(() => {
    let current = true;
    void whose().then((next) => {
      if (current) setAccess(next);
    });
    return () => {
      current = false;
    };
  }, []);

  return (
    <Screen tabBar>
      <Heading>{t.title}</Heading>
      {access.kind === "checking" && (
        <p role="status" className="text-ink-muted">
          {t.loading}
        </p>
      )}
      {access.kind === "login" && <LoginCard />}
      {access.kind === "ready" && (
        <>
          <RecordsByMonth key={access.owner} owner={access.owner} onLoggedOut={toLogin} />
          <p className="mt-6 text-caption text-ink-muted">{disclaimer}</p>
        </>
      )}
    </Screen>
  );
}

async function whose(): Promise<Access> {
  if (mockEnabled()) return { kind: "ready", owner: MOCK_OWNER };
  const who = await viewer();
  return who && !who.anonymous ? { kind: "ready", owner: who.id } : { kind: "login" };
}

/** 로그인을 권한다. 로그인하면 이 화면으로 돌아온다(게스트 체험은 이어지지 않는다). */
function LoginCard() {
  const [error, setError] = useState<unknown>(null);
  const locale = useLocale();
  const t = useMessages(RECORDS);
  const login = (provider: Provider) => signIn(provider, "/records").catch((e: unknown) => setError(e));
  return (
    <Card>
      <p className="font-bold">{t.login.title}</p>
      <p className="mt-1 break-keep text-ink-muted">{t.login.guest}</p>
      {authConfigured && (
        // 버튼에 글자가 없어 무엇을 하는 버튼인지 위에 적는다(시작 화면과 같다).
        <div className="mt-4 flex flex-col items-center gap-2 text-caption text-ink-muted">
          <p>{t.login.quick}</p>
          <div className="flex gap-5">
            <SocialLoginButton provider="google" onClick={() => login("google")} />
            <SocialLoginButton provider="kakao" onClick={() => login("kakao")} />
          </div>
        </div>
      )}
      {error !== null && <p className="mt-2 text-caption break-keep">{errorText(error, locale, t.loadFailed)}</p>}
    </Card>
  );
}

/**
 * 달력과 고른 날의 세션 카드. 처음에는 이번 달에서 오늘을 고른다. 달을 넘기면 그 달을 받아 점을 찍고, 고른 날은
 * 그대로 둔다(제목이 그날을 보인다). 카드는 그날 받은 순서(최근 것부터)다.
 * 받을 달 — 보이는 달과 고른 날의 달. 이번 달은 이 화면을 열 때 한 번 새로 받고, 지난 달은 받아 둔 것이 있으면
 * 다시 받지 않는다(지난 달 기록은 늘지 않는다). 받는 중에도 받아 둔 달은 바로 보인다. 활동 이름은 BE가 화면 언어로
 * 붙여 주므로(?lang=) 받은 달은 언어마다 따로 둔다 — 다른 탭에서 언어를 바꾸면 그 언어로 다시 받는다.
 */
function RecordsByMonth({ owner, onLoggedOut }: { owner: string; onLoggedOut: () => void }) {
  const [today] = useState(() => dayKey(new Date()));
  const thisMonth = monthIndex(keyDate(today));
  const [month, setMonth] = useState(thisMonth);
  const [selected, setSelected] = useState(today);
  const selectedMonth = monthIndex(keyDate(selected));
  const [pages, setPages] = useState<ReadonlyMap<string, SessionHistoryPage>>(() => new Map()); // 언어|달 → 기록
  const [failures, setFailures] = useState<ReadonlyMap<number, unknown>>(() => new Map()); // 달 → 오류(문장은 그릴 때 고른다)
  const locale = useLocale();
  const t = useMessages(RECORDS);
  const [attempt, setAttempt] = useState(0);
  const asked = useRef(new Set<string>()); // 이 화면에서 받은(받는) 언어|달 — 실패하면 빼서 다시 시도로 받는다
  const keyOf = useCallback((m: number) => `${locale}|${m}`, [locale]);

  useEffect(() => {
    for (const m of new Set([month, selectedMonth])) {
      const key = keyOf(m);
      if (asked.current.has(key) || (m !== thisMonth && savedMonth(owner, m, locale))) continue;
      asked.current.add(key);
      // 결과는 화면을 떠난 뒤에 와도 버리지 않는다 — 받아 둔 달에도 남아 다음에 바로 보인다
      loadMonth(owner, m, locale).then(
        (page) => setPages((old) => new Map(old).set(key, page)),
        (e: unknown) => {
          asked.current.delete(key);
          if (e instanceof ApiError && RELOGIN.includes(e.code)) {
            forgetRecords();
            onLoggedOut();
            return;
          }
          setFailures((old) => new Map(old).set(m, e));
        },
      );
    }
  }, [owner, month, selectedMonth, thisMonth, attempt, onLoggedOut, locale, keyOf]);

  // 새로 받은 달이 먼저, 없으면 받아 둔 달(앱을 열 때 미리 받았거나 전에 이 탭을 열었다)
  const pageOf = (m: number) => pages.get(keyOf(m)) ?? savedMonth(owner, m, locale);
  const visible = pageOf(month);
  const selectedPage = pageOf(selectedMonth);
  // 기간과 상관없는 값이라 받은 달 어디에서 읽어도 같다. undefined = 아직 모른다, null = 기록이 하나도 없다
  const firstStarted = (visible ?? selectedPage ?? pageOf(thisMonth))?.first_started_at;
  const firstMonth = firstStarted ? Math.min(monthIndex(new Date(firstStarted)), thisMonth) : thisMonth;
  const counts = useMemo(
    () => new Map([...byDay(visible?.sessions ?? [])].map(([day, list]) => [day, list.length])),
    [visible],
  );
  const picked = useMemo(() => (selectedPage ? (byDay(selectedPage.sessions).get(selected) ?? []) : null), [selectedPage, selected]);

  const retry = () => {
    setFailures(new Map());
    setAttempt((n) => n + 1);
  };

  return (
    <>
      <RecordCalendar
        month={month}
        first={firstMonth}
        last={thisMonth}
        onMonth={setMonth}
        loading={!visible && !failures.has(month)}
        counts={counts}
        selected={selected}
        today={today}
        onSelect={setSelected}
      />
      {!visible && failures.has(month) && (
        <Card className="mt-3">
          <p className="font-bold">{t.monthFailed}</p>
          <p className="mt-1 break-keep text-ink-muted">{errorText(failures.get(month), locale, t.loadFailed)}</p>
          <Button variant="secondary" className="mt-4 w-full" onClick={retry}>
            {t.retry}
          </Button>
        </Card>
      )}
      {visible && visible.sessions.length >= MONTH_LIMIT && (
        <p className="mt-1 text-caption break-keep text-ink-muted">{t.monthLimit(MONTH_LIMIT)}</p>
      )}
      {firstStarted === null ? (
        <Card className="mt-6">
          <p className="font-bold">{t.empty.title}</p>
          <p className="mt-1 break-keep text-ink-muted">{t.empty.body}</p>
          <ButtonLink href="/" variant="secondary" className="mt-4 w-full">
            {t.empty.start}
          </ButtonLink>
        </Card>
      ) : (
        <>
          <h2 className="mt-6 mb-3 font-bold">{t.dayTitle(keyDate(selected), selected.slice(0, 4) !== today.slice(0, 4))}</h2>
          {picked === null ? (
            failures.has(selectedMonth) ? (
              <p className="text-ink-muted">{t.loadFailed}</p>
            ) : (
              <p role="status" className="text-ink-muted">
                {t.loading}
              </p>
            )
          ) : picked.length === 0 ? (
            <p className="text-ink-muted">{t.dayEmpty}</p>
          ) : (
            <ol className="flex flex-col gap-3">
              {picked.map((session) => (
                <li key={session.session_id}>
                  <SessionCard session={session} />
                </li>
              ))}
            </ol>
          )}
        </>
      )}
    </>
  );
}

/**
 * 세션 카드 — 목표와 시작 시각(summary)만 보이고 활동 · 점수는 접어 둔다. 날짜는 달력이 보이므로 카드에 쓰지 않는다.
 * summary를 카드 여백만큼 넓혀(-m-4 p-4) 접힌 카드 어디를 눌러도 열리고, 펼치면 아래 여백을 활동 목록과의
 * 간격(8px)으로 줄인다. 브라우저의 펼침 삼각형은 지우고(사파리는 ::-webkit-details-marker) 오른쪽 화살표로
 * 접힘 · 펼침을 보인다.
 */
function SessionCard({ session }: { session: SessionHistory }) {
  const { goal, goal_scale: scale } = session;
  const t = useMessages(RECORDS);
  const labels = useMessages(LABELS);
  return (
    <Card>
      <details className="group">
        <summary className="-m-4 flex cursor-pointer list-none items-center gap-3 rounded-card p-4 group-open:mb-0 group-open:pb-2 [&::-webkit-details-marker]:hidden">
          <span className="min-w-0 flex-1">
            <span className="flex items-center justify-between gap-3">
              <span className="flex min-w-0 items-center gap-2 font-bold">
                {goal && <span aria-hidden className={`size-2.5 shrink-0 rounded-full ${GOAL_DOTS[goal]}`} />}
                {goal ? labels.goals[goal] : t.noGoal}
              </span>
              <time dateTime={session.started_at} className="shrink-0 text-caption text-ink-muted tabular-nums">
                {t.time(new Date(session.started_at))}
              </time>
            </span>
            {!session.ended_at && <span className="mt-0.5 block text-caption text-ink-muted">{t.unfinished}</span>}
          </span>
          <svg
            viewBox="0 0 24 24"
            className="size-5 shrink-0 text-ink-muted transition-transform group-open:rotate-180 motion-reduce:transition-none"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.8}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </summary>
        <ol className="divide-y divide-line">
          {session.rounds.map((round) => (
            <li key={round.round} className="flex items-center justify-between gap-3 py-2.5">
              <div className="min-w-0">
                <p className="break-keep">{round.name ?? round.protocol_id}</p>
                <p className="text-caption text-ink-muted">{t.round(round.minutes, round.completed)}</p>
              </div>
              {round.improved !== null && (
                <span
                  className={`shrink-0 rounded-chip px-2.5 py-1 text-caption font-bold ${round.improved ? "bg-primary-soft text-on-primary-soft" : "bg-surface-muted text-ink-muted"}`}
                >
                  {round.improved ? t.improved : t.unchanged}
                </span>
              )}
            </li>
          ))}
        </ol>
        {scale && (
          <div className="mt-1 border-t border-line pt-2.5">
            <p className="mb-1 text-caption font-bold text-ink-muted">{t.compare}</p>
            <ul className="flex flex-col gap-1">
              {Object.entries(scale.delta).map(([key, delta]) => (
                <li key={key} className="flex justify-between gap-3">
                  <span>{nameOf(labels.deltas, key)}</span>
                  <strong className="tabular-nums">
                    {score(scale.pre[key])} → {score(scale.end[key])} ({delta > 0 ? `+${score(delta)}` : score(delta)})
                  </strong>
                </li>
              ))}
            </ul>
          </div>
        )}
      </details>
    </Card>
  );
}

