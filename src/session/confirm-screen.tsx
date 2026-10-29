"use client";

/**
 * CONFIRM — 평가(전후 비교)와 다음 단계 제안. options에 있는 것만 고를 수 있고 권한 것을 먼저 보인다.
 * deltas는 사후 − 사전이다(SAM valence · arousal, S3는 MFVAS도). 판정(improved)은 임시 규칙이다
 * — S1 쾌↑ · S2 각성↓ · S3 피로 10점 이상↓.
 */

import type { ConfirmPayload, NextStep } from "@/lib/api/types";
import { Button, Card, Heading, Screen } from "@/ui/controls";
import { DELTA_LABELS, NEXT_STEP_LABELS } from "./labels";

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
  const ordered = [...options].sort((a, b) => Number(b === proposal.recommended) - Number(a === proposal.recommended));
  const headline = !evaluation.completed
    ? "이번 활동은 여기까지 했어요"
    : evaluation.improved
      ? "활동 전보다 나아졌어요"
      : evaluation.improved === false
        ? "이번에는 큰 변화가 없었어요"
        : "활동을 마쳤어요";

  return (
    <Screen
      footer={ordered.map((step) => (
        <Button key={step} variant={step === proposal.recommended ? "primary" : "secondary"} disabled={busy} onClick={() => onDecide(step)}>
          {NEXT_STEP_LABELS[step]}
        </Button>
      ))}
    >
      <Heading eyebrow={`${evaluation.round}번째 활동`}>{headline}</Heading>
      <Card>
        <p className="mb-2 text-caption font-bold text-ink-muted">활동 전과 비교</p>
        <ul className="flex flex-col gap-1">
          {Object.entries(evaluation.deltas).map(([key, delta]) => (
            <li key={key} className="flex justify-between">
              <span>{DELTA_LABELS[key] ?? key}</span>
              <strong className="tabular-nums">{delta > 0 ? `+${delta}` : delta}</strong>
            </li>
          ))}
        </ul>
      </Card>
      <p className="mt-4 break-keep text-ink-muted">LUMI의 제안: {NEXT_STEP_LABELS[proposal.recommended]}</p>
    </Screen>
  );
}
