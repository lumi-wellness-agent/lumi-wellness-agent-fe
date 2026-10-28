"use client";

/**
 * 콘텐츠 명세를 읽는 원형 타이머·안내 음성 플레이어.
 * PR-06부터 구현하고, 같은 CIRCULAR_SESSION_TIMER 계약을 쓰는 PR-08·09·22로 확장한다.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { canSpeak, cancelSpeech, speakScript } from "@/lib/speech";
import { playTone } from "@/lib/tone";
import { useBrowserValue } from "@/lib/use-browser-value";
import { Button } from "@/ui/controls";
import type { ContentSlot } from "@/lib/api/types";
import type { ActivityResult, PlayerProps } from "../types";

type JsonObject = Record<string, unknown>;
type Cue = { remaining_seconds: number; script_id: string };

function object(value: unknown): JsonObject {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as JsonObject) : {};
}

function number(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function strings(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function cues(value: unknown): Cue[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    const cue = object(item);
    return typeof cue.remaining_seconds === "number" && typeof cue.script_id === "string"
      ? [{ remaining_seconds: cue.remaining_seconds, script_id: cue.script_id }]
      : [];
  });
}

function formatTime(seconds: number): string {
  return String(Math.floor(seconds / 60)).padStart(2, "0") + ":" + String(seconds % 60).padStart(2, "0");
}


/** 이미지·외부 폰트 없이 그리는 7세그먼트 숫자. 색은 현재 테마의 글자 토큰을 따른다. */
const SEGMENT_POINTS = [
  "7,2 33,2 38,6 33,10 7,10 2,6",
  "34,12 40,7 40,32 36,36 32,32 32,16",
  "36,38 40,42 40,67 34,62 32,58 32,42",
  "7,62 33,62 38,67 33,71 7,71 2,67",
  "0,42 4,38 8,42 8,58 6,62 0,67",
  "0,7 6,12 8,16 8,32 4,36 0,32",
  "8,33 32,33 36,37 32,41 8,41 4,37",
];
const DIGIT_SEGMENTS: Record<string, readonly number[]> = {
  "0": [0, 1, 2, 3, 4, 5],
  "1": [1, 2],
  "2": [0, 1, 6, 4, 3],
  "3": [0, 1, 2, 3, 6],
  "4": [5, 6, 1, 2],
  "5": [0, 5, 6, 2, 3],
  "6": [0, 5, 4, 3, 2, 6],
  "7": [0, 1, 2],
  "8": [0, 1, 2, 3, 4, 5, 6],
  "9": [0, 1, 2, 3, 5, 6],
};

function DigitalClock({ value }: { value: string }) {
  return (
    <span aria-hidden="true" className="inline-flex items-center gap-1 text-ink">
      {Array.from(value).map((digit, index) => digit === ":" ? (
        <svg key={index} width="10" height="48" viewBox="0 0 14 74" fill="currentColor">
          <rect x="3" y="22" width="8" height="8" rx="1" />
          <rect x="3" y="46" width="8" height="8" rx="1" />
        </svg>
      ) : (
        <svg key={index} width="26" height="48" viewBox="0 0 42 74" fill="currentColor">
          {(DIGIT_SEGMENTS[digit] ?? []).map((segment) => (
            <polygon key={segment} points={SEGMENT_POINTS[segment]} />
          ))}
        </svg>
      ))}
    </span>
  );
}

export default function GuidedTimerPlayer({ content, step, onFinish }: PlayerProps) {
  const [remaining, setRemaining] = useState(0);
  const [started, setStarted] = useState(false);
  const [preparing, setPreparing] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const speechAvailable = useBrowserValue(canSpeak, false);
  const finishRef = useRef(false);
  const mountedRef = useRef(true);
  const speechRunRef = useRef(0);
  const endAtRef = useRef(0);
  const handledCuesRef = useRef(new Set<string>());
  const beepedRef = useRef(new Set<number>());
  const onFinishRef = useRef(onFinish);
  useEffect(() => { onFinishRef.current = onFinish; }, [onFinish]);

  const spec = content.content_spec;
  const sessionUi = useMemo(() => object(spec.session_ui), [spec]);
  const timerSpec = useMemo(() => object(sessionUi.timer), [sessionUi]);
  const slots = useMemo(() => (spec.slots ?? []) as ContentSlot[], [spec]);
  const guide = useMemo(() => object(slots.find((slot) => slot.slot === "GUIDE_AUDIO")), [slots]);
  const render = useMemo(() => object(guide.render), [guide]);
  const policy = useMemo(() => object(guide.source_policy), [guide]);
  const scriptList = useMemo(() => Array.isArray(guide.scripts) ? guide.scripts : [], [guide]);
  const scriptById = useMemo(() => {
    const result = new Map<string, string>();
    for (const entry of scriptList) {
      const item = object(entry);
      if (typeof item.id === "string" && typeof item.text === "string") result.set(item.id, item.text);
    }
    return result;
  }, [scriptList]);
  const beforeTimer = strings(render.before_timer);
  const selectedScripts = object(guide.selection);
  const introOrder =
    beforeTimer.length > 0
      ? beforeTimer
      : strings(selectedScripts.script_ids).filter((id) => id === "guide.intro_text" || scriptById.has(id));
  const activitySeconds = Math.max(
    0,
    Math.floor(number(timerSpec.initial_seconds, number(render.activity_seconds, step.minutes * 60))),
  );
  const cueList = useMemo(() => cues(render.cues), [render]);
  const cueByTime = useMemo(() => new Map(cueList.map((cue) => [cue.remaining_seconds, cue])), [cueList]);
  const countdown = useMemo(() => {
    const config = object(render.countdown_sound);
    return new Set(
      Array.isArray(config.remaining_seconds)
        ? config.remaining_seconds.filter((value): value is number => typeof value === "number")
        : [],
    );
  }, [render]);
  const ttsAllowed = policy.tts !== "FORBIDDEN";

  const finishOnce = useCallback((result: ActivityResult) => {
    if (finishRef.current) return;
    finishRef.current = true;
    cancelSpeech();
    onFinishRef.current(result);
  }, []);

  const read = useCallback(async (text: string | undefined): Promise<void> => {
    if (!text || !ttsAllowed || !speechAvailable) return;
    const run = ++speechRunRef.current;
    setSpeaking(false);
    try {
      await speakScript(text, {
        rate: 0.85,
        pitch: 0.85,
        onSpeakingChange: (active) => {
          if (mountedRef.current && run === speechRunRef.current) setSpeaking(active);
        },
      });
    } finally {
      if (mountedRef.current && run === speechRunRef.current) setSpeaking(false);
    }
  }, [ttsAllowed, speechAvailable]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      cancelSpeech();
    };
  }, []);

  useEffect(() => {
    if (!started) return;
    const tick = () => {
      const next = Math.max(0, Math.ceil((endAtRef.current - Date.now()) / 1000));
      setRemaining(next);

      if (countdown.has(next) && !beepedRef.current.has(next)) {
        beepedRef.current.add(next);
        playTone();
      }

      const cue = cueByTime.get(next);
      if (cue && !handledCuesRef.current.has(cue.script_id)) {
        handledCuesRef.current.add(cue.script_id);
        const text = scriptById.get(cue.script_id);
        if (next === 0) {
          void read(text).finally(() => finishOnce({ completed: true }));
        } else if (text) {
          void read(text);
        }
      }

      if (next === 0 && !cueByTime.has(0)) finishOnce({ completed: true });
    };

    const timer = window.setInterval(tick, 250);
    return () => window.clearInterval(timer);
  }, [started, countdown, cueByTime, scriptById, read, finishOnce]);

  async function start() {
    if (preparing || started || finishRef.current) return;
    setPreparing(true);
    handledCuesRef.current.clear();
    beepedRef.current.clear();
    finishRef.current = false;
    cancelSpeech();

    try {
      if (ttsAllowed) {
        for (const id of introOrder) {
          const text = id === "guide.intro_text" ? content.guide_text : scriptById.get(id);
          await read(text);
          if (!mountedRef.current) return;
        }
      }
      endAtRef.current = Date.now() + activitySeconds * 1000;
      setRemaining(activitySeconds);
      setStarted(true);
    } finally {
      if (mountedRef.current) setPreparing(false);
    }
  }

  const timerLabel = remaining === 0 && !started ? activitySeconds : remaining;
  const instructions = content.guide_text;
  const title = step.label || content.name;
  const timerVisible = timerSpec.visible_during_instruction !== false;

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-1 flex-col items-center bg-page px-5 py-6 text-center">
      <p className="text-caption font-bold text-ink-muted">{title}</p>
      {timerVisible && (
        <div className="relative my-6 flex h-64 w-64 shrink-0 items-center justify-center">
          {/* 발화 이벤트에 맞춘 장식 파형. 실제 음성 신호의 진폭 분석은 아니다. */}
          {speaking && (
            <svg
              aria-hidden="true"
              viewBox="0 0 280 280"
              className="pointer-events-none absolute inset-0 h-full w-full stroke-indicator motion-reduce:hidden"
              fill="none"
            >
              {Array.from({ length: 72 }, (_, index) => {
                const length = 9 + ((index * 17) % 23);
                const middle = 5 + ((index * 11) % 14);
                return (
                  <line
                    key={index}
                    x1="140"
                    y1="32"
                    x2="140"
                    y2={32 - length}
                    transform={"rotate(" + index * 5 + " 140 140)"}
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    opacity={0.45 + (index % 4) * 0.15}
                  >
                    <animate
                      attributeName="y2"
                      values={[29, 32 - length, 32 - middle, 27, 32 - middle, 29].join(";")}
                      dur={0.65 + (index % 7) * 0.09 + "s"}
                      begin={-(index % 9) * 0.13 + "s"}
                      repeatCount="indefinite"
                    />
                  </line>
                );
              })}
            </svg>
          )}
          <div
            className="flex h-48 w-48 items-center justify-center rounded-full border border-indicator bg-primary-soft shadow-card"
            role="timer"
            aria-label={"남은 시간 " + formatTime(timerLabel)}
          >
            <time className="inline-flex items-center" dateTime={"PT" + timerLabel + "S"}>
              <span className="sr-only">{formatTime(timerLabel)}</span>
              <DigitalClock value={formatTime(timerLabel)} />
            </time>
          </div>
        </div>
      )}
      {instructions && (
        <p className="max-w-prose whitespace-pre-line break-keep text-body leading-relaxed text-ink">
          {instructions}
        </p>
      )}
      <p aria-live="polite" className="mt-4 text-caption text-ink-muted">
        {preparing
          ? "안내를 준비하고 있어요."
          : speaking
            ? "안내 음성을 재생하고 있어요."
            : started
              ? "편안한 속도로 이어가세요. 불편하면 언제든 멈출 수 있어요."
              : "준비되면 시작을 눌러 주세요."}
      </p>
      {!speechAvailable && ttsAllowed && (
        <p className="mt-2 text-caption text-ink-muted">
          이 브라우저에서 안내 음성을 재생할 수 없어 화면 안내만 표시합니다.
        </p>
      )}
      <div className="mt-auto w-full pt-8 pb-[env(safe-area-inset-bottom)]">
        {!started ? (
          <Button className="w-full" disabled={preparing} onClick={() => void start()}>
            {preparing ? "준비 중" : "시작"}
          </Button>
        ) : (
          <p className="text-caption text-ink-muted">활동이 끝나면 다음 단계로 이동합니다.</p>
        )}
      </div>
    </main>
  );
}
