import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // AI 에이전트(Claude Code·Codex 등) 안에서 next dev를 돌리면 AGENTS.md에 Next 안내 블록을 넣는다.
  // AGENTS.md는 직접 관리하므로 끈다 — 끄면 그 블록만 지우고 직접 쓴 내용은 그대로 둔다.
  agentRules: false,
};

export default nextConfig;
