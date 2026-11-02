"use client";

/**
 * 소셜 로그인에서 돌아오는 곳. supabase-js가 주소의 code를 세션으로 바꾸면(PKCE) next로 보낸다.
 * 이 주소(/auth/callback)를 Supabase 대시보드 Authentication → URL Configuration의 Redirect URLs에
 * 로컬 · 운영 · 프리뷰 배포마다 등록한다.
 */

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { errorText } from "@/i18n/errors";
import { useLocale, useMessages } from "@/i18n/use-locale";
import { supabase } from "@/lib/auth";
import { useBrowserValue } from "@/lib/use-browser-value";
import { Heading, Screen } from "@/ui/controls";
import { Progress } from "@/session/progress";
import { APP } from "../../messages";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [error, setError] = useState<unknown>(null);
  const locale = useLocale();
  const t = useMessages(APP).callback;
  // 공급자 화면에서 거절하거나 실패하면 주소에 error_description이 붙어 온다
  const failed = useBrowserValue(() => new URLSearchParams(window.location.search).get("error_description"), null);

  useEffect(() => {
    if (failed) return;
    const next = new URLSearchParams(window.location.search).get("next");
    void (async () => {
      const result = await supabase()?.auth.getSession();
      if (result?.data.session) router.replace(next?.startsWith("/") ? next : "/");
      else setError(result?.error ?? new Error(""));
    })();
  }, [failed, router]);

  // 공급자가 주소에 붙여 보낸 사유(failed)는 그 사이트의 언어 그대로 보인다
  const message = failed ?? (error !== null ? errorText(error, locale, t.unfinished) : null);
  if (!message) return <Progress text={t.signingIn} />;
  return (
    <Screen>
      <Heading>{t.failed}</Heading>
      <p className="break-keep text-ink-muted">{message}</p>
    </Screen>
  );
}
