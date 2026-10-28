"use client";
/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from "react";
import { Button, Card, Heading, Screen } from "@/ui/controls";
import type { PlayerProps } from "../types";

type State = { status: "DAILY_OVERVIEW" | "DAY_ENTRY" | "DAY_COMPLETED" | "STOPPED"; entries: string[]; startedAt: string | null; elapsedSeconds: number; submittedAt: string | null };
const KEY = "lumi.pr19.journal.v1";
const EMPTY = ["", "", ""];

export default function DailyJournalPlayer({ onFinish }: PlayerProps) {
  const [state, setState] = useState<State>({ status: "DAILY_OVERVIEW", entries: EMPTY, startedAt: null, elapsedSeconds: 0, submittedAt: null });
  const [now, setNow] = useState(() => Date.now());
  const validCount = state.entries.filter((value) => value.trim()).length;
  const entryDate = state.submittedAt ? new Date(state.submittedAt).toLocaleDateString("sv-SE") : new Date().toLocaleDateString("sv-SE");

  useEffect(() => { try { const saved = JSON.parse(localStorage.getItem(KEY) ?? "null") as Partial<State> | null; if (saved) setState({ status: saved.status ?? "DAY_ENTRY", entries: saved.entries ?? EMPTY, startedAt: saved.startedAt ?? null, elapsedSeconds: saved.elapsedSeconds ?? 0, submittedAt: saved.submittedAt ?? null }); } catch { localStorage.removeItem(KEY); } }, []);
  useEffect(() => { const timer = window.setTimeout(() => localStorage.setItem(KEY, JSON.stringify(state)), 500); return () => window.clearTimeout(timer); }, [state]);
  useEffect(() => { if (!state.startedAt || state.status === "DAY_COMPLETED") return; const timer = window.setInterval(() => setNow(Date.now()), 1000); return () => window.clearInterval(timer); }, [state.startedAt, state.status]);
  useEffect(() => { if (!state.startedAt || state.status === "DAY_COMPLETED") return; const elapsed = Math.floor((now - Date.parse(state.startedAt)) / 1000); setState((current) => current.elapsedSeconds === elapsed ? current : { ...current, elapsedSeconds: elapsed }); }, [now, state.startedAt, state.status, state.elapsedSeconds]);

  const updateEntry = (index: number, value: string) => setState((current) => { const entries = [...current.entries]; entries[index] = value; const startedAt = current.startedAt ?? new Date().toISOString(); return { ...current, status: "DAY_ENTRY", entries, startedAt }; });
  const submit = () => { if (validCount < 1) return; const submittedAt = new Date().toISOString(); setState((current) => ({ ...current, status: "DAY_COMPLETED", submittedAt })); window.setTimeout(() => { localStorage.removeItem(KEY); onFinish({ completed: true }); }, 0); };
  const stop = () => { localStorage.removeItem(KEY); setState((current) => ({ ...current, status: "STOPPED" })); onFinish({ completed: false, stoppedReason: "JOURNAL_STOPPED" }); };

  return <Screen footer={<div className="flex gap-2"><Button variant="quiet" onClick={stop}>그만하기</Button><Button onClick={submit} disabled={validCount < 1 || state.status === "DAY_COMPLETED"}>제출하기</Button></div>}>
    <Heading eyebrow="PR-19">오늘의 좋은 일 기록</Heading>
    <p className="text-ink-muted">오늘 어떤 좋은 일이 있었나요? 그 일이 왜 좋았는지도 함께 적어 보세요.</p>
    <Card className="mt-6"><h2 className="font-semibold">오늘의 기록</h2>{state.entries.map((value, index) => <textarea key={index} className="mt-3 min-h-28 w-full resize-y rounded-button border border-line bg-page p-3" value={value} maxLength={1000} placeholder={`${index + 1}번째 좋은 일`} onChange={(event) => updateEntry(index, event.target.value)} />)}<p className="mt-3 text-caption text-ink-muted">공백만 입력한 칸은 기록으로 인정하지 않습니다. {validCount}/3개 입력</p></Card>
    {state.status === "DAY_COMPLETED" && <p className="mt-4 text-ink-muted">오늘 기록을 저장했습니다. 기록 날짜: {entryDate}</p>}
    <p className="mt-5 text-caption text-ink-muted">권장 시간은 약 5분이며, 완료 조건은 아닙니다. 7일 전체 수행 여부와 오늘 기록 완료는 별도로 관리됩니다.</p>
  </Screen>;
}
