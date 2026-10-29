export type ScheduledCue = { elapsed_seconds: number; script_id: string };

type JsonObject = Record<string, unknown>;

function object(value: unknown): JsonObject {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as JsonObject) : {};
}

/** Accept both protocol cue contracts: elapsed time (PR-08/09) and remaining time (PR-06/22). */
export function normalizeCues(value: unknown, activitySeconds: number): ScheduledCue[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((entry) => {
    const cue = object(entry);
    if (typeof cue.script_id !== "string") return [];

    const elapsed = cue.elapsed_seconds;
    const remaining = cue.remaining_seconds;
    const elapsedSeconds =
      typeof elapsed === "number" && Number.isFinite(elapsed)
        ? elapsed
        : typeof remaining === "number" && Number.isFinite(remaining)
          ? activitySeconds - remaining
          : null;

    return elapsedSeconds !== null && elapsedSeconds >= 0 && elapsedSeconds <= activitySeconds
      ? [{ elapsed_seconds: elapsedSeconds, script_id: cue.script_id }]
      : [];
  });
}
