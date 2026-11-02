"use client";

/**
 * 세션 화면 — 응답의 step으로 화면을 고른다. 세션을 시작하면 빛을 고정하고(lockLight) 끝나면 푼다(unlockLight).
 *
 * 들어올 때: 시작 화면이 남긴 입력이 있으면 POST /sessions, 없으면 이어 그릴 세션을 GET, 둘 다 없으면 처음으로.
 * 오류는 BE README 「오류」 표대로 다룬다 — 동의가 없으면 동의 화면, retryable이면 retry, 연결 실패면 다시 보내기.
 */

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { errorText } from "@/i18n/errors";
import { useLocale, useMessages } from "@/i18n/use-locale";
import type { ApiError } from "@/lib/api/client";
import { lockLight, unlockLight } from "@/lib/light";
import { Button, ButtonLink, Heading, Screen } from "@/ui/controls";
import { AskScreen } from "./intake/ask-screen";
import { ConfirmScreen } from "./confirm-screen";
import { EndScreen } from "./end-screen";
import { LABELS, progressLabel } from "./labels";
import { MeasureScreen } from "./measure/measure-screen";
import { SESSION } from "./messages";
import { Progress } from "./progress";
import { RunScreen } from "./run-screen";
import { readDraft, savedSessionId, useSession, type Session } from "./use-session";

const RELOGIN = ["UNAUTHENTICATED", "INVALID_TOKEN", "SESSION_REVOKED"];
const GONE = ["SESSION_NOT_FOUND", "SESSION_EXPIRED"];

export function SessionFlow() {
  const router = useRouter();
  const session = useSession();
  const { view, busy, progress, error } = session.status;
  const labels = useMessages(LABELS);
  const progressText = progress ? progressLabel(labels, progress) : null;
  const entered = useRef(false);

  useEffect(() => {
    if (entered.current) return; // 개발 모드 StrictMode의 두 번째 실행
    entered.current = true;
    const draft = readDraft();
    const saved = savedSessionId();
    if (draft) {
      lockLight();
      void session.start(draft);
    } else if (saved) {
      void session.resume(saved); // 빛은 시작할 때 고정한 것을 그대로 쓴다(세션 화면에서 applyLight가 읽는다)
    } else {
      router.replace("/");
    }
  }, [router, session]);

  useEffect(() => {
    if (view?.step === "END") unlockLight();
  }, [view?.step]);

  // 한 페이지 안에서 화면만 바뀌므로 앞 화면의 스크롤 위치가 남는다
  const screen = view ? `${view.step}:${view.node}:${view.step === "ASK" ? view.payload.question_id : ""}` : "";
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [screen]);

  useEffect(() => {
    if (error?.code === "CONSENT_REQUIRED") router.replace("/consent?next=/session");
  }, [error?.code, router]);

  if (!view) {
    if (error && error.code !== "CONSENT_REQUIRED") return <ErrorScreen error={error} session={session} />;
    return <Progress text={progressText} />;
  }

  return (
    <>
      <StepScreen session={session} />
      {busy && <Progress text={progressText} overlay />}
      {error && <ErrorSheet error={error} session={session} />}
    </>
  );
}

function StepScreen({ session }: { session: Session }) {
  const { view, busy } = session.status;
  const t = useMessages(SESSION).stalled;
  if (!view) return null;
  switch (view.step) {
    case "ASK":
      return <AskScreen key={view.payload.question_id} question={view.payload} busy={busy} onAnswer={session.answer} />;
    case "MEASURE":
      return (
        <MeasureScreen key={`${view.node}-${view.payload.round}`} payload={view.payload} busy={busy} onSubmit={session.measure} />
      );
    case "RUN":
      return (
        <RunScreen
          key={`${view.payload.content.protocol_id}-${view.payload.plan.activity.evidence_record_ids.join(",")}`}
          sessionId={view.session_id}
          payload={view.payload}
          busy={busy}
          onReport={session.report}
        />
      );
    case "CONFIRM":
      return <ConfirmScreen payload={view.payload} busy={busy} onDecide={(step) => session.decide({ next_step: step })} />;
    case "END":
      return <EndScreen payload={view.payload} />;
    case "STALLED":
      return (
        <Screen footer={<Button onClick={session.retry} disabled={busy}>{t.continue}</Button>}>
          <Heading>{t.title}</Heading>
          <p className="break-keep text-ink-muted">{t.body}</p>
        </Screen>
      );
  }
}

/** 화면 위에 띄우는 오류 — 지금 화면을 지키고 다시 시도하거나 처음으로 간다. */
function ErrorSheet({ error, session }: { error: ApiError; session: Session }) {
  return (
    <div role="alertdialog" aria-modal="true" aria-labelledby="error-title" className="fixed inset-0 z-50 flex items-end bg-black/40">
      <div className="mx-auto w-full max-w-[480px] rounded-t-card bg-surface px-4 pt-5 pb-[calc(16px+env(safe-area-inset-bottom))]">
        <ErrorBody error={error} session={session} />
      </div>
    </div>
  );
}

function ErrorScreen({ error, session }: { error: ApiError; session: Session }) {
  return (
    <Screen>
      <ErrorBody error={error} session={session} />
    </Screen>
  );
}

function ErrorBody({ error, session }: { error: ApiError; session: Session }) {
  const locale = useLocale();
  const m = useMessages(SESSION);
  const t = m.error;
  const home = (
    <ButtonLink href="/" variant="secondary">
      {m.home}
    </ButtonLink>
  );
  let title = t.title;
  let action = home;
  if (RELOGIN.includes(error.code)) title = t.relogin;
  else if (GONE.includes(error.code)) title = t.gone;
  else if (error.code === "INVALID_ANSWER" || error.code === "VALIDATION") {
    title = t.checkAnswer;
    action = <Button onClick={session.dismissError}>{t.ok}</Button>;
  } else if (error.retryable) {
    title = t.retryLater;
    action = <Button onClick={session.retry}>{m.tryAgain}</Button>;
  } else if (error.code === "NETWORK" || error.code === "STREAM_CLOSED" || error.status >= 500) {
    title = t.network;
    action = <Button onClick={session.again}>{m.tryAgain}</Button>;
  }
  return (
    <>
      <h2 id="error-title" className="mb-1 font-display text-title">
        {title}
      </h2>
      <p className="mb-4 break-keep text-ink-muted">{errorText(error, locale, t.title)}</p>
      <div className="flex flex-col gap-2">
        {action}
        {action !== home && home}
      </div>
      {process.env.NODE_ENV !== "production" && <p className="mt-3 text-caption text-ink-muted">{error.code}</p>}
    </>
  );
}
