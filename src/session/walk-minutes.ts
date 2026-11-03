/**
 * 야외 보행(PR-11)의 시작 안내는 기본 시간(50분)을 적어 둔다 — 사용자가 고른 시간으로 바꿔 보인다.
 * BE는 세션 언어로 안내를 보내므로 한국어 '약 50분'과 영어 'about 50 minutes'(BE data/protocols/en/PR-11.json)를
 * 모두 본다. 다른 문장은 그대로다.
 */
export function withWalkMinutes<T extends string | undefined>(text: T, minutes: number): T {
  return text?.replace(/약\s*50분/g, `약 ${minutes}분`).replace(/about 50 minutes/g, `about ${minutes} minutes`) as T;
}
