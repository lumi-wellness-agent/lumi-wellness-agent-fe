"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { assetUrl } from "@/lib/api/client";
import { cancelSpeech, canSpeak, loadVoices, speakScript, splitScript, unlockSpeech } from "@/lib/speech";
import { Button } from "@/ui/controls";
import type { PlayerProps } from "../types";
import { clock, cueAt, parseRest } from "./spec";
import { playVideo } from "./play-video";

export default function RestPlayer({ content, onFinish }: PlayerProps) {
  const spec = useMemo(() => parseRest(content.content_spec), [content.content_spec]);
  const video = content.assets.find((asset) => asset.slot === "VISUAL_VIDEO" && asset.url);
  const [modeId, setModeId] = useState<string | null>(null);
  const mode = spec?.modes.find((m) => m.id === modeId);
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [caption, setCaption] = useState("");
  const [starting, setStarting] = useState(false);
  const startRequest = useRef<AbortController | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [silent, setSilent] = useState(false);
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
    if (!ttsAllowed || !canSpeak()) {
      setCaption(text);
      setSilent(true);
      return;
    }
    void (async () => {
      for (const chunk of splitScript(text)) {
        if (!mounted.current || mine !== generation.current) return;
        setCaption(chunk.text);
        const ok = await speakScript(chunk.text, { rate: 0.85 });
        if (!mounted.current || mine !== generation.current) return;
        if (!ok) {
          setSilent(true);
          setCaption(text);
          return;
        }
        if (chunk.pauseMs) await new Promise((resolve) => setTimeout(resolve, chunk.pauseMs));
      }
    })().catch(() => {
      if (mounted.current && mine === generation.current) {
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
      <p>활동 안내를 불러오지 못했어요.</p>
      <Button onClick={() => onFinish({ completed: false, stoppedReason: "REST_SPEC_UNAVAILABLE" })}>돌아가기</Button>
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
      setError(timeout
        ? "영상 로딩이 오래 걸려요. 영상 다시 불러오기를 누른 뒤 재시도해 주세요."
        : "영상을 재생하지 못했어요. 영상 다시 불러오기를 누른 뒤 재시도해 주세요.");
    }).finally(() => {
      if (startRequest.current === request) {
        startRequest.current = null;
        if (mounted.current) setStarting(false);
      }
    });
  };
  const failedVideo = () => {
    setError("영상을 불러오지 못했어요. 다시 불러오거나 실제 자연환경 모드를 선택해 주세요.");
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
          <p className="text-body text-ink">어디에서 자연을 알아차릴까요?</p>
          {spec.modes.map((m) => (
            <Button key={m.id} variant={modeId === m.id ? "primary" : "secondary"}
              disabled={starting || (m.video && !video)} onClick={() => { setModeId(m.id); setError(null); }}>
              {m.video ? "자연 영상으로 하기" : "실제 자연환경에서 하기"}
            </Button>
          ))}
          {!video && <p className="text-caption text-ink-muted">준비된 영상이 없어요. 영상 모드는 BE에서 영상 자산을 받은 뒤 사용할 수 있어요.</p>}
        </div>
      )}
      <div className="relative min-h-[42dvh] overflow-hidden rounded-card bg-surface-muted">
        {/* 소스를 고정하므로 타이머나 자막 변경 때 영상을 다시 선택하지 않는다. */}
        {video && (
          <video ref={videoRef} src={assetUrl(video.url)} muted playsInline loop={spec.loop}
            preload="auto" onError={failedVideo}
            aria-label="바람에 흔들리는 나무와 잎의 자연 영상"
            className={mode?.video ? "absolute inset-0 h-full w-full object-cover" : "hidden"} />
        )}
        {!mode?.video && (
          <div className="absolute inset-0 flex items-center justify-center p-6 text-center">
            <p className="text-body break-keep text-ink-muted">
              {mode ? "안전한 곳에 앉아 주변의 자연을 편안하게 살펴보세요." : "편안하게 머물 환경을 선택해 주세요."}
            </p>
          </div>
        )}
        <div className="absolute top-3 right-3 rounded-chip bg-page/80 px-3 py-2 opacity-70">
          <span className="text-caption text-ink tabular-nums" aria-label="남은 시간">{clock(spec.seconds - elapsed)}</span>
        </div>
      </div>
      <div className="min-h-24 rounded-card bg-surface p-4">
        <p className="text-body break-keep whitespace-pre-line text-ink">{caption || content.guide_text}</p>
      </div>
      {silent && <p className="text-caption text-ink-muted">음성 안내를 사용할 수 없어 화면에 대본을 표시하고 있어요.</p>}
      {error && <p role="alert" className="text-caption text-ink">{error}</p>}
      {!running && mode && (
        <div className="flex flex-col gap-2 pb-[env(safe-area-inset-bottom)]">
          {starting && <p role="status" className="text-caption text-ink-muted">영상을 재생하고 있어요. 잠시만 기다려 주세요.</p>}
          {mode.video && error && !starting && <Button variant="secondary" onClick={() => { setError(null); videoRef.current?.load(); }}>영상 다시 불러오기</Button>}
          <Button disabled={starting} onClick={start}>{starting ? "영상 연결 중…" : `시작하기 · ${Math.round(spec.seconds / 60)}분`}</Button>
        </div>
      )}
      {mode?.video && video?.source_url && (
        <a href={video.source_url} target="_blank" rel="noreferrer" className="min-h-12 py-3 text-caption text-ink-muted underline">
          Pixabay · {video.creator || "영상 출처"} · {video.license}
        </a>
      )}
    </div>
  );
}
