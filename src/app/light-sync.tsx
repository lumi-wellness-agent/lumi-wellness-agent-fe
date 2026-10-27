"use client";

import { useEffect } from "react";
import { refreshLight, syncThemeColor } from "@/lib/light";

/** 앱으로 돌아오면 빛을 다시 정하고, 휴대폰 다크 모드가 바뀌면 브라우저 상단 색을 맞춘다. */
export function LightSync(): null {
  useEffect(() => {
    syncThemeColor();
    const scheme = window.matchMedia("(prefers-color-scheme: dark)");
    const onVisible = () => {
      if (document.visibilityState === "visible") refreshLight();
    };
    document.addEventListener("visibilitychange", onVisible);
    scheme.addEventListener("change", syncThemeColor);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      scheme.removeEventListener("change", syncThemeColor);
    };
  }, []);
  return null;
}
