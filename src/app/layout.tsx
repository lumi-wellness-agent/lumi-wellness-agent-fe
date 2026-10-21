import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LUMI",
  description: "심리학 이론·임상/실험 연구 Reference 기반 AI 웰니스 에이전트",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ko"><body>{children}</body></html>;
}
