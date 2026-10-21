const sessions = [
  {
    id: "S1",
    title: "반복적 생각 완화",
    description: "반복적 반추에서 잠시 벗어나 지금, 여기의 감각에 집중합니다.",
  },
  {
    id: "S2",
    title: "스트레스·긴장 완화",
    description: "자연 이미지를 보며 천천히 호흡하고 긴장을 이완합니다.",
  },
  {
    id: "S3",
    title: "주의력·인지 피로 회복",
    description: "회복적 자연 노출로 지친 인지 자원을 재충전합니다.",
  },
];

export default function Home() {
  return (
    <main>
      <p className="brand">LUMI · LIGHT + MIND</p>
      <h1>지친 순간의 휴식,<br />연구 근거와 함께.</h1>
      <p className="description">
        지금의 상태와 원하는 변화를 고르면 자연 이미지·소리 세션을 추천하고,<br />
        추천 이유가 된 심리학 이론과 연구를 Reference 카드로 보여 주는 서비스를 준비하고 있어요.
      </p>
      <ul className="sessions">
        {sessions.map((session) => (
          <li key={session.id} className="session" data-session={session.id}>
            <span className="session-id">{session.id}</span>
            <strong>{session.title}</strong>
            <p>{session.description}</p>
          </li>
        ))}
      </ul>
      <span className="status">서비스 준비 중</span>
      <p className="notice">LUMI는 의료적 진단이나 치료를 대신하지 않습니다.</p>
    </main>
  );
}
