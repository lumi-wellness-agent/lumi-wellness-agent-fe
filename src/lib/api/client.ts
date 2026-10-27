/**
 * BE 세션 API 클라이언트. 브라우저에서 BE를 직접 부른다(BE가 FE 오리진을 CORS로 허용한다).
 *
 * - 응답 전에 LLM이 도는 호출(시작 · 답 · 사전 측정 · 결정 · 재시도)은 SSE로 받아 진행을 보여 준다.
 *   handlers를 넘기면 SSE, 안 넘기면 JSON이다. 나머지(보고 · 사후·종료 측정 · 조회)는 JSON이다.
 * - 오류 본문은 {"detail": {code, message, …}}이고 ApiError로 바꿔 던진다. 코드 표는 BE README 「오류」.
 */

import { accessToken } from "@/lib/auth";
import { readSse } from "./sse";
import type {
  CareRequest,
  ConsentView,
  IntakeAnswer,
  MeasureAnswers,
  ProgressEvent,
  ReplanDecision,
  SessionReport,
  SessionView,
} from "./types";

/** BE 주소. 로컬 BE는 http://localhost:3000만 CORS로 허용하므로 FE도 localhost로 연다. */
export const BACKEND_URL = (process.env.NEXT_PUBLIC_BACKEND_URL || "http://127.0.0.1:8000").replace(/\/$/, "");

/** 콘텐츠 자산 주소. 검수 자산은 BE 기준 상대 경로(/assets/…)로 와서 BE 주소를 붙인다. */
export function assetUrl(url: string): string {
  return url.startsWith("/") ? `${BACKEND_URL}${url}` : url;
}

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly detail: Record<string, unknown>;

  constructor(status: number, code: string, message: string, detail: Record<string, unknown> = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.detail = detail;
  }

  /** PLAN_REJECTED · LLM_UNAVAILABLE처럼 retry로 다시 돌릴 수 있는 실패. */
  get retryable(): boolean {
    return this.detail.retryable === true;
  }
}

export type StreamHandlers = {
  /** 새 세션이 만들어졌다(POST /sessions의 첫 이벤트). */
  onSession?: (sessionId: string) => void;
  onProgress?: (event: ProgressEvent) => void;
};

/** 세션 API. 목업(src/lib/api/mock.ts)도 같은 모양이다. */
export type SessionApi = {
  start(body: CareRequest, handlers?: StreamHandlers): Promise<SessionView>;
  get(sessionId: string): Promise<SessionView>;
  answer(sessionId: string, body: IntakeAnswer, handlers?: StreamHandlers): Promise<SessionView>;
  measure(sessionId: string, body: MeasureAnswers, handlers?: StreamHandlers): Promise<SessionView>;
  report(sessionId: string, body: SessionReport): Promise<SessionView>;
  decide(sessionId: string, body: ReplanDecision, handlers?: StreamHandlers): Promise<SessionView>;
  retry(sessionId: string, handlers?: StreamHandlers): Promise<SessionView>;
};

export const sessionApi: SessionApi = {
  start: (body, handlers) => call("/sessions", { method: "POST", body, handlers }),
  get: (id) => call(`/sessions/${id}`),
  answer: (id, body, handlers) => call(`/sessions/${id}/answer`, { method: "POST", body, handlers }),
  measure: (id, body, handlers) => call(`/sessions/${id}/measure`, { method: "POST", body, handlers }),
  report: (id, body) => call(`/sessions/${id}/report`, { method: "POST", body }),
  decide: (id, body, handlers) => call(`/sessions/${id}/decision`, { method: "POST", body, handlers }),
  retry: (id, handlers) => call(`/sessions/${id}/retry`, { method: "POST", handlers }),
};

/** 기록 동의(회원만)와 탈퇴. */
export const meApi = {
  consent: () => call<ConsentView>("/me/consent"),
  agree: (rawText: boolean) =>
    call<ConsentView>("/me/consent", { method: "PUT", body: { records: true, raw_text: rawText } }),
  withdraw: () => call<null>("/me", { method: "DELETE" }),
};

// SSE error 이벤트에는 HTTP 상태가 없어 코드로 정한다(스트림은 이미 200으로 열렸다).
const STREAM_ERROR_STATUS: Record<string, number> = { PLAN_REJECTED: 422, LLM_UNAVAILABLE: 503 };

type CallOptions = { method?: "GET" | "POST" | "PUT" | "DELETE"; body?: unknown; handlers?: StreamHandlers };

async function call<T = SessionView>(path: string, { method = "GET", body, handlers }: CallOptions = {}): Promise<T> {
  const headers: Record<string, string> = { Accept: handlers ? "text/event-stream" : "application/json" };
  if (body !== undefined) headers["Content-Type"] = "application/json";
  const token = await accessToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  let response: Response;
  try {
    response = await fetch(`${BACKEND_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(0, "NETWORK", "서버에 연결하지 못했어요. 인터넷 연결을 확인해 주세요.");
  }
  if (!response.ok) throw await toError(response);
  if (response.status === 204) return null as T;
  if (!handlers || !response.headers.get("content-type")?.includes("text/event-stream")) {
    return (await response.json()) as T;
  }

  const outcome: { result?: T; failure?: ApiError } = {};
  await readSse(response, ({ event, data }) => {
    const parsed = JSON.parse(data);
    if (event === "session") handlers.onSession?.(parsed.session_id);
    else if (event === "progress") handlers.onProgress?.(parsed);
    else if (event === "result") outcome.result = parsed;
    else if (event === "error") {
      outcome.failure = new ApiError(STREAM_ERROR_STATUS[parsed.code] ?? 500, parsed.code, parsed.message, parsed);
    }
  });
  if (outcome.failure) throw outcome.failure;
  // 결과 없이 끊겼다 — 그래프는 마지막 체크포인트에 남아 있다. 호출한 쪽이 GET으로 멈춘 자리를 다시 본다.
  if (outcome.result === undefined) throw new ApiError(0, "STREAM_CLOSED", "응답이 중간에 끊겼어요.");
  return outcome.result;
}

async function toError(response: Response): Promise<ApiError> {
  let body: unknown;
  try {
    body = await response.json();
  } catch {
    body = undefined;
  }
  const detail = (body as { detail?: unknown } | undefined)?.detail;
  if (detail && typeof detail === "object" && !Array.isArray(detail) && "code" in detail) {
    const { code, message } = detail as { code: string; message?: string };
    return new ApiError(response.status, code, message ?? code, detail as Record<string, unknown>);
  }
  if (Array.isArray(detail)) {
    // FastAPI 요청 검증 실패(형식이 계약과 다르다) — FE 버그이므로 내용을 남긴다
    return new ApiError(response.status, "VALIDATION", "요청 형식이 계약과 맞지 않아요.", { errors: detail });
  }
  return new ApiError(response.status, `HTTP_${response.status}`, "서버 오류가 났어요.");
}
