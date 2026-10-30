import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { TabBar } from "./tab-bar";

/*
 * 공통 컨트롤. 터치 영역은 48px 이상이고(min-h-12) 색은 토큰 클래스만 쓴다(AGENTS.md).
 * 플레이어도 이 버튼과 칩을 쓰면 다섯 색 세트에서 따로 확인할 것이 줄어든다.
 */

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "quiet" };

const BUTTON_VARIANTS = {
  primary: "bg-primary font-bold text-on-primary",
  secondary: "border border-line-strong bg-surface font-bold text-ink",
  quiet: "text-ink-muted",
};

export function Button({ variant = "primary", className = "", ...props }: ButtonProps) {
  return (
    <button
      type="button"
      className={`inline-flex min-h-12 items-center justify-center rounded-button px-5 text-body disabled:opacity-40 ${BUTTON_VARIANTS[variant]} ${className}`}
      {...props}
    />
  );
}

/** 버튼 모양의 링크 — 다른 화면으로 갈 때(처음으로 · 목록으로). */
export function ButtonLink({
  href,
  variant = "primary",
  className = "",
  children,
}: {
  href: string;
  variant?: ButtonProps["variant"];
  className?: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`inline-flex min-h-12 items-center justify-center rounded-button px-5 text-body ${BUTTON_VARIANTS[variant]} ${className}`}
    >
      {children}
    </Link>
  );
}

/** 하나를 고르는 칩. 다시 누르면 풀린다(묶음마다 single). */
export function Chip({ selected, className = "", ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { selected: boolean }) {
  const look = selected
    ? "border-indicator bg-primary-soft text-on-primary-soft shadow-selected"
    : "border-line-control bg-control text-ink";
  return (
    <button
      type="button"
      aria-pressed={selected}
      className={`min-h-12 rounded-chip border px-4 text-body break-keep ${look} ${className}`}
      {...props}
    />
  );
}

/** 아래 탭 바(src/ui/tab-bar.tsx, 높이 56px)에 가리지 않게 화면 아래를 비운다 — 탭 바 위로 24px과 안전 영역. */
export const TAB_BAR_SPACE = "pb-[calc(80px+env(safe-area-inset-bottom))]";

/**
 * 화면 틀 — 360px에서 먼저 맞추고 넓은 화면에서는 가운데 480px. footer는 아래에 붙는 버튼 줄이다.
 * 하단 바는 실제 높이만큼 문서 공간을 차지하고 sticky로 화면 아래에 붙는다.
 * 버튼 수·줄바꿈과 env(safe-area-inset-bottom)에 맞춰 본문을 끝까지 올려 볼 수 있다.
 * tabBar면 footer 대신 아래 탭 바(메인 · 기록 · 설정)를 붙인다 — 탭 화면만 쓴다.
 */
export function Screen({ children, footer, tabBar = false }: { children: ReactNode; footer?: ReactNode; tabBar?: boolean }) {
  const space = tabBar && !footer ? TAB_BAR_SPACE : "pb-6";
  return (
    <>
      <main className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col px-4 pt-6">
        <div className={`flex flex-1 flex-col ${space}`}>{children}</div>
        {footer && (
          <div className="sticky bottom-0 z-20 -mx-4 flex shrink-0 flex-col gap-2 border-t border-line bg-page px-4 pt-3 pb-[calc(12px+env(safe-area-inset-bottom))]">
            {footer}
          </div>
        )}
      </main>
      {tabBar && <TabBar />}
    </>
  );
}

/** 화면 제목과 그 위의 작은 머리말. */
export function Heading({ eyebrow, children }: { eyebrow?: ReactNode; children: ReactNode }) {
  return (
    <header className="mb-5">
      {eyebrow && <p className="mb-2 text-caption font-bold text-ink-muted">{eyebrow}</p>}
      <h1 className="font-display text-title break-keep">{children}</h1>
    </header>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`rounded-card border border-line bg-surface p-4 shadow-card ${className}`}>{children}</section>;
}

/**
 * 도는 표시 — 길이를 모르는 기다림(SSE 응답 · 사진 불러오기)에 쓰고, 무엇을 기다리는지는 옆에 글로 적는다.
 * line 트랙 위에 indicator 호를 둥근 끝으로 그려 1초에 한 바퀴 돈다. indicator는 page · surface · surface-muted 바탕
 * 모두에서 다섯 색 세트 3:1을 넘는다. '동작 줄이기'를 켰어도 멈추면 화면이 멈춘 것으로 읽혀서 3초에 한 바퀴로 느리게만 돌린다.
 */
export function Spinner() {
  return (
    <svg aria-hidden="true" viewBox="0 0 40 40" fill="none" className="h-10 w-10 shrink-0 animate-spin motion-reduce:[animation-duration:3s]">
      <circle cx="20" cy="20" r="17" strokeWidth="3" className="stroke-line" />
      <circle cx="20" cy="20" r="17" strokeWidth="3" strokeLinecap="round" strokeDasharray="27 80" className="stroke-indicator" />
    </svg>
  );
}
