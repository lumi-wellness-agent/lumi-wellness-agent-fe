"use client";

import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { cancelSpeech, canSpeak, loadVoices, speakScript, splitScript, unlockSpeech } from "@/lib/speech";
import { Button } from "@/ui/controls";
import type { PlayerProps } from "../types";
import { groundReducer, initialGroundState, parseGrounding } from "./sequence";
import { SenseArt } from "./sense-art";

export default function GroundingPlayer({ content, onFinish }: PlayerProps) {
  const spec = useMemo(() => parseGrounding(content.content_spec), [content.content_spec]);
  const [state, dispatch] = useReducer(groundReducer, initialGroundState);
  const [caption, setCaption] = useState("");
  const [reading, setReading] = useState(false);
  const [silent, setSilent] = useState(false);
  const [replay, setReplay] = useState(0);
  const mounted = useRef(false);
  const run = useRef(0);
  const finished = useRef(false);
  const finishRef = useRef(onFinish);
  useEffect(() => { finishRef.current = onFinish; }, [onFinish]);
  useEffect(() => {
    mounted.current = true;
    void loadVoices();
    return () => { mounted.current = false; run.current++; cancelSpeech(); };
  }, []);
  const finish = useCallback(() => {
    if (!spec || finished.current || !mounted.current) return;
    finished.current = true;
    run.current++;
    cancelSpeech();
    const labels = state.skipped.map((index) => spec.stages[index].label);
    finishRef.current(labels.length
      ? { completed: false, stoppedReason: "건너뛴 단계: " + labels.join(", ") }
      : { completed: true });
  }, [spec, state.skipped]);

  const read = useCallback(async (text: string, mine: number): Promise<boolean> => {
    const current = () => mounted.current && mine === run.current;
    if (!current()) return false;
    setCaption(text);
    if (!spec?.tts || !canSpeak()) {
      setSilent(true);
      setReading(false);
      return false;
    }
    setReading(true);
    try {
      for (const chunk of splitScript(text)) {
        if (!current()) return false;
        setCaption(chunk.text);
        const ok = await speakScript(chunk.text, { rate: 0.85 });
        if (!current()) return false;
        if (!ok) {
          setSilent(true);
          setCaption(text);
          return false;
        }
        if (chunk.pauseMs) await new Promise((resolve) => setTimeout(resolve, chunk.pauseMs));
      }
      return current();
    } catch {
      if (current()) { setSilent(true); setCaption(text); }
      return false;
    } finally {
      if (current()) setReading(false);
    }
  }, [spec]);

  useEffect(() => {
    if (!spec) return;
    const mine = ++run.current;
    cancelSpeech();
    const stage = spec.stages[state.index];
    const text = state.phase === "intro" ? spec.intro : state.phase === "end" ? spec.end
      : [stage.text, stage.exampleText].filter(Boolean).join("\n\n");
    void read(text, mine).then((ok) => {
      if (!mounted.current || mine !== run.current) return;
      if (state.phase === "intro") {
        if (ok) dispatch({ type: "INTRO_DONE" });
        return;
      }
      if (state.phase === "end" && ok) finish();
    });
    return () => { run.current++; cancelSpeech(); };
  }, [spec, state.phase, state.index, read, replay, finish]);

  if (!spec) return (
    <div className="p-4 text-body text-ink">
      <p>감각 안내를 불러오지 못했어요.</p>
      <Button onClick={() => onFinish({ completed: false, stoppedReason: "GROUNDING_SPEC_UNAVAILABLE" })}>돌아가기</Button>
    </div>
  );
  const stage = spec.stages[state.index];
  return (
    <div className="mx-auto flex w-full max-w-[480px] flex-1 flex-col gap-4 px-5 py-5">
      <h2 className="font-display text-title break-keep text-ink">{content.name}</h2>
      <>
          {state.phase === "active" && (
            <>
              <ol className="flex justify-center gap-3" aria-label="감각 단계 진행">
                {spec.stages.map((s, i) => (
                  <li key={s.id} aria-current={i === state.index ? "step" : undefined}
                    className={i === state.index
                      ? "flex h-10 w-10 items-center justify-center rounded-full bg-primary text-body text-on-primary"
                      : "flex h-10 w-10 items-center justify-center rounded-full bg-primary-soft text-body text-on-primary-soft"}>
                    <span className="sr-only">{s.label} </span>{s.count}
                  </li>
                ))}
              </ol>
              <SenseArt id={stage.id} label={stage.label} count={stage.count} />
              <h3 className="text-center font-display text-title text-ink">{stage.label} · {stage.count}가지</h3>
              {stage.examples.length > 0 && (
                <p className="text-center text-caption break-keep text-ink-muted">예: {stage.examples.join(" · ")}</p>
              )}
              <p className="min-h-24 text-body break-keep whitespace-pre-line text-ink">
                {caption || stage.text}
              </p>
            </>
          )}
          {state.phase !== "active" && (
            <div className="flex flex-1 flex-col justify-start gap-3 pt-8">
              <h3 className="font-display text-title text-ink">
                {state.phase === "intro" ? "시작 안내" : "마무리 안내"}
              </h3>
              <p className="min-h-24 text-body break-keep whitespace-pre-line text-ink">
                {caption || (state.phase === "intro" ? spec.intro : spec.end)}
              </p>
            </div>
          )}
          {silent && <p className="text-caption text-ink-muted">음성을 사용할 수 없어 글로 안내하고 있어요. 자신의 속도로 진행해 주세요.</p>}
          <div className="mt-auto flex flex-col gap-2 pt-4 pb-[env(safe-area-inset-bottom)]">
            {state.phase === "intro" && silent && !reading && (
              <Button onClick={() => dispatch({ type: "INTRO_DONE" })}>음성 없이 첫 단계로</Button>
            )}
            {state.phase === "active" && (
              <>
                <Button onClick={() => dispatch({ type: "NEXT", total: spec.stages.length })}>
                  {state.index === spec.stages.length - 1 ? "마무리하기" : "다음 단계"}
                </Button>
                <Button variant="quiet" onClick={() => dispatch({ type: "SKIP", total: spec.stages.length })}>이 단계 건너뛰기</Button>
                <Button variant="quiet" onClick={() => { unlockSpeech(); setReplay((v) => v + 1); }}>안내 다시 듣기</Button>
              </>
            )}
            {state.phase === "end" && (
              <>
                {state.skipped.length > 0 && <p className="text-caption text-ink-muted">건너뛴 단계: {state.skipped.map((i) => spec.stages[i].label).join(" · ")}</p>}
                <Button disabled={reading} onClick={finish}>{reading ? "마무리 안내 중…" : "다음으로"}</Button>
              </>
            )}
          </div>
      </>
    </div>
  );
}
