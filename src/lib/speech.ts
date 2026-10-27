/**
 * 안내 음성: 활동 대본을 브라우저 speechSynthesis로 읽는다. 녹음 음원은 없다(BE README 「RUN 페이로드」).
 *
 * - 음성은 PREFERRED 순서로 고른다. 데스크톱 크롬의 Google 한국의(온라인)가 가장 낫고, 없으면 엣지의
 *   신경망 음성, 사파리·iOS·맥의 Yuna 순이다. macOS의 기계음 계열(Eddy 등)은 쓰지 않는다.
 * - 대본은 문장 단위로 나눠 읽는다. 크롬 온라인 음성은 한 번에 15초쯤 넘게 읽으면 끊긴다.
 *   문장 사이는 0.4초, 문단(빈 줄) 사이는 1.5초 쉰다.
 * - 음성에서 오류가 나면(온라인 음성의 네트워크 오류 등) 다음 음성으로 그 문장부터 다시 읽는다.
 *   읽을 음성이 남지 않으면 false를 돌려준다. 그때는 화면 문구만 보인다.
 * - iOS는 사용자가 누른 순간에 처음 읽어야 이후에도 소리가 난다. 시작 버튼에서 unlockSpeech()를 부른다.
 */

/** 좋은 음성부터. 음성 이름은 브라우저와 OS가 정한다. */
const PREFERRED = [
  /^Google 한국의$/, // 데스크톱 크롬 — 온라인
  /^Microsoft .* Online \(Natural\)/, // 엣지 — 신경망 음성
  /^Yuna/, // 사파리 · iOS · 맥 — 기기 내장
];
/** macOS의 기계음 계열 한국어 음성. 목록에서 뺀다. */
const NOVELTY = /^(Eddy|Flo|Grandma|Grandpa|Reed|Rocko|Sandy|Shelley)\b/;

export const SENTENCE_PAUSE_MS = 400;
export const PARAGRAPH_PAUSE_MS = 1500;

type Voice = Pick<SpeechSynthesisVoice, "name" | "lang">;
export type Chunk = { text: string; pauseMs: number };

/** 한국어 음성을 좋은 순서로 돌려준다. 맨 앞을 쓰고, 오류가 나면 다음 음성으로 넘어간다. */
export function rankKoreanVoices<V extends Voice>(voices: readonly V[]): V[] {
  const rank = (voice: V) => {
    const i = PREFERRED.findIndex((re) => re.test(voice.name));
    return i === -1 ? PREFERRED.length : i;
  };
  return voices
    .filter((v) => v.lang.toLowerCase().startsWith("ko") && !NOVELTY.test(v.name))
    .sort((a, b) => rank(a) - rank(b));
}

/** 대본을 읽을 조각으로 나눈다. 빈 줄은 문단이고, 문장 끝(. ? !) 뒤의 공백에서 자른다. */
export function splitScript(script: string): Chunk[] {
  const chunks: Chunk[] = [];
  for (const paragraph of script.split(/\n\s*\n/)) {
    const sentences = paragraph
      .replace(/\s*\n\s*/g, " ")
      .replace(/([.?!])\s+/g, "$1\n")
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
    sentences.forEach((text, i) => {
      const last = i === sentences.length - 1;
      chunks.push({ text, pauseMs: last ? PARAGRAPH_PAUSE_MS : SENTENCE_PAUSE_MS });
    });
  }
  if (chunks.length) chunks[chunks.length - 1].pauseMs = 0; // 마지막 조각 뒤에는 쉬지 않는다
  return chunks;
}

/** 이 브라우저가 음성 합성을 지원하는지. 서버 렌더링 중에는 false다. */
export function canSpeak(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

/**
 * 브라우저의 음성 목록. 크롬은 처음에 빈 목록을 주고 voiceschanged 뒤에 채운다.
 * 활동 화면을 열 때 한 번 불러 두면 첫 대본부터 좋은 음성으로 읽는다.
 */
export function loadVoices(timeoutMs = 2000): Promise<SpeechSynthesisVoice[]> {
  if (!canSpeak()) return Promise.resolve([]);
  const synth = window.speechSynthesis;
  const voices = synth.getVoices();
  if (voices.length) return Promise.resolve(voices);
  return new Promise((resolve) => {
    const done = () => {
      clearTimeout(timer);
      synth.removeEventListener("voiceschanged", done);
      resolve(synth.getVoices());
    };
    const timer = setTimeout(done, timeoutMs);
    synth.addEventListener("voiceschanged", done);
  });
}

let generation = 0; // cancelSpeech()가 올린다. 읽던 대본은 번호가 바뀌면 멈춘다
const speaking = new Set<SpeechSynthesisUtterance>(); // 크롬은 읽는 중인 utterance를 GC하면 onend를 보내지 않는다

/** iOS용. 시작 버튼 onClick 안에서 바로 부른다. 소리 없는 한 마디로 이후 음성을 허용받는다. */
export function unlockSpeech(): void {
  if (!canSpeak()) return;
  const utterance = new SpeechSynthesisUtterance(" ");
  utterance.volume = 0;
  window.speechSynthesis.speak(utterance);
}

/** 읽던 대본을 멈춘다. 활동을 멈추거나 화면을 떠날 때 부른다. */
export function cancelSpeech(): void {
  generation += 1;
  if (canSpeak()) window.speechSynthesis.cancel();
}

/**
 * 대본 하나를 끝까지 읽는다. 읽던 대본이 있으면 멈추고 새로 읽는다 — 대본끼리 겹치지 않는다.
 * 다 읽으면 true, 중간에 멈췄거나 읽을 음성이 없으면 false.
 */
export async function speakScript(script: string, { rate = 0.9 } = {}): Promise<boolean> {
  if (!canSpeak()) return false;
  const synth = window.speechSynthesis;
  const busy = synth.speaking || synth.pending;
  cancelSpeech();
  const mine = generation;
  if (busy) await wait(100); // 사파리·크롬은 cancel() 바로 뒤의 speak()를 흘리는 경우가 있다
  const voices = rankKoreanVoices(await loadVoices());
  let v = 0;
  for (const chunk of splitScript(script)) {
    for (;;) {
      if (mine !== generation || v >= voices.length) return false;
      const result = await speakChunk(synth, chunk.text, voices[v], rate);
      if (result === "end") break;
      if (result === "stopped") return false;
      v += 1; // 오류 — 다음 음성으로 같은 문장을 다시 읽는다
    }
    if (chunk.pauseMs) await wait(chunk.pauseMs);
  }
  return mine === generation;
}

type ChunkResult = "end" | "error" | "stopped";

function speakChunk(
  synth: SpeechSynthesis,
  text: string,
  voice: SpeechSynthesisVoice,
  rate: number,
): Promise<ChunkResult> {
  return new Promise((resolve) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.voice = voice;
    utterance.lang = voice.lang;
    utterance.rate = rate;
    let settled = false;
    const finish = (result: ChunkResult) => {
      if (settled) return;
      settled = true;
      clearTimeout(watchdog);
      speaking.delete(utterance);
      resolve(result);
    };
    // onend가 오지 않는 브라우저 버그에 대비한 상한. 한국어는 1초에 6~7자쯤 읽는다
    const watchdog = setTimeout(() => finish("end"), 5000 + (text.length * 300) / rate);
    utterance.onend = () => finish("end");
    utterance.onerror = (event) =>
      finish(event.error === "interrupted" || event.error === "canceled" ? "stopped" : "error");
    speaking.add(utterance);
    synth.speak(utterance);
  });
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
