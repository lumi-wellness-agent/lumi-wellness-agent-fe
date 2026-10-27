"use client";

import { useEffect, useState } from "react";
import { runFixtures } from "@/fixtures";
import type { RunPayload, SessionReport } from "@/lib/api/types";
import { RunScreen } from "@/session/run-screen";
import { Button, ButtonLink, Card, Heading, Screen } from "@/ui/controls";

/**
 * 견본 RUN payload로 RunScreen을 그대로 띄운다 — 세션과 같은 소개 · 시작 버튼 · 호스트 · NOTICE를 지난다.
 * 끝나면 BE로 보냈을 SessionReport를 보여 준다. 견본에는 외부 공급자 자산(사진 · 영상 · 자연음)이 없다.
 */
export function PlayerPreview({ id }: { id: string }) {
  const [payload, setPayload] = useState<RunPayload | null>(null);
  const [report, setReport] = useState<SessionReport | null>(null);
  const [round, setRound] = useState(0);

  useEffect(() => {
    void runFixtures[id]().then(setPayload);
  }, [id]);

  if (!payload) return null;
  if (report) {
    return (
      <Screen
        footer={
          <>
            <Button
              onClick={() => {
                setReport(null);
                setRound((r) => r + 1);
              }}
            >
              다시 해 보기
            </Button>
            <ButtonLink href="/dev" variant="quiet">
              목록으로
            </ButtonLink>
          </>
        }
      >
        <Heading eyebrow={`${id} · 개발용`}>보낼 SessionReport</Heading>
        <Card>
          <pre className="text-caption break-all whitespace-pre-wrap">{JSON.stringify(report, null, 2)}</pre>
        </Card>
        <details className="mt-4">
          <summary className="min-h-12 cursor-pointer content-center font-bold">견본 content 전체</summary>
          <pre className="text-caption break-all whitespace-pre-wrap">{JSON.stringify(payload.content, null, 2)}</pre>
        </details>
      </Screen>
    );
  }
  return <RunScreen key={round} payload={payload} busy={false} onReport={setReport} />;
}
