"use client";

/**
 * ASK — intake 질문(IntakeQuestion). 담당 A(TEAM.md).
 *
 * 묶음마다 보기 하나를 고르고, 고른 보기의 set을 합쳐 answer로 보낸다. 직접 쓰기를 받는 질문(allow_free_text)은
 * 글로도 답할 수 있다 — 글이 있으면 text로 보낸다. 되묻기(restate)는 글로만 답하고 skip_label("그냥 시작할게요")을
 * 누르면 skip으로 보낸다. 계약은 BE app/schemas/intake.py, 고정 질문과 칩 보기는 app/agent/intake_rules.py.
 */

import { useState } from "react";
import type { IntakeAnswer, IntakeQuestion } from "@/lib/api/types";
import { Button, Chip, Heading, Screen } from "@/ui/controls";
import { GROUP_LABELS } from "./labels";

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
  const canSend = typed.length > 0 || chosen.length > 0;

  const send = () => {
    if (typed) return onAnswer({ question_id: question.question_id, text: typed });
    const answer = Object.assign({}, ...chosen.map((g) => g.options[picked[g.key]].set));
    onAnswer({ question_id: question.question_id, answer });
  };

  const counted = question.turn > 0;
  return (
    <Screen
      footer={
        <>
          <Button onClick={send} disabled={busy || !canSend}>
            다음
          </Button>
          {question.skip_label && (
            <Button variant="quiet" onClick={() => onAnswer({ question_id: question.question_id, skip: true })} disabled={busy}>
              {question.skip_label}
            </Button>
          )}
          {question.slot === "context" && (
            <Button variant="quiet" onClick={() => onAnswer({ question_id: question.question_id, answer: {} })} disabled={busy}>
              건너뛸게요
            </Button>
          )}
        </>
      }
    >
      <Heading eyebrow={counted ? `질문 ${question.turn} / ${question.max_turns}` : undefined}>{question.text}</Heading>

      {question.groups.map((group) => (
        <fieldset key={group.key} className="mb-5">
          {GROUP_LABELS[group.key] && (
            <legend className="mb-2 text-caption font-bold text-ink-muted">{GROUP_LABELS[group.key]}</legend>
          )}
          <div className="flex flex-col gap-2">
            {group.options.map((option, i) => (
              <Chip
                key={option.label}
                selected={picked[group.key] === i}
                disabled={busy}
                className="text-left"
                onClick={() =>
                  setPicked((p) => {
                    const next = { ...p };
                    if (next[group.key] === i) delete next[group.key];
                    else next[group.key] = i;
                    return next;
                  })
                }
              >
                {option.label}
              </Chip>
            ))}
          </div>
        </fieldset>
      ))}

      {question.allow_free_text && (
        <label className="flex flex-col gap-2">
          <span className="text-caption font-bold text-ink-muted">
            {question.groups.length ? "보기에 없으면 직접 적어 주세요" : "한두 마디로 적어 주세요"}
          </span>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={3}
            maxLength={500}
            disabled={busy}
            className="rounded-row border border-line-control bg-control p-3 text-body text-ink"
          />
        </label>
      )}
    </Screen>
  );
}
