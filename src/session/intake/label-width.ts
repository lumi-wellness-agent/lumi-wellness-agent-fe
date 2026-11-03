/**
 * 보기 문구의 화면 폭 — 한글은 두 칸, 그 밖(영문 · 숫자 · 기호 · 공백)은 한 칸. 짧은 보기(이어폰 있어요/없어요 ·
 * I have them/I don't · 5분/20 min or more)는 한 줄에 나란히 놓아 환경 질문이 한 화면에 들어오게 한다.
 * 한국어는 예전 기준(7글자 이하)과 같은 보기가 짧고, 영어도 같은 묶음이 한 줄에 놓인다.
 */
export const SHORT_WIDTH = 14;

export function labelWidth(label: string): number {
  let width = 0;
  for (const ch of label) width += /[가-힣ㄱ-ㅎㅏ-ㅣ]/.test(ch) ? 2 : 1;
  return width;
}

export function isShortLabel(label: string): boolean {
  return labelWidth(label) <= SHORT_WIDTH;
}
