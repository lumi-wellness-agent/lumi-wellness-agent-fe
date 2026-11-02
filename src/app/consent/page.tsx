"use client";

/**
 * 기록 동의(회원만) — 필수 세션 기록과 선택 원문 보관(BE README 「인증 · 세션 기록」).
 *
 * 동의 문구는 FE에 있고 BE는 버전(records.CONSENT_VERSION)만 맞춘다. 이 문구를 바꾸면 BE의 버전을 올려야
 * 회원이 다시 동의한다. 게스트는 동의를 받지 않는다(PUT이 403 MEMBERS_ONLY) — 처음 화면으로 돌려보낸다.
 */

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { errorText } from "@/i18n/errors";
import { useLocale, useMessages } from "@/i18n/use-locale";
import { meApi } from "@/lib/api/client";
import type { ConsentView } from "@/lib/api/types";
import { viewer } from "@/lib/auth";
import { Button, Card, Heading, Screen } from "@/ui/controls";
import { APP } from "../messages";

export default function ConsentPage() {
  const router = useRouter();
  const [consent, setConsent] = useState<ConsentView | null>(null);
  const [records, setRecords] = useState(false);
  const [rawText, setRawText] = useState(false);
  // 실패한 오류와 그 화면의 '…하지 못했어요' 문장(언어를 바꾸면 따라간다)
  const [error, setError] = useState<{ error: unknown; fallback: "readFailed" | "saveFailed" } | null>(null);
  const [busy, setBusy] = useState(false);
  const locale = useLocale();
  const m = useMessages(APP);
  const t = m.consent;

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
        setError({ error: e, fallback: "readFailed" });
      }
    })();
  }, [router]);

  const agree = async () => {
    setBusy(true);
    try {
      await meApi.agree(rawText);
      router.replace(nextPath());
    } catch (e) {
      setError({ error: e, fallback: "saveFailed" });
      setBusy(false);
    }
  };

  return (
    <Screen
      footer={
        <Button disabled={!consent || !records || busy} onClick={agree}>
          {t.agree}
        </Button>
      }
    >
      <Heading eyebrow={t.once}>{t.title}</Heading>
      <div className="flex flex-col gap-3">
        <Card>
          <label className="flex min-h-12 items-start gap-3">
            <input type="checkbox" checked={records} onChange={(e) => setRecords(e.target.checked)} className="mt-1 size-5 accent-primary" />
            <span>
              <strong>{t.records}</strong>
              <span className="mt-1 block break-keep text-ink-muted">{t.recordsBody}</span>
            </span>
          </label>
        </Card>
        <Card>
          <label className="flex min-h-12 items-start gap-3">
            <input type="checkbox" checked={rawText} onChange={(e) => setRawText(e.target.checked)} className="mt-1 size-5 accent-primary" />
            <span>
              <strong>{t.rawText}</strong>
              <span className="mt-1 block break-keep text-ink-muted">{t.rawTextBody(consent?.text_retention_days ?? 90)}</span>
            </span>
          </label>
        </Card>
        <p className="text-caption break-keep text-ink-muted">
          {t.openai}
          {consent && t.version(consent.version)}
        </p>
        {error && <p className="text-caption break-keep">{errorText(error.error, locale, t[error.fallback])}</p>}
      </div>
    </Screen>
  );
}

function nextPath(): string {
  const next = new URLSearchParams(window.location.search).get("next");
  return next?.startsWith("/") ? next : "/";
}
