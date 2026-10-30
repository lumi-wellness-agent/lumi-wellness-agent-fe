"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/*
 * 아래 탭 바 — 메인 · 기록 · 설정. 탭 화면에만 두고, 세션 · 동의 · 로그인처럼 흐름을 마쳐야 하는 화면에는 두지 않는다.
 * 높이는 64px(탭마다 터치 영역이 화면 폭의 1/3 × 64px)이고 아래로 env(safe-area-inset-bottom)만큼 더 비운다.
 * 화면은 TAB_BAR_SPACE(src/ui/controls.tsx)만큼 아래를 비워 탭 바에 가리지 않는다. 아이콘은 currentColor로 그린다.
 * 탭 이름은 화면에 쓰지 않고 aria-label로만 읽힌다.
 */

const TABS: { href: string; label: string; icon: ReactNode }[] = [
  {
    href: "/",
    label: "메인",
    icon: <path d="M4 10.2 12 4l8 6.2V19a1.5 1.5 0 0 1-1.5 1.5H15v-5.5H9v5.5H5.5A1.5 1.5 0 0 1 4 19z" />,
  },
  {
    href: "/records",
    label: "기록",
    icon: (
      <>
        <rect x="4" y="5.5" width="16" height="15" rx="2.5" />
        <path d="M4 10h16M8.5 3.5v3.5M15.5 3.5v3.5m-6 8.5 1.8 1.8 3.4-3.4" />
      </>
    ),
  },
  {
    href: "/settings",
    label: "설정",
    icon: (
      <>
        <path d="M10.21 5.34 10.56 2.91h2.88l.35 2.43 1.66.68 1.96-1.46 2.03 2.03-1.46 1.96.68 1.66 2.43.35v2.88l-2.43.35-.68 1.66 1.46 1.96-2.03 2.03-1.96-1.46-1.66.68-.35 2.43h-2.88l-.35-2.43-1.66-.68-1.96 1.46-2.03-2.03 1.46-1.96-.68-1.66-2.43-.35v-2.88l2.43-.35.68-1.66-1.46-1.96 2.03-2.03 1.96 1.46z" />
        <circle cx="12" cy="12" r="3" />
      </>
    ),
  },
];

export function TabBar() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="주요 화면"
      className="fixed bottom-0 left-1/2 z-20 w-full max-w-[480px] -translate-x-1/2 border-t border-line bg-page pb-[env(safe-area-inset-bottom)]"
    >
      <ul className="flex h-16">
        {TABS.map((tab) => {
          const current = tab.href === "/" ? pathname === "/" : pathname.startsWith(tab.href);
          return (
            <li key={tab.href} className="flex-1">
              <Link
                href={tab.href}
                aria-label={tab.label}
                aria-current={current ? "page" : undefined}
                className={`flex h-full items-center justify-center ${current ? "text-ink" : "text-ink-muted"}`}
              >
                <span
                  className={`flex h-8 w-14 items-center justify-center rounded-full ${current ? "bg-primary-soft text-on-primary-soft" : ""}`}
                >
                  <svg
                    viewBox="0 0 24 24"
                    className="size-6"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.8}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden
                  >
                    {tab.icon}
                  </svg>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
