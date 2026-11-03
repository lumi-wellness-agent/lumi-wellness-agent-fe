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
import { nameOf } from "@/i18n/locale";
import { useMessages } from "@/i18n/use-locale";
import type { RunPayload, SessionReport } from "@/lib/api/types";
import { loadVoices, unlockSpeech } from "@/lib/speech";
import { unlockTone } from "@/lib/tone";
import { PlayerHost } from "@/players/player-host";
import { Button, Card, Chip, Heading, Screen } from "@/ui/controls";
import { LABELS } from "./labels";
import { SESSION } from "./messages";
import { ReferenceCardView } from "./reference-card";
import { withWalkMinutes } from "./walk-minutes";

// 멈춘 이유는 BE가 그대로 읽어 다음 단계를 권한다(replan) — 화면 언어와 상관없이 같은 값을 보낸다
const NOT_NOW = "지금은 어려워요";

export function RunScreen({
  payload,
  sessionId,
  busy,
  onReport,
}: {
  payload: RunPayload;
  sessionId?: string;
  busy: boolean;
  onReport: (report: SessionReport) => void;
}) {
  const { plan, content } = payload;
  const t = useMessages(SESSION).run;
  const gaps = useMessages(LABELS).gaps;
  const isOutdoorWalk = plan.activity.protocol_id === "PR-11";
  const restoresActivityScreen = isOutdoorWalk || plan.activity.protocol_id === "PR-12";
  const playingKey = `lumi:run-playing:${sessionId ?? "current"}:${plan.activity.protocol_id}`;
  const [playing, setPlaying] = useState(() => {
    if (!restoresActivityScreen || typeof window === "undefined") return false;
    return window.sessionStorage.getItem(playingKey) === "true";
  });
  const [why, setWhy] = useState(false);
  const durationOptions = [20, 50, 90] as const;
  const [selectedMinutes, setSelectedMinutes] = useState<number>(
    (() => {
      const fallback = isOutdoorWalk && durationOptions.includes(plan.activity.minutes as (typeof durationOptions)[number]) ? plan.activity.minutes : 50;
      if (!isOutdoorWalk || typeof window === "undefined") return fallback;
      const saved = Number(window.sessionStorage.getItem(`${playingKey}:minutes`));
      return durationOptions.includes(saved as (typeof durationOptions)[number]) ? saved : fallback;
    })(),
  );

  useEffect(() => {
    void loadVoices(); // 첫 대본부터 좋은 음성으로 읽도록 미리 불러 둔다
  }, []);

  const handleReport = (report: SessionReport) => {
    if (restoresActivityScreen) {
      window.sessionStorage.removeItem(playingKey);
      if (isOutdoorWalk) window.sessionStorage.removeItem(`${playingKey}:minutes`);
    }
    onReport(report);
  };

  if (playing) {
    const runtimeContent = isOutdoorWalk
      ? {
          ...content,
          guide_text: withWalkMinutes(content.guide_text, selectedMinutes),
          steps: content.steps.map((step) => (step.type === "ACTIVITY" ? { ...step, minutes: selectedMinutes } : step)),
        }
      : content;
    return <PlayerHost content={runtimeContent} onReport={handleReport} />;
  }

  const displayGuideText = isOutdoorWalk ? withWalkMinutes(content.guide_text, selectedMinutes) : content.guide_text;

  const start = () => {
    unlockSpeech();
    unlockTone();
      if (restoresActivityScreen) {
        window.sessionStorage.setItem(playingKey, "true");
        if (isOutdoorWalk) window.sessionStorage.setItem(`${playingKey}:minutes`, String(selectedMinutes));
    }
    setPlaying(true);
  };

  return (
    <Screen
      footer={
        <>
          <Button onClick={start} disabled={busy}>
            {t.start}
          </Button>
          <Button
            variant="quiet"
            disabled={busy}
            onClick={() => onReport({ completed: false, stopped_reason: NOT_NOW })}
          >
            {t.notNow}
          </Button>
        </>
      }
    >
      <Heading eyebrow={t.eyebrow(isOutdoorWalk ? selectedMinutes : plan.activity.minutes)}>{content.name}</Heading>
      <p className="break-keep">{plan.rationale}</p>

      {plan.environment_gaps.length > 0 && (
        <ul className="mt-4 flex flex-col gap-2">
          {plan.environment_gaps.map((gap) => (
            <li key={gap} className="rounded-row bg-primary-soft p-3 text-on-primary-soft">
              {nameOf(gaps, gap)}
            </li>
          ))}
        </ul>
      )}

      {displayGuideText && (
        <Card className="mt-5">
          <p className="mb-1 text-caption font-bold text-ink-muted">{t.guide}</p>
          <p className="break-keep">{displayGuideText}</p>
        </Card>
      )}

      {isOutdoorWalk && (
        <Card className="mt-5">
          <p className="mb-2 text-caption font-bold text-ink-muted">{t.duration}</p>
          <div className="flex flex-col gap-2" role="group" aria-label={t.durationGroup}>
            {durationOptions.map((minutes) => (
              <Chip
                key={minutes}
                selected={selectedMinutes === minutes}
                className="flex w-full items-center gap-2 text-left"
                onClick={() => {
                  setSelectedMinutes(minutes);
                  window.sessionStorage.setItem(`${playingKey}:minutes`, String(minutes));
                }}
              >
                <span className="font-bold">{t.minutes(minutes)}</span>
                <span className="text-caption">{t.durations[minutes]}</span>
              </Chip>
            ))}
          </div>
        </Card>
      )}

      {plan.reference_card && (
        <section className="mt-5">
          <Button variant="secondary" className="w-full" aria-expanded={why} onClick={() => setWhy((v) => !v)}>
            {t.why}
          </Button>
          {why && (
            <Card className="mt-3">
              <ReferenceCardView card={plan.reference_card} />
            </Card>
          )}
        </section>
      )}

      <p className="mt-6 text-caption text-ink-muted">{t.stopAnytime}</p>
    </Screen>
  );
}
