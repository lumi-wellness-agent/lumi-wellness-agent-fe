export type Cue = { id: string; at: number; text: string };
export type RestSpec = { seconds: number; cues: Cue[]; modes: { id: string; video: boolean }[]; loop: boolean };
export function obj(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}
export function parseRest(value: unknown): RestSpec | null {
  const spec = obj(value);
  const slots = Array.isArray(spec.slots) ? spec.slots.map(obj) : [];
  const guide = slots.find((s) => s.slot === "GUIDE_AUDIO");
  const video = slots.find((s) => s.slot === "VISUAL_VIDEO");
  const render = obj(guide?.render);
  const seconds = render.activity_seconds;
  if (typeof seconds !== "number" || !Number.isFinite(seconds) || seconds <= 0) return null;
  const scripts = Array.isArray(guide?.scripts) ? guide.scripts.map(obj) : [];
  const raw = Array.isArray(render.cues) ? render.cues.map(obj) : [];
  const cues: Cue[] = [];
  for (const cue of raw) {
    const script = scripts.find((s) => s.id === cue.script_id);
    if (typeof cue.script_id !== "string" || typeof cue.elapsed_seconds !== "number"
      || !Number.isFinite(cue.elapsed_seconds) || cue.elapsed_seconds < 0 || cue.elapsed_seconds >= seconds
      || typeof script?.text !== "string" || !script.text.trim()) return null;
    cues.push({ id: cue.script_id, at: cue.elapsed_seconds, text: script.text });
  }
  cues.sort((a, b) => a.at - b.at);
  if (!cues.length || cues[0].at !== 0 || new Set(cues.map((c) => c.id)).size !== cues.length
    || new Set(cues.map((c) => c.at)).size !== cues.length) return null;
  const rawModes = obj(spec.session_modes).modes;
  const modes = (Array.isArray(rawModes) ? rawModes.map(obj) : [])
    .filter((m) => typeof m.id === "string" && typeof m.uses_video === "boolean")
    .map((m) => ({ id: m.id as string, video: m.uses_video as boolean }));
  if (!modes.length) return null;
  return { seconds, cues, modes, loop: obj(video?.render).loop === true };
}
export function cueAt(cues: Cue[], elapsed: number): Cue | undefined {
  return cues.findLast((cue) => cue.at <= elapsed);
}
export function clock(seconds: number): string {
  const s = Math.max(0, Math.ceil(seconds));
  return `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;
}
