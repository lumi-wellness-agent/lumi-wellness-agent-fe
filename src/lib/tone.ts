/**
 * 알림음: 음원 없이 Web Audio로 짧은 소리를 낸다(BE README 「RUN 페이로드」 — countdown_sound · completion_sound).
 *
 * iOS는 사용자가 누른 순간에 AudioContext를 깨워야 소리가 난다. 활동 시작 버튼에서 unlockTone()을 부른다
 * (플레이어 호스트가 unlockSpeech()와 함께 부른다).
 */

let context: AudioContext | null = null;

/** 시작 버튼 onClick에서 부른다. */
export function unlockTone(): void {
  if (typeof window === "undefined" || !("AudioContext" in window)) return;
  context ??= new AudioContext();
  if (context.state === "suspended") void context.resume();
}

/** 부드러운 사인파 한 번. 소리를 낼 수 없으면 조용히 넘어간다. */
export function playTone({ frequency = 660, seconds = 0.6, volume = 0.2 } = {}): void {
  if (!context) return;
  const now = context.currentTime;
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.frequency.value = frequency;
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(volume, now + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + seconds);
  oscillator.connect(gain).connect(context.destination);
  oscillator.start(now);
  oscillator.stop(now + seconds);
}
