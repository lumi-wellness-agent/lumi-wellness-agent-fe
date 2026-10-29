export type GroundStage = { id: string; label: string; count: number; text: string; examples: string[]; exampleText: string };
export type GroundSpec = { intro: string; end: string; stages: GroundStage[]; tts: boolean };
function obj(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}
export function parseGrounding(value: unknown): GroundSpec | null {
  const spec = obj(value);
  const slots = Array.isArray(spec.slots) ? spec.slots.map(obj) : [];
  const guide = slots.find((slot) => slot.slot === "GUIDE_AUDIO");
  const render = obj(guide?.render);
  if (render.timing_mode !== "USER_CONTROLLED_SEQUENCE") return null;
  const scripts = Array.isArray(guide?.scripts) ? guide.scripts.map(obj) : [];
  const ids = Array.isArray(render.stages) ? render.stages : [];
  if (!ids.length || new Set(ids).size !== ids.length) return null;
  const intro = scripts.find((s) => s.id === "START")?.text;
  const end = scripts.find((s) => s.id === "END")?.text;
  if (typeof intro !== "string" || !intro.trim() || typeof end !== "string" || !end.trim()) return null;
  const stages: GroundStage[] = [];
  for (const id of ids) {
    const s = scripts.find((script) => script.id === id);
    if (typeof id !== "string" || !s || typeof s.label !== "string" || typeof s.text !== "string"
      || !s.text.trim() || typeof s.target_count !== "number" || !Number.isInteger(s.target_count)
      || s.target_count < 1) return null;
    stages.push({
      id, label: s.label, count: s.target_count, text: s.text,
      examples: Array.isArray(s.examples) ? s.examples.filter((v): v is string => typeof v === "string") : [],
      exampleText: typeof s.example_text === "string" ? s.example_text : "",
    });
  }
  return { intro, end, stages, tts: obj(guide?.source_policy).tts !== "FORBIDDEN" };
}
export type GroundState = { phase: "intro" | "active" | "end"; index: number; skipped: number[] };
export const initialGroundState: GroundState = { phase: "intro", index: 0, skipped: [] };
export type GroundAction = { type: "INTRO_DONE" } | { type: "NEXT" | "SKIP"; total: number };
export function groundReducer(state: GroundState, action: GroundAction): GroundState {
  if (state.phase === "intro") {
    return action.type === "INTRO_DONE" ? { ...state, phase: "active" } : state;
  }
  if (state.phase !== "active" || action.type === "INTRO_DONE") return state;
  const skipped = action.type === "SKIP" ? [...state.skipped, state.index] : state.skipped;
  return state.index + 1 >= action.total ? { ...state, phase: "end", skipped }
    : { phase: "active", index: state.index + 1, skipped };
}
