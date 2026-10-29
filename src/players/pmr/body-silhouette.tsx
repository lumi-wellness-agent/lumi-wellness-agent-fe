"use client";

import { useId } from "react";
import type { PhaseName } from "./timeline";

const BODY = "M120 15 C103 15 94 29 95 47 C95 62 101 73 108 78 L107 93 C93 98 72 101 65 115 C57 132 58 150 53 169 L42 213 L35 245 L27 258 L24 278 Q24 283 29 279 L35 268 L33 291 Q34 296 38 290 L42 273 L41 295 Q44 299 47 290 L50 273 L51 290 Q55 294 57 286 L60 263 L57 248 L64 216 L77 174 L82 149 L85 190 L82 230 C80 246 84 260 86 275 L88 334 L91 388 L94 458 L86 481 Q82 495 94 497 L109 494 L113 477 L111 454 L113 391 L118 337 L120 286 L122 337 L127 391 L129 454 L127 477 L131 494 L146 497 Q158 495 154 481 L146 458 L149 388 L152 334 L154 275 C156 260 160 246 158 230 L155 190 L158 149 L163 174 L176 216 L183 248 L180 263 L183 286 Q185 294 189 290 L190 273 L193 290 Q196 299 199 295 L198 273 L202 290 Q206 296 207 291 L205 268 L211 279 Q216 283 216 278 L213 258 L205 245 L198 213 L187 169 C182 150 183 132 175 115 C168 101 147 98 133 93 L132 78 C139 73 145 62 145 47 C146 29 137 15 120 15 Z";
const AREAS: Record<string, string[]> = {
  RIGHT_HAND_FOREARM: ["M40 206 L65 211 L58 253 L60 296 L23 296 L27 251 Z"],
  LEFT_HAND_FOREARM: ["M175 211 L200 206 L213 251 L217 296 L180 296 L182 253 Z"],
  RIGHT_UPPER_ARM: ["M62 117 L83 120 L78 175 L65 211 L44 204 Z"],
  LEFT_UPPER_ARM: ["M157 120 L178 117 L196 204 L175 211 L162 175 Z"],
  FOREHEAD: ["M95 24 H145 V41 H95 Z"],
  EYES_CHEEKS: ["M94 42 H146 V60 H94 Z"],
  MOUTH_JAW: ["M99 61 H141 V79 H99 Z"],
  NECK: ["M105 78 H135 L139 99 H101 Z"],
  SHOULDERS: ["M63 104 Q85 96 108 94 L106 112 L76 127 Z", "M132 94 Q155 96 177 104 L164 127 L134 112 Z"],
  SHOULDER_BLADES_BACK: ["M82 116 Q120 108 158 116 L153 174 H87 Z"],
  CHEST_STOMACH: ["M86 122 Q120 113 154 122 L155 229 Q120 240 85 229 Z"],
  HIPS_BUTTOCKS: ["M83 231 Q120 240 157 231 L154 277 Q120 289 86 277 Z"],
  RIGHT_UPPER_LEG: ["M86 277 L119 283 L115 350 L89 350 Z"],
  LEFT_UPPER_LEG: ["M121 283 L154 277 L151 350 L125 350 Z"],
  RIGHT_LOWER_LEG: ["M89 353 L114 353 L111 456 L94 456 Z"],
  LEFT_LOWER_LEG: ["M126 353 L151 353 L146 456 L129 456 Z"],
  RIGHT_FOOT: ["M93 459 L112 459 L114 500 H81 Z"],
  LEFT_FOOT: ["M128 459 L147 459 L159 500 H126 Z"],
};

export function BodySilhouette({ region, label, phase }: { region: string | null; label: string; phase: PhaseName | null }) {
  const clip = useId();
  const back = region === "SHOULDER_BLADES_BACK" || region === "HIPS_BUTTOCKS";
  const highlighted = region && phase !== "TRANSITION" ? AREAS[region] ?? [] : [];
  return (
    <figure className="flex w-full flex-col items-center">
      <svg viewBox="0 0 240 515" role="img" aria-label={(back ? "후면" : "정면") + " 인체 안내: " + label}
        className="h-[340px] w-full max-w-[230px]">
        <defs><clipPath id={clip}><path d={BODY} /></clipPath></defs>
        <path d={BODY} className="fill-primary-soft stroke-primary" strokeWidth="2" />
        {back ? (
          <g className="stroke-primary" fill="none" opacity="0.3">
            <path d="M120 101 V226 M91 128 Q107 144 114 165 M149 128 Q133 144 126 165 M91 256 Q106 269 119 259 Q134 269 149 256" />
          </g>
        ) : (
          <g className="stroke-primary" fill="none" opacity="0.3">
            <path d="M104 48 H112 M128 48 H136 M119 50 L117 60 H123 M110 68 Q120 73 130 68 M91 119 Q106 113 116 120 M124 120 Q134 113 149 119" />
          </g>
        )}
        <g clipPath={"url(#" + clip + ")"}
          className={"fill-accent transition-opacity duration-[2000ms] motion-reduce:transition-none " +
            (phase === "INSTRUCTION" ? "animate-pulse motion-reduce:animate-none" : phase === "RELAX" ? "opacity-40" : "opacity-100")}
          stroke="none">
          {highlighted.map((d, i) => <path key={region + "-" + i} d={d} />)}
        </g>
      </svg>
      <figcaption className="text-caption text-ink-muted">
        {back ? "후면" : "정면 · 내 오른쪽은 화면 왼쪽"}
      </figcaption>
    </figure>
  );
}
