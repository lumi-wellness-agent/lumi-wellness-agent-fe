"use client";

/**
 * ASK — intake 질문(IntakeQuestion). 담당 A(TEAM.md).
 *
 * 묶음마다 보기 하나를 고르고, 고른 보기의 set을 합쳐 answer로 보낸다. 직접 쓰기를 받는 질문(allow_free_text)은
 * 글로도 답할 수 있다 — 글이 있으면 text로 보내고 고른 보기는 보내지 않는다(화면에서 보기를 흐리게 하고 알린다).
 * 되묻기(restate)는 글로만 답하고 skip_label("그냥 시작할게요")을 누르면 skip으로 보낸다.
 * '잘 모르겠어요'(set = {})는 다른 보기와 떨어뜨려 마지막에 둔다. 환경 칩은 고르지 않은 묶음이 answer에서 빠진다.
 * 계약은 BE app/schemas/intake.py, 고정 질문과 칩 보기는 app/agent/intake_rules.py.
 */

import { useState } from "react";
import type { IntakeAnswer, IntakeQuestion, QuestionOption } from "@/lib/api/types";
import { Button, Chip, Heading, Screen } from "@/ui/controls";
import { FREE_TEXT_HINTS, GROUP_LABELS } from "./labels";

const isUnknown = (option: QuestionOption) => Object.keys(option.set).length === 0;

export function AskScreen({
  question,
  busy,
  onAnswer,
}: {
  question: IntakeQuestion;
  busy: boolean;
  onAnswer: (answer: IntakeAnswer) => void;
}) {
  const [picked, setPicked] = useState<Record<string, number>>({}); // 묶음 key → 보기 번호
  const [text, setText] = useState("");
  const typed = text.trim();
  const chosen = question.groups.filter((g) => picked[g.key] !== undefined);
  const textWins = typed.length > 0 && chosen.length > 0; // 글이 이긴다 — 화면에 알린다
  const canSend = typed.length > 0 || chosen.length > 0;
  const restate = question.slot === "restate";
  const id = question.question_id;

  const send = () => {
    if (typed) return onAnswer({ question_id: id, text: typed });
    const answer = Object.assign({}, ...chosen.map((g) => g.options[picked[g.key]].set));
    onAnswer({ question_id: id, answer });
  };

  const toggle = (key: string, i: number) =>
    setPicked((p) => {
      const next = { ...p };
      if (next[key] === i) delete next[key];
      else next[key] = i;
      return next;
    });

  const hint = restate ? FREE_TEXT_HINTS.restate : question.groups.length ? FREE_TEXT_HINTS.withOptions : FREE_TEXT_HINTS.only;
  return (
    <Screen
      footer={
        <>
          <Button onClick={send} disabled={busy || !canSend}>
            다음
          </Button>
          {question.skip_label && (
            <Button variant="quiet" onClick={() => onAnswer({ question_id: id, skip: true })} disabled={busy}>
              {question.skip_label}
            </Button>
          )}
          {question.slot === "context" && (
            <Button variant="quiet" onClick={() => onAnswer({ question_id: id, answer: {} })} disabled={busy}>
              건너뛸게요
            </Button>
          )}
        </>
      }
    >
      <Heading eyebrow={question.turn > 0 ? `질문 ${question.turn} / ${question.max_turns}` : undefined}>{question.text}</Heading>

      {question.groups.map((group) => {
        const options = group.options.map((option, i) => ({ option, i }));
        const main = options.filter(({ option }) => !isUnknown(option));
        const unknown = options.filter(({ option }) => isUnknown(option));
        const chip = ({ option, i }: { option: QuestionOption; i: number }) => (
          <Chip
            key={option.label}
            selected={picked[group.key] === i}
            disabled={busy}
            className={`text-left ${typed ? "opacity-50" : ""}`}
            onClick={() => toggle(group.key, i)}
          >
            {option.label}
          </Chip>
        );
        return (
          <fieldset key={group.key} className="mb-5">
            {GROUP_LABELS[group.key] && (
              <legend className="mb-2 text-caption font-bold text-ink-muted">{GROUP_LABELS[group.key]}</legend>
            )}
            <div className="flex flex-col gap-2">{main.map(chip)}</div>
            {unknown.length > 0 && <div className="mt-4 flex flex-col gap-2">{unknown.map(chip)}</div>}
          </fieldset>
        );
      })}

      {question.allow_free_text && (
        <label className="flex flex-col gap-2">
          <span className="text-caption font-bold text-ink-muted">{hint.label}</span>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={3}
            maxLength={500}
            disabled={busy}
            autoFocus={restate}
            placeholder={hint.placeholder}
            className="rounded-row border border-line-control bg-control p-3 text-body text-ink"
          />
        </label>
      )}
      {textWins && (
        <p role="status" className="mt-2 text-caption text-ink-muted break-keep">
          직접 쓴 글로 답할게요. 고른 보기는 보내지 않아요.
        </p>
      )}
    </Screen>
  );
}
