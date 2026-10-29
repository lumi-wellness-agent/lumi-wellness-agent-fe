type Video = Pick<HTMLVideoElement, "play" | "pause" | "muted">;

/** play()가 로딩을 시작하게 한다. preload/canplay는 시작 버튼의 선행 조건이 아니다. */
export function playVideo(
  video: Video,
  signal: AbortSignal,
  timeoutMs = 15000,
): Promise<void> {
  return new Promise((resolve, reject) => {
    let settled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const finish = (error?: Error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      signal.removeEventListener("abort", abort);
      if (error) {
        video.pause();
        reject(error);
      } else resolve();
    };
    const abort = () => finish(new Error("VIDEO_START_CANCELLED"));
    if (signal.aborted) { abort(); return; }
    signal.addEventListener("abort", abort, { once: true });
    timer = setTimeout(() => finish(new Error("VIDEO_START_TIMEOUT")), timeoutMs);
    video.muted = true;
    try {
      // 버튼을 누른 호출 스택에서 바로 실행해 모바일의 사용자 동작 조건을 지킨다.
      void video.play().then(() => {
        // 취소·시간 초과 뒤 늦게 재생돼도 화면 밖에서 돌지 않게 멈춘다.
        if (settled) video.pause();
        else finish();
      }, () => finish(new Error("VIDEO_START_FAILED")));
    } catch {
      finish(new Error("VIDEO_START_FAILED"));
    }
  });
}
