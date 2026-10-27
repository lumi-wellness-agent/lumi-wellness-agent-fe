"use client";

/**
 * 기록 동의(회원만) — 필수 세션 기록과 선택 원문 보관(BE README 「인증 · 세션 기록」).
 *
 * 동의 문구는 FE에 있고 BE는 버전(records.CONSENT_VERSION)만 맞춘다. 이 문구를 바꾸면 BE의 버전을 올려야
 * 회원이 다시 동의한다. 게스트는 동의를 받지 않는다(PUT이 403 MEMBERS_ONLY) — 처음 화면으로 돌려보낸다.
 */

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { meApi } from "@/lib/api/client";
import type { ConsentView } from "@/lib/api/types";
import { viewer } from "@/lib/auth";
import { Button, Card, Heading, Screen } from "@/ui/controls";

export default function ConsentPage() {
  const router = useRouter();
  const [consent, setConsent] = useState<ConsentView | null>(null);
  const [records, setRecords] = useState(false);
  const [rawText, setRawText] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const next = nextPath();
    void (async () => {
      const who = await viewer();
      if (!who || who.anonymous) return router.replace("/");
      try {
        const view = await meApi.consent();
        if (view.agreed) return router.replace(next);
        setConsent(view);
        setRawText(view.raw_text);
      } catch (e) {
        setError(e instanceof Error ? e.message : "동의 상태를 읽지 못했어요.");
      }
    })();
  }, [router]);

  const agree = async () => {
    setBusy(true);
    try {
      await meApi.agree(rawText);
      router.replace(nextPath());
    } catch (e) {
      setError(e instanceof Error ? e.message : "동의를 저장하지 못했어요.");
      setBusy(false);
    }
  };

  return (
    <Screen
      footer={
        <Button disabled={!consent || !records || busy} onClick={agree}>
          동의하고 시작하기
        </Button>
      }
    >
      <Heading eyebrow="처음 한 번만">세션 기록에 동의해 주세요</Heading>
      <div className="flex flex-col gap-3">
        <Card>
          <label className="flex min-h-12 items-start gap-3">
            <input type="checkbox" checked={records} onChange={(e) => setRecords(e.target.checked)} className="mt-1 size-5 accent-primary" />
            <span>
              <strong>(필수) 세션 기록</strong>
              <span className="mt-1 block break-keep text-ink-muted">
                상황 분류, 질문에 고른 답, 측정값, 한 활동과 결과를 기록해요. 심리 상태 측정값이 들어 있어 민감정보로 보고
                따로 동의를 받아요. 거두려면 탈퇴하면 돼요.
              </span>
            </span>
          </label>
        </Card>
        <Card>
          <label className="flex min-h-12 items-start gap-3">
            <input type="checkbox" checked={rawText} onChange={(e) => setRawText(e.target.checked)} className="mt-1 size-5 accent-primary" />
            <span>
              <strong>(선택) 원문 보관</strong>
              <span className="mt-1 block break-keep text-ink-muted">
                처음 입력, 직접 쓴 답, 감정 단어, 멈춘 이유 같은 글을 {consent?.text_retention_days ?? 90}일 동안 보관해요.
                나중에 끄면 남긴 원문을 바로 지워요.
              </span>
            </span>
          </label>
        </Card>
        <p className="text-caption break-keep text-ink-muted">
          입력한 글은 추천을 위해 OpenAI 모델로 보내져요. LUMI는 의료적 진단이나 치료를 대신하지 않습니다.
          {consent && ` (동의 문구 ${consent.version})`}
        </p>
        {error && <p className="text-caption break-keep">{error}</p>}
      </div>
    </Screen>
  );
}

function nextPath(): string {
  const next = new URLSearchParams(window.location.search).get("next");
  return next?.startsWith("/") ? next : "/";
}
