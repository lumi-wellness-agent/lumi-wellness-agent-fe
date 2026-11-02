"use client";
/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from "react";
import { useMessages } from "@/i18n/use-locale";
import type { NoticeModule } from "@/lib/api/types";
import { Button } from "@/ui/controls";
import { NOTICE } from "./messages";
const KEY = "lumi.pr16.notice.v1";

function normalize(value: string) { return value.replace(/\s+/g, " ").trim(); }
function validPhrase(value: string, maxCharacters: number, minWords: number, maxWords: number) { const phrase = normalize(value); const words = phrase ? phrase.split(" ") : []; return phrase.length > 0 && phrase.length <= maxCharacters && words.length >= minWords && words.length <= maxWords && !/[\r\n]/.test(value); }

export function NoticePopup({ module, title, onDone }: { module: NoticeModule | null; title: string | null; onDone: (words: string[] | null) => void }) {
  const t = useMessages(NOTICE);
  const count = module?.input?.slot_count ?? 3; const maxLength = module?.input?.per_slot_max_characters ?? 20; const minimum = module?.input?.minimum_valid_slots ?? 1; const minWords = 1; const maxWords = 3;
  const [phase, setPhase] = useState<"READY" | "INPUTTING">("READY"); const [words, setWords] = useState<string[]>(() => Array(count).fill("")); const [error, setError] = useState("");
  useEffect(() => { try { const saved = JSON.parse(localStorage.getItem(KEY) ?? "null") as { phase?: "READY" | "INPUTTING"; words?: string[] } | null; if (saved?.words) { setWords(saved.words.slice(0, count)); setPhase(saved.phase ?? "INPUTTING"); } } catch { localStorage.removeItem(KEY); } }, [count]);
  useEffect(() => { localStorage.setItem(KEY, JSON.stringify({ phase, words })); }, [phase, words]);
  const submit = () => { const valid = words.map((word) => normalize(word)).filter((word) => validPhrase(word, maxLength, minWords, maxWords)); if (valid.length < minimum) { setError(t.invalid(minWords, maxWords)); return; } localStorage.removeItem(KEY); onDone(valid); };
  const skip = () => { localStorage.removeItem(KEY); onDone(null); };

  return <div role="dialog" aria-modal="true" aria-labelledby="notice-title" className="fixed inset-0 z-20 flex items-end bg-black/40"><div className="mx-auto w-full max-w-[480px] rounded-t-card bg-surface px-4 pt-5 pb-[calc(16px+env(safe-area-inset-bottom))]"><h2 id="notice-title" className="mb-1 font-display text-title">{title ?? t.title}</h2>{phase === "READY" ? <><p className="mb-5 break-keep text-ink-muted">{module?.popup?.start_text ?? t.start}</p><div className="flex flex-col gap-2"><Button onClick={() => setPhase("INPUTTING")}>{t.proceed}</Button><Button variant="quiet" onClick={skip}>{t.skip}</Button></div></> : <><p className="mb-4 break-keep text-ink-muted">{module?.popup?.start_text ?? t.start}</p><div className="mb-2 flex flex-col gap-2">{words.map((word, index) => <input key={index} value={word} maxLength={maxLength} aria-label={t.input(index + 1)} placeholder={index === 0 ? t.firstPlaceholder : t.morePlaceholder} onChange={(event) => { setError(""); setWords((all) => all.map((item, itemIndex) => itemIndex === index ? event.target.value : item)); }} className="min-h-12 rounded-row border border-line-control bg-control px-3 text-body text-ink" />)}</div>{error && <p role="alert" className="mb-3 text-caption text-danger">{error}</p>}<div className="flex flex-col gap-2"><Button onClick={submit}>{t.done}</Button><Button variant="quiet" onClick={skip}>{t.skip}</Button></div></>}</div></div>;
}
