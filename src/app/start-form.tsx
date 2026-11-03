"use client";

/**
 * 시작 화면의 입력 · 로그인 · 시작 버튼. 입력 칸과 환경 칩은 intake 화면(src/session/intake/start-input.tsx,
 * 담당 A)이고, 여기서는 그 값을 시작 입력으로 남기고 로그인한 뒤 세션 화면으로 보낸다.
 * 로그인하지 않았으면 게스트(익명 로그인)로 시작하고, 기록을 남기지 않는다는 고지를 보인다.
 */

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { errorText } from "@/i18n/errors";
import { useLocale, useMessages } from "@/i18n/use-locale";
import { mockEnabled } from "@/lib/api/mock";
import type { CareRequest } from "@/lib/api/types";
import { authConfigured, ensureViewer, signIn, viewer, type Provider, type Viewer } from "@/lib/auth";
import { useBrowserValue } from "@/lib/use-browser-value";
import { localizedExample } from "@/session/intake/labels";
import { StartInput } from "@/session/intake/start-input";
import { saveDraft } from "@/session/use-session";
import { Button } from "@/ui/controls";
import { SocialLoginButton } from "@/ui/social-login";
import { APP } from "./messages";

export function StartForm() {
  const router = useRouter();
  const [request, setRequest] = useState<CareRequest>({ text: "" });
  const [who, setWho] = useState<Viewer | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const mock = useBrowserValue(mockEnabled, false);
  const locale = useLocale();
  const t = useMessages(APP).start;

  useEffect(() => {
    void viewer().then(setWho);
  }, []);

  const begin = async () => {
    setBusy(true);
    setError(null);
    // 예시 문장을 누른 뒤 언어를 바꿨으면 입력 칸처럼 지금 언어의 예시를 보낸다(intake/labels.localizedExample).
    // 세션 언어는 지금 화면 언어다 — BE가 그 언어로 질문 · 대본 · 추천 이유를 보낸다
    saveDraft({ ...request, text: localizedExample(request.text, locale).trim(), lang: locale });
    try {
      if (!mock) await ensureViewer();
      router.push("/session");
    } catch (e) {
      setError(e);
      setBusy(false);
    }
  };

  const login = (provider: Provider) => signIn(provider).catch((e: unknown) => setError(e));
  const member = who && !who.anonymous;

  return (
    <div className="w-full">
      <StartInput value={request} onChange={setRequest} />

      <Button className="mt-6 w-full" disabled={busy || !request.text.trim()} onClick={begin}>
        {t.button}
      </Button>
      {error !== null && <p className="mt-2 text-caption break-keep text-ink">{errorText(error, locale, t.failed)}</p>}

      <div className="mt-4 text-caption text-ink-muted">
        {mock ? (
          <p>
            {t.mock} <Link href="/dev" className="underline">/dev</Link>
          </p>
        ) : member ? (
          <p>{t.signedIn(t.providers[who.provider === "kakao" ? "kakao" : "google"])}</p>
        ) : (
          <>
            <p className="break-keep">{t.guest}</p>
            {authConfigured && (
              // 버튼에 글자가 없어 무엇을 하는 버튼인지 위에 적는다.
              <div className="mt-4 flex flex-col items-center gap-2">
                <p>{t.quickLogin}</p>
                <div className="flex gap-5">
                  <SocialLoginButton provider="google" onClick={() => login("google")} />
                  <SocialLoginButton provider="kakao" onClick={() => login("kakao")} />
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
