"use client";

/**
 * CONFIRM — 평가(전후 비교)와 다음 단계 제안. options에 있는 것만 고를 수 있고 권한 것을 먼저 보인다.
 * 권한 이유는 LLM이 쓴 것(proposal.by_llm)만 보인다 — 규칙의 이유는 내부 문구다.
 * deltas는 사후 − 사전이다(SAM valence · arousal, S3는 MFVAS도). 판정(improved)은 임시 규칙이다
 * — S1 쾌↑ · S2 각성↓ · S3 피로 10점 이상↓.
 */

import { nameOf } from "@/i18n/locale";
import { useMessages } from "@/i18n/use-locale";
import type { ConfirmPayload, NextStep } from "@/lib/api/types";
import { Button, Card, Heading, Screen } from "@/ui/controls";
import { LABELS } from "./labels";
import { SESSION } from "./messages";

export function ConfirmScreen({
  payload,
  busy,
  onDecide,
}: {
  payload: ConfirmPayload;
  busy: boolean;
  onDecide: (step: NextStep) => void;
}) {
  const { evaluation, proposal, options } = payload;
  const t = useMessages(SESSION).confirm;
  const labels = useMessages(LABELS);
  const ordered = [...options].sort((a, b) => Number(b === proposal.recommended) - Number(a === proposal.recommended));
  const headline = !evaluation.completed
    ? t.stopped
    : evaluation.improved
      ? t.improved
      : evaluation.improved === false
        ? t.unchanged
        : t.done;

  return (
    <Screen
      footer={ordered.map((step) => (
        <Button key={step} variant={step === proposal.recommended ? "primary" : "secondary"} disabled={busy} onClick={() => onDecide(step)}>
          {labels.nextSteps[step]}
        </Button>
      ))}
    >
      <Heading eyebrow={t.eyebrow(evaluation.round)}>{headline}</Heading>
      <Card>
        <p className="mb-2 text-caption font-bold text-ink-muted">{t.compare}</p>
        <ul className="flex flex-col gap-1">
          {Object.entries(evaluation.deltas).map(([key, delta]) => (
            <li key={key} className="flex justify-between">
              <span>{nameOf(labels.deltas, key)}</span>
              <strong className="tabular-nums">{delta > 0 ? `+${delta}` : delta}</strong>
            </li>
          ))}
        </ul>
      </Card>
      <p className="mt-4 break-keep text-ink-muted">{t.suggestion(labels.nextSteps[proposal.recommended])}</p>
      {proposal.by_llm && <p className="mt-1 break-keep">{proposal.reason}</p>}
    </Screen>
  );
}
