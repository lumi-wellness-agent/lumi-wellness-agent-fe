/**
 * 목업 BE: 세션 API와 같은 모양으로 src/fixtures 견본을 돌려준다. 로그인 · LLM · BE 없이 화면 흐름을 본다(/dev).
 *
 * 흐름은 BE 그래프와 같다 — 시작 → 시점 질문 → 사전 측정 → RUN → 사후 측정 → 평가·선택 →
 * 활동 변경·추가 세션이면 다음 활동, 종료면 모든 목표에서 SAM 종료 측정을 한다. 측정 응답은 BE처럼
 * 필수 도구·문항과 범위 밖 값을 422로 막는다. 상태는 sessionStorage에 둬서 새로고침해도 이어진다.
 */

import { intakeFixtures, loadConfirm, measureFixtures, runFixtures } from "@/fixtures";
import { ApiError, type SessionApi, type StreamHandlers } from "./client";
import type { EndPayload, Goal, MeasureAnswers, MeasurePayload, NextStep, ProgressEvent, SessionView } from "./types";

const CONFIG_KEY = "lumi:mock";
const STATE_KEY = "lumi:mock-state";
const MAX_ROUNDS = 3;

/** 목표마다 도는 활동 순서 — 첫 활동은 실제 plan 실측(S1 PR-09 · S2 PR-06 · S3 PR-01)과 같다. */
const ROTATION: Record<Goal, string[]> = {
  S1: ["PR-09", "PR-21", "PR-15"],
  S2: ["PR-06", "PR-02", "PR-01"],
  S3: ["PR-01", "PR-10", "PR-11"],
};

type MockConfig = { goal: Goal; protocolId?: string };
type MockRound = {
  protocolId: string;
  minutes: number;
  completed: boolean;
  nextStep?: NextStep;
  deltas?: Record<string, number>;
  improved?: boolean | null;
};
type MockState = {
  config: MockConfig;
  queue: string[];
  rounds: MockRound[];
  view: SessionView;
  samStart?: Record<string, number>;
  samLast?: Record<string, number>;
};

/** 목업 세션을 켠다. 다음 세션 시작부터 목업 BE를 쓴다(이 탭에서만). */
export function enableMock(config: MockConfig): void {
  sessionStorage.setItem(CONFIG_KEY, JSON.stringify(config));
  sessionStorage.removeItem(STATE_KEY);
}

export function disableMock(): void {
  sessionStorage.removeItem(CONFIG_KEY);
  sessionStorage.removeItem(STATE_KEY);
}

export function mockEnabled(): boolean {
  try {
    return sessionStorage.getItem(CONFIG_KEY) !== null;
  } catch {
    return false;
  }
}

export const mockApi: SessionApi = {
  async start(_body, handlers) {
    const config = readConfig();
    const sessionId = `mock-${Date.now()}`;
    handlers?.onSession?.(sessionId);
    await emit(handlers, [{ node: "intake_read" }]);
    const rotation = ROTATION[config.goal];
    const first = config.protocolId ?? rotation[0];
    const queue = [first, ...rotation.filter((id) => id !== first)];
    const payload = await intakeFixtures.state();
    return save({ config, queue, rounds: [], view: { session_id: sessionId, step: "ASK", node: "intake_ask", payload } });
  },

  async get(sessionId) {
    return load(sessionId).view;
  },

  async answer(sessionId, _body, handlers) {
    const state = expect(sessionId, "ASK");
    await emit(handlers, [{ node: "intake_ask" }, { node: "intake_read" }, { node: "intake_goal" }, { node: "intake_context" }, { node: "intake_finish" }]);
    const payload = samOnly(await measureFixtures[`pre-${state.config.goal}`]());
    return save({ ...state, view: { session_id: sessionId, step: "MEASURE", node: "measure_pre", payload } });
  },

  async measure(sessionId, body, handlers) {
    const state = expect(sessionId, "MEASURE");
    const payload = state.view.payload as MeasurePayload;
    check(payload, body);
    if (payload.measure === "PRE") {
      const sam = body["INS-SAM"];
      const started = { ...state, samStart: sam, samLast: sam };
      await emit(handlers, [
        { node: "measure_pre" },
        { node: "plan", step: "choose_activity" },
        { node: "plan", step: "search_evidence" },
        { node: "plan", step: "verify_evidence" },
        { node: "plan", step: "write_rationale" },
        { node: "plan" },
        { node: "prepare" },
      ]);
      return save(await runView(started));
    }
    if (payload.measure === "POST") {
      const confirm = await loadConfirm();
      const options: NextStep[] = state.rounds.length >= MAX_ROUNDS ? ["END"] : confirm.options;
      const completed = state.rounds[state.rounds.length - 1]?.completed ?? true;
      const sam = body["INS-SAM"];
      const before = state.samLast ?? sam;
      const deltas = Object.fromEntries(
        Object.entries(sam).filter(([key]) => before[key] !== undefined).map(([key, value]) => [key, value - before[key]]),
      );
      const improved =
        state.config.goal === "S1" ? (deltas.valence ?? 0) > 0 :
        state.config.goal === "S2" ? (deltas.arousal ?? 0) < 0 : null;
      const rounds = state.rounds.map((round, i) =>
        i === state.rounds.length - 1 ? { ...round, deltas, improved } : round,
      );
      const updated = { ...state, rounds, samLast: sam };
      const view: SessionView = {
        session_id: sessionId,
        step: "CONFIRM",
        node: "confirm",
        payload: {
          evaluation: { goal: state.config.goal, round: state.rounds.length, deltas, completed, improved },
          // 실서비스와 같은 탐색 규칙: 미완료·변화 없음은 활동 변경, 개선 또는 기준 없음은 종료를 권한다.
          proposal: {
            ...confirm.proposal,
            recommended: !completed ? "CHANGE_ACTIVITY" : improved === false ? "CHANGE_ACTIVITY" : "END",
            reason: !completed ? "활동을 끝까지 하지 못했다" : improved === false ? "SAM 기분 지표가 개선 방향을 보이지 않았다(탐색 지표)" : improved === null ? "이 목표는 세션 내 판정 기준이 없다(목표 지표 —)" : "SAM 기분 지표가 개선 방향으로 변했다(탐색 지표)",
            options,
          },
          options,
        },
      };
      return save({ ...updated, view });
    }
    return save({ ...state, view: endView(state, body["INS-SAM"]) });
  },

  async report(sessionId, body) {
    const state = expect(sessionId, "RUN");
    const run = state.view.payload as { plan: { activity: { protocol_id: string; minutes: number } } };
    const round = { protocolId: run.plan.activity.protocol_id, minutes: run.plan.activity.minutes, completed: body.completed };
    const key = state.config.goal === "S3" ? "post-S3" : "post-S1-S2";
    const payload = samOnly(await measureFixtures[key](), state.rounds.length + 1);
    return save({ ...state, rounds: [...state.rounds, round], view: { session_id: sessionId, step: "MEASURE", node: "measure_post", payload } });
  },

  async decide(sessionId, body, handlers) {
    const state = expect(sessionId, "CONFIRM");
    const rounds = state.rounds.map((r, i) => (i === state.rounds.length - 1 ? { ...r, nextStep: body.next_step } : r));
    const next = { ...state, rounds };
    if (body.next_step !== "END") {
      await emit(handlers, [{ node: "confirm" }, { node: "plan", step: "choose_activity" }, { node: "plan", step: "write_rationale" }, { node: "prepare" }]);
      return save(await runView(next, body.next_step === "CHANGE_ACTIVITY"));
    }
    const payload = samOnly(await measureFixtures["pre-S2"](), rounds.length, "FINAL");
    return save({ ...next, view: { session_id: sessionId, step: "MEASURE", node: "measure_final", payload } });
  },

  async retry(sessionId) {
    return load(sessionId).view;
  },
};

async function runView(state: MockState, change = false): Promise<MockState> {
  const queue = change ? [...state.queue.slice(1), state.queue[0]] : state.queue;
  const payload = await runFixtures[queue[0]]();
  return { ...state, queue, view: { session_id: state.view.session_id, step: "RUN", node: "run_session", payload } };
}

function endView(state: MockState, finalSam?: Record<string, number>): SessionView {
  const pre = state.samStart ?? { valence: 5, arousal: 5 };
  const end = finalSam ?? state.samLast ?? pre;
  const delta = Object.fromEntries(
    Object.keys(pre).filter((key) => end[key] !== undefined).map((key) => [key, end[key] - pre[key]]),
  );
  const payload: EndPayload = {
    reason: "DONE",
    goal: state.config.goal,
    rounds: state.rounds.map((r, i) => ({
      round: i + 1,
      protocol_id: r.protocolId,
      minutes: r.minutes,
      completed: r.completed,
      deltas: r.deltas ?? {},
      improved: r.improved ?? null,
      next_step: r.nextStep ?? "END",
    })),
    sam_change: { instrument_id: "INS-SAM", pre, end, delta },
  };
  return { session_id: state.view.session_id, step: "END", node: null, payload };
}

/** BE의 instrument filter와 같은 계약으로, 목업은 SAM 하나만 응답 대상으로 둔다. */
function samOnly(
  payload: MeasurePayload,
  round = payload.round,
  measure: MeasurePayload["measure"] = payload.measure,
): MeasurePayload {
  const instruments = payload.instruments.filter((instrument) => instrument.instrument_id === "INS-SAM");
  if (instruments.length !== 1) throw new Error("측정 fixture에 INS-SAM이 하나 있어야 한다");
  return { ...payload, measure, round, instruments, required_instrument_ids: ["INS-SAM"] };
}

/** BE처럼 받은 도구 전부의 문항이 범위 안에 있어야 한다(app/api/sessions._check_measure). */
function check(payload: MeasurePayload, answers: MeasureAnswers): void {
  for (const instrument of payload.instruments) {
    const given = answers[instrument.instrument_id];
    if (!given) throw new ApiError(422, "INVALID_ANSWER", `${instrument.instrument_id} 응답이 없습니다.`);
    for (const item of instrument.items) {
      const value = given[item.id];
      const { min, max } = instrument.scale;
      if (typeof value !== "number") throw new ApiError(422, "INVALID_ANSWER", `${instrument.instrument_id}: 문항 ${item.id} 응답이 없다`);
      if (value < min || value > max) throw new ApiError(422, "INVALID_ANSWER", `${instrument.instrument_id}: ${item.id}=${value}는 ${min}–${max} 밖이다`);
    }
  }
}

function expect(sessionId: string, step: SessionView["step"]): MockState {
  const state = load(sessionId);
  if (state.view.step !== step) {
    throw new ApiError(409, "STEP_MISMATCH", `지금은 ${state.view.step} 단계입니다.`, { step: state.view.step, node: state.view.node });
  }
  return state;
}

function load(sessionId: string): MockState {
  const raw = sessionStorage.getItem(STATE_KEY);
  const state = raw ? (JSON.parse(raw) as MockState) : null;
  if (!state || state.view.session_id !== sessionId) throw new ApiError(404, "SESSION_NOT_FOUND", "세션이 없습니다.");
  return state;
}

function save(state: MockState): SessionView {
  sessionStorage.setItem(STATE_KEY, JSON.stringify(state));
  return state.view;
}

function readConfig(): MockConfig {
  const raw = sessionStorage.getItem(CONFIG_KEY);
  return raw ? (JSON.parse(raw) as MockConfig) : { goal: "S2" };
}

/** SSE progress 흉내 — 진행 표시를 그리고 다듬을 수 있게 이벤트 사이를 조금 띄운다. */
async function emit(handlers: StreamHandlers | undefined, events: ProgressEvent[]): Promise<void> {
  for (const event of events) {
    await new Promise((resolve) => setTimeout(resolve, 350));
    handlers?.onProgress?.(event);
  }
}
