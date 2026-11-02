"use client";
/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useMemo, useRef, useState } from "react";
import { useMessages } from "@/i18n/use-locale";
import { Button, Card, Heading, Screen } from "@/ui/controls";
import type { PlayerProps } from "../types";
import { WRITING } from "./messages";

type Status = "READY" | "WRITING" | "PAUSED" | "COMPLETED" | "STOPPED";
type Draft = { status: Status; text: string; elapsedSeconds: number; startedAt: string | null; activityCompleted: boolean; refreshCount: number };
const KEY = "lumi.pr18.writing.v1";
const SAVED_TTL_MS = 3 * 60 * 60 * 1000; // 이보다 오래된 기록은 지난 세션 것으로 보고 새로 시작한다
const MINIMUM = 300;
const MAXIMUM = 5000;

function normalizedLength(text: string) { return text.replace(/\s+/g, " ").trim().length; }

export default function WritingPlayer({ step, onFinish }: PlayerProps) {
  const t = useMessages(WRITING);
  const [draft, setDraft] = useState<Draft>({ status: "READY", text: "", elapsedSeconds: 0, startedAt: null, activityCompleted: false, refreshCount: 0 });
  const [now, setNow] = useState(() => Date.now());
  const [restored, setRestored] = useState(false);
  const leaving = useRef<number | null>(null);
  const length = useMemo(() => normalizedLength(draft.text), [draft.text]);
  const canComplete = length >= MINIMUM && !draft.activityCompleted;

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(KEY) ?? "null") as (Partial<Draft> & { savedAt?: number }) | null;
      if (saved && Date.now() - (saved.savedAt ?? 0) < SAVED_TTL_MS) {
        setRestored(true);
        setDraft({ status: saved.status === "WRITING" ? "PAUSED" : saved.status ?? "READY", text: saved.text ?? "", elapsedSeconds: saved.elapsedSeconds ?? 0, startedAt: saved.startedAt ?? null, activityCompleted: saved.activityCompleted ?? false, refreshCount: (saved.refreshCount ?? 0) + 1 });
      }
    } catch { localStorage.removeItem(KEY); }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => localStorage.setItem(KEY, JSON.stringify({ ...draft, savedAt: Date.now() })), 500);
    return () => window.clearTimeout(timer);
  }, [draft]);

  // 활동을 떠나면(완료 · 그만하기 · 화면 위 그만하기) 기록을 지운다. 새로고침에는 정리 함수가 돌지 않아 이어서 할 수 있고, 개발 모드의 마운트 → 정리 → 마운트에서는 지우기를 취소한다
  useEffect(() => {
    if (leaving.current !== null) window.clearTimeout(leaving.current);
    return () => { leaving.current = window.setTimeout(() => localStorage.removeItem(KEY), 0); };
  }, []);

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

  return <Screen footer={<div className="flex gap-2"><Button variant="quiet" onClick={stop}>{t.stop}</Button><Button onClick={complete} disabled={!canComplete}>{t.done}</Button></div>}>
    <Heading>{t.title}</Heading>
    <p className="text-ink-muted">{t.intro}</p>
    {restored && <p className="mt-4 text-caption text-ink-muted">{t.restored}</p>}
    <Card className="mt-6"><label htmlFor="writing-text" className="font-semibold">{t.label}</label><textarea id="writing-text" className="mt-3 min-h-64 w-full resize-y rounded-button border border-line bg-page p-3" value={draft.text} maxLength={MAXIMUM} onChange={(event) => updateText(event.target.value)} placeholder={t.placeholder} /><div className="mt-2 flex justify-between text-caption text-ink-muted"><span>{t.length(length)}</span><span>{t.maximum(MAXIMUM)}</span></div><p className="mt-2 text-caption text-ink-muted">{length >= MINIMUM ? t.minimumMet(MINIMUM) : t.minimumNeeded(MINIMUM)}</p></Card>
    <p className="mt-5 text-caption text-ink-muted">{t.recommended(Math.round(step.minutes))}</p>
  </Screen>;
}
