"use client";
/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useRef, useState } from "react";
import { useMessages } from "@/i18n/use-locale";
import { Button, Card, Heading, Screen } from "@/ui/controls";
import type { PlayerProps } from "../types";
import { NOTICING_WALK } from "./messages";
type Status = "READY" | "RUNNING" | "PAUSED" | "TARGET_REACHED" | "NOTICING";
type State = { status: Status; elapsed: number; env: boolean; body: boolean; notices: string[] };
const KEY = "lumi.pr12.noticing.v1"; const TARGET = 1800; const SAVED_TTL_MS = 3 * 60 * 60 * 1000; // 이보다 오래된 기록은 지난 세션 것으로 보고 새로 시작한다
export default function OutdoorWalkNoticingPlayer({ onFinish }: PlayerProps) {
  const t = useMessages(NOTICING_WALK);
  const [state, setState] = useState<State>({ status: "READY", elapsed: 0, env: false, body: false, notices: ["", "", ""] });
  const [hydrated, setHydrated] = useState(false); const leaving = useRef<number | null>(null);
  const [startedAt, setStartedAt] = useState<number | null>(null); const [now, setNow] = useState(() => Date.now());
  const recorded = state.notices.filter((value) => value.trim()).length; const progress = Math.min(100, Math.round((state.elapsed / TARGET) * 100));
  const formatTime = (seconds: number) => `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
  useEffect(() => { try { const saved = JSON.parse(localStorage.getItem(KEY) ?? "null") as (Partial<State> & { savedAt?: number }) | null; if (saved && Date.now() - (saved.savedAt ?? 0) < SAVED_TTL_MS) setState({ status: saved.status === "RUNNING" ? "PAUSED" : saved.status ?? "READY", elapsed: saved.elapsed ?? 0, env: saved.env ?? false, body: saved.body ?? false, notices: saved.notices ?? ["", "", ""] }); } catch { localStorage.removeItem(KEY); } finally { setHydrated(true); } }, []);
  useEffect(() => { if (hydrated) localStorage.setItem(KEY, JSON.stringify({ ...state, savedAt: Date.now() })); }, [state, hydrated]);
  // 활동을 떠나면(완료 · 그만하기 · 화면 위 그만하기) 기록을 지운다. 새로고침에는 정리 함수가 돌지 않아 이어서 할 수 있고, 개발 모드의 마운트 → 정리 → 마운트에서는 지우기를 취소한다
  useEffect(() => { if (leaving.current !== null) window.clearTimeout(leaving.current); return () => { leaving.current = window.setTimeout(() => localStorage.removeItem(KEY), 0); }; }, []);
  useEffect(() => { if (state.status !== "RUNNING") return; const timer = window.setInterval(() => setNow(Date.now()), 1000); return () => window.clearInterval(timer); }, [state.status]);
  useEffect(() => { if (state.status !== "RUNNING" || !startedAt) return; const elapsed = Math.min(TARGET, Math.floor((now - startedAt) / 1000)); setState((current) => current.elapsed === elapsed ? current : { ...current, elapsed, status: elapsed >= TARGET ? "TARGET_REACHED" : "RUNNING" }); }, [now, startedAt, state.status, state.elapsed]);
  const start = () => { setStartedAt(Date.now() - state.elapsed * 1000); setState((value) => ({ ...value, status: "RUNNING" })); }; const pause = () => { setStartedAt(null); setState((value) => ({ ...value, status: "PAUSED" })); }; const resume = () => { setStartedAt(Date.now() - state.elapsed * 1000); setState((value) => ({ ...value, status: "RUNNING" })); }; const stop = () => { localStorage.removeItem(KEY); onFinish({ completed: false, stoppedReason: "SAFETY_OR_DISCOMFORT" }); }; const submit = () => { if (recorded < 1) return; localStorage.removeItem(KEY); onFinish({ completed: true, noticeWords: state.notices.map((value) => value.trim()).filter(Boolean) }); };
  return <Screen footer={<div className="flex flex-col gap-2">{state.status === "RUNNING" && <Button variant="secondary" onClick={pause}>{t.pause}</Button>}{state.status === "PAUSED" && <Button onClick={resume}>{t.resume}</Button>}{["RUNNING", "PAUSED", "TARGET_REACHED"].includes(state.status) && <Button variant="quiet" onClick={stop}>{t.stop}</Button>}{state.status === "TARGET_REACHED" && <Button onClick={() => setState((value) => ({ ...value, status: "NOTICING" }))}>{t.endWalk}</Button>}{state.status === "NOTICING" && <Button onClick={submit} disabled={recorded < 1}>{t.save}</Button>}</div>}>
    <Heading>{t.title}</Heading><p className="text-ink-muted">{t.intro}</p>
    {(state.status === "READY" || state.status === "PAUSED") && <Card className="mt-5"><h2 className="font-semibold">{t.safety}</h2><label className="mt-4 flex gap-2"><input type="checkbox" checked={state.env} onChange={(event) => setState((value) => ({ ...value, env: event.target.checked }))} /><span>{t.env}</span></label><label className="mt-3 flex gap-2"><input type="checkbox" checked={state.body} onChange={(event) => setState((value) => ({ ...value, body: event.target.checked }))} /><span>{t.body}</span></label>{state.status === "READY" && <Button className="mt-5 w-full" onClick={start} disabled={!state.env || !state.body}>{t.start}</Button>}</Card>}
    {["RUNNING", "PAUSED", "TARGET_REACHED"].includes(state.status) && <div className="mt-8"><div className="flex justify-between font-semibold"><span>{t.elapsed(formatTime(state.elapsed))}</span><span>{t.progress(progress)}</span></div><div className="mt-3 h-4 rounded-full bg-surface-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${progress}%` }} /></div><div className="mt-1 flex justify-end text-caption text-ink-muted">{t.recommended}</div>{state.status === "TARGET_REACHED" && <p className="mt-3 text-ink-muted">{t.timeUp}</p>}</div>}
    {state.status === "NOTICING" && <Card className="mt-6"><h2 className="font-semibold">{t.notes}</h2><p className="mt-2 text-ink-muted">{t.notesHint}</p>{state.notices.map((value, index) => <input key={index} className="mt-3 min-h-12 w-full rounded-button border border-line px-3" value={value} maxLength={20} placeholder={t.placeholder(index + 1)} onChange={(event) => setState((current) => ({ ...current, notices: current.notices.map((item, itemIndex) => itemIndex === index ? event.target.value.replace(/\s+/g, " ").slice(0, 20) : item) }))} />)}<p className="mt-3 text-caption text-ink-muted">{t.notesRule(recorded)}</p></Card>}
    <p className="mt-8 text-caption text-ink-muted">{t.disclaimer}</p>
  </Screen>;
}
