"use client";

import { useEffect, useState } from "react";
import { intakeFixtures, loadConfirm, loadEnd, measureFixtures } from "@/fixtures";
import type { ConfirmPayload, EndPayload, IntakeQuestion, MeasurePayload } from "@/lib/api/types";
import { ConfirmScreen } from "@/session/confirm-screen";
import { EndScreen } from "@/session/end-screen";
import { AskScreen } from "@/session/intake/ask-screen";
import { MeasureScreen } from "@/session/measure/measure-screen";
import { Button, ButtonLink, Card, Heading, Screen } from "@/ui/controls";

type Loaded =
  | { kind: "ask"; payload: IntakeQuestion }
  | { kind: "measure"; payload: MeasurePayload }
  | { kind: "confirm"; payload: ConfirmPayload }
  | { kind: "end"; payload: EndPayload };

/**
 * 세션 화면 하나를 견본으로 띄우고, 사용자가 답하면 BE로 보냈을 값(IntakeAnswer · 측정 응답 · ReplanDecision)을
 * 보여 준다. 세션 화면과 같은 컴포넌트라 여기서 고친 것이 세션에 그대로 붙는다.
 */
export function ScreenPreview({ name }: { name: string }) {
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [sent, setSent] = useState<unknown>(null);
  const [round, setRound] = useState(0);

  useEffect(() => {
    void load(name).then(setLoaded);
  }, [name]);

  if (!loaded) return null;
  if (sent !== null) {
    return (
      <Screen
        footer={
          <>
            <Button
              onClick={() => {
                setSent(null);
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
        <Heading eyebrow={`${name} · 개발용`}>BE로 보낼 값</Heading>
        <Card>
          <pre className="text-caption break-all whitespace-pre-wrap">{JSON.stringify(sent, null, 2)}</pre>
        </Card>
      </Screen>
    );
  }

  switch (loaded.kind) {
    case "ask":
      return <AskScreen key={round} question={loaded.payload} busy={false} onAnswer={setSent} />;
    case "measure":
      return <MeasureScreen key={round} payload={loaded.payload} busy={false} onSubmit={setSent} />;
    case "confirm":
      return <ConfirmScreen key={round} payload={loaded.payload} busy={false} onDecide={(step) => setSent({ next_step: step })} />;
    case "end":
      return <EndScreen payload={loaded.payload} />;
  }
}

async function load(name: string): Promise<Loaded> {
  if (name.startsWith("ask-")) return { kind: "ask", payload: await intakeFixtures[name.slice(4)]() };
  if (name.startsWith("measure-")) return { kind: "measure", payload: await measureFixtures[name.slice(8)]() };
  if (name === "confirm") return { kind: "confirm", payload: await loadConfirm() };
  if (name === "end-safety") return { kind: "end", payload: { reason: "SAFETY" } };
  return { kind: "end", payload: await loadEnd() };
}
