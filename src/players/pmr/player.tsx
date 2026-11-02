"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMessages } from "@/i18n/use-locale";
import { canSpeak, cancelSpeech, speakScript } from "@/lib/speech";
import { Button } from "@/ui/controls";
import type { PlayerProps } from "../types";
import { BodySilhouette } from "./body-silhouette";
import { PMR } from "./messages";
import { obj, parsePmr, positionAt, skipDelta, type PhaseName } from "./timeline";

type Mode = "ready" | "preparing" | "active" | "closing";
const clock = (seconds: number) => String(Math.floor(seconds / 60)).padStart(2, "0") + ":" + String(seconds % 60).padStart(2, "0");

export default function PmrPlayer({ content, onFinish }: PlayerProps) {
  const t = useMessages(PMR);
  const timeline = useMemo(() => parsePmr(content.content_spec), [content.content_spec]);
  const [mode, setMode] = useState<Mode>("ready");
  const [elapsed, setElapsed] = useState(0);
  const [caption, setCaption] = useState(content.guide_text);
  const [overrun, setOverrun] = useState(false);
  const [audioUnavailable, setAudioUnavailable] = useState(false);
  const mounted = useRef(true);
  const startAt = useRef(0);
  const offset = useRef(0);
  const speechRun = useRef(0);
  const busy = useRef(false);
  const lastCue = useRef("");
  const lastRegion = useRef("");
  const instructed = useRef("");
  const skippedTension = useRef("");
  const finishing = useRef(false);
  const starting = useRef(false);
  const onFinishRef = useRef(onFinish);
  useEffect(() => { onFinishRef.current = onFinish; }, [onFinish]);
  const slots = content.content_spec.slots ?? [];
  const guide = obj(slots.find(s => s.slot === "GUIDE_AUDIO"));
  const ttsAllowed = obj(guide.source_policy).tts !== "FORBIDDEN";

  const say = useCallback(async (text: string): Promise<void> => {
    const run = ++speechRun.current;
    cancelSpeech();
    busy.current = false;
    if (mounted.current) setCaption(text);
    if (!text || !ttsAllowed) return;
    if (!canSpeak()) {
      if (mounted.current) setAudioUnavailable(true);
      return;
    }
    busy.current = true;
    try {
      const played = await speakScript(text, { rate: 0.85 });
      if (mounted.current && run === speechRun.current && !played) setAudioUnavailable(true);
    } catch {
      if (mounted.current && run === speechRun.current) setAudioUnavailable(true);
    } finally {
      if (run === speechRun.current) busy.current = false;
    }
  }, [ttsAllowed]);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      speechRun.current += 1;
      cancelSpeech();
    };
  }, []);

  const close = useCallback(async () => {
    if (!timeline || finishing.current) return;
    finishing.current = true;
    setMode("closing");
    await say(timeline.end);
    if (mounted.current) onFinishRef.current({ completed: true });
  }, [timeline, say]);

  useEffect(() => {
    if (mode !== "active" || !timeline) return;
    const timer = window.setInterval(() => {
      if (finishing.current) return;
      const current = (Date.now() - startAt.current) / 1000 + offset.current;
      const p = positionAt(timeline, current);
      setElapsed(current);
      if (p.done) {
        void close();
        return;
      }
      const region = timeline.regions[p.regionIndex];
      const phase = timeline.phases[p.phaseIndex];
      const script = timeline.scripts[region.id];
      if (lastRegion.current !== region.id) {
        lastRegion.current = region.id;
        skippedTension.current = "";
        setOverrun(false);
      }
      const key = region.id + ":" + phase.phase;
      if (lastCue.current === key) return;
      lastCue.current = key;
      if (phase.phase === "INSTRUCTION") {
        instructed.current = region.id;
        void say(script.instruction_text);
      } else if (phase.phase === "TENSE") {
        // Never extend tension while waiting for delayed narration, or issue a late tension cue.
        if (busy.current || instructed.current !== region.id) {
          skippedTension.current = region.id;
          setOverrun(true);
          void say(script.relaxation_cue);
        } else {
          void say(script.tension_cue);
        }
      } else if (phase.phase === "RELAX") {
        if (skippedTension.current !== region.id) void say(script.relaxation_cue);
      } else {
        void say(script.transition_text);
      }
    }, 100);
    return () => window.clearInterval(timer);
  }, [mode, timeline, say, close]);

  async function start() {
    if (!timeline || starting.current || mode !== "ready") return;
    starting.current = true;
    setMode("preparing");
    for (const text of [content.guide_text, timeline.pre]) {
      await say(text);
      if (!mounted.current) return;
    }
    startAt.current = Date.now();
    offset.current = 0;
    setMode("active");
  }

  function skip() {
    if (!timeline || mode !== "active" || finishing.current) return;
    const current = (Date.now() - startAt.current) / 1000 + offset.current;
    offset.current += skipDelta(timeline, current);
    speechRun.current += 1;
    cancelSpeech();
    busy.current = false;
    lastCue.current = "";
    setElapsed((Date.now() - startAt.current) / 1000 + offset.current);
  }

  if (!timeline) {
    return (
      <main className="mx-auto flex w-full max-w-[480px] flex-col gap-4 px-5 py-6 text-ink">
        <p>{t.specFailed}</p>
        <Button onClick={() => onFinish({ completed: false, stoppedReason: "PMR_SPEC_UNAVAILABLE" })}>{t.end}</Button>
      </main>
    );
  }
  const p = positionAt(timeline, elapsed);
  const region = timeline.regions[p.regionIndex];
  const rawPhase = timeline.phases[p.phaseIndex];
  const active = mode === "active" && !p.done;
  const phase: PhaseName | null = active
    ? overrun && rawPhase.phase === "TENSE" ? "RELAX" : rawPhase.phase
    : null;
  const phaseLabel = phase === "RELAX" && rawPhase.phase === "TENSE"
    ? timeline.phases.find(item => item.phase === "RELAX")?.label
    : rawPhase.label;

  return (
    <main className="mx-auto flex w-full max-w-[480px] flex-1 flex-col items-center bg-page px-5 py-5 text-center text-ink">
      <p className="text-caption text-ink-muted">{content.name}</p>
      <div className="mt-3 flex w-full items-center justify-between text-caption text-ink-muted">
        <span>{active ? t.region(p.regionIndex + 1, timeline.regions.length) : mode === "closing" ? t.closing : t.ready}</span>
        <span role="timer" aria-label={t.remaining(clock(p.remaining))} className="tabular-nums">{clock(p.remaining)}</span>
      </div>
      <h1 className="mt-3 font-display text-title">{active ? region.label : mode === "closing" ? t.closingTitle : t.preparingTitle}</h1>
      <p aria-live="polite" className="mt-1 min-h-6 text-body text-ink-muted">
        {active ? phaseLabel + " · " + t.seconds(p.phaseRemaining) : mode === "preparing" ? t.listening : t.sit}
      </p>
      <BodySilhouette region={active ? region.id : null} label={active ? region.label : t.wholeBody} phase={phase} />
      <p aria-live="polite" className="mt-3 min-h-12 whitespace-pre-line break-keep text-body">{caption}</p>
      {overrun && active && (
        <p className="mt-2 text-caption text-ink-muted">{t.overrun}</p>
      )}
      {audioUnavailable && <p className="mt-2 text-caption text-ink-muted">{t.noAudio}</p>}
      <div className="mt-auto flex w-full flex-col gap-2 pt-4 pb-[env(safe-area-inset-bottom)]">
        {mode === "ready" ? (
          <Button onClick={() => void start()}>{t.start}</Button>
        ) : active ? (
          <Button variant="secondary" onClick={skip}>{t.skip}</Button>
        ) : (
          <p className="text-caption text-ink-muted">{mode === "closing" ? t.afterClosing : t.afterIntro}</p>
        )}
        <p className="text-caption text-ink-muted">{t.colorNote}</p>
      </div>
    </main>
  );
}
