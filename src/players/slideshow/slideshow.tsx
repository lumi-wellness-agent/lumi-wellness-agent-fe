"use client";

/**
 * 사진 넘김 — 장면을 겹쳐 두고 index가 바뀌면 천천히 바꾼다(FADE). 담당 A(TEAM.md).
 *
 * 몇 번째 장면을 보일지는 부르는 쪽이 정한다(index). 그래서 시간 계산은 각 플레이어가 하고, 이 컴포넌트는 그리기만 한다.
 * PR-01 · 03 · 20(이미지 감상), PR-21(이미지 + 명상, 한 장), PR-22(B — 사진 보며 호흡)가 함께 쓴다.
 *
 *   import { Slideshow, slideIndex } from "@/players/slideshow/slideshow";
 *   <Slideshow slides={slides} index={slideIndex(elapsed, 15, slides.length)} transitionMs={800} />
 *
 * - 장면이 없으면(자산을 못 받았을 때) 은은한 배경과 안내를 보여 준다 — 활동은 끝까지 돈다.
 *   이미지 서버가 막혀 불러오지 못한 장면(onError)도 같은 배경으로 바꾼다(깨진 그림 아이콘을 보이지 않는다).
 * - panZoom은 장면마다 아주 천천히 확대한다. 사용자가 '동작 줄이기'를 켰으면 하지 않는다.
 * - 다음 장면을 미리 불러 둔다(겹쳐 둔 img가 모두 로드된다).
 */

import { useState, useSyncExternalStore } from "react";
import type { Slide } from "./spec";

export type { Slide } from "./spec";

type Props = {
  slides: Slide[];
  index: number;
  /** 바꿀 때 걸리는 시간(ms). 0이면 바로 바꾼다(transition NONE). */
  transitionMs?: number;
  /** 장면마다 천천히 확대할지와 한 장면의 길이(초) — 확대 속도에 쓴다. */
  panZoom?: boolean;
  secondsEach?: number;
  /** cover = 화면을 채운다(풍경 사진), contain = 잘리지 않게 다 보인다(미술 작품). */
  fit?: "cover" | "contain";
  /** 아래 작은 글씨로 작가 · 출처를 보일지. */
  showCredit?: boolean;
  /** 장면이 없을 때 안내. */
  emptyText?: string;
  /** 장면을 불러오지 못했을 때 안내. */
  failedText?: string;
};

export function Slideshow({
  slides,
  index,
  transitionMs = 800,
  panZoom = false,
  secondsEach = 15,
  fit = "cover",
  showCredit = true,
  emptyText = "사진을 준비하지 못했어요. 이 화면을 바라보며 천천히 쉬어 가세요.",
  failedText = "이미지를 불러오지 못했어요. 이 화면을 바라보며 천천히 쉬어 가세요.",
}: Props) {
  const reduceMotion = useReducedMotion();
  const [failed, setFailed] = useState<ReadonlySet<string>>(new Set());
  const current = slides.length ? ((index % slides.length) + slides.length) % slides.length : -1;
  const zoom = panZoom && !reduceMotion;

  return (
    <figure className="flex flex-1 flex-col">
      <div className="relative min-h-[50dvh] flex-1 overflow-hidden rounded-card bg-surface-muted">
        {current < 0 || failed.has(slides[current].url) ? (
          <div className="bg-progress absolute inset-0 flex items-center justify-center p-6">
            <p className="max-w-[18rem] text-center break-keep text-ink">{current < 0 ? emptyText : failedText}</p>
          </div>
        ) : null}
        {current >= 0 && (
          slides.map((slide, i) => {
            const active = i === current;
            return (
              // eslint-disable-next-line @next/next/no-img-element -- 외부 공급자 주소라 next/image 최적화를 쓰지 않는다
              <img
                key={`${slide.url}-${i}`}
                src={slide.url}
                alt={active ? slide.alt : ""}
                aria-hidden={!active}
                loading={Math.abs(i - current) <= 1 ? "eager" : "lazy"}
                onError={() => setFailed((prev) => new Set(prev).add(slide.url))}
                hidden={failed.has(slide.url)}
                className={`absolute inset-0 h-full w-full ${fit === "cover" ? "object-cover" : "object-contain"}`}
                style={{
                  opacity: active ? 1 : 0,
                  transform: zoom && active ? "scale(1.08)" : "scale(1)",
                  transition: [
                    `opacity ${reduceMotion ? 0 : transitionMs}ms ease-in-out`,
                    zoom ? `transform ${active ? secondsEach : 0}s linear` : "",
                  ]
                    .filter(Boolean)
                    .join(", "),
                }}
              />
            );
          })
        )}
      </div>
      {current >= 0 && slides[current].reason && (
        <p className="mt-2 text-caption break-keep text-ink-muted">{slides[current].reason}</p>
      )}
      {showCredit && current >= 0 && slides[current].credit && (
        <figcaption className={`truncate text-caption text-ink-muted ${slides[current].reason ? "mt-0.5" : "mt-2"}`}>
          {slides[current].sourceUrl ? (
            <a href={slides[current].sourceUrl} target="_blank" rel="noreferrer" className="underline">
              {slides[current].credit}
            </a>
          ) : (
            slides[current].credit
          )}
        </figcaption>
      )}
    </figure>
  );
}

/** 지난 시간(초)과 장면 길이로 몇 번째 장면인지. 장면이 모자라면 처음부터 다시 돈다. */
export function slideIndex(elapsed: number, secondsEach: number, count: number): number {
  if (count <= 0 || secondsEach <= 0) return 0;
  return Math.floor(elapsed / secondsEach) % count;
}

function useReducedMotion(): boolean {
  return useSyncExternalStore(
    (notify) => {
      const query = window.matchMedia("(prefers-reduced-motion: reduce)");
      query.addEventListener("change", notify);
      return () => query.removeEventListener("change", notify);
    },
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => false,
  );
}
