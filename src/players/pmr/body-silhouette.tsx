"use client";

import { useId } from "react";
import type { PhaseName } from "./timeline";

const BODY = "M120 15 C103 15 94 29 95 47 C95 62 101 73 108 78 L107 93 C93 98 72 101 65 115 C57 132 58 150 53 169 L42 213 L35 245 L27 258 L24 278 Q24 283 29 279 L35 268 L33 291 Q34 296 38 290 L42 273 L41 295 Q44 299 47 290 L50 273 L51 290 Q55 294 57 286 L60 263 L57 248 L64 216 L77 174 L82 149 L85 190 L82 230 C80 246 84 260 86 275 L88 334 L91 388 L94 458 L86 481 Q82 495 94 497 L109 494 L113 477 L111 454 L113 391 L118 337 L120 286 L122 337 L127 391 L129 454 L127 477 L131 494 L146 497 Q158 495 154 481 L146 458 L149 388 L152 334 L154 275 C156 260 160 246 158 230 L155 190 L158 149 L163 174 L176 216 L183 248 L180 263 L183 286 Q185 294 189 290 L190 273 L193 290 Q196 299 199 295 L198 273 L202 290 Q206 296 207 291 L205 268 L211 279 Q216 283 216 278 L213 258 L205 245 L198 213 L187 169 C182 150 183 132 175 115 C168 101 147 98 133 93 L132 78 C139 73 145 62 145 47 C146 29 137 15 120 15 Z";
const AREAS: Record<string, string[]> = {
  RIGHT_HAND_FOREARM: ["M49 208 Q60 205 61 216 Q57 239 54 250 Q60 270 53 286 Q42 296 30 280 Q28 267 35 251 Q39 229 42 217 Q43 210 49 208 Z"],
  LEFT_HAND_FOREARM: ["M191 208 Q180 205 179 216 Q183 239 186 250 Q180 270 187 286 Q198 296 210 280 Q212 267 205 251 Q201 229 198 217 Q197 210 191 208 Z"],
  RIGHT_UPPER_ARM: ["M73 120 Q83 123 78 145 Q75 171 65 196 Q59 209 50 203 Q44 198 50 181 Q57 157 60 137 Q62 121 73 120 Z"],
  LEFT_UPPER_ARM: ["M167 120 Q157 123 162 145 Q165 171 175 196 Q181 209 190 203 Q196 198 190 181 Q183 157 180 137 Q178 121 167 120 Z"],
  FOREHEAD: ["M103 28 Q120 20 137 29 Q143 35 135 39 Q120 42 104 38 Q98 35 103 28 Z"],
  EYES_CHEEKS: ["M103 45 Q120 40 137 45 Q143 51 136 58 Q121 64 105 58 Q97 52 103 45 Z"],
  MOUTH_JAW: ["M106 63 Q120 59 134 63 Q140 68 132 75 Q119 81 108 74 Q101 69 106 63 Z"],
  NECK: ["M113 79 Q121 75 128 81 Q133 91 129 97 Q120 102 111 97 Q107 89 113 79 Z"],
  SHOULDERS: ["M72 108 Q89 99 103 101 Q110 105 101 111 Q85 115 77 121 Q67 124 66 117 Q66 111 72 108 Z", "M168 108 Q151 99 137 101 Q130 105 139 111 Q155 115 163 121 Q173 124 174 117 Q174 111 168 108 Z"],
  SHOULDER_BLADES_BACK: ["M93 123 Q119 111 147 123 Q156 137 146 159 Q134 174 120 166 Q106 174 94 160 Q84 138 93 123 Z"],
  CHEST_STOMACH: ["M96 129 Q120 115 144 130 Q155 150 148 172 Q152 204 141 222 Q120 234 98 222 Q87 203 92 176 Q84 148 96 129 Z"],
  HIPS_BUTTOCKS: ["M96 241 Q119 232 143 241 Q157 251 148 268 Q135 281 120 273 Q105 281 92 268 Q82 251 96 241 Z"],
  RIGHT_UPPER_LEG: ["M96 282 Q108 278 113 291 Q116 318 109 342 Q102 352 95 342 Q88 318 91 293 Q91 285 96 282 Z"],
  LEFT_UPPER_LEG: ["M144 282 Q132 278 127 291 Q124 318 131 342 Q138 352 145 342 Q152 318 149 293 Q149 285 144 282 Z"],
  RIGHT_LOWER_LEG: ["M99 357 Q111 353 111 370 Q108 396 107 420 L106 448 Q102 460 97 449 Q93 428 94 410 Q90 381 95 364 Q96 359 99 357 Z"],
  LEFT_LOWER_LEG: ["M141 357 Q129 353 129 370 Q132 396 133 420 L134 448 Q138 460 143 449 Q147 428 146 410 Q150 381 145 364 Q144 359 141 357 Z"],
  RIGHT_FOOT: ["M100 464 Q110 460 110 473 Q114 487 105 491 Q94 497 89 486 Q88 480 94 471 Q96 466 100 464 Z"],
  LEFT_FOOT: ["M140 464 Q130 460 130 473 Q126 487 135 491 Q146 497 151 486 Q152 480 146 471 Q144 466 140 464 Z"],
};

export function BodySilhouette({ region, label, phase }: { region: string | null; label: string; phase: PhaseName | null }) {
  const softEdge = useId();
  const back = region === "SHOULDER_BLADES_BACK" || region === "HIPS_BUTTOCKS";
  const highlighted = region && phase !== "TRANSITION" ? AREAS[region] ?? [] : [];
  return (
    <figure className="flex w-full flex-col items-center">
      <svg viewBox="0 0 240 515" role="img" aria-label={(back ? "후면" : "정면") + " 인체 안내: " + label}
        className="h-[340px] w-full max-w-[230px]">
        <defs>
          <filter id={softEdge} x="-35%" y="-35%" width="170%" height="170%" colorInterpolationFilters="sRGB">
            <feGaussianBlur stdDeviation="2.8" />
          </filter>
        </defs>
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
        <g filter={"url(#" + softEdge + ")"}
          className={"fill-accent stroke-accent transition-opacity duration-[2000ms] motion-reduce:transition-none " +
            (phase === "INSTRUCTION" ? "animate-pulse motion-reduce:animate-none" : phase === "RELAX" ? "opacity-40" : "opacity-100")}
          strokeWidth="5" strokeLinecap="round" strokeLinejoin="round">
          {highlighted.map((d, i) => <path key={region + "-" + i} d={d} />)}
        </g>
      </svg>
      <figcaption className="text-caption text-ink-muted">
        {back ? "후면" : "정면 · 내 오른쪽은 화면 왼쪽"}
      </figcaption>
    </figure>
  );
}
