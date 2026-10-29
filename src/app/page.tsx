import { TAB_BAR_SPACE } from "@/ui/controls";
import { TabBar } from "@/ui/tab-bar";
import { StartForm } from "./start-form";

export default function Home() {
  return (
    <>
      <main className={`mx-auto flex min-h-dvh w-full max-w-[480px] flex-col px-4 pt-10 ${TAB_BAR_SPACE}`}>
        <p className="text-caption font-bold tracking-[0.16em] text-ink-muted">LUMI · LIGHT + MIND</p>
        <h1 className="mt-5 mb-3 font-display text-[length:clamp(30px,8vw,40px)] leading-[1.25] tracking-[-0.02em]">
          지친 순간의 휴식,
          <br />
          루미와 함께.
        </h1>
        <p className="mb-8 break-keep text-ink-muted">
          지금 상황을 들려주면 회복 활동 하나를 추천하고, 추천 이유가 된 심리학 이론과 연구를 Reference 카드로 보여
          드려요.
        </p>
        <StartForm />
        <p className="mt-auto pt-10 text-caption text-ink-muted">LUMI는 의료적 진단이나 치료를 대신하지 않습니다.</p>
      </main>
      <TabBar />
    </>
  );
}
