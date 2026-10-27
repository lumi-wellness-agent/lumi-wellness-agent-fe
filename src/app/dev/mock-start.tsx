"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { disableMock, enableMock } from "@/lib/api/mock";
import type { Goal } from "@/lib/api/types";
import { GOAL_LABELS } from "@/session/labels";
import { forgetSession, saveDraft } from "@/session/use-session";
import { Button, Chip } from "@/ui/controls";

/** 목업 세션 시작 — 목표와 첫 활동을 고른다. 첫 활동을 비우면 목표별 기본 순서(plan 실측)를 따른다. */
export function MockStart({ protocols }: { protocols: { id: string; name: string; goal: string }[] }) {
  const router = useRouter();
  const [goal, setGoal] = useState<Goal>("S2");
  const [first, setFirst] = useState<string>("");

  const start = () => {
    forgetSession();
    enableMock({ goal, protocolId: first || undefined });
    saveDraft({ text: "(목업) 발표 앞두고 긴장돼요" });
    router.push("/session");
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        {(Object.keys(GOAL_LABELS) as Goal[]).map((g) => (
          <Chip key={g} selected={goal === g} onClick={() => setGoal(g)}>
            {g} {GOAL_LABELS[g]}
          </Chip>
        ))}
      </div>
      <label className="flex flex-col gap-1 text-caption font-bold text-ink-muted">
        첫 활동
        <select
          value={first}
          onChange={(e) => setFirst(e.target.value)}
          className="min-h-12 rounded-row border border-line-control bg-control px-3 text-body font-normal text-ink"
        >
          <option value="">목표별 기본 순서</option>
          {protocols
            .filter((p) => p.id !== "PR-16")
            .map((p) => (
              <option key={p.id} value={p.id}>
                {p.id} {p.name}
              </option>
            ))}
        </select>
      </label>
      <Button onClick={start}>목업 세션 시작</Button>
      <Button variant="quiet" onClick={() => disableMock()}>
        목업 끄기(실제 BE로)
      </Button>
    </div>
  );
}
