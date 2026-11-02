"use client";

import { useMessages } from "@/i18n/use-locale";
import { TAB_BAR_SPACE } from "@/ui/controls";
import { LocaleToggle } from "@/ui/locale-toggle";
import { TabBar } from "@/ui/tab-bar";
import { APP } from "./messages";
import { StartForm } from "./start-form";

export default function Home() {
  const t = useMessages(APP);
  const [first, second] = t.home.title;
  return (
    <>
      <main className={`mx-auto flex min-h-dvh w-full max-w-[480px] flex-col px-4 pt-10 ${TAB_BAR_SPACE}`}>
        {/* 토글은 칸마다 48px이라 위아래 여백을 줄여 머리말 줄 높이를 지킨다 */}
        <div className="flex items-center justify-between gap-3">
          <p className="text-caption font-bold tracking-[0.16em] text-ink-muted">LUMI · LIGHT + MIND</p>
          <LocaleToggle className="-my-3 -mr-3" />
        </div>
        <h1 className="mt-5 mb-3 font-display text-[length:clamp(30px,8vw,40px)] leading-[1.25] tracking-[-0.02em] break-keep">
          {first}
          <br />
          {second}
        </h1>
        <p className="mb-8 break-keep text-ink-muted">{t.home.intro}</p>
        <StartForm />
        <p className="mt-auto pt-10 text-caption text-ink-muted">{t.disclaimer}</p>
      </main>
      <TabBar />
    </>
  );
}
