export type PhaseName = "INSTRUCTION" | "TENSE" | "RELAX" | "TRANSITION";
export type Phase = { phase: PhaseName; start: number; duration: number; label: string };
export type Region = { id: string; label: string };
export type RegionScript = { instruction_text: string; tension_cue: string; relaxation_cue: string; transition_text: string };
export type Timeline = {
  regions: Region[]; phases: Phase[]; secondsPerRegion: number; total: number;
  scripts: Record<string, RegionScript>; pre: string; end: string;
};
export function obj(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}
const text = (v: unknown) => typeof v === "string" ? v : "";
export function parsePmr(value: unknown): Timeline | null {
  const spec = obj(value);
  const slots = Array.isArray(spec.slots) ? spec.slots : [];
  const guide = obj(slots.find(s => obj(s).slot === "GUIDE_AUDIO"));
  const render = obj(guide.render);
  const source = obj(guide.scripts);
  const ui = obj(spec.session_ui);
  const labels = Array.isArray(ui.phase_labels) ? ui.phase_labels : [];
  const regions = (Array.isArray(render.regions) ? render.regions : []).map(obj)
    .sort((a, b) => Number(a.order) - Number(b.order))
    .map(r => ({ id: text(r.id), label: text(r.label) }));
  const names: PhaseName[] = ["INSTRUCTION", "TENSE", "RELAX", "TRANSITION"];
  const phases = (Array.isArray(render.phases) ? render.phases : []).map((p, i) => {
    const item = obj(p);
    return { phase: item.phase as PhaseName, start: Number(item.start_seconds),
      duration: Number(item.duration_seconds), label: text(labels[i]) || names[i] };
  });
  const secondsPerRegion = Number(render.seconds_per_region);
  const scripts: Record<string, RegionScript> = {};
  for (const entry of Array.isArray(source.region_scripts) ? source.region_scripts : []) {
    const r = obj(entry);
    scripts[text(r.region_id)] = { instruction_text: text(r.instruction_text),
      tension_cue: text(r.tension_cue), relaxation_cue: text(r.relaxation_cue),
      transition_text: text(r.transition_text) };
  }
  let boundary = 0;
  if (phases.length !== names.length || phases.some((p, i) => {
    const invalid = p.phase !== names[i] || p.start !== boundary || !Number.isFinite(p.duration) || p.duration <= 0;
    boundary += p.duration;
    return invalid;
  })) return null;
  const total = Number(obj(render.session_timing).activity_seconds);
  if (!regions.length || !Number.isFinite(secondsPerRegion) || secondsPerRegion !== boundary ||
      total !== secondsPerRegion * regions.length || new Set(regions.map(r => r.id)).size !== regions.length ||
      regions.some(r => !r.id || !r.label || !scripts[r.id] || Object.values(scripts[r.id]).some(s => !s))) return null;
  return { regions, phases, secondsPerRegion, total, scripts, pre: text(source.pre_start), end: text(source.end) };
}
export function positionAt(t: Timeline, elapsed: number) {
  const safe = Math.max(0, elapsed);
  const done = safe >= t.total;
  const regionIndex = Math.min(t.regions.length - 1, Math.floor(safe / t.secondsPerRegion));
  const within = done ? t.secondsPerRegion : safe % t.secondsPerRegion;
  const phaseIndex = Math.max(0, t.phases.findLastIndex(p => within >= p.start));
  const phase = t.phases[phaseIndex];
  return { done, regionIndex, phaseIndex, phaseRemaining: Math.max(0, Math.ceil(phase.start + phase.duration - within)),
    remaining: Math.max(0, Math.ceil(t.total - safe)) };
}
export function skipDelta(t: Timeline, elapsed: number) {
  return t.secondsPerRegion - Math.max(0, elapsed) % t.secondsPerRegion;
}
