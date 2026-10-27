import type { Metadata } from "next";
import { SessionFlow } from "@/session/session-flow";

export const metadata: Metadata = { title: "세션 · LUMI" };

export default function SessionPage() {
  return <SessionFlow />;
}
