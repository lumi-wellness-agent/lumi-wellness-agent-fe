/**
 * 키마다 값을 이 탭의 메모리에 두는 캐시. 새로고침하면 비고 기기에는 남지 않는다.
 * - load: 같은 키의 요청이 가고 있으면 새로 보내지 않고 그 요청을 같이 기다린다(미리 받기와 화면이 겹칠 때).
 *   끝난 뒤에 다시 부르면 새로 받는다 — 화면은 둔 값을 먼저 보이고 load로 바꾼다.
 * - 요청이 실패하면 그 키에 둔 값은 그대로 둔다.
 * - forget: 둔 값과 가고 있는 요청을 모두 버린다. 그 뒤에 끝난 요청의 값은 두지 않는다(버리기 전에 보낸 요청이라
 *   옛것일 수 있다).
 */

export type KeyedCache<T> = {
  saved(key: string): T | null;
  load(key: string): Promise<T>;
  forget(): void;
};

export function keyedCache<T>(request: (key: string) => Promise<T>): KeyedCache<T> {
  const saved = new Map<string, T>();
  const pending = new Map<string, Promise<T>>();
  return {
    saved: (key) => saved.get(key) ?? null,
    load(key) {
      const running = pending.get(key);
      if (running) return running;
      const promise = request(key).then(
        (value) => {
          if (pending.get(key) === promise) {
            saved.set(key, value);
            pending.delete(key);
          }
          return value;
        },
        (error: unknown) => {
          if (pending.get(key) === promise) pending.delete(key);
          throw error;
        },
      );
      pending.set(key, promise);
      return promise;
    },
    forget() {
      saved.clear();
      pending.clear();
    },
  };
}
