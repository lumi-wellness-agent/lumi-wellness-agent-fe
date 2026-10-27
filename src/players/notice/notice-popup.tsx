"use client";

/**
 * NOTICE 단계 — PR-16 감정에 이름 붙이기 팝업. 담당 C(TEAM.md).
 *
 * 호스트 활동(PR-01 · 09 · 15 · 21)의 NOTICE 단계에서 호스트가 띄운다. 명세는 content.notice_module
 * (BE data/protocols/PR-16.json의 session_ui) — 칸 수(input.slot_count), 칸마다 글자 수
 * (per_slot_max_characters), 최소 칸 수(minimum_valid_slots), 시작 문구(popup.start_text), SKIP · CONTINUE.
 * 적은 단어는 SessionReport.notice_words로 서버에 남는다(빈 칸은 빼고 각 20자 이하). 점수화하지 않는다.
 *
 * 지금은 기본 동작만 있다. 남은 것: 칸마다 단어 수(per_slot_min/max_words) 검사, 줄바꿈 막기,
 * persistence(새로고침 처리), 호스트 NOTICE 슬롯 문구(text_ref) 반영.
 */

import { useState } from "react";
import type { NoticeModule } from "@/lib/api/types";
import { Button } from "@/ui/controls";

const START_TEXT = "감정이나 분위기를 1~3개의 짧은 단어로 입력해 주세요. 이 활동에는 정답이 있지 않습니다.";

export function NoticePopup({
  module,
  title,
  onDone,
}: {
  module: NoticeModule | null;
  title: string | null;
  /** 적은 단어(1~3개). 건너뛰면 null. */
  onDone: (words: string[] | null) => void;
}) {
  const count = module?.input?.slot_count ?? 3;
  const maxLength = module?.input?.per_slot_max_characters ?? 20;
  const minimum = module?.input?.minimum_valid_slots ?? 1;
  const [words, setWords] = useState<string[]>(() => Array(count).fill(""));
  const filled = words.map((w) => w.trim().replace(/\s+/g, " ")).filter(Boolean);

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="notice-title" className="fixed inset-0 z-20 flex items-end bg-black/40">
      <div className="mx-auto w-full max-w-[480px] rounded-t-card bg-surface px-4 pt-5 pb-[calc(16px+env(safe-area-inset-bottom))]">
        <h2 id="notice-title" className="mb-1 font-display text-title">
          {title ?? "지금 느낌 알아차리기"}
        </h2>
        <p className="mb-4 break-keep text-ink-muted">{module?.popup?.start_text ?? START_TEXT}</p>
        <div className="mb-4 flex flex-col gap-2">
          {words.map((word, i) => (
            <input
              key={i}
              value={word}
              maxLength={maxLength}
              aria-label={`단어 ${i + 1}`}
              placeholder={i === 0 ? "예: 차분함" : "더 적어도 돼요"}
              onChange={(e) => setWords((all) => all.map((w, j) => (j === i ? e.target.value : w)))}
              className="min-h-12 rounded-row border border-line-control bg-control px-3 text-body text-ink"
            />
          ))}
        </div>
        <div className="flex flex-col gap-2">
          <Button disabled={filled.length < minimum} onClick={() => onDone(filled)}>
            계속
          </Button>
          <Button variant="quiet" onClick={() => onDone(null)}>
            건너뛰기
          </Button>
        </div>
      </div>
    </div>
  );
}
