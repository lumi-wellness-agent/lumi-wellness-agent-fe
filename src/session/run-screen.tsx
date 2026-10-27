"use client";

/**
 * RUN — 추천 활동 소개 → 플레이어. payload는 {plan, content}다.
 *
 * - 소개: 활동 이름 · 시간 · 추천 이유(rationale) · "왜 추천했나요?"(Reference 카드) · 환경 안내.
 *   환경을 풀어 고른 활동(environment_gaps)이면 "소리가 나와요" 같은 안내와 "지금은 어려워요"를 함께 보인다.
 * - "시작하기"를 누른 순간 안내 음성과 알림음을 깨운다(iOS는 사용자가 누른 순간에만 소리를 열어 준다).
 * - "지금은 어려워요"는 끝까지 못 한 것으로 보고한다 — 사후 측정 뒤 replan이 활동 변경을 권한다.
 */

import { useEffect, useState } from "react";
import type { RunPayload, SessionReport } from "@/lib/api/types";
import { loadVoices, unlockSpeech } from "@/lib/speech";
import { unlockTone } from "@/lib/tone";
import { PlayerHost } from "@/players/player-host";
import { Button, Card, Heading, Screen } from "@/ui/controls";
import { GAP_NOTICES } from "./labels";
import { ReferenceCardView } from "./reference-card";

export function RunScreen({
  payload,
  busy,
  onReport,
}: {
  payload: RunPayload;
  busy: boolean;
  onReport: (report: SessionReport) => void;
}) {
  const { plan, content } = payload;
  const [playing, setPlaying] = useState(false);
  const [why, setWhy] = useState(false);

  useEffect(() => {
    void loadVoices(); // 첫 대본부터 좋은 음성으로 읽도록 미리 불러 둔다
  }, []);

  if (playing) return <PlayerHost content={content} onReport={onReport} />;

  const start = () => {
    unlockSpeech();
    unlockTone();
    setPlaying(true);
  };

  return (
    <Screen
      footer={
        <>
          <Button onClick={start} disabled={busy}>
            시작하기
          </Button>
          <Button
            variant="quiet"
            disabled={busy}
            onClick={() => onReport({ completed: false, stopped_reason: "지금은 어려워요" })}
          >
            지금은 어려워요
          </Button>
        </>
      }
    >
      <Heading eyebrow={`추천 활동 · 약 ${plan.activity.minutes}분`}>{content.name}</Heading>
      <p className="break-keep">{plan.rationale}</p>

      {plan.environment_gaps.length > 0 && (
        <ul className="mt-4 flex flex-col gap-2">
          {plan.environment_gaps.map((gap) => (
            <li key={gap} className="rounded-row bg-primary-soft p-3 text-on-primary-soft">
              {GAP_NOTICES[gap] ?? gap}
            </li>
          ))}
        </ul>
      )}

      {content.guide_text && (
        <Card className="mt-5">
          <p className="mb-1 text-caption font-bold text-ink-muted">시작 안내</p>
          <p className="break-keep">{content.guide_text}</p>
        </Card>
      )}

      {plan.reference_card && (
        <section className="mt-5">
          <Button variant="secondary" className="w-full" aria-expanded={why} onClick={() => setWhy((v) => !v)}>
            왜 추천했나요?
          </Button>
          {why && (
            <Card className="mt-3">
              <ReferenceCardView card={plan.reference_card} />
            </Card>
          )}
        </section>
      )}

      <p className="mt-6 text-caption text-ink-muted">
        LUMI는 의료적 진단이나 치료를 대신하지 않습니다. 불편하면 언제든 멈출 수 있어요.
      </p>
    </Screen>
  );
}
