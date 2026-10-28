"use client";
/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from "react";
import type { NoticeModule } from "@/lib/api/types";
import { Button } from "@/ui/controls";

const START_TEXT = "감정이나 분위기를 1~3개의 짧은 단어로 입력해 주세요. 이 활동에는 정답이 있지 않습니다.";
const KEY = "lumi.pr16.notice.v1";

function normalize(value: string) { return value.replace(/\s+/g, " ").trim(); }
function validPhrase(value: string, maxCharacters: number, minWords: number, maxWords: number) { const phrase = normalize(value); const words = phrase ? phrase.split(" ") : []; return phrase.length > 0 && phrase.length <= maxCharacters && words.length >= minWords && words.length <= maxWords && !/[\r\n]/.test(value); }

export function NoticePopup({ module, title, onDone }: { module: NoticeModule | null; title: string | null; onDone: (words: string[] | null) => void }) {
  const count = module?.input?.slot_count ?? 3; const maxLength = module?.input?.per_slot_max_characters ?? 20; const minimum = module?.input?.minimum_valid_slots ?? 1; const minWords = 1; const maxWords = 3;
  const [phase, setPhase] = useState<"READY" | "INPUTTING">("READY"); const [words, setWords] = useState<string[]>(() => Array(count).fill("")); const [error, setError] = useState("");
  useEffect(() => { try { const saved = JSON.parse(localStorage.getItem(KEY) ?? "null") as { phase?: "READY" | "INPUTTING"; words?: string[] } | null; if (saved?.words) { setWords(saved.words.slice(0, count)); setPhase(saved.phase ?? "INPUTTING"); } } catch { localStorage.removeItem(KEY); } }, [count]);
  useEffect(() => { localStorage.setItem(KEY, JSON.stringify({ phase, words })); }, [phase, words]);
  const submit = () => { const valid = words.map((word) => normalize(word)).filter((word) => validPhrase(word, maxLength, minWords, maxWords)); if (valid.length < minimum) { setError(`한 칸 이상 ${minWords}~${maxWords}단어로 입력해 주세요.`); return; } localStorage.removeItem(KEY); onDone(valid); };
  const skip = () => { localStorage.removeItem(KEY); onDone(null); };

  return <div role="dialog" aria-modal="true" aria-labelledby="notice-title" className="fixed inset-0 z-20 flex items-end bg-black/40"><div className="mx-auto w-full max-w-[480px] rounded-t-card bg-surface px-4 pt-5 pb-[calc(16px+env(safe-area-inset-bottom))]"><h2 id="notice-title" className="mb-1 font-display text-title">{title ?? "감정 알아차리기"}</h2>{phase === "READY" ? <><p className="mb-5 break-keep text-ink-muted">{module?.popup?.start_text ?? START_TEXT}</p><div className="flex flex-col gap-2"><Button onClick={() => setPhase("INPUTTING")}>진행하기</Button><Button variant="quiet" onClick={skip}>건너뛰기</Button></div></> : <><p className="mb-4 break-keep text-ink-muted">{module?.popup?.start_text ?? START_TEXT}</p><div className="mb-2 flex flex-col gap-2">{words.map((word, index) => <input key={index} value={word} maxLength={maxLength} aria-label={`감정 또는 분위기 ${index + 1}`} placeholder={index === 0 ? "예: 차분한 기분" : "더 적어도 괜찮아요"} onChange={(event) => { setError(""); setWords((all) => all.map((item, itemIndex) => itemIndex === index ? event.target.value : item)); }} className="min-h-12 rounded-row border border-line-control bg-control px-3 text-body text-ink" />)}</div>{error && <p role="alert" className="mb-3 text-caption text-danger">{error}</p>}<div className="flex flex-col gap-2"><Button onClick={submit}>완료</Button><Button variant="quiet" onClick={skip}>건너뛰기</Button></div></>}</div></div>;
}
