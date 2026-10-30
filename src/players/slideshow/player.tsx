"use client";

/**
 * 이미지 감상 — PR-01 자연 사진 · PR-03 스트레스 전 자연 장면 · PR-20 온라인 예술 감상. 담당 A(TEAM.md).
 *
 * 자산: content.assets 중 slot VISUAL_STILL(PR-01 · 03) · ARTWORK(PR-20). url은 assetUrl()로 감싼다(spec.slidesFrom).
 * 재생: content_spec.slots[] — 장면 길이는 seconds_each(PR-01)가 있으면 그것, 없으면 계획 시간 ÷ 장면 수.
 *   render.transition(FADE · NONE) · transition_ms · pan_zoom, PR-20은 show_metadata(작품 정보와 출처를 보여 준다).
 * 시간: 계획한 시간(step.minutes)만큼 돈다. 끝나면 알림음을 울리고 "다음으로"를 누르면 onFinish({ completed: true }).
 *   PR-01은 그다음 호스트가 NOTICE 팝업을 띄운다. 첫 장면을 받는 동안은 도는 표시를 띄우고 시간을 세지 않는다.
 * 자산이 없으면(공급자 키 없음 · 요청 실패) 은은한 배경과 안내로 끝까지 돈다.
 * 사진 넘김은 PR-21(이미지 + 명상) · PR-22(B, 사진 보며 호흡)도 쓰므로 slideshow.tsx로 꺼내 두었다.
 */

import { useEffect, useState } from "react";
import { playTone } from "@/lib/tone";
import { Button } from "@/ui/controls";
import type { PlayerProps } from "../types";
import { Slideshow, slideIndex } from "./slideshow";
import { assetsOf, findSlot, num, renderOf, slidesFrom, str } from "./spec";
import { formatClock, useActivityTimer } from "./use-activity-timer";

const DEFAULT_TRANSITION_MS = 800;
const MIN_SECONDS_EACH = 8; // 장면 수가 많고 시간이 짧을 때 너무 빨리 넘어가지 않게
const FIRST_SLIDE_WAIT_MS = 15_000; // 첫 장면이 이만큼 지나도 안 오면 시간부터 센다 — 사진 서버가 답하지 않아도 활동이 멈춰 있지 않게

export default function SlideshowPlayer({ content, step, onFinish }: PlayerProps) {
  const slot = findSlot(content, "VISUAL_STILL", "ARTWORK");
  const render = renderOf(slot);
  const artwork = slot?.slot === "ARTWORK";
  const slides = slidesFrom(content, slot?.slot ?? "VISUAL_STILL");

  const total = Math.round(step.minutes * 60);
  const secondsEach = slides.length
    ? Math.max(MIN_SECONDS_EACH, num(slot?.seconds_each) ?? num(render.seconds_each) ?? total / slides.length)
    : total;
  const transitionMs = str(render.transition) === "NONE" ? 0 : (num(render.transition_ms) ?? DEFAULT_TRANSITION_MS);

  const [waiting, setWaiting] = useState(slides.length > 0);
  useEffect(() => {
    if (!waiting) return;
    const timeout = setTimeout(() => setWaiting(false), FIRST_SLIDE_WAIT_MS);
    return () => clearTimeout(timeout);
  }, [waiting]);

  const timer = useActivityTimer(total, () => playTone(), !waiting);
  const index = slideIndex(timer.elapsed, secondsEach, slides.length);

  return (
    <div className="mx-auto flex w-full max-w-[480px] flex-1 flex-col px-4 py-4">
      <Slideshow
        slides={slides}
        index={index}
        transitionMs={transitionMs}
        panZoom={render.pan_zoom === true}
        secondsEach={secondsEach}
        fit={artwork ? "contain" : "cover"}
        showCredit={!artwork}
        loadingText={artwork ? "작품을 불러오고 있어요" : undefined}
        onReady={() => setWaiting(false)}
      />

      {artwork && <ArtworkInfo content={content} fields={render.show_metadata} />}

      <div className="mt-4">
        <div
          role="progressbar"
          aria-label="남은 시간"
          aria-valuemin={0}
          aria-valuemax={total}
          aria-valuenow={timer.elapsed}
          className="h-1.5 overflow-hidden rounded-full bg-line"
        >
          <div className="h-full rounded-full bg-primary transition-[width] duration-1000 ease-linear" style={{ width: `${timer.progress * 100}%` }} />
        </div>
        <p className="mt-2 text-caption text-ink-muted tabular-nums" aria-live="off">
          {timer.done ? "다 봤어요" : `남은 시간 ${formatClock(timer.remaining)}`}
          {slides.length > 1 && !timer.done && ` · ${index + 1}/${slides.length}`}
        </p>
      </div>

      <div className="mt-auto flex flex-col gap-2 pt-4 pb-[env(safe-area-inset-bottom)]">
        {timer.done ? (
          <Button onClick={() => onFinish({ completed: true })}>다음으로</Button>
        ) : (
          <Button variant="secondary" onClick={timer.togglePause}>
            {timer.paused ? "이어서 보기" : "잠깐 멈추기"}
          </Button>
        )}
      </div>
    </div>
  );
}

/** PR-20 작품 정보 — render.show_metadata(title · artist_display · date_display · source)에 있는 것만 보인다. */
function ArtworkInfo({ content, fields }: { content: PlayerProps["content"]; fields: unknown }) {
  const asset = assetsOf(content, "ARTWORK")[0];
  if (!asset) return null;
  const show = new Set(Array.isArray(fields) ? fields : ["title", "artist_display", "date_display", "source"]);
  const date = str(asset.metadata.date_display);
  return (
    <div className="mt-3">
      {show.has("title") && asset.title && <p className="font-display text-body break-keep">{asset.title}</p>}
      {(show.has("artist_display") || show.has("date_display")) && (
        <p className="text-caption break-keep text-ink-muted">
          {[show.has("artist_display") ? asset.creator : null, show.has("date_display") ? date : null].filter(Boolean).join(" · ")}
        </p>
      )}
      {show.has("source") && asset.source_url && (
        <a href={asset.source_url} target="_blank" rel="noreferrer" className="text-caption text-ink-muted underline">
          Art Institute of Chicago · 공개 도메인
        </a>
      )}
    </div>
  );
}
