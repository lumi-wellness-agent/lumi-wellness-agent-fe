/**
 * BE 세션 API 계약. 원천은 BE 코드이고, 바뀌면 BE를 따른다(BE README 「세션 API」).
 *
 * - 요청·응답 모양: app/api/sessions.py, 질문·답: app/schemas/intake.py, 요청: app/schemas/care.py
 * - 측정: app/agent/nodes/measure.py · app/instruments.py의 present(), RUN: app/agent/state.py
 * - Reference 카드: app/schemas/card.py
 *
 * 응답 견본은 src/fixtures에 있다(scripts/fixtures.py가 BE 코드로 만든다).
 */

export type Goal = "S1" | "S2" | "S3";
export type Setting = "HOME" | "OFFICE_CAFE" | "TRANSIT" | "OUTDOOR";

// ── 요청 ────────────────────────────────────────────────────────────────────────────────

/** 세션마다 다시 묻지 않는 선호. 콘텐츠 개인화에 쓴다. */
export type UserProfile = {
  preferred_colors?: string[];
  avoided_colors?: string[];
  preferred_scenery?: string[];
  accessibility_note?: string | null;
  native_language?: string | null;
  cultural_background?: string | null;
  content_type?: "CURATED_PHOTO" | "AI_IMAGE";
};

/** POST /sessions. text("오늘 상황이 어떠세요?"의 답)만 필수이고 환경 칩은 비워도 된다. */
export type CareRequest = {
  text: string;
  setting?: Setting | null;
  earphones?: boolean | null;
  minutes_available?: number | null;
  profile?: UserProfile;
};

// ── 응답 {session_id, step, node, payload} ───────────────────────────────────────────────

export type Step = "ASK" | "MEASURE" | "RUN" | "CONFIRM" | "END" | "STALLED";

export type SessionView =
  | { session_id: string; step: "ASK"; node: "intake_ask"; payload: IntakeQuestion }
  | { session_id: string; step: "MEASURE"; node: MeasureNode; payload: MeasurePayload }
  | { session_id: string; step: "RUN"; node: "run_session"; payload: RunPayload }
  | { session_id: string; step: "CONFIRM"; node: "confirm"; payload: ConfirmPayload }
  | { session_id: string; step: "END"; node: null; payload: EndPayload }
  | { session_id: string; step: "STALLED"; node: string; payload: { error: string | null } };

/** SSE progress — 노드가 끝날 때 {node}, plan 안 단계가 시작될 때 {node: "plan", step}. */
export type ProgressEvent = { node: string; step?: string };

// ── ASK: intake 질문 ────────────────────────────────────────────────────────────────────

export type QuestionSlot = "restate" | "state" | "state_followup" | "context";

/** set = 이 보기를 고르면 채워질 칸과 값. "잘 모르겠어요"는 {}. */
export type QuestionOption = { label: string; set: Record<string, unknown> };

/** key: state · state_followup · setting · earphones · minutes. 묶음마다 하나만 고른다. */
export type QuestionGroup = { key: string; select: "single"; options: QuestionOption[] };

export type IntakeQuestion = {
  type: "intake_question";
  question_id: string; // q1 · q2 · q3, 되묻기는 r1 · r2 …
  slot: QuestionSlot;
  turn: number; // 예산 안 몇 번째 질문. 되묻기는 0
  max_turns: number;
  text: string;
  groups: QuestionGroup[]; // 되묻기는 [](글로만 답한다)
  allow_free_text: boolean;
  skip_label: string | null; // 되묻기만 — "그냥 시작할게요"
};

/** answer(고른 보기들의 set을 합친 것) · text · skip 중 하나만 보낸다. */
export type IntakeAnswer =
  | { question_id: string; answer: Record<string, unknown> }
  | { question_id: string; text: string }
  | { question_id: string; skip: true };

// ── MEASURE: 측정 ───────────────────────────────────────────────────────────────────────

export type MeasureNode = "measure_pre" | "measure_post" | "measure_final";
export type ScaleKind = "LIKERT" | "PICTORIAL" | "SLIDER";

export type InstrumentItem = {
  id: string;
  text: string | null; // null = 문항 원문을 아직 채우지 않은 도구(BE status TODO)
  low_label: string | null;
  high_label: string | null;
};

export type Instrument = {
  instrument_id: string; // INS-SAM · INS-STAI6 · INS-BSRI · INS-MFVAS
  name: string;
  instruction: string | null;
  scale: { min: number; max: number; step: number; kind: ScaleKind };
  items: InstrumentItem[];
};

export type MeasurePayload = {
  measure: "PRE" | "POST" | "FINAL";
  round: number;
  instruments: Instrument[];
};

/** 받은 도구 전부를 {instrument_id: {item_id: value}}로. 빠진 문항이나 범위 밖 값은 422다. */
export type MeasureAnswers = Record<string, Record<string, number>>;

// ── RUN: 계획 · 콘텐츠 ──────────────────────────────────────────────────────────────────

export type RunPayload = { plan: CarePlan; content: ActivityContent };

export type CarePlan = {
  activity: { protocol_id: string; minutes: number; evidence_record_ids: number[] };
  rationale: string; // 추천 이유 2~3문장(LLM)
  relaxed: string[]; // 다 맞는 후보가 없어 푼 조건
  environment_gaps: EnvironmentGap[]; // 지금 환경에서 어려운 이유 — "소리가 나와요" 같은 안내를 띄운다
  reference_card: ReferenceCard | null;
};

export type EnvironmentGap = "AUDIO" | "SCREEN" | "QUIET" | "OUTDOORS";

/** 플레이어가 그대로 쓰는 콘텐츠(ActivityContent). */
export type ActivityContent = {
  protocol_id: string;
  name: string;
  steps: ContentStep[];
  assets: ActivityAsset[];
  asset_warnings: string[];
  image_urls: string[];
  guide_text: string; // 시작 안내(guide.intro_text) — 화면에만 보인다
  notice_prompt: string | null; // NOTICE 단계의 이름
  content_spec: ContentSpec; // 활동 노드 JSON의 content_spec 그대로 — 활동마다 모양이 다르다
  notice_module: NoticeModule | null; // NOTICE 단계가 있으면 PR-16의 session_ui
};

export type ContentStep = {
  order: number;
  type: "ACTIVITY" | "NOTICE" | "CHOOSE";
  label: string;
  minutes: number;
  optional: boolean;
};

export type ActivityAsset = {
  slot: string; // VISUAL_STILL · VISUAL_VIDEO · SOUNDSCAPE · MUSIC · GUIDE_AUDIO · ARTWORK · COLORING_TEMPLATE
  url: string; // 검수 자산은 BE 상대 경로(/assets/…) — assetUrl()로 붙인다
  provider: string;
  title: string | null;
  creator: string | null;
  source_url: string | null;
  license: string | null;
  generated: boolean;
  verification: string;
  metadata: Record<string, unknown>;
};

/** BE가 형을 고정하지 않는다. 슬롯별 scripts · render · selection과 화면 명세 session_ui는 플레이어가 읽는다. */
export type ContentSpec = {
  slots?: ContentSlot[];
  session_ui?: Record<string, unknown>;
  [key: string]: unknown;
};

export type ContentSlot = { slot: string; required?: boolean; [key: string]: unknown };

/** PR-16 감정 단어 팝업 명세. 쓰는 칸만 형을 적었다 — 전체는 BE data/protocols/PR-16.json. */
export type NoticeModule = {
  popup?: { start_text?: string; actions?: string[] };
  input?: { slot_count?: number; minimum_valid_slots?: number; per_slot_max_characters?: number };
  [key: string]: unknown;
};

/** POST /sessions/{id}/report. 점수는 보내지 않는다. */
export type SessionReport = {
  completed: boolean;
  stopped_reason?: string | null;
  notice_words?: string[]; // NOTICE 팝업에 적은 감정 단어 1~3개(빈 칸은 빼고 각 20자 이하)
};

// ── Reference 카드 ──────────────────────────────────────────────────────────────────────

export type CardBadge =
  | "EXPERIMENTAL"
  | "LIMITED_EVIDENCE"
  | "NO_VERIFIED_EVIDENCE"
  | "CONFLICTING_EVIDENCE"
  | "ADAPTED_STIMULUS"
  | "AI_IMAGE_UNVERIFIED"
  | "RELAXED_ORDER"
  | "RELAXED_ENVIRONMENT"
  | "DEFAULT_GOAL"
  | "PROVISIONAL_MEASURE";

export type PaperCitation = {
  paper_id: string;
  title: string;
  authors: string | null;
  year: number | null;
  doi: string | null;
  url: string | null;
};

export type GoalDefinitionRef = {
  goal: Goal;
  concept: string | null;
  page: string | null;
  sentence: string; // 원문 그대로(영어)
  paper: PaperCitation | null;
};

export type GoalSection = {
  goal: Goal;
  label: string;
  secondary_goal: Goal | null;
  source: "INFERRED" | "DEFAULT" | "CHIP" | null;
  reason: string | null;
  definitions: GoalDefinitionRef[];
  evidence_outcomes: string[];
  measured_by: { instrument_id: string; name: string; concept: string; provisional: boolean } | null;
  notes: string[];
};

export type OutcomeResult = {
  outcome: string;
  effect: string;
  measure: string | null;
  comparison: string | null;
  timepoint: string | null;
  stat: string | null;
  note: string | null;
};

export type CardEvidence = {
  paper: PaperCitation;
  experiment_id: string | null;
  arm_label: string | null;
  theories: string[];
  study_design: string;
  population: string | null;
  n: number | null;
  n_detail: string | null;
  exposure_minutes: number | null;
  regimen: string | null;
  studied_orders: string[];
  results: OutcomeResult[];
  supports_goal: boolean;
  supported_outcomes: string[];
  flags: string[];
  limits: string[];
  excerpts: { evidence_record_id: number; section: string; text: string }[];
  checks: { check: string; passed: boolean | null; reason: string; related_record_ids: number[] }[];
  evidence_record_ids: number[];
};

export type ReferenceCard = {
  protocol_id: string;
  name: string;
  minutes: number;
  composition: string;
  badges: CardBadge[];
  goal: GoalSection;
  grades: Record<string, string>;
  evidence: CardEvidence[];
  limits: string[];
};

// ── CONFIRM · END ───────────────────────────────────────────────────────────────────────

export type NextStep = "END" | "CHANGE_ACTIVITY" | "ADDITIONAL_SESSION";

export type ConfirmPayload = {
  evaluation: {
    goal: Goal;
    round: number;
    deltas: Record<string, number>; // 사후 − 사전. SAM valence · arousal, S3는 MFVAS fatigue 등도
    improved: boolean | null; // null = 세션 내 판정 기준 없음
    completed: boolean;
  };
  // reason은 by_llm이면 LLM이 쓴 사용자용 문장, 아니면 규칙의 내부 이유다(화면에 보이지 않는다).
  // rule_recommended · by_llm은 BE #95부터 온다 — 그 전 응답에는 없다
  proposal: {
    recommended: NextStep;
    reason: string;
    options: NextStep[];
    rule_recommended?: NextStep | null;
    by_llm?: boolean;
  };
  options: NextStep[];
};

/** POST /sessions/{id}/decision. options에 없는 값이면 422다. */
export type ReplanDecision = { next_step: NextStep };

export type EndPayload =
  | { reason: "SAFETY" }
  | {
      reason: "DONE";
      goal: Goal;
      rounds: {
        round: number;
        protocol_id: string;
        minutes: number;
        completed: boolean;
        deltas: Record<string, number>;
        improved: boolean | null;
        next_step: NextStep;
      }[];
      goal_scale: {
        instrument_id: string;
        pre: Record<string, number>;
        end: Record<string, number>;
        delta: Record<string, number>;
      } | null;
    };

// ── 기록 동의 (GET · PUT /me/consent) ───────────────────────────────────────────────────

export type ConsentView = {
  version: string;
  agreed: boolean; // false면 동의 화면을 띄운다
  agreed_version: string | null;
  raw_text: boolean;
  text_retention_days: number;
};
