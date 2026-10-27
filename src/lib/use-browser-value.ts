import { useSyncExternalStore } from "react";

const noSubscribe = () => () => {};

/**
 * 브라우저에서만 읽을 수 있는 값(sessionStorage · localStorage · 주소). 서버 렌더링과 첫 hydration에는
 * serverValue를 쓰고 그 뒤 브라우저 값으로 다시 그린다 — effect 안에서 setState하지 않아도 된다.
 * read는 같은 값이면 같은 결과(원시 값)를 돌려줘야 한다.
 */
export function useBrowserValue<T>(read: () => T, serverValue: T): T {
  return useSyncExternalStore(noSubscribe, read, () => serverValue);
}
