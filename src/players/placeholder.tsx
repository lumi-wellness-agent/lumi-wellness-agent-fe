"use client";

/**
 * 아직 만들지 않은 플레이어 자리. 시작 안내와 경과 시간을 보여 주고 "다 했어요"로 마친다 —
 * 플레이어가 늦어도 세션 흐름(사후 측정 → 평가 → 재계획)은 끝까지 돈다. 개발 서버에서는 담당과
 * 이 활동의 content_spec 요약을 함께 보여 준다.
 */

import { useEffect, useState } from "react";
import { Button } from "@/ui/controls";
import { PLAYERS, playerKeyFor } from "./catalog";
import type { PlayerProps } from "./types";

export function Placeholder({ content, step, onFinish }: PlayerProps) {
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(timer);
  }, []);
  const clock = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;

  return (
    <div className="mx-auto flex w-full max-w-[480px] flex-1 flex-col px-4 py-6">
      <p className="text-caption font-bold text-ink-muted">{step.label}</p>
      <p className="mt-2 font-display text-title tabular-nums">{clock}</p>
      <p className="text-caption text-ink-muted">약 {step.minutes}분</p>
      {content.guide_text && <p className="mt-6 break-keep">{content.guide_text}</p>}
      <p className="mt-4 text-caption break-keep text-ink-muted">
        이 활동 화면은 준비 중이에요. 안내에 따라 진행한 뒤 &lsquo;다 했어요&rsquo;를 눌러 주세요.
      </p>
      {process.env.NODE_ENV !== "production" && <DevNotes {...{ content }} />}
      <div className="mt-auto pt-6 pb-[env(safe-area-inset-bottom)]">
        <Button className="w-full" onClick={() => onFinish({ completed: true })}>
          다 했어요
        </Button>
      </div>
    </div>
  );
}

function DevNotes({ content }: Pick<PlayerProps, "content">) {
  const key = playerKeyFor(content.protocol_id);
  const player = key ? PLAYERS[key] : null;
  const sessionUi = content.content_spec.session_ui;
  return (
    <details className="mt-6 rounded-row border border-line p-3 text-caption">
      <summary className="min-h-12 cursor-pointer content-center font-bold">
        개발 정보 — {player ? `${player.title} · 담당 ${player.owner} · src/players/${key}/player.tsx` : "플레이어 없음"}
      </summary>
      <ul className="mt-2 flex flex-col gap-1 break-all">
        {(content.content_spec.slots ?? []).map((slot) => (
          <li key={slot.slot}>
            <strong>{slot.slot}</strong> — {Object.keys(slot).filter((k) => k !== "slot").join(", ")}
          </li>
        ))}
        {sessionUi && (
          <li>
            <strong>session_ui</strong> — {Object.keys(sessionUi).join(", ")}
          </li>
        )}
        <li>
          <strong>assets</strong> — {content.assets.length ? content.assets.map((a) => a.slot).join(", ") : "없음"}
        </li>
        {content.asset_warnings.map((warning) => (
          <li key={warning} className="text-ink-muted">
            {warning}
          </li>
        ))}
      </ul>
    </details>
  );
}
