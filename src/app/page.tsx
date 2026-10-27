const goals = [
  {
    id: "S1",
    title: "반복적 생각 완화",
    description: "같은 생각이 자꾸 떠올라 잠시 벗어나고 싶을 때",
  },
  {
    id: "S2",
    title: "스트레스·긴장 완화",
    description: "긴장이 쌓여 마음을 풀고 싶을 때",
  },
  {
    id: "S3",
    title: "주의력·인지 피로 회복",
    description: "오래 집중해 지친 머리를 다시 맑게 하고 싶을 때",
  },
];

export default function Home() {
  return (
    <main>
      <p className="brand">LUMI · LIGHT + MIND</p>
      <h1>지친 순간의 휴식,<br />연구 근거와 함께.</h1>
      <p className="description">
        지금 상태와 원하는 변화를 들려주면 자연 이미지·소리와 함께하는 회복 활동을 추천하고,<br />
        추천 이유가 된 심리학 이론과 연구를 Reference 카드로 보여 주는 서비스를 준비하고 있어요.
      </p>
      <ul className="goals">
        {goals.map((goal) => (
          <li key={goal.id} className="goal" data-goal={goal.id}>
            <span className="goal-id">{goal.id}</span>
            <strong>{goal.title}</strong>
            <p>{goal.description}</p>
          </li>
        ))}
      </ul>
      <span className="status">서비스 준비 중</span>
      <p className="notice">LUMI는 의료적 진단이나 치료를 대신하지 않습니다.</p>
    </main>
  );
}
