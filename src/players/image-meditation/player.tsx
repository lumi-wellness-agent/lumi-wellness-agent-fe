"use client";

/**
 * 이미지 + 녹음 명상 — PR-21 실내 자연 이미지 + 약 16분 명상. 담당 A(TEAM.md).
 *
 * 자산: VISUAL_STILL(사진 한 장) + GUIDE_AUDIO(검수된 고정 녹음 /assets/audio/pr21 — LLM 재작성 금지).
 * 재생: render — VISUAL_STILL mode SINGLE_IMAGE · transition NONE · brightness(사용자 조절),
 *   GUIDE_AUDIO autoplay false(iOS — "재생하기"를 눌러야 시작) · playback_rate · volume(안전 상한).
 *   captions("script_ref와 동일한 고정 자막")는 대본(scripts/pr21_meditation_ko_v1)이 아직 저장소에 없어 보이지 않는다.
 * 시간: 계획한 시간(step.minutes)만큼 돈다. 끝나면 소리를 멈추고 "다음으로" → 호스트가 NOTICE 팝업을 띄운다.
 *   "재생하기"를 눌러도 녹음이 나오기 전에는 시간을 세지 않고 도는 표시를 띄운다(15초가 지나면 먼저 센다).
 * 녹음을 불러오지 못하면 안내하고 사진과 시간은 그대로 돈다.
 * 사진은 slideshow, 재생 · 음량 · 출처는 listening의 부품을 가져다 쓴다.
 */

import { useRef, useState } from "react";
import { useMessages } from "@/i18n/use-locale";
import type { ActivityAsset } from "@/lib/api/types";
import { assetUrl } from "@/lib/api/client";
import { Button } from "@/ui/controls";
import { DEFAULT_VOLUME, fadeVolume } from "../listening/media";
import { Credits, Running } from "../listening/player";
import { SLIDESHOW } from "../slideshow/messages";
import { Slideshow } from "../slideshow/slideshow";
import { assetsOf, findSlot, num, renderOf, slidesFrom } from "../slideshow/spec";
import type { PlayerProps } from "../types";
import { MEDITATION } from "./messages";

const MIN_BRIGHTNESS = 0.5;

export default function ImageMeditationPlayer({ content, step, onFinish }: PlayerProps) {
  const t = useMessages(MEDITATION);
  const slides = slidesFrom(content, useMessages(SLIDESHOW), "VISUAL_STILL").slice(0, 1); // SINGLE_IMAGE
  const guide: ActivityAsset | undefined = assetsOf(content, "GUIDE_AUDIO")[0];
  const audioRender = renderOf(findSlot(content, "GUIDE_AUDIO"));
  const rate = num(audioRender.playback_rate) ?? 1;
  const totalSeconds = Math.round(step.minutes * 60);

  const audioRef = useRef<HTMLAudioElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null); // Running이 받는 자리 — 이 활동에는 영상이 없다
  const [started, setStarted] = useState(false);
  const [playing, setPlaying] = useState(!guide); // 녹음이 실제로 나오기 시작했는지 — 못 받으면(onError) 더 기다리지 않는다
  const [volume, setVolume] = useState(DEFAULT_VOLUME);
  const [brightness, setBrightness] = useState(1);
  const [error, setError] = useState<"playFailed" | "loadFailed" | null>(null); // 문장은 그릴 때 지금 언어로 고른다

  const start = () => {
    const audio = audioRef.current;
    if (audio) {
      audio.playbackRate = rate;
      audio.volume = 0;
      audio.play().then(
        () => fadeVolume(audio, volume, 1),
        () => setError((prev) => prev ?? "playFailed"),
      );
    }
    setStarted(true);
  };

  return (
    <div className="mx-auto flex w-full max-w-[480px] flex-1 flex-col px-4 py-4">
      <Slideshow slides={slides} index={0} transitionMs={0} brightness={brightness} />
      {guide && <Credits assets={[guide]} />}

      {guide && (
        <audio
          ref={audioRef}
          src={assetUrl(guide.url)}
          preload="auto"
          onPlaying={() => setPlaying(true)}
          onError={() => {
            setPlaying(true);
            setError("loadFailed");
          }}
        />
      )}
      {!guide && <p className="mt-3 text-caption break-keep text-ink-muted">{t.noGuide}</p>}
      {error && (
        <p role="alert" className="mt-3 text-caption break-keep text-ink">
          {t[error]}
        </p>
      )}

      <label className="mt-3 flex min-h-12 items-center gap-3">
        <span className="shrink-0 text-caption font-bold text-ink-muted">{t.brightness}</span>
        <input
          type="range"
          min={MIN_BRIGHTNESS}
          max={1}
          step={0.05}
          value={brightness}
          onChange={(e) => setBrightness(Number(e.target.value))}
          className="h-12 w-full accent-primary"
        />
      </label>

      {started ? (
        <Running
          audioRef={audioRef}
          videoRef={videoRef}
          totalSeconds={totalSeconds}
          volume={volume}
          setVolume={setVolume}
          fadeOut={1}
          onFinish={() => onFinish({ completed: true })}
          waiting={!playing}
          loadingText={t.loading}
        />
      ) : (
        <div className="mt-auto flex flex-col gap-2 pt-4 pb-[env(safe-area-inset-bottom)]">
          <p className="text-caption break-keep text-ink-muted">{t.ready(Math.round(totalSeconds / 60))}</p>
          <Button onClick={start}>{t.play}</Button>
        </div>
      )}
    </div>
  );
}
