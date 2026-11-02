import { keyDate, monthCells, monthStart } from "@/lib/days";

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];
const MONTH = new Intl.DateTimeFormat("ko-KR", { year: "numeric", month: "long" }); // 2026년 11월
const DAY_NAME = new Intl.DateTimeFormat("ko-KR", { month: "long", day: "numeric", weekday: "long" }); // 11월 2일 월요일

type CalendarProps = {
  month: number; // 보이는 달(days.ts의 monthIndex) — 기록을 달마다 받으므로 페이지가 정한다
  first: number; // 넘길 수 있는 가장 이른 달(첫 기록의 달)
  last: number; // 가장 늦은 달(이번 달)
  onMonth: (month: number) => void;
  loading: boolean; // 보이는 달의 기록을 받는 중 — 점이 아직 없다
  counts: ReadonlyMap<string, number>; // 보이는 달의 dayKey → 그날 시작한 세션 수
  selected: string; // dayKey
  today: string; // dayKey
  onSelect: (day: string) => void;
};

/**
 * 기록 달력 — 한 달을 일요일부터 7칸씩 보이고, 기록이 있는 날 숫자 아래에 점을 찍는다. 날짜를 누르면 그날을 고른다.
 * 달은 first부터 last까지만 넘기고, 오늘 뒤의 날은 고를 수 없다. 오늘은 테두리, 고른 날은 primary 원으로 보인다.
 * 날짜 칸은 화면 폭 / 7 × 48px인데, 360px에서는 약 47px라 그리드를 양옆 여백으로 4px씩 넓혀(-mx-1) 48px을 맞춘다.
 */
export function RecordCalendar({ month, first, last, onMonth, loading, counts, selected, today, onSelect }: CalendarProps) {
  const title = MONTH.format(monthStart(month));
  return (
    <section aria-label="기록 달력">
      <div className="flex items-center justify-between">
        <div className="flex items-baseline gap-2">
          <h2 aria-live="polite" className="font-bold">
            {title}
          </h2>
          {loading && (
            <span role="status" className="text-caption text-ink-muted">
              불러오는 중
            </span>
          )}
        </div>
        {/* 화살표가 아래 카드의 오른쪽 끝과 맞게 버튼을 바깥 여백으로 조금 민다 */}
        <div className="-mr-3 flex">
          <MonthButton label="이전 달" path="m14.5 6-6 6 6 6" disabled={month <= first} onClick={() => onMonth(month - 1)} />
          <MonthButton label="다음 달" path="m9.5 6 6 6-6 6" disabled={month >= last} onClick={() => onMonth(month + 1)} />
        </div>
      </div>
      <div role="group" aria-label={title} className="-mx-1 mt-1 grid grid-cols-7 text-center">
        {WEEKDAYS.map((name) => (
          <span key={name} aria-hidden className="pb-1 text-caption text-ink-muted">
            {name}
          </span>
        ))}
        {monthCells(month).map((day, i) =>
          day === null ? (
            <span key={`blank-${i}`} aria-hidden />
          ) : (
            <DayButton
              key={day}
              day={day}
              count={counts.get(day) ?? 0}
              selected={day === selected}
              today={day === today}
              future={day > today}
              onSelect={onSelect}
            />
          ),
        )}
      </div>
    </section>
  );
}

function MonthButton({ label, path, disabled, onClick }: { label: string; path: string; disabled: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="inline-flex size-12 items-center justify-center rounded-button text-ink disabled:opacity-40"
    >
      <svg
        viewBox="0 0 24 24"
        className="size-5"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <path d={path} />
      </svg>
    </button>
  );
}

function DayButton({
  day,
  count,
  selected,
  today,
  future,
  onSelect,
}: {
  day: string;
  count: number;
  selected: boolean;
  today: boolean;
  future: boolean;
  onSelect: (day: string) => void;
}) {
  const circle = selected ? "bg-primary font-bold text-on-primary" : today ? "border border-line-strong font-bold" : "";
  return (
    <button
      type="button"
      disabled={future}
      aria-pressed={selected}
      aria-current={today ? "date" : undefined}
      aria-label={`${DAY_NAME.format(keyDate(day))}${count > 0 ? `, 기록 ${count}개` : ""}`}
      onClick={() => onSelect(day)}
      className="flex min-h-12 flex-col items-center justify-center gap-0.5 disabled:opacity-40"
    >
      <span className={`flex size-9 items-center justify-center rounded-full tabular-nums ${circle}`}>{Number(day.slice(8))}</span>
      {/* 점 자리는 늘 비워 둬서 기록이 있든 없든 숫자 높이가 같다 */}
      <span aria-hidden className={`size-1.5 rounded-full ${count > 0 ? "bg-indicator" : ""}`} />
    </button>
  );
}
