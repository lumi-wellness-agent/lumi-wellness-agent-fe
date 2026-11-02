"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useMessages } from "@/i18n/use-locale";
import { assetUrl } from "@/lib/api/client";
import { cancelSpeech, canSpeak, loadVoices, speakScript, splitScript, unlockSpeech } from "@/lib/speech";
import { Button, Spinner } from "@/ui/controls";
import type { PlayerProps } from "../types";
import { REST } from "./messages";
import { cueAt, parseRest } from "./spec";
import { playVideo } from "./play-video";
import { NatureTimer, VideoTimer } from "./nature-timer";

export default function RestPlayer({ content, onFinish }: PlayerProps) {
  const t = useMessages(REST);
  const spec = useMemo(() => parseRest(content.content_spec), [content.content_spec]);
  const video = content.assets.find((asset) => asset.slot === "VISUAL_VIDEO" && asset.url);
  const [modeId, setModeId] = useState<string | null>(null);
  const mode = spec?.modes.find((m) => m.id === modeId);
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [caption, setCaption] = useState("");
  const [starting, setStarting] = useState(false);
  const startRequest = useRef<AbortController | null>(null);
  const [error, setError] = useState<"videoSlow" | "videoPlayFailed" | "videoLoadFailed" | null>(null); // 문장은 그릴 때 지금 언어로 고른다
  const [silent, setSilent] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const origin = useRef(0);
  const finished = useRef(false);
  const mounted = useRef(false);
  const generation = useRef(0);
  const lastCue = useRef("");
  const finishRef = useRef(onFinish);
  const speechAllowed = content.content_spec.slots?.find((s) => s.slot === "GUIDE_AUDIO")
    ?.source_policy;
  const ttsAllowed = !(speechAllowed && typeof speechAllowed === "object"
    && "tts" in speechAllowed && speechAllowed.tts === "FORBIDDEN");

  useEffect(() => { finishRef.current = onFinish; }, [onFinish]);
  useEffect(() => {
    mounted.current = true;
    void loadVoices();
    const media = videoRef.current;
    return () => {
      mounted.current = false;
      startRequest.current?.abort();
      generation.current += 1;
      cancelSpeech();
      media?.pause();
    };
  }, []);

  const say = (text: string) => {
    const mine = ++generation.current;
    cancelSpeech();
    setSpeaking(false);
    if (!ttsAllowed || !canSpeak()) {
      setCaption(text);
      setSilent(true);
      return;
    }
    void (async () => {
      for (const chunk of splitScript(text)) {
        if (!mounted.current || mine !== generation.current) return;
        setCaption(chunk.text);
        setSpeaking(true);
        const ok = await speakScript(chunk.text, { rate: 0.85 });
        if (!mounted.current || mine !== generation.current) return;
        setSpeaking(false);
        if (!ok) {
          setSilent(true);
          setCaption(text);
          return;
        }
        if (chunk.pauseMs) await new Promise((resolve) => setTimeout(resolve, chunk.pauseMs));
      }
    })().catch(() => {
      if (mounted.current && mine === generation.current) {
        setSpeaking(false);
        setCaption(text);
        setSilent(true);
      }
    });
  };
  const sayRef = useRef(say);
  useEffect(() => { sayRef.current = say; });

  useEffect(() => {
    if (!running || !spec) return;
    const tick = () => {
      if (!mounted.current || finished.current) return;
      const now = Math.min(spec.seconds, (Date.now() - origin.current) / 1000);
      setElapsed(now);
      if (now >= spec.seconds) {
        finished.current = true;
        generation.current += 1;
        cancelSpeech();
        videoRef.current?.pause();
        finishRef.current({ completed: true });
        return;
      }
      // 복귀가 늦어져도 지나간 안내를 연달아 읽지 않는다.
      const cue = cueAt(spec.cues, now);
      if (cue && lastCue.current !== cue.id) {
        lastCue.current = cue.id;
        sayRef.current(cue.text);
      }
    };
    tick();
    const timer = setInterval(tick, 200);
    return () => clearInterval(timer);
  }, [running, spec]);

  if (!spec) return (
    <div className="p-4 text-body text-ink">
      <p>{t.specFailed}</p>
      <Button onClick={() => onFinish({ completed: false, stoppedReason: "REST_SPEC_UNAVAILABLE" })}>{t.back}</Button>
    </div>
  );

  const start = () => {
    if (!mode || running || startRequest.current) return;
    unlockSpeech();
    setError(null);
    const begin = () => {
      if (!mounted.current) return;
      origin.current = Date.now();
      setRunning(true);
    };
    if (!mode.video) { begin(); return; }
    const media = videoRef.current;
    if (!media) return;
    const request = new AbortController();
    startRequest.current = request;
    setStarting(true);
    void playVideo(media, request.signal).then(begin).catch((reason: unknown) => {
      if (!mounted.current || request.signal.aborted) return;
      const timeout = reason instanceof Error && reason.message === "VIDEO_START_TIMEOUT";
      setError(timeout ? "videoSlow" : "videoPlayFailed");
    }).finally(() => {
      if (startRequest.current === request) {
        startRequest.current = null;
        if (mounted.current) setStarting(false);
      }
    });
  };
  const failedVideo = () => {
    setError("videoLoadFailed");
    if (running && mode?.video && !finished.current) {
      finished.current = true;
      generation.current += 1;
      cancelSpeech();
      videoRef.current?.pause();
      finishRef.current({ completed: false, stoppedReason: "REST_VIDEO_UNAVAILABLE" });
    }
  };
  return (
    <div className="mx-auto flex w-full max-w-[480px] flex-1 flex-col gap-4 px-4 py-4">
      <h2 className="font-display text-title break-keep">{content.name}</h2>
      {!running && (
        <div className="flex flex-col gap-2">
          <p className="text-body text-ink">{t.where}</p>
          {spec.modes.map((m) => (
            <Button key={m.id} variant={modeId === m.id ? "primary" : "secondary"}
              disabled={starting || (m.video && !video)} onClick={() => { setModeId(m.id); setError(null); }}>
              {m.video ? t.modeVideo : t.modeReal}
            </Button>
          ))}
          {/* 버튼 이름과 조사를 한 덩어리로 둔 문장(messages.tsx) */}
          {!video && <p className="text-caption break-keep text-ink-muted">{t.noVideo}</p>}
        </div>
      )}
      <div className={!mode ? "hidden" : mode.video ? "relative min-h-[42dvh] overflow-hidden rounded-card bg-surface-muted" : "relative"}>
        {/* 소스를 고정하므로 타이머나 자막 변경 때 영상을 다시 선택하지 않는다. */}
        {video && (
          <video ref={videoRef} src={assetUrl(video.url)} muted playsInline loop={spec.loop}
            preload="auto" onError={failedVideo}
            aria-label={t.videoAlt}
            className={mode?.video ? "absolute inset-0 h-full w-full object-cover" : "hidden"} />
        )}
        {mode?.video && starting && (
          <div role="status" className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6 text-center">
            <Spinner />
            <p className="break-keep text-ink-muted">{t.loadingVideo}</p>
          </div>
        )}
        {mode && !mode.video && (
          <NatureTimer remaining={spec.seconds - elapsed} total={spec.seconds} speaking={speaking} />
        )}
        {mode?.video && <VideoTimer remaining={spec.seconds - elapsed} />}
      </div>
      {mode?.video && video?.source_url && (
        <a href={video.source_url} target="_blank" rel="noreferrer"
          className="-mt-3 flex min-h-12 items-center text-caption text-ink-muted underline">
          <span className="origin-left scale-90 break-words">
            Pixabay · {video.creator || t.videoSource} · {video.license}
          </span>
        </a>
      )}
      <p className="text-body break-keep whitespace-pre-line text-ink">{caption || content.guide_text}</p>
      {silent && <p className="text-caption text-ink-muted">{t.silent}</p>}
      {error && <p role="alert" className="text-caption text-ink">{t[error]}</p>}
      {!running && mode && (
        <div className="flex flex-col gap-2 pb-[env(safe-area-inset-bottom)]">
          {mode.video && error && !starting && <Button variant="secondary" onClick={() => { setError(null); videoRef.current?.load(); }}>{t.reload}</Button>}
          <Button disabled={starting} onClick={start}>{starting ? t.connecting : t.start(Math.round(spec.seconds / 60))}</Button>
        </div>
      )}

    </div>
  );
}
