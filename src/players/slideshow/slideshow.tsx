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
 * - 보이는 장면을 받은 뒤에 다음 장면 하나만 미리 받는다. 겹쳐 둔 img를 모두 그리면 장면 수(PR-01은 25장)만큼
 *   한꺼번에 받아서 첫 장면이 나머지와 대역폭을 나눠 늦게 뜬다.
 * - 보이는 장면을 받는 동안은 도는 표시를 띄우고, 받은 장면은 천천히 드러낸다. 보이는 장면이 준비되면(받았거나
 *   못 받았을 때) onReady를 불러, 플레이어가 첫 장면이 뜬 뒤부터 시간을 세게 한다.
 */

import { useState, useSyncExternalStore } from "react";
import { Spinner } from "@/ui/controls";
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
  /**
   * cover = 풍경 사진 — 사진은 잘리지 않게 전체를 보이고, 남는 위아래는 같은 사진을 흐리게 깔아 칸을 채운다
   *   (세로 화면에서 가로 사진을 꽉 채우면 양옆이 잘려 명세의 "열린 조망"이 사라진다 — P03).
   * contain = 미술 작품 — 전체를 보이고 배경은 비운다(작품 주변에 다른 색을 깔지 않는다).
   */
  fit?: "cover" | "contain";
  /** 사진 아래 오른쪽 작은 글씨로 작가 · 출처를 보일지. 고른 이유(reason)는 같은 줄 왼쪽에 둔다. */
  showCredit?: boolean;
  /** 장면이 없을 때 안내. */
  emptyText?: string;
  /** 장면을 불러오지 못했을 때 안내. */
  failedText?: string;
  /** 보이는 장면을 받는 동안 안내. */
  loadingText?: string;
  /** 보이는 장면이 준비되면(받았거나 못 받았을 때) 부른다. 장면이 바뀔 때마다 다시 부를 수 있다. */
  onReady?: () => void;
  /** 사진 밝기(0~1) — PR-21 render.brightness "사용자 조절". 글자는 어두워지지 않는다. */
  brightness?: number;
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
  loadingText = "사진을 불러오고 있어요",
  onReady,
  brightness = 1,
}: Props) {
  const reduceMotion = useReducedMotion();
  const [loaded, setLoaded] = useState<ReadonlySet<string>>(new Set());
  const [failed, setFailed] = useState<ReadonlySet<string>>(new Set());
  const count = slides.length;
  const current = count ? ((index % count) + count) % count : -1;
  const shown = current >= 0 ? slides[current] : undefined;
  const loading = shown !== undefined && !loaded.has(shown.url) && !failed.has(shown.url);
  const reason = shown?.reason;
  const credit = showCredit ? shown?.credit : undefined;
  const zoom = panZoom && !reduceMotion;

  const settle = (url: string, ok: boolean) => {
    const add = (prev: ReadonlySet<string>) => (prev.has(url) ? prev : new Set(prev).add(url));
    if (ok) setLoaded(add);
    else setFailed(add);
    if (url === shown?.url) onReady?.();
  };
  // 그릴 장면 — 보이는 장면, 미리 받을 다음 장면, 사라지는 앞 장면. 다음 장면은 보이는 장면을 받은 뒤에 받고
  // (보이는 장면이 대역폭을 혼자 쓰게), 앞 장면은 이미 받은 것만 그린다(처음에 마지막 장면까지 받지 않게).
  const drawn = (i: number) =>
    i === current ||
    (i === (current + 1) % count && !loading) ||
    (i === (current - 1 + count) % count && loaded.has(slides[i].url));

  return (
    <figure className="flex flex-1 flex-col">
      <div
        className="relative min-h-[50dvh] flex-1 overflow-hidden rounded-card bg-surface-muted"
        style={brightness < 1 ? { filter: `brightness(${brightness})` } : undefined}
      >
        {!shown || failed.has(shown.url) ? (
          <div className="bg-progress absolute inset-0 flex items-center justify-center p-6">
            <p className="max-w-[18rem] text-center break-keep text-ink">{shown ? failedText : emptyText}</p>
          </div>
        ) : null}
        {slides.map((slide, i) => {
          if (!drawn(i)) return null;
          const active = i === current;
          return (
            <div
              key={`${slide.url}-${i}`}
              aria-hidden={!active}
              hidden={failed.has(slide.url)}
              className="absolute inset-0"
              style={{
                // 받기 전에는 숨겨 두었다가 받으면 드러낸다 — 반쯤 그려진 사진이 보이지 않게
                opacity: active && loaded.has(slide.url) ? 1 : 0,
                transition: `opacity ${reduceMotion ? 0 : transitionMs}ms ease-in-out`,
              }}
            >
              {fit === "cover" && (
                // 칸을 채우는 흐린 배경 — 같은 사진을 크게 흐린다. 장식이라 읽지 않는다
                // eslint-disable-next-line @next/next/no-img-element -- 외부 공급자 주소라 next/image 최적화를 쓰지 않는다
                <img
                  src={slide.url}
                  alt=""
                  aria-hidden
                  className="absolute inset-0 h-full w-full scale-110 object-cover opacity-60"
                  style={{ filter: "blur(24px)" }}
                />
              )}
              {/* eslint-disable-next-line @next/next/no-img-element -- 외부 공급자 주소라 next/image 최적화를 쓰지 않는다 */}
              <img
                src={slide.url}
                alt={active ? slide.alt : ""}
                onLoad={() => settle(slide.url, true)}
                onError={() => settle(slide.url, false)}
                className="absolute inset-0 h-full w-full object-contain"
                style={{
                  transform: zoom && active ? "scale(1.08)" : "scale(1)",
                  transition: zoom ? `transform ${active ? secondsEach : 0}s linear` : undefined,
                }}
              />
            </div>
          );
        })}
        {loading && (
          <div role="status" className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6 text-center">
            <Spinner />
            <p className="break-keep text-ink-muted">{loadingText}</p>
          </div>
        )}
      </div>
      {(reason || credit) && (
        // 고른 이유는 왼쪽, 출처는 오른쪽에 한 줄로 둔다 — 두 줄일 때보다 사진 칸이 세로로 커진다.
        // 이유는 줄이지 않고, 둘이 한 줄에 다 들어가지 않으면 출처 끝을 말줄임한다(겹치지 않게).
        <figcaption className="mt-2 flex gap-2 text-fine text-ink-muted">
          {reason && <span className="shrink-0">{reason}</span>}
          {credit && (
            <span className="ml-auto min-w-0 truncate">
              {shown?.sourceUrl ? (
                <a href={shown.sourceUrl} target="_blank" rel="noreferrer" className="underline">
                  {credit}
                </a>
              ) : (
                credit
              )}
            </span>
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
