"use client";

import { useEffect, useState, type ReactNode } from "react";

type Props = {
  urls: string[];
  index: number;
  transitionMs: number;
  children: ReactNode;
};

/** Loaded photos overlap: outgoing opacity 1→0 and incoming opacity 0→1 together. */
export function PhotoStage({ urls, index, transitionMs, children }: Props) {
  const [active, setActive] = useState<number | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const url = urls[index];
    if (!url) return;
    let cancelled = false;
    const image = new window.Image();
    image.onload = () => {
      void image.decode().catch(() => undefined).then(() => {
        if (!cancelled) {
          setActive(index);
          setFailed(false);
        }
      });
    };
    image.onerror = () => {
      if (!cancelled) setFailed(true);
    };
    image.src = url;
    // Prefetch the next photo while the current one remains visible.
    const next = urls[index + 1];
    if (next) {
      const preload = new window.Image();
      preload.src = next;
    }
    return () => {
      cancelled = true;
      image.onload = null;
      image.onerror = null;
    };
  }, [urls, index]);

  return (
    <div
      className="relative my-6 flex aspect-[4/3] w-full shrink-0 items-center justify-center overflow-hidden rounded-card bg-surface-muted"
      role="region"
      aria-label={active === null ? "자연 사진 준비 영역" : "자연 풍경 사진 " + (active + 1)}
    >
      {urls.map((url, i) => (
        <div
          key={url + i}
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-cover bg-center transition-opacity ease-in-out motion-reduce:transition-none"
          style={{
            backgroundImage: "url(" + JSON.stringify(url) + ")",
            opacity: active === i ? 1 : 0,
            transitionDuration: transitionMs + "ms",
          }}
        />
      ))}
      {active === null && (
        <p className="relative px-5 text-caption text-ink-muted">
          {failed || urls.length === 0 ? "자연 사진을 불러오지 못했어요." : "자연 사진을 준비하고 있어요."}
        </p>
      )}
      {children}
    </div>
  );
}
