"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { refreshLight, syncThemeColor } from "@/lib/light";

/**
 * 화면을 옮길 때, 앱으로 돌아올 때, 켜 둔 동안 1분마다 빛을 다시 정한다. 켜 둔 채로 시간대가 바뀌어도 따라가고,
 * 세션 화면을 드나들면 세션의 빛을 쓰거나 놓는다. 휴대폰 다크 모드가 바뀌면 브라우저 상단 색을 맞춘다.
 */
export function LightSync(): null {
  const pathname = usePathname();

  useEffect(() => {
    refreshLight();
  }, [pathname]);

  useEffect(() => {
    const scheme = window.matchMedia("(prefers-color-scheme: dark)");
    const onVisible = () => {
      if (document.visibilityState === "visible") refreshLight();
    };
    // 데스크톱에서 창을 띄워 둔 탭은 계속 보이는 상태라 visibilitychange가 오지 않는다.
    const timer = setInterval(refreshLight, 60_000);
    document.addEventListener("visibilitychange", onVisible);
    scheme.addEventListener("change", syncThemeColor);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
      scheme.removeEventListener("change", syncThemeColor);
    };
  }, []);
  return null;
}
