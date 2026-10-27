import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // AI 에이전트(Claude Code·Codex 등) 안에서 next dev를 돌리면 루트에 AGENTS.md를 만든다 — 쓰지 않으므로 끈다
  agentRules: false,
};

export default nextConfig;
