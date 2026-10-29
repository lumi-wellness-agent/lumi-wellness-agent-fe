/**
 * 목업 BE: 세션 API와 같은 모양으로 src/fixtures 견본을 돌려준다. 로그인 · LLM · BE 없이 화면 흐름을 본다(/dev).
 *
 * 흐름은 BE 그래프와 같다 — 시작 → 시점 질문 → 사전 측정 → RUN → 사후 측정 → 평가·선택 →
 * 활동 변경·추가 세션이면 다음 활동, 종료면 종료 측정(S1 · S2, S3는 바로 끝). 측정 응답은 BE처럼
 * 빠진 도구·문항과 범위 밖 값을 422로 막는다. 상태는 sessionStorage에 둬서 새로고침해도 이어진다.
 * 끝낸 세션은 활동 기록(GET /me/sessions)의 목업으로 남아 기록 탭에 보인다.
 */

import { intakeFixtures, loadConfirm, measureFixtures, runFixtures } from "@/fixtures";
import { ApiError, type SessionApi, type StreamHandlers } from "./client";
import type {
  EndPayload,
  Goal,
  GoalScaleChange,
  MeasureAnswers,
  MeasurePayload,
  NextStep,
  ProgressEvent,
  RoundSummary,
  RunPayload,
  SessionHistory,
  SessionView,
} from "./types";

const CONFIG_KEY = "lumi:mock";
const STATE_KEY = "lumi:mock-state";
const HISTORY_KEY = "lumi:mock-history";
const MAX_ROUNDS = 3;

/** 목표마다 도는 활동 순서 — 첫 활동은 실제 plan 실측(S1 PR-09 · S2 PR-06 · S3 PR-01)과 같다. */
const ROTATION: Record<Goal, string[]> = {
  S1: ["PR-09", "PR-21", "PR-15"],
  S2: ["PR-06", "PR-02", "PR-01"],
  S3: ["PR-01", "PR-10", "PR-11"],
};

type MockConfig = { goal: Goal; protocolId?: string };
type MockRound = { protocolId: string; name: string; minutes: number; completed: boolean; nextStep?: NextStep };
type MockState = { config: MockConfig; queue: string[]; rounds: MockRound[]; startedAt: string; view: SessionView };

/** 목업 세션을 켠다. 다음 세션 시작부터 목업 BE를 쓴다(이 탭에서만). */
export function enableMock(config: MockConfig): void {
  sessionStorage.setItem(CONFIG_KEY, JSON.stringify(config));
  sessionStorage.removeItem(STATE_KEY);
}

export function disableMock(): void {
  sessionStorage.removeItem(CONFIG_KEY);
  sessionStorage.removeItem(STATE_KEY);
  sessionStorage.removeItem(HISTORY_KEY);
}

export function mockEnabled(): boolean {
  try {
    return sessionStorage.getItem(CONFIG_KEY) !== null;
  } catch {
    return false;
  }
}

/** 이 탭에서 끝낸 목업 세션 — 활동 기록(GET /me/sessions)의 목업이고, 최근 것부터다. */
export function mockHistory(): SessionHistory[] {
  try {
    const raw = sessionStorage.getItem(HISTORY_KEY);
    return raw ? (JSON.parse(raw) as SessionHistory[]) : [];
  } catch {
    return [];
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
    const view: SessionView = { session_id: sessionId, step: "ASK", node: "intake_ask", payload };
    return save({ config, queue, rounds: [], startedAt: new Date().toISOString(), view });
  },

  async get(sessionId) {
    return load(sessionId).view;
  },

  async answer(sessionId, _body, handlers) {
    const state = expect(sessionId, "ASK");
    await emit(handlers, [{ node: "intake_ask" }, { node: "intake_read" }, { node: "intake_goal" }, { node: "intake_context" }, { node: "intake_finish" }]);
    const payload = await measureFixtures[`pre-${state.config.goal}`]();
    return save({ ...state, view: { session_id: sessionId, step: "MEASURE", node: "measure_pre", payload } });
  },

  async measure(sessionId, body, handlers) {
    const state = expect(sessionId, "MEASURE");
    const payload = state.view.payload as MeasurePayload;
    check(payload, body);
    if (payload.measure === "PRE") {
      await emit(handlers, [
        { node: "measure_pre" },
        { node: "plan", step: "choose_activity" },
        { node: "plan", step: "search_evidence" },
        { node: "plan", step: "verify_evidence" },
        { node: "plan", step: "write_rationale" },
        { node: "plan" },
        { node: "prepare" },
      ]);
      return save(await runView(state));
    }
    if (payload.measure === "POST") {
      const confirm = await loadConfirm();
      const options: NextStep[] = state.rounds.length >= MAX_ROUNDS ? ["END"] : confirm.options;
      const completed = state.rounds[state.rounds.length - 1]?.completed ?? true;
      const view: SessionView = {
        session_id: sessionId,
        step: "CONFIRM",
        node: "confirm",
        payload: {
          evaluation: { ...confirm.evaluation, goal: state.config.goal, round: state.rounds.length, completed, improved: completed },
          // replanner: 끝까지 못 하면 활동 변경, 나아지면 종료를 권한다
          proposal: { ...confirm.proposal, recommended: completed ? "END" : "CHANGE_ACTIVITY", reason: completed ? "사전보다 나아졌다" : "활동을 끝까지 하지 못했다", options },
          options,
        },
      };
      return save({ ...state, view });
    }
    return save(finish(state));
  },

  async report(sessionId, body) {
    const state = expect(sessionId, "RUN");
    const { plan, content } = state.view.payload as RunPayload;
    const round = { protocolId: plan.activity.protocol_id, name: content.name, minutes: plan.activity.minutes, completed: body.completed };
    const key = state.config.goal === "S3" ? "post-S3" : "post-S1-S2";
    const payload = { ...(await measureFixtures[key]()), round: state.rounds.length + 1 };
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
    if (state.config.goal === "S3") return save(finish(next));
    const payload = { ...(await measureFixtures[`final-${state.config.goal}`]()), round: rounds.length };
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

/** 세션 끝(END). BE가 라운드 행을 남기듯 끝낸 세션을 활동 기록 목업에도 남긴다. */
function finish(state: MockState): MockState {
  const scale = { S1: ["INS-BSRI", "mean", 62, 48], S2: ["INS-STAI6", "total", 53.33, 43.33], S3: ["INS-MFVAS", "fatigue", 70, 52] } as const;
  const [instrument, key, pre, end] = scale[state.config.goal];
  const rounds: RoundSummary[] = state.rounds.map((r, i) => ({
    round: i + 1,
    protocol_id: r.protocolId,
    minutes: r.minutes,
    completed: r.completed,
    deltas: { valence: 1, arousal: -2 },
    improved: r.completed,
    next_step: r.nextStep ?? "END",
  }));
  const goalScale: GoalScaleChange = { instrument_id: instrument, pre: { [key]: pre }, end: { [key]: end }, delta: { [key]: end - pre } };
  const session: SessionHistory = {
    session_id: state.view.session_id,
    started_at: state.startedAt,
    ended_at: new Date().toISOString(),
    goal: state.config.goal,
    rounds: rounds.map((round, i) => ({ ...round, name: state.rounds[i].name })),
    goal_scale: goalScale,
  };
  sessionStorage.setItem(HISTORY_KEY, JSON.stringify([session, ...mockHistory()]));
  const payload: EndPayload = { reason: "DONE", goal: state.config.goal, rounds, goal_scale: goalScale };
  return { ...state, view: { session_id: state.view.session_id, step: "END", node: null, payload } };
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
