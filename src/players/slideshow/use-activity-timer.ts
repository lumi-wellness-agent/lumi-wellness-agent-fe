"use client";

/**
 * 활동 타이머 — 정해진 시간(초)을 세고, 끝나면 onDone을 한 번 부른다. 담당 A(TEAM.md).
 *
 * 멈춤 · 다시 시작을 지원하고, 도는 동안 화면이 꺼지지 않게 Wake Lock을 요청한다(지원하지 않는 브라우저는 그냥 넘어간다).
 * 이미지 감상(slideshow) · 소리·영상(listening) · 이미지 + 명상(image-meditation)이 함께 쓴다. 다른 담당도 import해서 쓸 수 있다.
 */

import { useEffect, useRef, useState } from "react";

export type ActivityTimer = {
  elapsed: number; // 지난 초
  remaining: number; // 남은 초
  progress: number; // 0~1
  paused: boolean;
  done: boolean;
  togglePause: () => void;
};

export function useActivityTimer(totalSeconds: number, onDone: () => void): ActivityTimer {
  const total = Math.max(1, Math.round(totalSeconds));
  const [elapsed, setElapsed] = useState(0);
  const [paused, setPaused] = useState(false);
  const done = elapsed >= total;
  const onDoneRef = useRef(onDone);
  const fired = useRef(false);

  useEffect(() => {
    onDoneRef.current = onDone;
  }, [onDone]);

  useEffect(() => {
    if (paused || done) return;
    const timer = setInterval(() => setElapsed((e) => Math.min(e + 1, total)), 1000);
    return () => clearInterval(timer);
  }, [paused, done, total]);

  useEffect(() => {
    if (done && !fired.current) {
      fired.current = true;
      onDoneRef.current();
    }
  }, [done]);

  useWakeLock(!paused && !done);

  return {
    elapsed,
    remaining: total - elapsed,
    progress: elapsed / total,
    paused,
    done,
    togglePause: () => setPaused((p) => !p),
  };
}

/** 켜져 있는 동안 화면이 꺼지지 않게 한다. 탭이 다시 보이면 다시 요청한다(브라우저가 숨길 때 풀어 버린다). */
function useWakeLock(active: boolean) {
  useEffect(() => {
    if (!active || typeof navigator === "undefined" || !("wakeLock" in navigator)) return;
    let lock: WakeLockSentinel | null = null;
    let cancelled = false;
    const request = async () => {
      try {
        lock = await navigator.wakeLock.request("screen");
        if (cancelled) await lock.release();
      } catch {
        // 배터리 절약 모드 등으로 거절되면 그냥 넘어간다
      }
    };
    const onVisible = () => {
      if (document.visibilityState === "visible") void request();
    };
    void request();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisible);
      void lock?.release().catch(() => {});
    };
  }, [active]);
}

/** 초 → "m:ss". */
export function formatClock(seconds: number): string {
  const s = Math.max(0, Math.round(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}
