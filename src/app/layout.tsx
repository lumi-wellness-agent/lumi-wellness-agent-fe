import type { Metadata, Viewport } from "next";
import { Gowun_Dodum, Noto_Sans_KR } from "next/font/google";
import { applyLight, LIGHT_KEYS } from "@/lib/light";
import { LightSync } from "./light-sync";
import "./globals.css";

const notoSansKr = Noto_Sans_KR({ subsets: ["latin"], variable: "--font-noto-sans-kr" });
const gowunDodum = Gowun_Dodum({ weight: "400", subsets: ["latin"], variable: "--font-gowun-dodum" });

// 서버는 사용자의 시각을 모르므로 첫 화면을 그리기 전에 <head>에서 빛을 정한다.
const lightScript = `(${applyLight.toString()})(${JSON.stringify(LIGHT_KEYS)})`;

export const metadata: Metadata = {
  title: "LUMI",
  description: "심리학 이론·임상/실험 연구 Reference 기반 AI 웰니스 에이전트",
};

export const viewport: Viewport = {
  colorScheme: "light dark",
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
      </body>
    </html>
  );
}
