"use client";

/**
 * 시작 입력 — "오늘 상황이 어떠세요?"(BE intake의 고정 첫 질문)의 답과 선택 칩. 담당 A(TEAM.md).
 *
 * 이 값이 POST /sessions의 CareRequest가 된다(BE app/schemas/care.py). text만 필수이고, 칩(장소 · 이어폰 · 시간)은
 * 고르면 intake가 문장에서 읽은 값보다 우선한다. 목표(S1 · S2 · S3)는 묻지 않는다 — intake가 문장과 대화로 추론한다.
 * 로그인 · 게스트 고지 · 시작 버튼은 시작 화면(src/app/start-form.tsx, 통합 담당)이 맡는다.
 *
 * 입력 칸 아래 예시 문장(INTAKE_LABELS.examples)을 누르면 칸에 채워지고 여건 칩(EXAMPLE_CONTEXT)도 같이 골라지며 여건 섹션이
 * 펼쳐진다 — 무엇을 쓰면 되는지 보여 주고, 질문 없이 측정으로 바로 가게 하는 용도다. 칩은 그대로 고칠 수 있다.
 * 프로필(선호 풍경 · 선호 색 · 피하고 싶은 색)은 세션마다 다시 묻지 않는 선호라 이 기기에 기억해 두고(localStorage)
 * CareRequest.profile로 보낸다. 피하고 싶은 색에 검정 · 진한 보라가 있으면 setAvoidDark(true)(src/lib/light.ts).
 */

import { useEffect, useState, type ReactNode } from "react";
import { useLocale, useMessages } from "@/i18n/use-locale";
import type { CareRequest, UserProfile } from "@/lib/api/types";
import { setAvoidDark } from "@/lib/light";
import { Chip } from "@/ui/controls";
import {
  COLOR_VALUES,
  DARK_COLORS,
  EXAMPLE_CONTEXT,
  INTAKE_LABELS,
  localizedExample,
  MAX_PREFERRED_COLORS,
  MINUTE_CHOICES,
  SCENERY_VALUES,
  SETTINGS,
} from "./labels";
import { INTAKE } from "./messages";

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
  const locale = useLocale();
  const labels = useMessages(INTAKE_LABELS);
  const t = useMessages(INTAKE).start;
  // 예시를 누른 뒤 언어를 바꾸면 칸의 예시도 따라간다 — 보내는 문장도 같은 값이다(start-form.tsx)
  const text = localizedExample(value.text, locale);

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
        <span className="font-display text-title">{t.question}</span>
        <textarea
          value={text}
          onChange={(e) => set({ text: e.target.value })}
          rows={3}
          maxLength={500}
          placeholder={t.placeholder}
          className="rounded-row border border-line-control bg-control p-3 text-body text-ink"
        />
      </label>
      <div className="mt-3">
        <p className="mb-2 text-caption text-ink-muted">{t.examples}</p>
        <div className="flex flex-wrap gap-2">
          {labels.examples.map((example) => (
            <Chip
              key={example}
              selected={text === example}
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
          {t.context}
          {contextCount > 0 && t.picked(contextCount)}
        </summary>
        <ChipGroup label={labels.groups.setting}>
          {SETTINGS.map((key) => (
            <Chip key={key} selected={value.setting === key} onClick={() => set({ setting: value.setting === key ? null : key })}>
              {labels.settings[key]}
            </Chip>
          ))}
        </ChipGroup>
        <ChipGroup label={labels.groups.earphones}>
          {[true, false].map((on) => (
            <Chip key={String(on)} selected={value.earphones === on} onClick={() => set({ earphones: value.earphones === on ? null : on })}>
              {on ? t.earphones.yes : t.earphones.no}
            </Chip>
          ))}
        </ChipGroup>
        <ChipGroup label={labels.groups.minutes}>
          {MINUTE_CHOICES.map((minutes) => (
            <Chip
              key={minutes}
              selected={value.minutes_available === minutes}
              onClick={() => set({ minutes_available: value.minutes_available === minutes ? null : minutes })}
            >
              {t.minutes(minutes)}
            </Chip>
          ))}
        </ChipGroup>
      </details>

      <details className="mt-1">
        <summary className="min-h-12 cursor-pointer content-center font-bold text-ink-muted">
          {t.profile}
          {profileCount > 0 && t.picked(profileCount)}
        </summary>
        <p className="mt-1 text-caption text-ink-muted break-keep">{t.remembered}</p>
        <ChipGroup label={t.likedScenery}>
          {SCENERY_VALUES.map((scenery) => (
            <Chip
              key={scenery}
              selected={profile.preferred_scenery?.includes(scenery) ?? false}
              onClick={() => setProfile({ preferred_scenery: toggled(profile.preferred_scenery, scenery) })}
            >
              {labels.scenery[scenery]}
            </Chip>
          ))}
        </ChipGroup>
        <ChipGroup label={t.likedColors(MAX_PREFERRED_COLORS)}>
          {COLOR_VALUES.map((color) => {
            const on = preferred.includes(color);
            return (
              <Chip
                key={color}
                selected={on}
                className="disabled:opacity-40"
                disabled={!on && (preferred.length >= MAX_PREFERRED_COLORS || avoided.includes(color))}
                onClick={() => setProfile({ preferred_colors: toggled(preferred, color) })}
              >
                {labels.colors[color]}
              </Chip>
            );
          })}
        </ChipGroup>
        <ChipGroup label={t.avoidedColors}>
          {COLOR_VALUES.map((color) => {
            const on = avoided.includes(color);
            return (
              <Chip
                key={color}
                selected={on}
                className="disabled:opacity-40"
                disabled={!on && preferred.includes(color)}
                onClick={() => setProfile({ avoided_colors: toggled(avoided, color) })}
              >
                {labels.colors[color]}
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
