/**
 * 기록 달력의 날짜 계산. 날은 기기 시간대의 'YYYY-MM-DD'(dayKey)라 문자열 그대로 견주고 정렬한다.
 * 달은 연 × 12 + 월(0–11)인 수(monthIndex)라 앞뒤 달이 ±1이다.
 * BE의 started_at은 UTC라 날로 묶을 때 기기 시간대로 바꾼다 — 한국에서 0시 30분에 시작한 세션은 UTC로는 전날이다.
 */

export function dayKey(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

/** dayKey 날의 0시(기기 시간대). */
export function keyDate(key: string): Date {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function monthIndex(date: Date): number {
  return date.getFullYear() * 12 + date.getMonth();
}

/** monthIndex 달의 1일. */
export function monthStart(index: number): Date {
  return new Date(Math.floor(index / 12), index % 12, 1);
}

/** monthIndex 달의 시작 시각 범위 — 기기 시간대의 1일 0시 이상 · 다음 달 1일 0시 미만(GET /me/sessions의 since · until). */
export function monthRange(index: number): { since: string; until: string } {
  return { since: monthStart(index).toISOString(), until: monthStart(index + 1).toISOString() };
}

/** 한 달의 칸 — 일요일부터 7칸씩 줄이 되게 1일 앞을 빈칸(null)으로 채우고, 나머지는 그날의 dayKey다. */
export function monthCells(index: number): (string | null)[] {
  const first = monthStart(index);
  const year = first.getFullYear();
  const month = first.getMonth();
  const days = new Date(year, month + 1, 0).getDate();
  return [
    ...Array.from({ length: first.getDay() }, () => null),
    ...Array.from({ length: days }, (_, i) => dayKey(new Date(year, month, i + 1))),
  ];
}

/** 세션을 시작한 날(기기 시간대)로 묶는다. 날마다 받은 순서(최근 것부터)를 지킨다. */
export function byDay<T extends { started_at: string }>(sessions: readonly T[]): Map<string, T[]> {
  const days = new Map<string, T[]>();
  for (const session of sessions) {
    const key = dayKey(new Date(session.started_at));
    days.set(key, [...(days.get(key) ?? []), session]);
  }
  return days;
}
