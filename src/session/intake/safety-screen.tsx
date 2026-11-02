/**
 * SAFETY 도움 안내 — intake ① 상황 읽기가 처음 입력이나 글 답에서 안전 신호를 봐서 세션을 끝냈을 때
 * (END payload의 reason이 SAFETY). 측정 · 활동으로 가지 않고 상담 창구를 안내한다. 담당 A(TEAM.md).
 */

import { useMessages } from "@/i18n/use-locale";
import { ButtonLink, Heading, Screen } from "@/ui/controls";
import { INTAKE } from "./messages";

/** 2026-10 기준 국내 상담 전화. 이름은 messages.ts에 있고, 영어 화면도 같은 국내 번호다. 문구와 번호는 발표 전에 다시 확인한다. */
const HELP_LINES = [
  { key: "suicide", number: "109", allDay: true },
  { key: "crisis", number: "1577-0199", allDay: true },
  { key: "emergency", number: "119", allDay: false },
  { key: "police", number: "112", allDay: false },
] as const;

export function SafetyScreen() {
  const t = useMessages(INTAKE).safety;
  return (
    <Screen footer={<ButtonLink href="/">{t.home}</ButtonLink>}>
      <Heading>{t.title}</Heading>
      <p className="break-keep">{t.body}</p>
      {t.region && <p className="mt-5 text-caption font-bold text-ink-muted">{t.region}</p>}
      <ul className={`${t.region ? "mt-2" : "mt-5"} flex flex-col gap-2`}>
        {HELP_LINES.map((line) => (
          <li key={line.key}>
            <a
              href={`tel:${line.number.replace(/[^0-9]/g, "")}`}
              className="flex min-h-12 items-center justify-between gap-3 rounded-row border border-line-control bg-control px-4"
            >
              <span>{t.lines[line.key]}</span>
              <strong className="shrink-0 whitespace-nowrap">
                {line.number}
                {line.allDay && <span className="ml-1 text-caption font-normal text-ink-muted">{t.allDay}</span>}
              </strong>
            </a>
          </li>
        ))}
      </ul>
    </Screen>
  );
}
