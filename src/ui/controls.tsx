import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";

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

/**
 * 화면 틀 — 360px에서 먼저 맞추고 넓은 화면에서는 가운데 480px. footer는 아래에 붙는 버튼 줄이다.
 * 하단 바는 sticky라 내용을 가리지 않고, env(safe-area-inset-bottom)만큼 아래를 비운다.
 */
export function Screen({ children, footer }: { children: ReactNode; footer?: ReactNode }) {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col px-4 pt-6">
      <div className="flex flex-1 flex-col pb-6">{children}</div>
      {footer && (
        <div className="sticky bottom-0 -mx-4 flex flex-col gap-2 border-t border-line bg-page px-4 pt-3 pb-[calc(12px+env(safe-area-inset-bottom))]">
          {footer}
        </div>
      )}
    </main>
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
