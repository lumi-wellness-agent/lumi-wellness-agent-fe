"use client";

/**
 * 플레이어 호스트 — 활동 노드 하나의 단계(steps)를 차례로 실행하고 SessionReport를 만든다.
 *
 * - ACTIVITY 단계는 catalog.ts가 고른 플레이어가, NOTICE 단계는 PR-16 팝업(notice/notice-popup.tsx)이 그린다.
 *   CHOOSE 단계는 아직 쓰는 활동이 없어 건너뛴다.
 * - 위쪽의 "그만하기"는 어느 활동에서나 보인다. 불편하면 바로 멈출 수 있어야 한다.
 * - 화면을 떠나면 읽던 안내 음성을 멈춘다. 플레이어가 따로 정리할 것(오디오 · 타이머)은 플레이어가 치운다.
 */

import { Suspense, lazy, useEffect, useRef, useState, type ComponentType, type LazyExoticComponent } from "react";
import type { ActivityContent, SessionReport } from "@/lib/api/types";
import { cancelSpeech } from "@/lib/speech";
import { Button } from "@/ui/controls";
import { playerKeyFor, type PlayerKey } from "./catalog";
import { NoticePopup } from "./notice/notice-popup";
import { Placeholder } from "./placeholder";
import type { ActivityResult, PlayerProps } from "./types";

const COMPONENTS: Record<PlayerKey, LazyExoticComponent<ComponentType<PlayerProps>>> = {
  slideshow: lazy(() => import("./slideshow/player")),
  listening: lazy(() => import("./listening/player")),
  "image-meditation": lazy(() => import("./image-meditation/player")),
  "guided-timer": lazy(() => import("./guided-timer/player")),
  rest: lazy(() => import("./rest/player")),
  pmr: lazy(() => import("./pmr/player")),
  grounding: lazy(() => import("./grounding/player")),
  coloring: lazy(() => import("./coloring/player")),
  writing: lazy(() => import("./writing/player")),
  "daily-journal": lazy(() => import("./daily-journal/player")),
  "outdoor-walk": lazy(() => import("./outdoor-walk/player")),
  "outdoor-walk-noticing": lazy(() => import("./outdoor-walk-noticing/player")),
};

const STOP_REASONS = ["불편해요", "어지러워요", "지금은 시간이 없어요", "그냥 그만할래요"];

export function PlayerHost({ content, onReport }: { content: ActivityContent; onReport: (report: SessionReport) => void }) {
  const steps = content.steps
    .filter((s) => s.type === "ACTIVITY" || s.type === "NOTICE")
    .sort((a, b) => a.order - b.order);
  const [index, setIndex] = useState(0);
  const [stopping, setStopping] = useState(false);
  const noticeWords = useRef<string[]>([]);
  const reported = useRef(false);

  useEffect(() => () => cancelSpeech(), []);

  const report = (value: SessionReport) => {
    if (reported.current) return;
    reported.current = true;
    cancelSpeech();
    onReport(value);
  };
  const advance = () => {
    if (index + 1 < steps.length) setIndex(index + 1);
    else report({ completed: true, notice_words: noticeWords.current });
  };
  const onFinish = (result: ActivityResult) => {
    if (result.completed) {
      if (result.noticeWords) noticeWords.current = result.noticeWords;
      advance();
    }
    else report({ completed: false, stopped_reason: result.stoppedReason });
  };

  const step = steps[index];
  const key = playerKeyFor(content.protocol_id);
  const Player = key ? COMPONENTS[key] : null;

  return (
    <div className="flex min-h-dvh flex-col bg-page">
      <div className="sticky top-0 z-10 border-b border-line bg-page">
        <div className="mx-auto flex w-full max-w-[480px] items-center justify-between gap-3 px-4 py-1">
          <p className="min-w-0 truncate text-caption font-bold text-ink-muted">
            {content.name}
            {step && steps.length > 1 && ` · ${index + 1}/${steps.length} ${step.label}`}
          </p>
          <Button variant="quiet" className="shrink-0 px-2" onClick={() => setStopping(true)}>
            그만하기
          </Button>
        </div>
      </div>

      <div className="flex flex-1 flex-col">
        {!step ? (
          <Placeholder content={content} step={{ order: 1, type: "ACTIVITY", label: content.name, minutes: 1, optional: false }} onFinish={onFinish} />
        ) : step.type === "NOTICE" ? (
          <NoticePopup
            module={content.notice_module}
            title={content.notice_prompt}
            onDone={(words) => {
              noticeWords.current = words ?? [];
              advance();
            }}
          />
        ) : (
          <Suspense fallback={<p className="p-6 text-center text-ink-muted">활동을 불러오고 있어요</p>}>
            {Player ? <Player key={step.order} content={content} step={step} onFinish={onFinish} /> : <Placeholder content={content} step={step} onFinish={onFinish} />}
          </Suspense>
        )}
      </div>

      {stopping && (
        <div role="dialog" aria-modal="true" aria-labelledby="stop-title" className="fixed inset-0 z-30 flex items-end bg-black/40">
          <div className="mx-auto w-full max-w-[480px] rounded-t-card bg-surface px-4 pt-5 pb-[calc(16px+env(safe-area-inset-bottom))]">
            <h2 id="stop-title" className="mb-1 font-display text-title">
              여기서 멈출까요?
            </h2>
            <p className="mb-4 text-ink-muted">멈춘 이유를 고르면 다음 추천에 참고해요.</p>
            <div className="flex flex-col gap-2">
              {STOP_REASONS.map((reason) => (
                <Button key={reason} variant="secondary" onClick={() => report({ completed: false, stopped_reason: reason })}>
                  {reason}
                </Button>
              ))}
              <Button variant="quiet" onClick={() => setStopping(false)}>
                계속할게요
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
