/**
 * "왜 추천했나요?" — plan.reference_card를 그대로 그린다(BE app/schemas/card.py, README 「Reference 카드」).
 *
 * 근거마다 이론 → 논문(DOI) → 대상 · 실험 조건 → 결과 → 한계 순서다. 원문 구간(excerpts)은 요약하지 않은
 * 영어 원문이라 '원문 보기'에 접어 둔다. 카드의 사실은 BE가 검증한 값이라 FE가 문장을 지어내지 않는다 —
 * 코드 값의 이름(배지 · 지표 · 섹션)만 FE가 정한다(labels.ts).
 */

import { nameOf } from "@/i18n/locale";
import { useLocale, useMessages } from "@/i18n/use-locale";
import type { CardEvidence, ReferenceCard } from "@/lib/api/types";
import { LABELS } from "./labels";
import { SESSION } from "./messages";

export function ReferenceCardView({ card }: { card: ReferenceCard }) {
  const { goal } = card;
  const t = useMessages(SESSION).card;
  const labels = useMessages(LABELS);
  // 목표 라벨은 BE가 한국어로 보낸다 — 한국어 화면은 그대로, 영어 화면은 목표 코드의 이름을 쓴다
  const goalLabel = useLocale() === "ko" ? goal.label : labels.goals[goal.goal];
  return (
    <div className="flex flex-col gap-5 text-body">
      {card.badges.length > 0 && (
        <ul className="flex flex-wrap gap-1.5" aria-label={t.badges}>
          {card.badges.map((badge) => (
            <li key={badge} className="rounded-full bg-surface-muted px-2.5 py-1 text-caption font-bold text-ink-muted">
              {nameOf(labels.badges, badge)}
            </li>
          ))}
        </ul>
      )}

      <section>
        <h3 className="mb-1 font-bold">{t.goal(goalLabel)}</h3>
        {goal.reason && <p className="break-keep text-ink-muted">{goal.reason}</p>}
        {goal.measured_by && (
          <p className="mt-1 text-caption text-ink-muted">
            {t.measuredBy(goal.measured_by.name)}
            {goal.measured_by.provisional && t.provisional}
          </p>
        )}
        {goal.notes.map((note) => (
          <p key={note} className="mt-1 text-caption break-keep text-ink-muted">
            {note}
          </p>
        ))}
        {goal.definitions.length > 0 && (
          <details className="mt-2">
            <summary className="min-h-12 cursor-pointer content-center font-bold">{t.definitions}</summary>
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
          <h3 className="mb-1 font-bold">{t.grades}</h3>
          <ul className="flex flex-wrap gap-x-4 gap-y-1">
            {Object.entries(card.grades).map(([outcome, grade]) => (
              <li key={outcome}>
                {nameOf(labels.outcomes, outcome)} <strong>{grade}</strong>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <h3 className="mb-2 font-bold">{t.evidence}</h3>
        {card.evidence.length === 0 ? (
          <p className="text-ink-muted">{t.noEvidence}</p>
        ) : (
          <ol className="flex flex-col gap-3">
            {card.evidence.map((evidence) => (
              <EvidenceItem key={evidence.evidence_record_ids.join("-")} evidence={evidence} />
            ))}
          </ol>
        )}
      </section>

      <section>
        <h3 className="mb-1 font-bold">{t.limits}</h3>
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
  const t = useMessages(SESSION).card;
  const labels = useMessages(LABELS);
  const conditions = [
    evidence.population,
    evidence.n && t.participants(evidence.n),
    evidence.exposure_minutes && t.exposure(evidence.exposure_minutes),
    evidence.studied_orders.map((o) => nameOf(labels.orders, o)).join(" · "),
  ].filter(Boolean);
  return (
    <li className="rounded-row border border-line p-3">
      <p className="text-caption font-bold text-ink-muted">
        {evidence.supports_goal ? t.supports : t.reference}
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
              {nameOf(labels.outcomes, r.outcome)}
              {r.measure && `(${r.measure})`}: {nameOf(labels.effects, r.effect)}
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
        <summary className="min-h-12 cursor-pointer content-center text-caption font-bold">{t.source}</summary>
        {evidence.excerpts.map((x) => (
          <blockquote key={`${x.evidence_record_id}-${x.section}`} className="mt-2 border-l-2 border-line-strong pl-3 text-caption">
            <span className="font-bold">{nameOf(labels.sections, x.section)}</span> <span lang="en">{x.text}</span>
          </blockquote>
        ))}
      </details>
    </li>
  );
}
