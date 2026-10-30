/**
 * 진행 표시 — SSE progress 문구를 띄운다. 처음 응답을 기다릴 때는 화면 전체, 화면 위에서는 덮개로 쓴다.
 * plan은 실측 2.5~3.5초, AI 이미지 생성이 끼면 60초까지 걸릴 수 있다(BE README 「SSE」).
 * 길이를 모르는 기다림이라 도는 표시를 쓴다. '동작 줄이기'를 켰어도 멈추면 화면이 멈춘 것으로 읽혀서 느리게만 돌린다.
 */

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
        <svg aria-hidden="true" viewBox="0 0 40 40" fill="none" className="h-10 w-10 animate-spin motion-reduce:[animation-duration:3s]">
          <circle cx="20" cy="20" r="17" strokeWidth="3" className="stroke-line" />
          <circle cx="20" cy="20" r="17" strokeWidth="3" strokeLinecap="round" strokeDasharray="27 80" className="stroke-indicator" />
        </svg>
        <p className="break-keep text-ink-muted">{text ?? "잠시만 기다려 주세요"}</p>
      </div>
    </div>
  );
}
