"use client";

/**
 * 시작 입력 — "오늘 상황이 어떠세요?"(BE intake의 고정 첫 질문)의 답과 선택 칩. 담당 A(TEAM.md).
 *
 * 이 값이 POST /sessions의 CareRequest가 된다(BE app/schemas/care.py). text만 필수이고, 칩(장소 · 이어폰 · 시간)은
 * 고르면 intake가 문장에서 읽은 값보다 우선한다. 목표(S1 · S2 · S3)는 묻지 않는다 — intake가 문장과 대화로 추론한다.
 * 로그인 · 게스트 고지 · 시작 버튼은 시작 화면(src/app/start-form.tsx, 통합 담당)이 맡는다.
 *
 * 입력 칸 아래 예시 문장(EXAMPLE_TEXTS)을 누르면 칸에 채워지고 여건 칩(EXAMPLE_CONTEXT)도 같이 골라지며 여건 섹션이
 * 펼쳐진다 — 무엇을 쓰면 되는지 보여 주고, 질문 없이 측정으로 바로 가게 하는 용도다. 칩은 그대로 고칠 수 있다.
 * 프로필(선호 풍경 · 선호 색 · 피하고 싶은 색)은 세션마다 다시 묻지 않는 선호라 이 기기에 기억해 두고(localStorage)
 * CareRequest.profile로 보낸다. 피하고 싶은 색에 검정 · 진한 보라가 있으면 setAvoidDark(true)(src/lib/light.ts).
 */

import { useEffect, useState, type ReactNode } from "react";
import type { CareRequest, Setting, UserProfile } from "@/lib/api/types";
import { setAvoidDark } from "@/lib/light";
import { Chip } from "@/ui/controls";
import {
  COLOR_CHOICES,
  DARK_COLORS,
  EXAMPLE_CONTEXT,
  EXAMPLE_TEXTS,
  GROUP_LABELS,
  MAX_PREFERRED_COLORS,
  MINUTE_CHOICES,
  SCENERY_CHOICES,
  SETTING_LABELS,
} from "./labels";

const PROFILE_KEY = "lumi:profile";

function loadProfile(): UserProfile | null {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    return raw ? (JSON.parse(raw) as UserProfile) : null;
  } catch {
    return null;
  }
}

function saveProfile(profile: UserProfile) {
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  } catch {
    // 저장이 막힌 브라우저(사생활 보호 모드 등)에서는 이번 세션에만 쓴다
  }
}

const toggled = (list: string[] | undefined, value: string) =>
  list?.includes(value) ? list.filter((v) => v !== value) : [...(list ?? []), value];

export function StartInput({ value, onChange }: { value: CareRequest; onChange: (next: CareRequest) => void }) {
  const set = (patch: Partial<CareRequest>) => onChange({ ...value, ...patch });
  const profile = value.profile ?? {};
  // 여건 섹션 — 예시를 누르면 펼쳐서 같이 골라진 칩을 보인다. 사용자가 접고 펴면 onToggle로 따라간다
  const [contextOpen, setContextOpen] = useState(false);

  // 지난번에 고른 프로필을 한 번 불러온다
  useEffect(() => {
    const saved = loadProfile();
    if (saved && !value.profile) onChange({ ...value, profile: saved });
    // 처음 한 번만 — value가 바뀔 때마다 덮어쓰지 않는다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setProfile = (patch: Partial<UserProfile>) => {
    const next = { ...profile, ...patch };
    saveProfile(next);
    if (patch.avoided_colors) setAvoidDark(patch.avoided_colors.some((c) => DARK_COLORS.includes(c)));
    set({ profile: next });
  };

  const preferred = profile.preferred_colors ?? [];
  const avoided = profile.avoided_colors ?? [];
  const contextCount = [value.setting, value.earphones, value.minutes_available].filter((v) => v != null).length;
  const profileCount = (profile.preferred_scenery?.length ?? 0) + preferred.length + avoided.length;
  return (
    <>
      <label className="flex flex-col gap-2">
        <span className="font-display text-title">오늘 상황이 어떠세요?</span>
        <textarea
          value={value.text}
          onChange={(e) => set({ text: e.target.value })}
          rows={3}
          maxLength={500}
          placeholder="한두 마디면 충분해요"
          className="rounded-row border border-line-control bg-control p-3 text-body text-ink"
        />
      </label>
      <div className="mt-3">
        <p className="mb-2 text-caption text-ink-muted">이렇게 써도 돼요</p>
        <div className="flex flex-wrap gap-2">
          {EXAMPLE_TEXTS.map((example) => (
            <Chip
              key={example}
              selected={value.text === example}
              className="text-left"
              onClick={() => {
                set({ text: example, ...EXAMPLE_CONTEXT });
                setContextOpen(true);
              }}
            >
              {example}
            </Chip>
          ))}
        </div>
      </div>

      <details className="mt-4" open={contextOpen} onToggle={(e) => setContextOpen(e.currentTarget.open)}>
        <summary className="min-h-12 cursor-pointer content-center font-bold text-ink-muted">
          지금 여건 알려 주기 (선택){contextCount > 0 && ` · ${contextCount}개 고름`}
        </summary>
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

      <details className="mt-1">
        <summary className="min-h-12 cursor-pointer content-center font-bold text-ink-muted">
          내 취향 알려 주기 (선택){profileCount > 0 && ` · ${profileCount}개 고름`}
        </summary>
        <p className="mt-1 text-caption text-ink-muted break-keep">이 기기에 기억해 두고 다음에도 써요.</p>
        <ChipGroup label="좋아하는 풍경">
          {SCENERY_CHOICES.map((c) => (
            <Chip
              key={c.value}
              selected={profile.preferred_scenery?.includes(c.value) ?? false}
              onClick={() => setProfile({ preferred_scenery: toggled(profile.preferred_scenery, c.value) })}
            >
              {c.label}
            </Chip>
          ))}
        </ChipGroup>
        <ChipGroup label={`좋아하는 색 (${MAX_PREFERRED_COLORS}개까지)`}>
          {COLOR_CHOICES.map((c) => {
            const on = preferred.includes(c.value);
            return (
              <Chip
                key={c.value}
                selected={on}
                className="disabled:opacity-40"
                disabled={!on && (preferred.length >= MAX_PREFERRED_COLORS || avoided.includes(c.value))}
                onClick={() => setProfile({ preferred_colors: toggled(preferred, c.value) })}
              >
                {c.label}
              </Chip>
            );
          })}
        </ChipGroup>
        <ChipGroup label="불편한 색">
          {COLOR_CHOICES.map((c) => {
            const on = avoided.includes(c.value);
            return (
              <Chip
                key={c.value}
                selected={on}
                className="disabled:opacity-40"
                disabled={!on && preferred.includes(c.value)}
                onClick={() => setProfile({ avoided_colors: toggled(avoided, c.value) })}
              >
                {c.label}
              </Chip>
            );
          })}
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
