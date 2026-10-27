"use client";

/**
 * END — 세션 끝. reason이 DONE이면 라운드 요약과 목표 척도의 세션 변화(끝 − 사전)를 보인다.
 * SAFETY(intake가 안전 신호로 세션을 끝냄)면 도움 안내(intake/safety-screen.tsx, 담당 A)를 띄운다.
 */

import type { EndPayload } from "@/lib/api/types";
import { ButtonLink, Card, Heading, Screen } from "@/ui/controls";
import { SafetyScreen } from "./intake/safety-screen";
import { DELTA_LABELS, GOAL_LABELS } from "./labels";
import { activityNames } from "./use-session";

export function EndScreen({ payload }: { payload: EndPayload }) {
  if (payload.reason === "SAFETY") return <SafetyScreen />;

  const { goal_scale: scale } = payload;
  const names = activityNames();
  return (
    <Screen footer={<ButtonLink href="/">처음으로</ButtonLink>}>
      <Heading eyebrow={GOAL_LABELS[payload.goal]}>오늘 세션을 마쳤어요</Heading>
      {scale && (
        <Card className="mb-4">
          <p className="mb-2 text-caption font-bold text-ink-muted">시작할 때와 비교</p>
          <ul className="flex flex-col gap-1">
            {Object.entries(scale.delta).map(([key, delta]) => (
              <li key={key} className="flex justify-between">
                <span>{DELTA_LABELS[key] ?? key}</span>
                <strong className="tabular-nums">
                  {scale.pre[key]} → {scale.end[key]} ({delta > 0 ? `+${delta}` : delta})
                </strong>
              </li>
            ))}
          </ul>
        </Card>
      )}
      <Card>
        <p className="mb-2 text-caption font-bold text-ink-muted">한 활동</p>
        <ol className="flex flex-col gap-1">
          {payload.rounds.map((round) => (
            <li key={round.round} className="flex justify-between gap-3">
              <span>
                {round.round}. {names[round.protocol_id] ?? round.protocol_id} · {round.minutes}분
              </span>
              <span className="text-ink-muted">{round.completed ? "끝까지 함" : "중간에 멈춤"}</span>
            </li>
          ))}
        </ol>
      </Card>
      <p className="mt-6 text-caption text-ink-muted">LUMI는 의료적 진단이나 치료를 대신하지 않습니다.</p>
    </Screen>
  );
}
