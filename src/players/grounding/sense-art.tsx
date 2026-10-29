import see from "./see.json";
import touch from "./touch.json";
import hear from "./hear.json";
import smell from "./smell.json";

const pictures: Record<string, { src: string; width: number; height: number }> = {
  SEE: see, TOUCH: touch, HEAR: hear, SMELL: smell,
};
export function SenseArt({ id, label, count }: { id: string; label: string; count: number }) {
  const picture = pictures[id];
  if (picture) return (
    <div className="mx-auto flex h-[34dvh] min-h-48 max-h-80 w-full items-center justify-center">
      {/* 첨부 이미지는 픽셀 변경 없이 lossless WebP로 포장했다. Next 이미지 최적화가 필요 없는 data URL. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={picture.src} width={picture.width} height={picture.height}
        alt={count + " · " + label} className="h-full max-w-full rounded-card object-contain" />
    </div>
  );
  return (
    <div className="mx-auto flex h-[34dvh] min-h-48 max-h-80 w-full flex-col items-center justify-center gap-3 text-primary">
      <span className="font-display text-title text-ink">{count}</span>
      <svg role="img" aria-label={label} viewBox="0 0 240 160" className="h-40 w-60 max-w-full" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M25 70Q65 30 90 47Q120 65 150 47Q180 30 215 70Q170 125 120 125Q65 125 25 70Z" />
        <path d="M25 70Q75 92 120 80Q170 92 215 70" />
        <path d="M88 89V117M112 91V122M136 91V122M160 89V117" opacity=".35" />
      </svg>
    </div>
  );
}
