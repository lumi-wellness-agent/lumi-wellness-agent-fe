"use client";

/**
 * 세션 상태 기계. 응답의 step이 지금 그릴 화면이고, 요청마다 BE가 다음 멈춘 자리를 돌려준다.
 *
 * - LLM이 도는 호출(시작 · 답 · 사전 측정 · 결정 · 재시도)은 SSE로 받아 진행 문구를 띄운다.
 * - 스트림이 끊기거나 단계가 어긋나면(STEP_MISMATCH) GET으로 멈춘 자리를 다시 본다.
 * - 세션 ID는 sessionStorage에 둬서 새로고침하면 GET으로 이어 그린다. 목업 세션(/dev)도 같은 길로 돈다.
 */

import { useCallback, useRef, useState } from "react";
import { ApiError, sessionApi, type SessionApi, type StreamHandlers } from "@/lib/api/client";
import { mockApi, mockEnabled } from "@/lib/api/mock";
import type {
  CareRequest,
  IntakeAnswer,
  MeasureAnswers,
  ReplanDecision,
  SessionReport,
  SessionView,
} from "@/lib/api/types";
import { progressLabel } from "./labels";

const SESSION_KEY = "lumi:session-id";
const DRAFT_KEY = "lumi:start";
const NAMES_KEY = "lumi:activity-names"; // END payload에는 protocol_id만 와서 RUN에서 본 이름을 기억한다

type SessionRequest = (api: SessionApi, handlers: StreamHandlers) => Promise<SessionView>;

export type SessionStatus = {
  view: SessionView | null;
  busy: boolean;
  progress: string | null; // SSE 진행 문구
  error: ApiError | null;
};

export function useSession() {
  const [status, setStatus] = useState<SessionStatus>({ view: null, busy: false, progress: null, error: null });
  const current = useRef<{ id: string | null; view: SessionView | null }>({ id: null, view: null });
  const last = useRef<SessionRequest | null>(null);

  const perform = useCallback(async (request: SessionRequest) => {
    const api = mockEnabled() ? mockApi : sessionApi;
    last.current = request;
    setStatus((s) => ({ ...s, busy: true, progress: null, error: null }));
    const handlers: StreamHandlers = {
      onSession: (id) => {
        current.current.id = id;
        write(SESSION_KEY, id);
        write(DRAFT_KEY, null); // 시작 입력을 썼다
      },
      onProgress: (event) => setStatus((s) => ({ ...s, progress: progressLabel(event.node, event.step) })),
    };
    const show = (view: SessionView) => {
      current.current = { id: view.session_id, view };
      write(SESSION_KEY, view.step === "END" ? null : view.session_id);
      if (view.step === "RUN") {
        const { protocol_id, name } = view.payload.content;
        write(NAMES_KEY, JSON.stringify({ ...activityNames(), [protocol_id]: name }));
      }
      setStatus({ view, busy: false, progress: null, error: null });
    };
    try {
      show(await request(api, handlers));
    } catch (caught) {
      const error = caught instanceof ApiError ? caught : new ApiError(0, "UNKNOWN", String(caught));
      const id = current.current.id;
      if (id && ["STREAM_CLOSED", "STEP_MISMATCH"].includes(error.code)) {
        try {
          return show(await api.get(id));
        } catch {
          // 멈춘 자리도 못 읽었다 — 아래에서 오류를 보여 준다
        }
      }
      if (["SESSION_NOT_FOUND", "SESSION_EXPIRED"].includes(error.code)) write(SESSION_KEY, null);
      setStatus((s) => ({ ...s, busy: false, progress: null, error }));
    }
  }, []);

  const id = () => current.current.id ?? "";

  return {
    status,
    start: (body: CareRequest) => perform((api, h) => api.start(body, h)),
    resume: (sessionId: string) => {
      current.current.id = sessionId;
      return perform((api) => api.get(sessionId));
    },
    answer: (body: IntakeAnswer) => perform((api, h) => api.answer(id(), body, h)),
    // 사전 측정 뒤에는 plan(LLM)이 돌아 SSE로 받는다. 사후 · 종료 측정은 JSON이다
    measure: (body: MeasureAnswers) =>
      perform((api, h) => api.measure(id(), body, current.current.view?.node === "measure_pre" ? h : undefined)),
    report: (body: SessionReport) => perform((api) => api.report(id(), body)),
    decide: (body: ReplanDecision) => perform((api, h) => api.decide(id(), body, h)),
    /** STALLED · 실패한 노드를 BE가 멈춘 자리부터 다시 돌린다(retryable 오류). */
    retry: () => perform((api, h) => api.retry(id(), h)),
    /** 서버에 닿지 못한 요청을 그대로 다시 보낸다(NETWORK 등). */
    again: () => (last.current ? perform(last.current) : Promise.resolve()),
    dismissError: () => setStatus((s) => ({ ...s, error: null })),
  };
}

export type Session = ReturnType<typeof useSession>;

/** 시작 화면이 남긴 입력. 세션 화면이 이것으로 POST /sessions를 보낸다(동의 화면을 다녀와도 남는다). */
export function saveDraft(request: CareRequest): void {
  write(DRAFT_KEY, JSON.stringify(request));
}

export function readDraft(): CareRequest | null {
  const raw = read(DRAFT_KEY);
  return raw ? (JSON.parse(raw) as CareRequest) : null;
}

/** 이어 그릴 세션. 끝났거나 없으면 null. */
export function savedSessionId(): string | null {
  return read(SESSION_KEY);
}

export function forgetSession(): void {
  write(SESSION_KEY, null);
  write(DRAFT_KEY, null);
  write(NAMES_KEY, null);
}

/** 이 탭에서 RUN으로 받은 활동 이름(protocol_id → 이름). */
export function activityNames(): Record<string, string> {
  return JSON.parse(read(NAMES_KEY) ?? "{}") as Record<string, string>;
}

function read(key: string): string | null {
  try {
    return sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string | null): void {
  try {
    if (value === null) sessionStorage.removeItem(key);
    else sessionStorage.setItem(key, value);
  } catch {
    // 저장소를 막은 브라우저 — 새로고침하면 처음부터 시작한다
  }
}
