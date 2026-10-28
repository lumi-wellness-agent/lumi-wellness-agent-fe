"use client";

/**
 * CONFIRM — 평가(전후 비교)와 다음 단계 제안. options에 있는 것만 고를 수 있고 권한 것을 먼저 보인다.
 * deltas는 SAM valence · arousal의 사후 − 사전이다. S1 쾌↑ · S2 각성↓는 탐색용 방향 지표이고,
 * S3는 SAM으로 피로를 재지 않아 판정할 수 없다.
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
      ? "SAM 기분 지표가 개선 방향으로 바뀌었어요"
      : evaluation.improved === false
        ? "SAM 기분 지표가 개선 방향을 보이지 않았어요"
        : "SAM으로는 목표 변화를 판정할 수 없어요";

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
      <p className="mt-3 break-keep text-caption text-ink-muted">
        SAM 기분 변화 참고값이에요. 목표 증상이나 임상 효과를 직접 측정한 결과는 아니에요.
      </p>
      <p className="mt-4 break-keep text-ink-muted">LUMI의 제안: {NEXT_STEP_LABELS[proposal.recommended]}</p>
    </Screen>
  );
}
