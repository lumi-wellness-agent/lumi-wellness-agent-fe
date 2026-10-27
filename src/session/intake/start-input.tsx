"use client";

/**
 * 시작 입력 — "오늘 상황이 어떠세요?"(BE intake의 고정 첫 질문)의 답과 선택 환경 칩. 담당 A(TEAM.md).
 *
 * 이 값이 POST /sessions의 CareRequest가 된다(BE app/schemas/care.py). text만 필수이고, 칩(장소 · 이어폰 · 시간)은
 * 고르면 intake가 문장에서 읽은 값보다 우선한다. 목표(S1 · S2 · S3)는 묻지 않는다 — intake가 문장과 대화로 추론한다.
 * 로그인 · 게스트 고지 · 시작 버튼은 시작 화면(src/app/start-form.tsx, 통합 담당)이 맡는다.
 *
 * 남은 것: 프로필(선호 색 · 풍경 · 피하고 싶은 색) → CareRequest.profile, avoided_colors에 검정 · 진한 보라가 있으면
 * setAvoidDark(true)(src/lib/light.ts).
 */

import type { ReactNode } from "react";
import type { CareRequest, Setting } from "@/lib/api/types";
import { Chip } from "@/ui/controls";
import { GROUP_LABELS, MINUTE_CHOICES, SETTING_LABELS } from "./labels";

export function StartInput({ value, onChange }: { value: CareRequest; onChange: (next: CareRequest) => void }) {
  const set = (patch: Partial<CareRequest>) => onChange({ ...value, ...patch });
  return (
    <>
      <label className="flex flex-col gap-2">
        <span className="font-display text-title">오늘 상황이 어떠세요?</span>
        <textarea
          value={value.text}
          onChange={(e) => set({ text: e.target.value })}
          rows={3}
          maxLength={500}
          placeholder="예: 발표 앞두고 긴장돼요"
          className="rounded-row border border-line-control bg-control p-3 text-body text-ink"
        />
      </label>

      <details className="mt-4">
        <summary className="min-h-12 cursor-pointer content-center font-bold text-ink-muted">지금 여건 알려 주기 (선택)</summary>
        <ChipGroup label={GROUP_LABELS.setting}>
          {(Object.keys(SETTING_LABELS) as Setting[]).map((key) => (
            <Chip key={key} selected={value.setting === key} onClick={() => set({ setting: value.setting === key ? null : key })}>
              {SETTING_LABELS[key]}
            </Chip>
          ))}
        </ChipGroup>
        <ChipGroup label={GROUP_LABELS.earphones}>
          {[true, false].map((on) => (
            <Chip key={String(on)} selected={value.earphones === on} onClick={() => set({ earphones: value.earphones === on ? null : on })}>
              {on ? "있어요" : "없어요"}
            </Chip>
          ))}
        </ChipGroup>
        <ChipGroup label={GROUP_LABELS.minutes}>
          {MINUTE_CHOICES.map((minutes) => (
            <Chip
              key={minutes}
              selected={value.minutes_available === minutes}
              onClick={() => set({ minutes_available: value.minutes_available === minutes ? null : minutes })}
            >
              {minutes === 20 ? "20분 이상" : `${minutes}분`}
            </Chip>
          ))}
        </ChipGroup>
      </details>
    </>
  );
}

function ChipGroup({ label, children }: { label: string; children: ReactNode }) {
  return (
    <fieldset className="mt-3">
      <legend className="mb-2 text-caption font-bold text-ink-muted">{label}</legend>
      <div className="flex flex-wrap gap-2">{children}</div>
    </fieldset>
  );
}
