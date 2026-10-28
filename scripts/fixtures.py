"""BE 응답 견본(src/fixtures)을 BE 코드로 만든다 — 개발용 미리보기(/dev)와 목업 세션이 읽는다.

BE 저장소의 .venv로 실행한다. BE 코드(prepare · Reference 카드 · 측정 도구 · intake 질문)를 그대로 불러
만들기 때문에 모양이 실제 응답과 같다. 활동 노드 JSON(data/protocols)이 바뀌면 BE를 최신 main으로
당긴 뒤 다시 만든다.

    ../lumi-wellness-agent-be/.venv/bin/python scripts/fixtures.py ../lumi-wellness-agent-be
    (Windows) ..\\lumi-wellness-agent-be\\.venv\\Scripts\\python scripts\\fixtures.py ..\\lumi-wellness-agent-be

- 네트워크를 쓰지 않는다. 외부 공급자(Pixabay · Freesound · AI Horde · 시카고 미술관) 슬롯은 비고
  asset_warnings에 이유가 남는다. 검수 자산(음원 · 컬러링 도안)은 BE 상대 경로(/assets/…)로 들어간다 —
  로컬 BE(127.0.0.1:8000)를 띄우면 미리보기에서도 재생된다.
- Reference 카드는 BE 테스트의 근거 fixture(tests/fixtures/evidence_hits.json)와 실제 검증 규칙(judge)으로
  만든다. 근거가 없으면 NO_VERIFIED_EVIDENCE 배지가 붙은 카드가 나온다.
"""

import json
import sys
from pathlib import Path

FE = Path(__file__).resolve().parents[1]
OUT = FE / "src" / "fixtures"


def main() -> None:
    be = Path(sys.argv[1] if len(sys.argv) > 1 else FE.parent / "lumi-wellness-agent-be").resolve()
    if not (be / "app" / "agent" / "reference_card.py").exists():
        sys.exit(f"BE 저장소를 찾지 못했습니다(Reference 카드가 있는 main이어야 합니다): {be}")
    sys.path.insert(0, str(be))
    offline()

    from app import protocols

    loaded = sorted(protocols.load_protocols().values(), key=lambda p: p.protocol_id)
    measures, questions = measure_payloads(), intake_questions()
    written = [write(f"run/{p.protocol_id}.json", run_payload(p)) for p in loaded]
    written += [write(f"measure/{name}.json", payload) for name, payload in measures.items()]
    written += [write(f"intake/{name}.json", payload) for name, payload in questions.items()]
    written.append(write("confirm.json", confirm_payload()))
    written.append(write("end.json", end_payload()))
    written.append(write_index(loaded, measures, questions))
    print(f"{len(written)}개 파일을 {OUT.relative_to(FE)}에 썼습니다.")


def offline() -> None:
    """BE .env의 공급자 키를 읽지 않고, 키 없이 부르는 공급자(시카고 미술관)도 네트워크에 나가지 않게 한다."""
    import httpx

    from app.agent.nodes import executor
    from app.config import Settings
    from app.content import resolve_activity_assets

    settings = Settings(_env_file=None)
    blocked = httpx.MockTransport(lambda request: httpx.Response(503))

    def resolve(protocol, request, **kwargs):
        # prepare가 콘텐츠 Factor · 무작위 생성기(factors · rng)를 넘긴다 — 그대로 전달한다
        with httpx.Client(transport=blocked) as client:
            return resolve_activity_assets(
                protocol, request, settings=settings, client=client, **kwargs
            )

    executor.resolve_activity_assets = resolve


def run_payload(protocol) -> dict:
    """RUN payload {plan, content} — run_session interrupt와 같은 모양."""
    from app.agent.nodes.executor import prepare_session
    from app.agent.state import CarePlan, PlannedActivity
    from app.protocols import planned_minutes
    from app.schemas.care import CareRequest

    activity = PlannedActivity(
        protocol_id=protocol.protocol_id, minutes=planned_minutes(protocol, None)
    )
    card = reference_card(protocol, activity)
    plan = CarePlan(
        activity=activity.model_copy(update={"evidence_record_ids": evidence_ids(card)}),
        rationale="(견본) 추천 이유는 plan이 LLM으로 쓴다 — 사용자 상태, 고른 이유, 근거와 한계 2~3문장.",
        reference_card=card,
    )
    state = {"plan": plan, "request": CareRequest(text="견본")}
    content = prepare_session(state)["content"]
    return {"plan": plan.model_dump(mode="json"), "content": content.model_dump(mode="json")}


def reference_card(protocol, activity):
    from app.agent import intake_rules, reference_card
    from app.agent.state import IntakeResult
    from app.agent.validation import judge
    from app.protocols import delivered_media
    from app.schemas.care import ContentType
    from app.schemas.intake import GoalSource
    from tests.agent import fakes

    orders = fakes.protocol_orders(protocol.protocol_id)
    delivered = delivered_media(protocol, ContentType.CURATED_PHOTO)
    intake = IntakeResult(
        goal=protocol.goal,
        goal_source=GoalSource.INFERRED,
        goal_reason="(견본) intake가 상황 단서로 고른 목표의 판단 이유 한 줄",
        order_condition=orders[0] if orders else None,
        goal_evidence=intake_rules.goal_evidence({"goal": protocol.goal}),
    )
    hits = fakes.load_hits()
    cited = []
    for hit in hits:
        verdict = judge(hit, goal=protocol.goal, media=delivered, orders=orders, candidates=hits)
        if verdict.usable:
            cited.append((hit, verdict))
    cited.sort(key=lambda pair: not pair[1].supports_goal)  # 목표 지지가 앞
    return reference_card.build_card(intake, protocol, activity, cited[:4], delivered=delivered)


def evidence_ids(card) -> list[int]:
    return [i for evidence in card.evidence for i in evidence.evidence_record_ids]


def measure_payloads() -> dict[str, dict]:
    """측정 interrupt — {"measure", "round", "instruments"}. 목표마다 도구가 다르다(measure.py)."""
    from app import instruments
    from app.schemas.measure import InstrumentId

    def payload(measure: str, round_no: int, *ids: InstrumentId) -> dict:
        presented = [instruments.present(instruments.get_instrument(i)) for i in ids]
        return {"measure": measure, "round": round_no, "instruments": presented}

    sam, stai, bsri, mfvas = (
        InstrumentId.SAM,
        InstrumentId.STAI6,
        InstrumentId.BSRI,
        InstrumentId.MFVAS,
    )
    return {
        "pre-S1": payload("PRE", 0, sam, bsri),
        "pre-S2": payload("PRE", 0, sam, stai),
        "pre-S3": payload("PRE", 0, sam, mfvas),
        "post-S1-S2": payload("POST", 1, sam),
        "post-S3": payload("POST", 1, sam, mfvas),
        "final-S1": payload("FINAL", 1, bsri),
        "final-S2": payload("FINAL", 1, stai),
    }


def intake_questions() -> dict[str, dict]:
    """intake 질문 — 고정 질문과 환경 칩. 실제로는 LLM이 State 질문의 문구와 보기를 바꿀 수 있다."""
    from app.agent import intake_rules
    from app.schemas.intake import SKIP_LABEL, IntakeQuestion, QuestionSlot

    restate = IntakeQuestion(
        question_id="r1",
        slot=QuestionSlot.RESTATE,
        turn=0,
        text=intake_rules.RESTATE_FIXED,
        allow_free_text=True,
        skip_label=SKIP_LABEL,
    )
    questions = {
        "restate": restate,
        "state": intake_rules.fixed_question(QuestionSlot.STATE, 1),
        "state-followup": intake_rules.fixed_question(QuestionSlot.STATE_FOLLOWUP, 2),
        "context": intake_rules.context_question(["setting", "earphones", "minutes"], 3),
    }
    return {name: q.model_dump(mode="json") for name, q in questions.items()}


def confirm_payload() -> dict:
    """CONFIRM — 평가 · 제안 · 선택지(replanner.confirm과 같은 모양)."""
    from app.agent.state import NextStep, OutcomeEvaluation, ReplanProposal
    from app.schemas.care import CareGoal

    evaluation = OutcomeEvaluation(
        goal=CareGoal.S2,
        round=1,
        deltas={"valence": 1.0, "arousal": -2.0},
        improved=True,
        completed=True,
    )
    proposal = ReplanProposal(
        recommended=NextStep.END, reason="사전보다 나아졌다", options=list(NextStep)
    )
    return {
        "evaluation": evaluation.model_dump(mode="json"),
        "proposal": proposal.model_dump(mode="json"),
        "options": [step.value for step in proposal.options],
    }


def end_payload() -> dict:
    """END — 라운드 요약과 목표 척도의 세션 변화(api/sessions.end_payload와 같은 모양)."""
    return {
        "reason": "DONE",
        "goal": "S2",
        "rounds": [
            {
                "round": 1,
                "protocol_id": "PR-06",
                "minutes": 5,
                "completed": True,
                "deltas": {"valence": 1.0, "arousal": -2.0},
                "improved": True,
                "next_step": "END",
            }
        ],
        "goal_scale": {
            "instrument_id": "INS-STAI6",
            "pre": {"total": 53.33},
            "end": {"total": 43.33},
            "delta": {"total": -10.0},
        },
    }


def write(name: str, payload: dict) -> Path:
    path = OUT / name
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return path


def write_index(loaded, measures: dict, questions: dict) -> Path:
    """견본 목록과 지연 로더. 목업 세션 · 미리보기가 쓰는 견본만 그때 불러온다(번들에 미리 싣지 않는다)."""
    from app.protocols import planned_minutes

    rows = [
        {
            "id": p.protocol_id,
            "name": p.name,
            "goal": p.goal.value,
            "composition": p.composition.value,
            "minutes": planned_minutes(p, None),
        }
        for p in loaded
    ]

    def loaders(folder: str, names, type_name: str) -> str:
        lines = [f'  "{n}": () => load<{type_name}>(import("./{folder}{n}.json")),' for n in names]
        return "\n".join(lines)

    protocols = "\n".join(f"  {json.dumps(row, ensure_ascii=False)}," for row in rows)
    text = f"""// scripts/fixtures.py가 BE 코드로 만든 응답 견본이다. 손으로 고치지 말고 스크립트를 다시 돌린다.
import type {{ ConfirmPayload, EndPayload, IntakeQuestion, MeasurePayload, RunPayload }} from "@/lib/api/types";

/** 활동 노드(BE data/protocols). PR-13은 E19를 PR-11에 합쳐 결번이고, PR-16은 NOTICE 단계 모듈이다. */
export const PROTOCOLS: {{ id: string; name: string; goal: string; composition: string; minutes: number }}[] = [
{protocols}
];

function load<T>(module: Promise<{{ default: unknown }}>): Promise<T> {{
  return module.then((m) => m.default as T);
}}

/** RUN payload {{plan, content}} — 활동마다 하나. */
export const runFixtures: Record<string, () => Promise<RunPayload>> = {{
{loaders("run/", [p.protocol_id for p in loaded], "RunPayload")}
}};

/** 측정 interrupt — 시점 × 목표. */
export const measureFixtures: Record<string, () => Promise<MeasurePayload>> = {{
{loaders("measure/", measures, "MeasurePayload")}
}};

/** intake 질문 — 되묻기 · 시점 질문 · 재질문 · 환경 칩. */
export const intakeFixtures: Record<string, () => Promise<IntakeQuestion>> = {{
{loaders("intake/", questions, "IntakeQuestion")}
}};

export const loadConfirm = () => load<ConfirmPayload>(import("./confirm.json"));
export const loadEnd = () => load<EndPayload>(import("./end.json"));
"""
    path = OUT / "index.ts"
    path.write_text(text, encoding="utf-8")
    return path


if __name__ == "__main__":
    main()
