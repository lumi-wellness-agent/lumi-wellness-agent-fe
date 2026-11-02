"use client";
/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect,useRef,useState } from "react";
import { useMessages } from "@/i18n/use-locale";
import { Button,Card,Heading,Screen } from "@/ui/controls";
import type { PlayerProps } from "../types";
import { OUTDOOR_WALK } from "./messages";
type S={status:"READY"|"RUNNING"|"PAUSED";elapsed:number;checks:{env:boolean;body:boolean};savedAt?:number}; const KEY="lumi.pr11.outdoor.v1"; const SAVED_TTL_MS=3*60*60*1000; // 이보다 오래된 기록은 지난 세션 것으로 보고 새로 시작한다
export default function OutdoorWalkPlayer({onFinish,step}:PlayerProps){
 const T=useMessages(OUTDOOR_WALK);
 const [s,setS]=useState<S>({status:"READY",elapsed:0,checks:{env:false,body:false}}); const [startedAt,setStartedAt]=useState<number|null>(null); const [now,setNow]=useState(()=>Date.now()); const [hydrated,setHydrated]=useState(false); const leaving=useRef<number|null>(null); const valid=s.checks.env&&s.checks.body; const targetSeconds=Math.max(60,Math.round(step.minutes*60)); const progress=Math.min(100,Math.round(s.elapsed/targetSeconds*100)); const fmt=(v:number)=>String(Math.floor(v/60)).padStart(2,"0")+":"+String(v%60).padStart(2,"0");
 useEffect(()=>{try{const r=localStorage.getItem(KEY);if(r){const x=JSON.parse(r) as S;if(Date.now()-(x.savedAt||0)<SAVED_TTL_MS)setS({...x,status:x.status==="RUNNING"?"PAUSED":x.status});}}catch{localStorage.removeItem(KEY);}finally{setHydrated(true);}},[targetSeconds]);
 useEffect(()=>{if(s.status!=="RUNNING")return;const t=window.setInterval(()=>setNow(Date.now()),1000);return()=>window.clearInterval(t);},[s.status]);
 useEffect(()=>{if(s.status==="RUNNING"&&startedAt)setS(x=>({...x,elapsed:Math.min(targetSeconds,Math.floor((now-startedAt)/1000))}));},[now,s.status,startedAt]);
 useEffect(()=>{if(hydrated)localStorage.setItem(KEY,JSON.stringify({...s,savedAt:Date.now()}));},[s,hydrated]);
 // 활동을 떠나면(완료 · 그만하기 · 화면 위 그만하기) 기록을 지운다. 새로고침에는 정리 함수가 돌지 않아 이어서 할 수 있고, 개발 모드의 마운트 → 정리 → 마운트에서는 지우기를 취소한다
 useEffect(()=>{if(leaving.current!==null)window.clearTimeout(leaving.current);return()=>{leaving.current=window.setTimeout(()=>localStorage.removeItem(KEY),0);};},[]);
 const start=()=>{setStartedAt(Date.now()-s.elapsed*1000);setS(x=>({...x,status:"RUNNING"}));}; const pause=()=>{setStartedAt(null);setS(x=>({...x,status:"PAUSED"}));}; const resume=()=>{setStartedAt(Date.now()-s.elapsed*1000);setS(x=>({...x,status:"RUNNING"}));}; const stop=()=>{localStorage.removeItem(KEY);onFinish({completed:false,stoppedReason:"SAFETY_OR_DISCOMFORT"});}; const done=()=>{if(s.elapsed>=targetSeconds){localStorage.removeItem(KEY);onFinish({completed:true});}};
 return <Screen footer={<div className="flex flex-col gap-2">{s.status==="RUNNING"&&<Button variant="secondary" onClick={pause}>{T.pause}</Button>}{s.status==="PAUSED"&&<Button onClick={resume} disabled={!valid}>{T.resume}</Button>}{(s.status==="RUNNING"||s.status==="PAUSED")&&<Button variant="quiet" onClick={stop}>{T.stop}</Button>}{s.elapsed>=targetSeconds&&<Button onClick={done}>{T.done}</Button>}</div>}><Heading eyebrow={T.title}>{T.title}</Heading><p className="text-ink-muted">{T.intro}</p>{(s.status==="READY"||s.status==="PAUSED")&&<Card className="mt-5"><h2 className="font-semibold">{T.safety}</h2><label className="mt-4 flex gap-2"><input type="checkbox" checked={s.checks.env} onChange={e=>setS(x=>({...x,checks:{...x.checks,env:e.target.checked}}))}/><span>{T.env}</span></label><label className="mt-3 flex gap-2"><input type="checkbox" checked={s.checks.body} onChange={e=>setS(x=>({...x,checks:{...x.checks,body:e.target.checked}}))}/><span>{T.body}</span></label>{s.status==="READY"&&<Button className="mt-5 w-full" onClick={start} disabled={!valid}>{T.start}</Button>}</Card>} {(s.status==="RUNNING"||s.status==="PAUSED")&&<div className="mt-8"><div className="flex justify-between font-semibold"><span>{T.elapsed} {fmt(s.elapsed)}</span><span>{T.remaining} {fmt(Math.max(0,targetSeconds-s.elapsed))}</span></div><div className="mt-3 h-4 rounded-full bg-surface-muted"><div className="h-full rounded-full bg-primary" style={{width:progress+"%"}}/></div><div className="mt-1 flex justify-end text-caption text-ink-muted">{T.recommended} {T.minutes(Math.round(step.minutes))}</div></div>}<p className="mt-8 text-caption text-ink-muted">{T.location}</p></Screen>;
}




