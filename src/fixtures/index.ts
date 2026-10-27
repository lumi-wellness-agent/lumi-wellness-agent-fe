// scripts/fixtures.py가 BE 코드로 만든 응답 견본이다. 손으로 고치지 말고 스크립트를 다시 돌린다.
import type { ConfirmPayload, EndPayload, IntakeQuestion, MeasurePayload, RunPayload } from "@/lib/api/types";

/** 활동 노드(BE data/protocols). PR-13은 E19를 PR-11에 합쳐 결번이고, PR-16은 NOTICE 단계 모듈이다. */
export const PROTOCOLS: { id: string; name: string; goal: string; composition: string; minutes: number }[] = [
  {"id": "PR-01", "name": "자연 사진 감상", "goal": "S2", "composition": "SINGLE", "minutes": 6},
  {"id": "PR-02", "name": "자연 영상 + 자연음 감상(스트레스 후)", "goal": "S2", "composition": "VALIDATED_MULTIMODAL", "minutes": 10},
  {"id": "PR-03", "name": "스트레스 전 자연 장면 보기(예방)", "goal": "S2", "composition": "SINGLE", "minutes": 10},
  {"id": "PR-04", "name": "자연음 듣기(스트레스 후·과제 전후)", "goal": "S2", "composition": "SINGLE", "minutes": 4},
  {"id": "PR-05", "name": "이완 음악 듣기", "goal": "S2", "composition": "SINGLE", "minutes": 10},
  {"id": "PR-06", "name": "주기적 한숨 호흡 5분", "goal": "S2", "composition": "SINGLE", "minutes": 5},
  {"id": "PR-07", "name": "점진적 근육 이완(PMR) 18부위 — 수행 9분", "goal": "S2", "composition": "SINGLE", "minutes": 9},
  {"id": "PR-08", "name": "유도 심상 20분", "goal": "S2", "composition": "SINGLE", "minutes": 20},
  {"id": "PR-09", "name": "3분 안내 마음챙김", "goal": "S1", "composition": "SINGLE", "minutes": 3},
  {"id": "PR-10", "name": "자연환경 알아차리기 20분 (ReST 참고)", "goal": "S3", "composition": "EXPERIMENTAL", "minutes": 20},
  {"id": "PR-11", "name": "야외 자연 보행", "goal": "S3", "composition": "SINGLE", "minutes": 50},
  {"id": "PR-12", "name": "자연 속 걷기 + 좋은 것 3가지 알아차리기", "goal": "S2", "composition": "VALIDATED_MULTIMODAL", "minutes": 30},
  {"id": "PR-14", "name": "만다라 컬러링", "goal": "S2", "composition": "SINGLE", "minutes": 20},
  {"id": "PR-15", "name": "자연 도안 디지털 컬러링 3–5분", "goal": "S1", "composition": "EXPERIMENTAL", "minutes": 3},
  {"id": "PR-16", "name": "감정에 이름 붙이기(NOTICE 모듈)", "goal": "S1", "composition": "STAGE_MODULE", "minutes": 1},
  {"id": "PR-17", "name": "오감 그라운딩(5-4-3-2-1)", "goal": "S2", "composition": "SINGLE", "minutes": 10},
  {"id": "PR-18", "name": "강렬한 긍정 경험 글쓰기 20분", "goal": "S2", "composition": "SINGLE", "minutes": 20},
  {"id": "PR-19", "name": "세 가지 좋은 일 기록(일간 1주)", "goal": "S2", "composition": "SINGLE", "minutes": 5},
  {"id": "PR-20", "name": "온라인 예술 감상 1–2분", "goal": "S2", "composition": "SINGLE", "minutes": 1},
  {"id": "PR-21", "name": "실내 자연 이미지 + 약 16분 명상(S1 핵심 조합)", "goal": "S1", "composition": "EXPERIMENTAL", "minutes": 16},
  {"id": "PR-22", "name": "자연 이미지 보며 주기적 한숨 호흡 (5분)", "goal": "S2", "composition": "EXPERIMENTAL", "minutes": 5},
];

function load<T>(module: Promise<{ default: unknown }>): Promise<T> {
  return module.then((m) => m.default as T);
}

/** RUN payload {plan, content} — 활동마다 하나. */
export const runFixtures: Record<string, () => Promise<RunPayload>> = {
  "PR-01": () => load<RunPayload>(import("./run/PR-01.json")),
  "PR-02": () => load<RunPayload>(import("./run/PR-02.json")),
  "PR-03": () => load<RunPayload>(import("./run/PR-03.json")),
  "PR-04": () => load<RunPayload>(import("./run/PR-04.json")),
  "PR-05": () => load<RunPayload>(import("./run/PR-05.json")),
  "PR-06": () => load<RunPayload>(import("./run/PR-06.json")),
  "PR-07": () => load<RunPayload>(import("./run/PR-07.json")),
  "PR-08": () => load<RunPayload>(import("./run/PR-08.json")),
  "PR-09": () => load<RunPayload>(import("./run/PR-09.json")),
  "PR-10": () => load<RunPayload>(import("./run/PR-10.json")),
  "PR-11": () => load<RunPayload>(import("./run/PR-11.json")),
  "PR-12": () => load<RunPayload>(import("./run/PR-12.json")),
  "PR-14": () => load<RunPayload>(import("./run/PR-14.json")),
  "PR-15": () => load<RunPayload>(import("./run/PR-15.json")),
  "PR-16": () => load<RunPayload>(import("./run/PR-16.json")),
  "PR-17": () => load<RunPayload>(import("./run/PR-17.json")),
  "PR-18": () => load<RunPayload>(import("./run/PR-18.json")),
  "PR-19": () => load<RunPayload>(import("./run/PR-19.json")),
  "PR-20": () => load<RunPayload>(import("./run/PR-20.json")),
  "PR-21": () => load<RunPayload>(import("./run/PR-21.json")),
  "PR-22": () => load<RunPayload>(import("./run/PR-22.json")),
};

/** 측정 interrupt — 시점 × 목표. */
export const measureFixtures: Record<string, () => Promise<MeasurePayload>> = {
  "pre-S1": () => load<MeasurePayload>(import("./measure/pre-S1.json")),
  "pre-S2": () => load<MeasurePayload>(import("./measure/pre-S2.json")),
  "pre-S3": () => load<MeasurePayload>(import("./measure/pre-S3.json")),
  "post-S1-S2": () => load<MeasurePayload>(import("./measure/post-S1-S2.json")),
  "post-S3": () => load<MeasurePayload>(import("./measure/post-S3.json")),
  "final-S1": () => load<MeasurePayload>(import("./measure/final-S1.json")),
  "final-S2": () => load<MeasurePayload>(import("./measure/final-S2.json")),
};

/** intake 질문 — 되묻기 · 시점 질문 · 재질문 · 환경 칩. */
export const intakeFixtures: Record<string, () => Promise<IntakeQuestion>> = {
  "restate": () => load<IntakeQuestion>(import("./intake/restate.json")),
  "state": () => load<IntakeQuestion>(import("./intake/state.json")),
  "state-followup": () => load<IntakeQuestion>(import("./intake/state-followup.json")),
  "context": () => load<IntakeQuestion>(import("./intake/context.json")),
};

export const loadConfirm = () => load<ConfirmPayload>(import("./confirm.json"));
export const loadEnd = () => load<EndPayload>(import("./end.json"));
