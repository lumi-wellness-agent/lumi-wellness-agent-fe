import { ImageResponse } from "next/og";
import { APP } from "./messages";
import { SITE_DESCRIPTION, SITE_NAME } from "./site";

/** 1.91:1. LinkedIn · 카카오톡 · 슬랙 · X가 자르지 않고 그대로 쓰는 공유 카드 크기다. */
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// 크롤러는 화면 언어를 고르지 않으므로 서버가 그리는 기본 언어(한국어)의 시작 화면 제목을 그대로 담는다.
const HEADLINE = APP.ko.home.title;
const EYEBROW = "LUMI · LIGHT + MIND"; // 시작 화면 머리말과 같다
export const alt = `${SITE_NAME} — ${HEADLINE.join(" ")}`;

// 이 그림은 CSS를 거치지 않아 var()를 풀 수 없다. 시간대에 따라 바뀌지 않는 정적 그림이라 기본 빛인
// B 볕(sunlit, globals.css :root)의 토큰 값을 그대로 적고 어느 토큰인지만 남긴다.
const PAGE = "#fbf7ef"; // --lumi-page
const INK = "#3a2e24"; // --lumi-ink
const INK_MUTED = "#6e5e4f"; // --lumi-ink-muted
const ON_PRIMARY = "#fff8ec"; // --lumi-on-primary
// --lumi-accent를 옅게. 끝 색을 transparent(투명한 검정)로 두면 번지는 자리가 회색으로 탁해져 같은 색의 알파 0으로 끝낸다.
const GLOW = "rgb(234 200 90 / 0.30)";
const GLOW_END = "rgb(234 200 90 / 0)";

/**
 * 화면과 같은 글꼴로 그린다 — 제목은 고운돋움, 나머지는 Noto Sans KR(layout.tsx의 next/font와 같다).
 * Satori는 woff2를 읽지 못해 Google Fonts에서 이 그림에 쓰는 글자만 담은 TTF를 받는다(text=).
 * 경로에 동적 구간이 없어 빌드 때 한 번 그려 정적 파일로 둔다.
 */
async function googleFont(family: string, weight: 400 | 700, text: string): Promise<ArrayBuffer> {
  const url = `https://fonts.googleapis.com/css2?family=${family}:wght@${weight}&text=${encodeURIComponent(text)}`;
  const css = await (await fetch(url)).text();
  const src = css.match(/src: url\((.+?)\) format\('(?:opentype|truetype)'\)/)?.[1];
  if (!src) throw new Error(`공유 카드 글꼴을 받지 못했어요: ${family} ${weight}`);
  return (await fetch(src)).arrayBuffer();
}

/** 앱 아이콘 — 이니셜 L이 열린 쪽에 빛을 품는다. 좌표와 색은 앱 아이콘(lumi-app-icon.svg) 그대로다. */
function AppIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 512 512">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#55422f" />
          <stop offset="1" stopColor="#33281e" />
        </linearGradient>
        <radialGradient id="halo" cx="306" cy="206" r="160" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#eac85a" stopOpacity="0.6" />
          <stop offset="0.5" stopColor="#eac85a" stopOpacity="0.16" />
          <stop offset="1" stopColor="#eac85a" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="orb" cx="0.4" cy="0.36" r="0.72">
          <stop offset="0" stopColor="#fff7da" />
          <stop offset="0.5" stopColor="#f5e3a6" />
          <stop offset="1" stopColor="#e3bd4a" />
        </radialGradient>
      </defs>
      {/* 홈 화면 아이콘처럼 모서리를 둥글린다(한 변의 약 22%) */}
      <rect width="512" height="512" rx="114" fill="url(#bg)" />
      <g transform="translate(3 6)">
        <circle cx="306" cy="206" r="160" fill="url(#halo)" />
        <path
          d="M170 140 V350 H330"
          fill="none"
          stroke={ON_PRIMARY}
          strokeWidth="56"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="306" cy="206" r="58" fill="url(#orb)" />
      </g>
    </svg>
  );
}

/** 링크를 공유했을 때 보이는 썸네일. 앱 아이콘과 시작 화면 제목 · 소개를 담는다. */
export default async function OpengraphImage() {
  const [display, regular, bold] = await Promise.all([
    googleFont("Gowun+Dodum", 400, HEADLINE.join("")),
    googleFont("Noto+Sans+KR", 400, SITE_DESCRIPTION),
    googleFont("Noto+Sans+KR", 700, EYEBROW),
  ]);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 96px",
          background: PAGE,
          // 아이콘 둘레에 볕이 번진 듯한 기운을 옅게 깐다.
          backgroundImage: `radial-gradient(circle at 80% 50%, ${GLOW}, ${GLOW_END} 46%)`,
          fontFamily: "Noto Sans KR",
          color: INK,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", width: 620 }}>
          <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: "0.16em", color: INK_MUTED }}>{EYEBROW}</div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              marginTop: 28,
              fontFamily: "Gowun Dodum",
              fontSize: 74,
              lineHeight: 1.25,
              letterSpacing: "-0.02em",
            }}
          >
            {HEADLINE.map((line) => (
              <div key={line}>{line}</div>
            ))}
          </div>
          {/* 폭을 좁혀 '기반' 뒤에서 끊는다. 넓으면 'AI'만 윗줄 끝에 남아 'AI 웰니스 에이전트'가 갈라진다. */}
          <div style={{ width: 566, marginTop: 36, fontSize: 30, lineHeight: 1.5, color: INK_MUTED, wordBreak: "keep-all" }}>
            {SITE_DESCRIPTION}
          </div>
        </div>
        <div style={{ display: "flex", borderRadius: 72, boxShadow: "0 24px 56px rgb(74 57 43 / 0.28)" }}>
          <AppIcon size={320} />
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Gowun Dodum", data: display, weight: 400, style: "normal" },
        { name: "Noto Sans KR", data: regular, weight: 400, style: "normal" },
        { name: "Noto Sans KR", data: bold, weight: 700, style: "normal" },
      ],
    },
  );
}
