import type { Metadata, Viewport } from "next";
import { Gowun_Dodum, Noto_Sans_KR } from "next/font/google";
import { LocaleSync } from "@/i18n/locale-sync";
import { applyLight, LIGHT_KEYS } from "@/lib/light";
import { BackendWarmup } from "./backend-warmup";
import { LightSync } from "./light-sync";
import { SITE_DESCRIPTION, SITE_NAME } from "./site";
import "./globals.css";

const notoSansKr = Noto_Sans_KR({ subsets: ["latin"], variable: "--font-noto-sans-kr" });
const gowunDodum = Gowun_Dodum({ weight: "400", subsets: ["latin"], variable: "--font-gowun-dodum" });

// 서버는 사용자의 시각을 모르므로 첫 화면을 그리기 전에 <head>에서 빛을 정한다.
const lightScript = `(${applyLight.toString()})(${JSON.stringify(LIGHT_KEYS)})`;

/**
 * 링크 공유 카드의 og:image · og:url은 절대 주소여야 해서 기준 주소가 필요하다. Vercel이 배포마다 넣어 주는
 * 운영 도메인을 쓰고, 로컬에는 그 값이 없으니 개발 주소로 떨어진다.
 */
const siteUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : "http://localhost:3000";

// 공유 카드 그림은 opengraph-image.tsx가 만든다. og:image 태그는 Next가 붙이므로 여기 적지 않는다.
// LinkedIn · 카카오톡 · 슬랙은 og 태그가 없으면 링크에 썸네일을 붙이지 않는다.
export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: SITE_NAME,
  description: SITE_DESCRIPTION,
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    url: "/",
    locale: "ko_KR",
  },
};

export const viewport: Viewport = {
  colorScheme: "light dark",
  viewportFit: "cover",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  // data-light는 스크립트가 붙이므로 html 속성 불일치 경고를 끈다.
  return (
    <html lang="ko" className={`${notoSansKr.variable} ${gowunDodum.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: lightScript }} />
      </head>
      <body className="min-h-dvh bg-page text-body text-ink antialiased">
        {children}
        <LightSync />
        <LocaleSync />
        <BackendWarmup />
      </body>
    </html>
  );
}
