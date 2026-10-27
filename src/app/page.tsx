const goals = [
  {
    id: "S1",
    title: "반복적 생각 완화",
    description: "같은 생각이 자꾸 떠올라 잠시 벗어나고 싶을 때",
    dot: "bg-goal-s1",
  },
  {
    id: "S2",
    title: "스트레스·긴장 완화",
    description: "긴장이 쌓여 마음을 풀고 싶을 때",
    dot: "bg-goal-s2",
  },
  {
    id: "S3",
    title: "주의력·인지 피로 회복",
    description: "오래 집중해 지친 머리를 다시 맑게 하고 싶을 때",
    dot: "bg-goal-s3",
  },
];

export default function Home() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-[1000px] flex-col items-start justify-center px-6 py-[clamp(48px,10vw,112px)]">
      <p className="text-caption font-bold tracking-[0.16em] text-ink-muted">LUMI · LIGHT + MIND</p>
      <h1 className="mt-7 mb-5 font-display text-[length:clamp(34px,6vw,64px)] leading-[1.25] tracking-[-0.02em]">
        지친 순간의 휴식,<br />연구 근거와 함께.
      </h1>
      <p className="text-[length:clamp(16px,2vw,19px)] leading-[1.9] break-keep text-ink-muted">
        지금 상태와 원하는 변화를 들려주면 자연 이미지·소리와 함께하는 회복 활동을 추천하고,<br />
        추천 이유가 된 심리학 이론과 연구를 Reference 카드로 보여 주는 서비스를 준비하고 있어요.
      </p>
      <ul className="mt-10 grid w-full grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-4">
        {goals.map((goal) => (
          <li key={goal.id} className="rounded-card border border-line bg-surface p-5.5 shadow-card">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-muted px-2.5 py-1 text-caption font-bold text-ink-muted">
              <span className={`size-2 rounded-full ${goal.dot}`} aria-hidden="true" />
              {goal.id}
            </span>
            <strong className="mt-3 mb-2 block text-lg">{goal.title}</strong>
            <p className="break-keep text-ink-muted">{goal.description}</p>
          </li>
        ))}
      </ul>
      <span className="mt-8 rounded-full bg-primary-soft px-4 py-2.5 text-sm text-on-primary-soft">서비스 준비 중</span>
      <p className="mt-4 text-caption text-ink-muted">LUMI는 의료적 진단이나 치료를 대신하지 않습니다.</p>
    </main>
  );
}
