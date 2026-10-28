"use client";

/**
 * 소리·영상 감상 — PR-02 자연 영상 + 자연음 · PR-04 자연음 · PR-05 이완 음악. 담당 A(TEAM.md).
 *
 * 자산: content.assets 중 VISUAL_VIDEO(PR-02, 소리 없이 반복) · SOUNDSCAPE(PR-02 · 04, Freesound) · MUSIC(PR-05, 검수 음원 3곡).
 *   검수 음원은 BE 상대 경로(/assets/…)라 assetUrl()로 감싼다.
 * 재생: content_spec.slots[].render — fade_in_seconds · fade_out_seconds(자연음 2초) · loop · volume(사용자 조절, 안전 상한).
 *   autoplay false — iOS는 사용자가 누른 순간에만 소리를 열어 주므로 "재생하기"를 눌러야 시작한다.
 * 시간: 계획한 시간(step.minutes)만큼 돈다. 소리가 그보다 짧으면 반복하고(무봉제 루프는 BE 선택 조건),
 *   끝나면 천천히 소리를 줄이고 "다음으로"를 누르면 onFinish({ completed: true }).
 * PR-05는 음악 후보가 여럿이면 먼저 한 곡을 고른다(단계 이름 "검수된 음악 후보 중 한 곡 선택해 듣기").
 *   BE가 추천곡을 맨 앞에 두고 metadata.recommended · content_factor.reason을 단다 — "LUMI 추천" 배지와 이유를
 *   보이되 고르는 것은 사용자다(E08: 목록에서 사용자가 고른 음악).
 * 소리를 불러오지 못하면 안내하고 시간은 그대로 돈다 — 그만두려면 호스트의 "그만하기".
 * 출처(CC BY 계열은 표기가 조건)를 아래에 보인다.
 */

import { useEffect, useRef, useState, type RefObject } from "react";
import type { ActivityAsset } from "@/lib/api/types";
import { assetUrl } from "@/lib/api/client";
import { Button, Card } from "@/ui/controls";
import { assetsOf, factorOf, findSlot, num, renderOf, str } from "../slideshow/spec";
import { formatClock, useActivityTimer } from "../slideshow/use-activity-timer";
import type { PlayerProps } from "../types";
import { DEFAULT_VOLUME, MAX_VOLUME, canSetVolume, creditOf, durationOf, fadeVolume } from "./media";

export default function ListeningPlayer({ content, step, onFinish }: PlayerProps) {
  const music = assetsOf(content, "MUSIC");
  const [picked, setPicked] = useState<ActivityAsset | null>(music.length === 1 ? music[0] : null);
  if (music.length > 1 && !picked) return <MusicChoice tracks={music} onPick={setPicked} />;

  const sound = picked ?? assetsOf(content, "SOUNDSCAPE")[0];
  const video = assetsOf(content, "VISUAL_VIDEO")[0];
  const render = renderOf(findSlot(content, sound?.slot ?? "SOUNDSCAPE"));
  return (
    <Listening
      key={sound?.url ?? "none"}
      sound={sound}
      video={video}
      totalSeconds={Math.round(step.minutes * 60)}
      fadeIn={num(render.fade_in_seconds) ?? 0}
      fadeOut={num(render.fade_out_seconds) ?? 0}
      onFinish={() => onFinish({ completed: true })}
    />
  );
}

/** PR-05 — 검수된 음악 후보에서 한 곡을 고른다. */
function MusicChoice({ tracks, onPick }: { tracks: ActivityAsset[]; onPick: (track: ActivityAsset) => void }) {
  return (
    <div className="mx-auto flex w-full max-w-[480px] flex-1 flex-col px-4 py-4">
      <h2 className="font-display text-title break-keep">들을 곡을 하나 골라 주세요</h2>
      <p className="mt-1 text-caption break-keep text-ink-muted">모두 10분 길이로 맞춘 곡이에요. 듣다가 불편하면 언제든 멈출 수 있어요.</p>
      <ul className="mt-4 flex flex-col gap-2">
        {tracks.map((track) => {
          const year = track.metadata.recording_year;
          const sub = [str(track.metadata.composer), typeof year === "number" ? `${year}년 녹음` : null].filter(Boolean).join(" · ");
          const recommended = track.metadata.recommended === true;
          const why = recommended ? factorOf(track)?.reason : undefined;
          return (
            <li key={track.url}>
              <button
                type="button"
                onClick={() => onPick(track)}
                className={`flex min-h-12 w-full flex-col items-start rounded-row border bg-control px-4 py-3 text-left ${
                  recommended ? "border-line-strong" : "border-line-control"
                }`}
              >
                {recommended && (
                  <span className="mb-1 rounded-chip bg-primary-soft px-2 py-0.5 text-caption font-bold text-on-primary-soft">
                    LUMI 추천
                  </span>
                )}
                <span className="text-body break-keep text-ink">{track.title}</span>
                {sub && <span className="text-caption break-keep text-ink-muted">{sub}</span>}
                {why && <span className="mt-1 text-caption break-keep text-ink-muted">{why}</span>}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

type ListeningProps = {
  sound?: ActivityAsset;
  video?: ActivityAsset;
  totalSeconds: number;
  fadeIn: number;
  fadeOut: number;
  onFinish: () => void;
};

function Listening({ sound, video, totalSeconds, fadeIn, fadeOut, onFinish }: ListeningProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [started, setStarted] = useState(false);
  const [volume, setVolume] = useState(DEFAULT_VOLUME);
  const [error, setError] = useState<string | null>(null);
  const soundLoops = (sound ? (durationOf(sound) ?? Infinity) : Infinity) < totalSeconds;

  // 누른 순간에 바로 play()를 불러야 iOS가 소리를 열어 준다 — 상태를 바꾸기 전에 부른다
  const start = () => {
    const audio = audioRef.current;
    if (audio) {
      audio.volume = 0;
      audio.play().then(
        () => fadeVolume(audio, volume, fadeIn),
        // 불러오기 실패(onError)가 먼저 왔으면 그 안내를 남긴다 — 더 정확하다
        () => setError((prev) => prev ?? "소리를 재생하지 못했어요. 기기 소리가 켜져 있는지 확인해 주세요."),
      );
    }
    void videoRef.current?.play().catch(() => {});
    setStarted(true);
  };

  return (
    <div className="mx-auto flex w-full max-w-[480px] flex-1 flex-col px-4 py-4">
      <div className="relative min-h-[40dvh] flex-1 overflow-hidden rounded-card bg-surface-muted">
        {video ? (
          <video
            ref={videoRef}
            src={assetUrl(video.url)}
            muted
            loop
            playsInline
            preload="auto"
            aria-label={video.title ?? "자연 영상"}
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <div className="bg-progress absolute inset-0 flex flex-col items-center justify-center gap-2 p-6 text-center">
            {/* 자연음 제목은 Freesound 파일 이름이라 화면에는 쓰지 않고 출처에만 둔다 */}
            <p className="font-display text-title break-keep text-ink">{sound?.slot === "MUSIC" ? sound.title : "자연의 소리"}</p>
            <p className="text-caption break-keep text-ink-muted">눈을 감고 들어도 좋아요</p>
          </div>
        )}
      </div>

      {sound && (
        <audio
          ref={audioRef}
          src={assetUrl(sound.url)}
          loop={soundLoops}
          preload="auto"
          onError={() => setError("소리를 불러오지 못했어요. 화면을 바라보며 쉬거나, '그만하기'로 다른 활동을 고를 수 있어요.")}
        />
      )}
      {!sound && <p className="mt-3 text-caption break-keep text-ink-muted">준비된 소리가 없어요. 화면을 바라보며 천천히 쉬어 가세요.</p>}
      {error && (
        <p role="alert" className="mt-3 text-caption break-keep text-ink">
          {error}
        </p>
      )}

      {started ? (
        <Running
          audioRef={audioRef}
          videoRef={videoRef}
          totalSeconds={totalSeconds}
          volume={volume}
          setVolume={setVolume}
          fadeOut={fadeOut}
          onFinish={onFinish}
        />
      ) : (
        <div className="mt-auto flex flex-col gap-2 pt-4 pb-[env(safe-area-inset-bottom)]">
          <p className="text-caption break-keep text-ink-muted">약 {Math.round(totalSeconds / 60)}분 · 소리를 편안한 크기로 맞춰 주세요</p>
          <Button onClick={start}>재생하기</Button>
        </div>
      )}

      <Credits assets={[video, sound].filter((a): a is ActivityAsset => Boolean(a))} />
    </div>
  );
}

type RunningProps = {
  audioRef: RefObject<HTMLAudioElement | null>;
  videoRef: RefObject<HTMLVideoElement | null>;
  totalSeconds: number;
  volume: number;
  setVolume: (v: number) => void;
  fadeOut: number;
  onFinish: () => void;
};

/** 재생 중 — 시간 · 멈춤 · 음량. 끝나면 소리를 줄이고 멈춘다. 이미지 + 명상(PR-21)도 쓴다. */
export function Running({ audioRef, videoRef, totalSeconds, volume, setVolume, fadeOut, onFinish }: RunningProps) {
  const [adjustable] = useState(canSetVolume);
  const timer = useActivityTimer(totalSeconds, () => {
    const audio = audioRef.current;
    if (audio) {
      fadeVolume(audio, 0, fadeOut);
      setTimeout(() => audio.pause(), fadeOut * 1000 + 100);
    }
    videoRef.current?.pause();
  });

  // 멈춤 · 이어서
  useEffect(() => {
    if (timer.done) return;
    const media = [audioRef.current, videoRef.current].filter((m): m is HTMLMediaElement => Boolean(m));
    if (timer.paused) media.forEach((m) => m.pause());
    else media.forEach((m) => void m.play().catch(() => {}));
  }, [timer.paused, timer.done, audioRef, videoRef]);

  // 화면을 떠나면 소리를 끈다
  useEffect(() => {
    const audio = audioRef.current;
    const video = videoRef.current;
    return () => {
      audio?.pause();
      video?.pause();
    };
  }, [audioRef, videoRef]);

  const changeVolume = (v: number) => {
    setVolume(v);
    if (audioRef.current) audioRef.current.volume = v;
  };

  return (
    <div className="mt-4 flex flex-1 flex-col">
      <div
        role="progressbar"
        aria-label="남은 시간"
        aria-valuemin={0}
        aria-valuemax={totalSeconds}
        aria-valuenow={timer.elapsed}
        className="h-1.5 overflow-hidden rounded-full bg-line"
      >
        <div className="h-full rounded-full bg-primary transition-[width] duration-1000 ease-linear" style={{ width: `${timer.progress * 100}%` }} />
      </div>
      <p className="mt-2 text-caption text-ink-muted tabular-nums">{timer.done ? "다 들었어요" : `남은 시간 ${formatClock(timer.remaining)}`}</p>

      {!timer.done && (
        <label className="mt-3 flex min-h-12 items-center gap-3">
          <span className="shrink-0 text-caption font-bold text-ink-muted">음량</span>
          {adjustable ? (
            <input
              type="range"
              min={0}
              max={MAX_VOLUME}
              step={0.05}
              value={volume}
              onChange={(e) => changeVolume(Number(e.target.value))}
              className="h-12 w-full accent-primary"
            />
          ) : (
            <span className="text-caption break-keep text-ink-muted">기기 옆 음량 버튼으로 맞춰 주세요</span>
          )}
        </label>
      )}

      <div className="mt-auto flex flex-col gap-2 pt-4 pb-[env(safe-area-inset-bottom)]">
        {timer.done ? (
          <Button onClick={onFinish}>다음으로</Button>
        ) : (
          <Button variant="secondary" onClick={timer.togglePause}>
            {timer.paused ? "이어서 듣기" : "잠깐 멈추기"}
          </Button>
        )}
      </div>
    </div>
  );
}

export function Credits({ assets }: { assets: ActivityAsset[] }) {
  if (!assets.length) return null;
  return (
    <Card className="mt-4">
      <p className="text-caption font-bold text-ink-muted">출처</p>
      <ul className="mt-1 flex flex-col gap-1">
        {assets.map((asset) => {
          const credit = creditOf(asset);
          return (
            <li key={asset.url} className="text-caption break-all text-ink-muted">
              {credit.href ? (
                <a href={credit.href} target="_blank" rel="noreferrer" className="underline">
                  {credit.text}
                </a>
              ) : (
                credit.text
              )}
              {credit.license && (
                <>
                  {" · "}
                  {credit.licenseHref ? (
                    <a href={credit.licenseHref} target="_blank" rel="noreferrer" className="underline">
                      {credit.license}
                    </a>
                  ) : (
                    credit.license
                  )}
                </>
              )}
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
