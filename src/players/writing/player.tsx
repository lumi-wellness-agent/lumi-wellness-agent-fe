"use client";
/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useMemo, useState } from "react";
import { Button, Card, Heading, Screen } from "@/ui/controls";
import type { PlayerProps } from "../types";

type Status = "READY" | "WRITING" | "PAUSED" | "COMPLETED" | "STOPPED";
type Draft = { status: Status; text: string; elapsedSeconds: number; startedAt: string | null; activityCompleted: boolean; refreshCount: number };
const KEY = "lumi.pr18.writing.v1";
const MINIMUM = 300;
const MAXIMUM = 5000;

function normalizedLength(text: string) { return text.replace(/\s+/g, " ").trim().length; }

export default function WritingPlayer({ onFinish }: PlayerProps) {
  const [draft, setDraft] = useState<Draft>({ status: "READY", text: "", elapsedSeconds: 0, startedAt: null, activityCompleted: false, refreshCount: 0 });
  const [now, setNow] = useState(() => Date.now());
  const [restored, setRestored] = useState(false);
  const length = useMemo(() => normalizedLength(draft.text), [draft.text]);
  const canComplete = length >= MINIMUM && !draft.activityCompleted;

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(KEY) ?? "null") as Partial<Draft> | null;
      if (saved) {
        setRestored(true);
        setDraft({ status: saved.status === "WRITING" ? "PAUSED" : saved.status ?? "READY", text: saved.text ?? "", elapsedSeconds: saved.elapsedSeconds ?? 0, startedAt: saved.startedAt ?? null, activityCompleted: saved.activityCompleted ?? false, refreshCount: (saved.refreshCount ?? 0) + 1 });
      }
    } catch { localStorage.removeItem(KEY); }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => localStorage.setItem(KEY, JSON.stringify(draft)), 500);
    return () => window.clearTimeout(timer);
  }, [draft]);

  useEffect(() => {
    if (draft.status !== "WRITING" || !draft.startedAt) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [draft.status, draft.startedAt]);

  useEffect(() => {
    if (draft.status !== "WRITING" || !draft.startedAt) return;
    const elapsed = Math.max(0, Math.floor((now - Date.parse(draft.startedAt)) / 1000));
    setDraft((current) => current.elapsedSeconds === elapsed ? current : { ...current, elapsedSeconds: elapsed });
  }, [now, draft.status, draft.startedAt, draft.elapsedSeconds]);

  const updateText = (value: string) => {
    const text = value.slice(0, MAXIMUM);
    setDraft((current) => {
      if (current.status === "READY" && text.length > 0) return { ...current, text, status: "WRITING", startedAt: new Date().toISOString() };
      if (current.status === "PAUSED" && text !== current.text) return { ...current, text, status: "WRITING", startedAt: new Date(Date.now() - current.elapsedSeconds * 1000).toISOString() };
      return { ...current, text };
    });
  };

  const complete = () => {
    if (!canComplete) return;
    setDraft((current) => ({ ...current, status: "COMPLETED", activityCompleted: true }));
    window.setTimeout(() => { localStorage.removeItem(KEY); onFinish({ completed: true }); }, 0);
  };

  const stop = () => { localStorage.removeItem(KEY); setDraft((current) => ({ ...current, status: "STOPPED" })); onFinish({ completed: false, stoppedReason: "WRITING_STOPPED" }); };

  return <Screen footer={<div className="flex gap-2"><Button variant="quiet" onClick={stop}>그만하기</Button><Button onClick={complete} disabled={!canComplete}>완료</Button></div>}>
    <Heading eyebrow="PR-18">강렬한 긍정 경험 글쓰기</Heading>
    <p className="text-ink-muted">살면서 가장 멋졌던 경험이나 가장 행복했던 순간을 하나 골라 보세요. 그 순간의 느낌과 생각, 감정을 떠올리며 경험을 되도록 자세히 적어 보세요.</p>
    {restored && <p className="mt-4 text-caption text-ink-muted">이전에 작성하던 내용을 복구했습니다. 글을 다시 입력하면 활동을 이어갑니다.</p>}
    <Card className="mt-6"><label htmlFor="writing-text" className="font-semibold">경험 기록</label><textarea id="writing-text" className="mt-3 min-h-64 w-full resize-y rounded-button border border-line bg-page p-3" value={draft.text} maxLength={MAXIMUM} onChange={(event) => updateText(event.target.value)} placeholder="그때 들었던 느낌과 생각, 감정을 담아 자세히 적어 보세요." /><div className="mt-2 flex justify-between text-caption text-ink-muted"><span>현재 {length}자</span><span>최대 {MAXIMUM}자</span></div><p className="mt-2 text-caption text-ink-muted">{length >= MINIMUM ? "최소 300자 충족 · 완료할 수 있어요." : "최소 300자 이상 작성하면 완료할 수 있어요."}</p></Card>
    <p className="mt-5 text-caption text-ink-muted">권장 시간은 약 15분이며, 시간은 완료 조건이 아닙니다.</p>
  </Screen>;
}
