/**
 * 화면 문구. BE는 코드 값만 보내고 문구는 FE가 정한다(Reference 카드 배지 · 진행 표시 · 선택지).
 * 의료적 진단·치료 효능을 주장하는 표현은 쓰지 않는다.
 */

import type { CardBadge, EnvironmentGap, Goal, NextStep } from "@/lib/api/types";

export const GOAL_LABELS: Record<Goal, string> = {
  S1: "반복적 생각 완화",
  S2: "스트레스·긴장 완화",
  S3: "주의력·인지 피로 회복",
};

export const GOAL_DOTS: Record<Goal, string> = { S1: "bg-goal-s1", S2: "bg-goal-s2", S3: "bg-goal-s3" };

/** SSE progress — 노드가 끝날 때와 plan 안 단계가 시작될 때. */
export function progressLabel(node: string, step?: string): string {
  if (node === "plan" && step) {
    return (
      { choose_activity: "지금 상황에 맞는 활동을 고르고 있어요", search_evidence: "연구 근거를 찾고 있어요", verify_evidence: "근거가 맞는지 확인하고 있어요", write_rationale: "추천 이유를 쓰고 있어요" }[step] ??
      "활동을 준비하고 있어요"
    );
  }
  return (
    {
      intake_read: "이야기를 읽고 있어요",
      intake_ask: "답을 받았어요",
      intake_goal: "필요한 변화를 살피고 있어요",
      intake_context: "지금 여건을 살피고 있어요",
      intake_finish: "측정을 준비하고 있어요",
      measure_pre: "측정을 받았어요",
      plan: "추천을 마쳤어요",
      prepare: "콘텐츠를 준비하고 있어요",
      confirm: "다음 활동을 고르고 있어요",
    }[node] ?? "잠시만 기다려 주세요"
  );
}

export const BADGE_LABELS: Record<CardBadge, string> = {
  EXPERIMENTAL: "실험적 구성",
  LIMITED_EVIDENCE: "근거 적음",
  NO_VERIFIED_EVIDENCE: "검증된 근거 없음",
  CONFLICTING_EVIDENCE: "상반된 연구 있음",
  ADAPTED_STIMULUS: "연구 자극을 바꿈",
  AI_IMAGE_UNVERIFIED: "AI 생성 이미지",
  RELAXED_ORDER: "다른 상황용 활동",
  RELAXED_ENVIRONMENT: "지금 환경과 다름",
  DEFAULT_GOAL: "기본 목표",
  PROVISIONAL_MEASURE: "임시 척도",
};

export const OUTCOME_LABELS: Record<string, string> = {
  AFFECT: "정서·기분",
  SUBJECTIVE_STRESS: "주관적 스트레스·불안",
  RUMINATION: "반추",
  ATTENTION: "주의·인지",
  PHYSIO: "생리 지표",
  OTHER: "기타",
};

export const EFFECT_LABELS: Record<string, string> = {
  POSITIVE: "개선",
  NOT_SIGNIFICANT: "유의 차이 없음",
  NEGATIVE: "반대 방향",
  UNCLEAR: "판단 어려움",
};

export const ORDER_LABELS: Record<string, string> = {
  PRE_STRESS: "스트레스 전",
  POST_STRESS: "스트레스 뒤",
  POST_FATIGUE: "피로 뒤",
};

/** 계획의 environment_gaps — 지금 환경에서 어려울 수 있는 이유. 활동 시작 화면에 띄운다. */
export const GAP_NOTICES: Record<EnvironmentGap, string> = {
  AUDIO: "소리가 나와요. 이어폰을 쓰거나 소리를 켤 수 있는 곳에서 해 주세요.",
  SCREEN: "화면을 계속 봐야 하는 활동이에요.",
  QUIET: "조용한 곳에서 하면 좋아요.",
  OUTDOORS: "밖에서 하는 활동이에요.",
};

export const NEXT_STEP_LABELS: Record<NextStep, string> = {
  END: "여기서 마칠게요",
  CHANGE_ACTIVITY: "다른 활동을 해 볼래요",
  ADDITIONAL_SESSION: "한 번 더 할래요",
};

/**
 * 평가 deltas의 키 — SAM valence · arousal, S3는 MFVAS fatigue · concentration · energy.
 * concentration은 "집중하기가 얼마나 어려운가요?"라 높을수록 어렵다 — '집중'이라 쓰면 줄었을 때(좋아짐) 거꾸로 읽힌다.
 */
export const DELTA_LABELS: Record<string, string> = {
  valence: "기분(쾌)",
  arousal: "긴장(각성)",
  fatigue: "피로",
  concentration: "집중 어려움",
  energy: "기운",
  total: "점수",
  mean: "점수",
};
