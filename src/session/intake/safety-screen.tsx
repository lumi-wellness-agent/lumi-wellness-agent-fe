/**
 * SAFETY 도움 안내 — intake ① 상황 읽기가 처음 입력이나 글 답에서 안전 신호를 봐서 세션을 끝냈을 때
 * (END payload의 reason이 SAFETY). 측정 · 활동으로 가지 않고 상담 창구를 안내한다. 담당 A(TEAM.md).
 */

import { ButtonLink, Heading, Screen } from "@/ui/controls";

/** 2026-10 기준 국내 상담 전화. 문구와 번호는 발표 전에 다시 확인한다. */
const HELP_LINES = [
  { name: "자살예방 상담전화", number: "109", note: "24시간" },
  { name: "정신건강 위기상담 전화", number: "1577-0199", note: "24시간" },
  { name: "긴급 상황", number: "112 · 119", note: "" },
];

export function SafetyScreen() {
  return (
    <Screen footer={<ButtonLink href="/">처음으로</ButtonLink>}>
      <Heading>지금은 혼자 감당하지 않으셨으면 해요</Heading>
      <p className="break-keep">
        들려주신 이야기가 걱정돼요. 지금 마음을 함께 나눌 수 있는 곳에 연락해 주세요. LUMI는 위기 상황을 돕기 어려워
        활동을 추천하지 않았어요.
      </p>
      <ul className="mt-5 flex flex-col gap-2">
        {HELP_LINES.map((line) => (
          <li key={line.name}>
            <a
              href={`tel:${line.number.split(" ")[0]}`}
              className="flex min-h-12 items-center justify-between rounded-row border border-line-control bg-control px-4"
            >
              <span>{line.name}</span>
              <strong>
                {line.number}
                {line.note && <span className="ml-1 text-caption font-normal text-ink-muted">{line.note}</span>}
              </strong>
            </a>
          </li>
        ))}
      </ul>
    </Screen>
  );
}
