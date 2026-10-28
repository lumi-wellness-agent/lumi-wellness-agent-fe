"use client";

/**
 * MEASURE — 받은 도구를 scale.kind(PICTORIAL · LIKERT · SLIDER)대로 그리고 {instrument_id: {item_id: value}}로 보낸다.
 * 담당 B(TEAM.md). 사전(measure_pre) · 사후 · 종료 측정이 이 화면 하나를 쓴다.
 *
 * - 서버가 보낸 활성 도구만 그린다. 현재 MVP payload는 모든 목표·시점에서 SAM 하나다.
 * - TODO 또는 비활성 도구는 payload에 실수로 포함돼도 표시하지 않고 응답도 요구하지 않는다.
 * - 점수는 FE에서 계산하지 않는다. 필수 답을 {instrument_id: {item_id: value}}로 보낸다.
 * - PICTORIAL(SAM)은 현재 1–9 단계 슬라이더로 표시한다. 그림 UI와 사용 권한은 후속 확인 대상이다.
 */

import { useState } from "react";
import type { Instrument, InstrumentItem, MeasureAnswers, MeasurePayload } from "@/lib/api/types";
import { Button, Card, Heading, Screen } from "@/ui/controls";

const TITLES: Record<MeasurePayload["measure"], string> = {
  PRE: "시작하기 전에 지금 상태를 알려 주세요",
  POST: "활동을 마친 지금은 어떤가요?",
  FINAL: "마치기 전에 한 번 더 알려 주세요",
};

export function MeasureScreen({
  payload,
  busy,
  onSubmit,
}: {
  payload: MeasurePayload;
  busy: boolean;
  onSubmit: (answers: MeasureAnswers) => void;
}) {
  const [answers, setAnswers] = useState<MeasureAnswers>({});
  const instruments = payload.instruments.filter((i) => i.enabled !== false && i.status !== "TODO");
  const total = instruments.reduce((n, i) => n + i.items.length, 0);
  const answered = instruments.reduce(
    (n, i) => n + i.items.filter((item) => answers[i.instrument_id]?.[item.id] !== undefined).length,
    0,
  );
  const choose = (instrumentId: string, itemId: string, value: number) =>
    setAnswers((a) => ({ ...a, [instrumentId]: { ...a[instrumentId], [itemId]: value } }));

  return (
    <Screen
      footer={
        <Button onClick={() => onSubmit(answers)} disabled={busy || total === 0 || answered < total}>
          다음 ({answered}/{total})
        </Button>
      }
    >
      <Heading eyebrow={payload.measure === "POST" ? `${payload.round}번째 활동 뒤` : undefined}>
        {TITLES[payload.measure]}
      </Heading>
      <div className="flex flex-col gap-4">
        {instruments.map((instrument) => (
          <Card key={instrument.instrument_id}>
            <p className="text-caption text-ink-muted">{instrument.name}</p>
            {instrument.instruction && <p className="mt-1 mb-2 break-keep">{instrument.instruction}</p>}
            <div className="mt-3 flex flex-col gap-6">
              {instrument.items.map((item) => (
                <ItemInput
                  key={item.id}
                  instrument={instrument}
                  item={item}
                  value={answers[instrument.instrument_id]?.[item.id]}
                  disabled={busy}
                  onChange={(value) => choose(instrument.instrument_id, item.id, value)}
                />
              ))}
            </div>
          </Card>
        ))}
      </div>
    </Screen>
  );
}

function ItemInput({
  instrument,
  item,
  value,
  disabled,
  onChange,
}: {
  instrument: Instrument;
  item: InstrumentItem;
  value: number | undefined;
  disabled: boolean;
  onChange: (value: number) => void;
}) {
  const { min, max, step, kind } = instrument.scale;
  const points = Array.from({ length: Math.round((max - min) / step) + 1 }, (_, i) => min + i * step);
  const label = item.text ?? `문항 ${item.id} — 원문 준비 중`;

  return (
    <div role="group" aria-label={label}>
      <p className={`mb-2 font-bold break-keep ${item.text ? "" : "text-ink-muted"}`}>{label}</p>
      {kind === "LIKERT" && points.length <= 5 ? (
        <div className="flex gap-2">
          {points.map((point) => (
            <button
              key={point}
              type="button"
              aria-pressed={value === point}
              disabled={disabled}
              onClick={() => onChange(point)}
              className={`min-h-12 flex-1 rounded-chip border text-body ${
                value === point
                  ? "border-indicator bg-primary-soft font-bold text-on-primary-soft shadow-selected"
                  : "border-line-control bg-control text-ink"
              }`}
            >
              {point}
            </button>
          ))}
        </div>
      ) : (
        <Slider
          min={min}
          max={max}
          step={step}
          value={value}
          disabled={disabled}
          onChange={onChange}
          showValue={kind !== "SLIDER"}
        />
      )}
      {(item.low_label || item.high_label) && (
        <div className="mt-1 flex justify-between gap-4 text-caption text-ink-muted">
          <span>{item.low_label}</span>
          <span className="text-right">{item.high_label}</span>
        </div>
      )}
    </div>
  );
}

/** 건드리기 전에는 값이 없다. 가운데를 그대로 고를 수도 있게 손을 뗄 때도 값을 받는다. */
function Slider({
  min,
  max,
  step,
  value,
  disabled,
  showValue,
  onChange,
}: {
  min: number;
  max: number;
  step: number;
  value: number | undefined;
  disabled: boolean;
  showValue: boolean;
  onChange: (value: number) => void;
}) {
  const middle = min + Math.round((max - min) / step / 2) * step;
  const take = (target: HTMLInputElement) => onChange(Number(target.value));
  return (
    <div className="flex items-center gap-3">
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value ?? middle}
        disabled={disabled}
        onChange={(e) => take(e.currentTarget)}
        onPointerUp={(e) => take(e.currentTarget)}
        onKeyUp={(e) => take(e.currentTarget)}
        aria-valuetext={value === undefined ? "아직 고르지 않음" : String(value)}
        className={`h-12 w-full accent-primary ${value === undefined ? "opacity-50" : ""}`}
      />
      {showValue && (
        <span className="w-8 shrink-0 text-right font-bold tabular-nums">{value ?? "–"}</span>
      )}
    </div>
  );
}
