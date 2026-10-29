/**
 * 개발용 — 목업 세션과 플레이어 미리보기. 운영 배포(VERCEL_ENV=production)에서는 404이고, 로컬과 프리뷰
 * 배포에서 열린다. 견본은 src/fixtures(scripts/fixtures.py가 BE 코드로 만든다).
 */

import Link from "next/link";
import { notFound } from "next/navigation";
import { PROTOCOLS } from "@/fixtures";
import { PLAYERS, playerKeyFor } from "@/players/catalog";
import { MockStart } from "./mock-start";
import { SCREEN_PREVIEWS } from "./screens/previews";

export default function DevPage() {
  if (process.env.VERCEL_ENV === "production") notFound();
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col gap-8 px-4 py-8">
      <header>
        <p className="text-caption font-bold text-ink-muted">개발용</p>
        <h1 className="font-display text-title">세션 · 화면 · 플레이어 미리보기</h1>
      </header>

      <section>
        <h2 className="mb-1 font-bold">목업 세션</h2>
        <p className="mb-3 text-caption break-keep text-ink-muted">
          BE · 로그인 · LLM 없이 견본으로 질문 → 측정 → 활동 → 평가 → 종료를 돈다. 이 탭에서만 켜지고, 끝낸 세션은
          기록 탭에 남는다.
        </p>
        <MockStart protocols={PROTOCOLS.map(({ id, name, goal }) => ({ id, name, goal }))} />
      </section>

      <section>
        <h2 className="mb-1 font-bold">세션 화면</h2>
        <p className="mb-3 text-caption break-keep text-ink-muted">
          화면 하나를 견본 payload로 띄우고, 답하면 BE로 보냈을 값을 보여 준다. A는 intake, B는 측정 화면을 맡는다.
        </p>
        <ul className="flex flex-col">
          {SCREEN_PREVIEWS.map((screen) => (
            <li key={screen.name}>
              <Link href={`/dev/screens/${screen.name}`} className="flex min-h-12 items-center gap-2 border-b border-line">
                <span className="w-10 shrink-0 text-caption font-bold text-ink-muted">{screen.owner}</span>
                <span className="min-w-0 flex-1 break-keep">{screen.title}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="mb-1 font-bold">플레이어</h2>
        <p className="mb-3 text-caption break-keep text-ink-muted">
          활동을 누르면 RUN 화면(소개 · Reference 카드 · 플레이어)을 견본으로 띄우고, 보낼 SessionReport를 보여 준다.
        </p>
        <ul className="flex flex-col gap-4">
          {Object.entries(PLAYERS).map(([key, player]) => (
            <li key={key}>
              <p className="text-caption font-bold text-ink-muted">
                {player.title} · 담당 {player.owner} · src/players/{key}/player.tsx
              </p>
              <ul className="mt-1 flex flex-col">
                {player.protocols.map((id) => (
                  <ProtocolLink key={id} id={id} />
                ))}
              </ul>
            </li>
          ))}
          <li>
            <p className="text-caption font-bold text-ink-muted">NOTICE 단계 모듈 · 담당 C · src/players/notice/notice-popup.tsx</p>
            <ul className="mt-1 flex flex-col">
              {PROTOCOLS.filter((p) => playerKeyFor(p.id) === null).map((p) => (
                <ProtocolLink key={p.id} id={p.id} />
              ))}
            </ul>
          </li>
        </ul>
      </section>
    </main>
  );
}

function ProtocolLink({ id }: { id: string }) {
  const protocol = PROTOCOLS.find((p) => p.id === id);
  return (
    <li>
      <Link href={`/dev/players/${id}`} className="flex min-h-12 items-center gap-2 border-b border-line">
        <span className="w-12 shrink-0 font-bold">{id}</span>
        <span className="min-w-0 flex-1 truncate">{protocol?.name}</span>
        <span className="text-caption text-ink-muted">{protocol?.minutes}분</span>
      </Link>
    </li>
  );
}
