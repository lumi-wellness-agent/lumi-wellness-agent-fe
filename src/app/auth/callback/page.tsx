"use client";

/**
 * 소셜 로그인에서 돌아오는 곳. supabase-js가 주소의 code를 세션으로 바꾸면(PKCE) next로 보낸다.
 * 이 주소(/auth/callback)를 Supabase 대시보드 Authentication → URL Configuration의 Redirect URLs에
 * 로컬 · 운영 · 프리뷰 배포마다 등록한다.
 */

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/auth";
import { useBrowserValue } from "@/lib/use-browser-value";
import { Heading, Screen } from "@/ui/controls";
import { Progress } from "@/session/progress";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  // 공급자 화면에서 거절하거나 실패하면 주소에 error_description이 붙어 온다
  const failed = useBrowserValue(() => new URLSearchParams(window.location.search).get("error_description"), null);

  useEffect(() => {
    if (failed) return;
    const next = new URLSearchParams(window.location.search).get("next");
    void (async () => {
      const result = await supabase()?.auth.getSession();
      if (result?.data.session) router.replace(next?.startsWith("/") ? next : "/");
      else setError(result?.error?.message ?? "로그인을 마치지 못했어요.");
    })();
  }, [failed, router]);

  const message = failed ?? error;
  if (!message) return <Progress text="로그인하고 있어요" />;
  return (
    <Screen>
      <Heading>로그인하지 못했어요</Heading>
      <p className="break-keep text-ink-muted">{message}</p>
    </Screen>
  );
}
