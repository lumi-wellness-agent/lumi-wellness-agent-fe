"use client";

/**
 * END — 세션 끝. reason이 DONE이면 라운드 요약과 목표 척도의 세션 변화(끝 − 사전)를 보인다.
 * SAFETY(intake가 안전 신호로 세션을 끝냄)면 도움 안내(intake/safety-screen.tsx, 담당 A)를 띄운다.
 */

import { nameOf } from "@/i18n/locale";
import { useMessages } from "@/i18n/use-locale";
import type { EndPayload } from "@/lib/api/types";
import { ButtonLink, Card, Heading, Screen } from "@/ui/controls";
import { SafetyScreen } from "./intake/safety-screen";
import { LABELS, score } from "./labels";
import { SESSION } from "./messages";
import { activityNames } from "./use-session";

export function EndScreen({ payload }: { payload: EndPayload }) {
  if (payload.reason === "SAFETY") return <SafetyScreen />;
  return <DoneScreen payload={payload} />;
}

function DoneScreen({ payload }: { payload: Extract<EndPayload, { reason: "DONE" }> }) {
  const m = useMessages(SESSION);
  const t = m.end;
  const labels = useMessages(LABELS);

  const { goal_scale: scale } = payload;
  const names = activityNames();
  return (
    <Screen footer={<ButtonLink href="/">{m.home}</ButtonLink>}>
      <Heading eyebrow={labels.goals[payload.goal]}>{t.title}</Heading>
      {scale && (
        <Card className="mb-4">
          <p className="mb-2 text-caption font-bold text-ink-muted">{t.compare}</p>
          <ul className="flex flex-col gap-1">
            {Object.entries(scale.delta).map(([key, delta]) => (
              <li key={key} className="flex justify-between">
                <span>{nameOf(labels.deltas, key)}</span>
                <strong className="tabular-nums">
                  {score(scale.pre[key])} → {score(scale.end[key])} ({delta > 0 ? `+${score(delta)}` : score(delta)})
                </strong>
              </li>
            ))}
          </ul>
        </Card>
      )}
      <Card>
        <p className="mb-2 text-caption font-bold text-ink-muted">{t.activities}</p>
        <ol className="flex flex-col gap-1">
          {payload.rounds.map((round) => (
            <li key={round.round} className="flex justify-between gap-3">
              <span>
                {t.round(round.round, names[round.protocol_id] ?? round.protocol_id, round.minutes)}
              </span>
              <span className="text-ink-muted">{round.completed ? t.completed : t.stopped}</span>
            </li>
          ))}
        </ol>
      </Card>
      <p className="mt-6 text-caption text-ink-muted">{m.disclaimer}</p>
    </Screen>
  );
}
