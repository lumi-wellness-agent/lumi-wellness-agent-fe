import { useId } from "react";
import { clock } from "./spec";

const SEGMENT_POINTS = [
  "7,2 33,2 38,6 33,10 7,10 2,6",
  "34,12 40,7 40,32 36,36 32,32 32,16",
  "36,38 40,42 40,67 34,62 32,58 32,42",
  "7,62 33,62 38,67 33,71 7,71 2,67",
  "0,42 4,38 8,42 8,58 6,62 0,67",
  "0,7 6,12 8,16 8,32 4,36 0,32",
  "8,33 32,33 36,37 32,41 8,41 4,37",
];
const DIGIT_SEGMENTS: Record<string, readonly number[]> = {
  "0": [0, 1, 2, 3, 4, 5],
  "1": [1, 2],
  "2": [0, 1, 6, 4, 3],
  "3": [0, 1, 2, 3, 6],
  "4": [5, 6, 1, 2],
  "5": [0, 5, 6, 2, 3],
  "6": [0, 5, 4, 3, 2, 6],
  "7": [0, 1, 2],
  "8": [0, 1, 2, 3, 4, 5, 6],
  "9": [0, 1, 2, 3, 5, 6],
};

function DigitalClock({ value }: { value: string }) {
  return (
    <span aria-hidden="true" className="inline-flex scale-[0.86] items-center gap-1 text-ink">
      {Array.from(value).map((digit, index) => digit === ":" ? (
        <svg key={index} width="10" height="48" viewBox="0 0 14 74" fill="currentColor">
          <rect x="3" y="22" width="8" height="8" rx="1" />
          <rect x="3" y="46" width="8" height="8" rx="1" />
        </svg>
      ) : (
        <svg key={index} width="26" height="48" viewBox="0 0 42 74" fill="currentColor">
          {(DIGIT_SEGMENTS[digit] ?? []).map((segment) => (
            <polygon key={segment} points={SEGMENT_POINTS[segment]} />
          ))}
        </svg>
      ))}
    </span>
  );
}


export function NatureTimer({ remaining, total, speaking }: { remaining: number; total: number; speaking: boolean }) {
  const gradient = useId();
  const circumference = 2 * Math.PI * 84;
  const progress = total > 0 ? Math.max(0, Math.min(1, remaining / total)) : 0;
  return (
    <div className="flex min-h-[42dvh] flex-col items-center justify-center gap-3 py-6">
      <div className="relative flex h-64 w-64 shrink-0 items-center justify-center">
        {/* 음성 재생 상태에 반응하는 장식 파형이며 실제 음성 진폭을 분석하지 않는다. */}
        {speaking && (
          <svg aria-hidden="true" viewBox="0 0 280 280"
            className="pointer-events-none absolute inset-0 h-full w-full stroke-indicator motion-reduce:hidden" fill="none">
            {Array.from({ length: 72 }, (_, index) => {
              const length = 9 + ((index * 17) % 23);
              const middle = 5 + ((index * 11) % 14);
              return (
                <line key={index} x1="140" y1="32" x2="140" y2={32 - length}
                  transform={`rotate(${index * 5} 140 140)`} strokeWidth="2.5" strokeLinecap="round"
                  opacity={0.45 + (index % 4) * 0.15}>
                  <animate attributeName="y2" values={[29, 32 - length, 32 - middle, 27, 32 - middle, 29].join(";")}
                    dur={0.65 + (index % 7) * 0.09 + "s"} begin={-(index % 9) * 0.13 + "s"} repeatCount="indefinite" />
                </line>
              );
            })}
          </svg>
        )}
        <div className="relative flex h-48 w-48 items-center justify-center rounded-full border border-line bg-primary-soft shadow-card"
          role="timer" aria-label={"남은 시간 " + clock(remaining)}>
          <svg aria-hidden="true" viewBox="0 0 192 192" className="pointer-events-none absolute inset-0 h-full w-full" fill="none">
            <defs>
              <linearGradient id={gradient} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="var(--lumi-accent)" />
                <stop offset="100%" stopColor="var(--lumi-indicator)" />
              </linearGradient>
            </defs>
            <circle cx="96" cy="96" r="84" stroke="currentColor" className="text-line" strokeWidth="2" />
            <circle cx="96" cy="96" r="84" stroke={`url(#${gradient})`} strokeWidth="4"
              strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={circumference * (1 - progress)}
              transform="rotate(-90 96 96)"
              className="transition-[stroke-dashoffset] duration-200 ease-linear motion-reduce:transition-none" />
          </svg>
          <time className="relative inline-flex items-center" dateTime={"PT" + Math.max(0, Math.ceil(remaining)) + "S"}>
            <span className="sr-only">{clock(remaining)}</span>
            <DigitalClock value={clock(remaining)} />
          </time>
        </div>
      </div>
      <p className="px-4 text-center text-caption break-keep text-ink-muted">
        화면을 계속 보지 않아도 괜찮아요. 주변의 자연을 편안하게 살펴보세요.
      </p>
    </div>
  );
}

/** PR-22와 같은 크기·투명도의 영상 위 타이머. */
export function VideoTimer({ remaining }: { remaining: number }) {
  const seconds = Math.max(0, Math.ceil(remaining));
  return (
    <div role="timer" aria-label={"남은 시간 " + clock(seconds)}
      className="pointer-events-none absolute top-3 right-3 flex h-16 w-16 items-center justify-center rounded-full border border-indicator/50 bg-page/80 opacity-70">
      <time className="absolute inline-flex scale-[0.45] items-center" dateTime={"PT" + seconds + "S"}>
        <span className="sr-only">{clock(seconds)}</span>
        <DigitalClock value={clock(seconds)} />
      </time>
    </div>
  );
}
