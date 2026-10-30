/**
 * 진행 표시 — SSE progress 문구를 띄운다. 처음 응답을 기다릴 때는 화면 전체, 화면 위에서는 덮개로 쓴다.
 * plan은 실측 2.5~3.5초, AI 이미지 생성이 끼면 60초까지 걸릴 수 있다(BE README 「SSE」).
 * 길이를 모르는 기다림이라 도는 표시(Spinner)를 쓴다.
 */

import { Spinner } from "@/ui/controls";

export function Progress({ text, overlay = false }: { text: string | null; overlay?: boolean }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={
        overlay
          ? "fixed inset-0 z-40 flex items-center justify-center bg-page/80 px-6"
          : "flex min-h-dvh items-center justify-center px-6"
      }
    >
      <div className="flex w-full max-w-[320px] flex-col items-center gap-4 text-center">
        <Spinner />
        <p className="break-keep text-ink-muted">{text ?? "잠시만 기다려 주세요"}</p>
      </div>
    </div>
  );
}
