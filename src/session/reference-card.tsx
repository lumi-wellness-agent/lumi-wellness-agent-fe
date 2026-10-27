/**
 * "왜 추천했나요?" — plan.reference_card를 그대로 그린다(BE app/schemas/card.py, README 「Reference 카드」).
 *
 * 근거마다 이론 → 논문(DOI) → 대상 · 실험 조건 → 결과 → 한계 순서다. 원문 구간(excerpts)은 요약하지 않은
 * 영어 원문이고, 검증 6항목(checks)은 자세히 보기에 둔다. 카드의 사실은 BE가 검증한 값이라 FE가 문장을
 * 지어내지 않는다 — 배지 문구만 FE가 정한다(labels.ts).
 */

import type { CardEvidence, ReferenceCard } from "@/lib/api/types";
import { BADGE_LABELS, EFFECT_LABELS, ORDER_LABELS, OUTCOME_LABELS } from "./labels";

export function ReferenceCardView({ card }: { card: ReferenceCard }) {
  const { goal } = card;
  return (
    <div className="flex flex-col gap-5 text-body">
      {card.badges.length > 0 && (
        <ul className="flex flex-wrap gap-1.5" aria-label="표시">
          {card.badges.map((badge) => (
            <li key={badge} className="rounded-full bg-surface-muted px-2.5 py-1 text-caption font-bold text-ink-muted">
              {BADGE_LABELS[badge] ?? badge}
            </li>
          ))}
        </ul>
      )}

      <section>
        <h3 className="mb-1 font-bold">목표 — {goal.label}</h3>
        {goal.reason && <p className="break-keep text-ink-muted">{goal.reason}</p>}
        {goal.measured_by && (
          <p className="mt-1 text-caption text-ink-muted">
            LUMI가 재는 척도: {goal.measured_by.name}
            {goal.measured_by.provisional && " (임시 · 타당화 전)"}
          </p>
        )}
        {goal.notes.map((note) => (
          <p key={note} className="mt-1 text-caption break-keep text-ink-muted">
            {note}
          </p>
        ))}
        {goal.definitions.length > 0 && (
          <details className="mt-2">
            <summary className="min-h-12 cursor-pointer content-center font-bold">목표 개념의 정의(원문)</summary>
            <ul className="mt-1 flex flex-col gap-3">
              {goal.definitions.map((d) => (
                <li key={d.sentence} className="text-caption">
                  <q className="italic">{d.sentence}</q>
                  {d.paper && (
                    <span className="mt-0.5 block text-ink-muted">
                      — {d.paper.authors} ({d.paper.year}){d.page && `, p.${d.page}`}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </details>
        )}
      </section>

      {Object.keys(card.grades).length > 0 && (
        <section>
          <h3 className="mb-1 font-bold">근거 등급</h3>
          <ul className="flex flex-wrap gap-x-4 gap-y-1">
            {Object.entries(card.grades).map(([outcome, grade]) => (
              <li key={outcome}>
                {OUTCOME_LABELS[outcome] ?? outcome} <strong>{grade}</strong>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <h3 className="mb-2 font-bold">연구 근거</h3>
        {card.evidence.length === 0 ? (
          <p className="text-ink-muted">이번에는 검증을 통과한 연구를 찾지 못했어요.</p>
        ) : (
          <ol className="flex flex-col gap-3">
            {card.evidence.map((evidence) => (
              <EvidenceItem key={evidence.evidence_record_ids.join("-")} evidence={evidence} />
            ))}
          </ol>
        )}
      </section>

      <section>
        <h3 className="mb-1 font-bold">한계</h3>
        <ul className="list-disc pl-5 text-caption break-keep text-ink-muted">
          {card.limits.map((limit) => (
            <li key={limit}>{limit}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function EvidenceItem({ evidence }: { evidence: CardEvidence }) {
  const { paper } = evidence;
  const conditions = [
    evidence.population,
    evidence.n && `${evidence.n}명`,
    evidence.exposure_minutes && `${evidence.exposure_minutes}분`,
    evidence.studied_orders.map((o) => ORDER_LABELS[o] ?? o).join(" · "),
  ].filter(Boolean);
  return (
    <li className="rounded-row border border-line p-3">
      <p className="text-caption font-bold text-ink-muted">
        {evidence.supports_goal ? "목표를 지지하는 연구" : "참고 연구"}
        {evidence.theories.length > 0 && ` · ${evidence.theories.join(" · ")}`}
      </p>
      <p className="mt-1 font-bold break-keep">
        {paper.url ? (
          <a href={paper.url} target="_blank" rel="noreferrer" className="underline underline-offset-2">
            {paper.title}
          </a>
        ) : (
          paper.title
        )}
      </p>
      <p className="text-caption text-ink-muted">
        {paper.authors} · {paper.year}
        {paper.doi && ` · DOI ${paper.doi}`}
      </p>
      {conditions.length > 0 && <p className="mt-2 text-caption break-keep">{conditions.join(" · ")}</p>}
      {evidence.results.length > 0 && (
        <ul className="mt-2 flex flex-col gap-1 text-caption">
          {evidence.results.map((r, i) => (
            <li key={i} className="break-keep">
              {OUTCOME_LABELS[r.outcome] ?? r.outcome}
              {r.measure && `(${r.measure})`}: {EFFECT_LABELS[r.effect] ?? r.effect}
              {r.comparison && ` — ${r.comparison}`}
              {r.stat && `, ${r.stat}`}
            </li>
          ))}
        </ul>
      )}
      {evidence.limits.map((limit) => (
        <p key={limit} className="mt-2 text-caption break-keep text-ink-muted">
          {limit}
        </p>
      ))}
      <details className="mt-1">
        <summary className="min-h-12 cursor-pointer content-center text-caption font-bold">원문 구간 · 검증 항목</summary>
        {evidence.excerpts.map((x) => (
          <blockquote key={`${x.evidence_record_id}-${x.section}`} lang="en" className="mt-2 border-l-2 border-line-strong pl-3 text-caption">
            <span className="font-bold">{x.section}</span> {x.text}
          </blockquote>
        ))}
        <ul className="mt-2 flex flex-col gap-1 text-caption text-ink-muted">
          {evidence.checks.map((c) => (
            <li key={c.check}>
              {c.passed === true ? "통과" : c.passed === false ? "주의" : "확인 안 함"} · {c.check} — {c.reason}
            </li>
          ))}
        </ul>
      </details>
    </li>
  );
}
