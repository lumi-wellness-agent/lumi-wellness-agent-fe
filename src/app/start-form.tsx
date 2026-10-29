"use client";

/**
 * 시작 화면의 입력 · 로그인 · 시작 버튼. 입력 칸과 환경 칩은 intake 화면(src/session/intake/start-input.tsx,
 * 담당 A)이고, 여기서는 그 값을 시작 입력으로 남기고 로그인한 뒤 세션 화면으로 보낸다.
 * 로그인하지 않았으면 게스트(익명 로그인)로 시작하고, 기록을 남기지 않는다는 고지를 보인다.
 */

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { mockEnabled } from "@/lib/api/mock";
import type { CareRequest } from "@/lib/api/types";
import { authConfigured, ensureViewer, signIn, viewer, type Provider, type Viewer } from "@/lib/auth";
import { useBrowserValue } from "@/lib/use-browser-value";
import { StartInput } from "@/session/intake/start-input";
import { saveDraft } from "@/session/use-session";
import { Button } from "@/ui/controls";
import { SocialLoginButton } from "@/ui/social-login";

export function StartForm() {
  const router = useRouter();
  const [request, setRequest] = useState<CareRequest>({ text: "" });
  const [who, setWho] = useState<Viewer | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mock = useBrowserValue(mockEnabled, false);

  useEffect(() => {
    void viewer().then(setWho);
  }, []);

  const begin = async () => {
    setBusy(true);
    setError(null);
    saveDraft({ ...request, text: request.text.trim() });
    try {
      if (!mock) await ensureViewer();
      router.push("/session");
    } catch (e) {
      setError(e instanceof Error ? e.message : "시작하지 못했어요.");
      setBusy(false);
    }
  };

  const login = (provider: Provider) => signIn(provider).catch((e: Error) => setError(e.message));
  const member = who && !who.anonymous;

  return (
    <div className="w-full">
      <StartInput value={request} onChange={setRequest} />

      <Button className="mt-6 w-full" disabled={busy || !request.text.trim()} onClick={begin}>
        시작하기
      </Button>
      {error && <p className="mt-2 text-caption break-keep text-ink">{error}</p>}

      <div className="mt-4 text-caption text-ink-muted">
        {mock ? (
          <p>
            목업 세션이 켜져 있어요(BE · 로그인 없이 견본으로 돕니다). <Link href="/dev" className="underline">/dev</Link>
          </p>
        ) : member ? (
          <p>{who.provider === "kakao" ? "카카오" : "Google"} 계정으로 로그인했어요</p>
        ) : (
          <>
            <p className="break-keep">
              로그인하지 않으면 체험 내용은 기록으로 남기지 않으며, 진행에 쓴 데이터는 1~2일 안에 지워집니다.
            </p>
            {authConfigured && (
              // 버튼에 글자가 없어 무엇을 하는 버튼인지 위에 적는다.
              <div className="mt-4 flex flex-col items-center gap-2">
                <p>간편 로그인</p>
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
