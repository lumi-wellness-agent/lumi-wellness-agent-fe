"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Spinner } from "@/ui/controls";

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
      // Prefetch the next photo once this one has arrived, so the two do not share bandwidth.
      const next = urls[index + 1];
      if (next && !cancelled) {
        const preload = new window.Image();
        preload.src = next;
      }
    };
    image.onerror = () => {
      if (!cancelled) setFailed(true);
    };
    image.src = url;
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
            // Only the shown, incoming and outgoing photos get a background — giving every photo one downloads
            // them all at once and the first photo arrives late.
            backgroundImage: i === active || i === index || i === index - 1 ? "url(" + JSON.stringify(url) + ")" : undefined,
            opacity: active === i ? 1 : 0,
            transitionDuration: transitionMs + "ms",
          }}
        />
      ))}
      {active === null && (failed || urls.length === 0 ? (
        <p className="relative px-5 text-caption text-ink-muted">자연 사진을 불러오지 못했어요.</p>
      ) : (
        <div role="status" className="relative flex flex-col items-center gap-3 px-5">
          <Spinner />
          <p className="text-caption text-ink-muted">자연 사진을 준비하고 있어요.</p>
        </div>
      ))}
      {children}
    </div>
  );
}
