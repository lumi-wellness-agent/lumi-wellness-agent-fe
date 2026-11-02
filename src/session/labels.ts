/**
 * 코드 값의 이름. BE는 코드 값만 보내고 문구는 FE가 정한다(Reference 카드 배지 · 진행 표시 · 선택지).
 * 한국어와 영어를 나란히 두고(src/i18n/locale.ts), 화면은 useMessages(LABELS)로 지금 언어의 표를 받는다.
 * 의료적 진단·치료 효능을 주장하는 표현은 쓰지 않는다.
 */

import { defineMessages } from "@/i18n/locale";
import type { CardBadge, EnvironmentGap, Goal, NextStep, ProgressEvent } from "@/lib/api/types";

export const GOAL_DOTS: Record<Goal, string> = { S1: "bg-goal-s1", S2: "bg-goal-s2", S3: "bg-goal-s3" };

export const LABELS = defineMessages({
  ko: {
    goals: {
      S1: "반복적 생각 완화",
      S2: "스트레스·긴장 완화",
      S3: "주의력·인지 피로 회복",
    } satisfies Record<Goal, string>,
    /** SSE progress — plan 안 단계가 시작될 때. */
    planSteps: {
      choose_activity: "지금 상황에 맞는 활동을 고르고 있어요",
      search_evidence: "연구 근거를 찾고 있어요",
      verify_evidence: "근거가 맞는지 확인하고 있어요",
      write_rationale: "추천 이유를 쓰고 있어요",
    },
    planDefault: "활동을 준비하고 있어요",
    /** SSE progress — 노드가 끝날 때. */
    nodes: {
      intake_read: "이야기를 읽고 있어요",
      intake_ask: "답을 받았어요",
      intake_goal: "필요한 변화를 살피고 있어요",
      intake_context: "지금 여건을 살피고 있어요",
      intake_finish: "측정을 준비하고 있어요",
      measure_pre: "측정을 받았어요",
      plan: "추천을 마쳤어요",
      prepare: "콘텐츠를 준비하고 있어요",
      confirm: "다음 활동을 고르고 있어요",
    },
    waiting: "잠시만 기다려 주세요",
    badges: {
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
    } satisfies Record<CardBadge, string>,
    outcomes: {
      AFFECT: "정서·기분",
      SUBJECTIVE_STRESS: "주관적 스트레스·불안",
      RUMINATION: "반추",
      ATTENTION: "주의·인지",
      PHYSIO: "생리 지표",
      OTHER: "기타",
    },
    effects: {
      POSITIVE: "개선",
      NOT_SIGNIFICANT: "유의 차이 없음",
      NEGATIVE: "반대 방향",
      UNCLEAR: "판단 어려움",
    },
    orders: {
      PRE_STRESS: "스트레스 전",
      POST_STRESS: "스트레스 뒤",
      POST_FATIGUE: "피로 뒤",
    },
    /** 원문 구간의 논문 섹션. 원문은 영어 그대로 두고 섹션 이름만 옮긴다. */
    sections: {
      ABSTRACT: "초록",
      INTRODUCTION: "서론",
      METHODS: "방법",
      RESULTS: "결과",
      DISCUSSION: "논의",
      TABLE: "표",
      OTHER: "기타",
    },
    /** 계획의 environment_gaps — 지금 환경에서 어려울 수 있는 이유. 활동 시작 화면에 띄운다. */
    gaps: {
      AUDIO: "소리가 나와요. 이어폰을 쓰거나 소리를 켤 수 있는 곳에서 해 주세요.",
      SCREEN: "화면을 계속 봐야 하는 활동이에요.",
      QUIET: "조용한 곳에서 하면 좋아요.",
      OUTDOORS: "밖에서 하는 활동이에요.",
    } satisfies Record<EnvironmentGap, string>,
    nextSteps: {
      END: "여기서 마칠게요",
      CHANGE_ACTIVITY: "다른 활동을 해 볼래요",
      ADDITIONAL_SESSION: "한 번 더 할래요",
    } satisfies Record<NextStep, string>,
    /**
     * 평가 deltas의 키 — SAM valence · arousal, S3는 MFVAS fatigue · concentration · energy.
     * concentration은 "집중하기가 얼마나 어려운가요?"라 높을수록 어렵다 — '집중'이라 쓰면 줄었을 때(좋아짐) 거꾸로 읽힌다.
     */
    deltas: {
      valence: "기분(쾌)",
      arousal: "긴장(각성)",
      fatigue: "피로",
      concentration: "집중 어려움",
      energy: "기운",
      total: "점수",
      mean: "점수",
    },
  },
  en: {
    goals: {
      S1: "Easing repetitive thoughts",
      S2: "Easing stress and tension",
      S3: "Recovering from mental fatigue",
    },
    planSteps: {
      choose_activity: "Choosing an activity for how you are now",
      search_evidence: "Looking for research evidence",
      verify_evidence: "Checking that the evidence fits",
      write_rationale: "Writing why we recommend it",
    },
    planDefault: "Preparing your activity",
    nodes: {
      intake_read: "Reading what you shared",
      intake_ask: "Got your answer",
      intake_goal: "Working out what would help",
      intake_context: "Checking your circumstances",
      intake_finish: "Getting the check-in ready",
      measure_pre: "Got your check-in",
      plan: "Recommendation ready",
      prepare: "Preparing the content",
      confirm: "Choosing the next activity",
    },
    waiting: "Just a moment",
    badges: {
      EXPERIMENTAL: "Experimental combination",
      LIMITED_EVIDENCE: "Limited evidence",
      NO_VERIFIED_EVIDENCE: "No verified evidence",
      CONFLICTING_EVIDENCE: "Conflicting studies",
      ADAPTED_STIMULUS: "Adapted from the study",
      AI_IMAGE_UNVERIFIED: "AI-generated image",
      RELAXED_ORDER: "Made for another situation",
      RELAXED_ENVIRONMENT: "May not suit where you are",
      DEFAULT_GOAL: "Default goal",
      PROVISIONAL_MEASURE: "Provisional scale",
    },
    outcomes: {
      AFFECT: "Affect · mood",
      SUBJECTIVE_STRESS: "Subjective stress · anxiety",
      RUMINATION: "Rumination",
      ATTENTION: "Attention · cognition",
      PHYSIO: "Physiological measures",
      OTHER: "Other",
    },
    effects: {
      POSITIVE: "Improved",
      NOT_SIGNIFICANT: "No significant difference",
      NEGATIVE: "Opposite direction",
      UNCLEAR: "Unclear",
    },
    orders: {
      PRE_STRESS: "Before stress",
      POST_STRESS: "After stress",
      POST_FATIGUE: "After fatigue",
    },
    sections: {
      ABSTRACT: "Abstract",
      INTRODUCTION: "Introduction",
      METHODS: "Methods",
      RESULTS: "Results",
      DISCUSSION: "Discussion",
      TABLE: "Table",
      OTHER: "Other",
    },
    gaps: {
      AUDIO: "This activity plays sound. Use earphones or go somewhere you can turn the sound on.",
      SCREEN: "You'll need to keep looking at the screen.",
      QUIET: "It works best somewhere quiet.",
      OUTDOORS: "This activity is done outdoors.",
    },
    nextSteps: {
      END: "I'll stop here",
      CHANGE_ACTIVITY: "Try a different activity",
      ADDITIONAL_SESSION: "Do it once more",
    },
    deltas: {
      valence: "Mood (pleasure)",
      arousal: "Tension (arousal)",
      fatigue: "Fatigue",
      concentration: "Trouble concentrating",
      energy: "Energy",
      total: "Score",
      mean: "Score",
    },
  },
});

export type Labels = (typeof LABELS)["ko"];

/** SSE progress 문구 — 노드가 끝날 때 {node}, plan 안 단계가 시작될 때 {node: "plan", step}. 아직 없으면 기다림. */
export function progressLabel(labels: Labels, event: ProgressEvent | null): string {
  if (!event) return labels.waiting;
  if (event.node === "plan" && event.step) return (labels.planSteps as Record<string, string>)[event.step] ?? labels.planDefault;
  return (labels.nodes as Record<string, string>)[event.node] ?? labels.waiting;
}

/** 척도 점수는 환산값이라 소수가 길 수 있다(53.33 − 43.33) — 둘째 자리까지 보인다. */
export function score(value: number): number {
  return Math.round(value * 100) / 100;
}
