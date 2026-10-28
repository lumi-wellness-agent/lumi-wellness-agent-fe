"use client";
/* eslint-disable react-hooks/set-state-in-effect, react-hooks/purity, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { useEffect, useRef, useState } from "react";
import { assetUrl } from "@/lib/api/client";
import { Button, Card, Heading, Screen } from "@/ui/controls";
import type { PlayerProps } from "../types";

const PR14_PALETTE = ["#397D78","#759BC3","#8873A6","#B86F87","#C48760","#D4B85F","#89964E","#DFD1B5"] as const;
const PR15_PALETTE = ["#789262","#536B52","#759BC3","#9BB7C9","#9A765C","#C48760","#D4B85F","#DFD1B5"] as const;
const WHITE="#FFFFFF";
type Regions=Record<string,string>; type Saved={designs:Record<string,Regions>;current:number;elapsed:number};

export default function ColoringPlayer({content,step,onFinish}:PlayerProps){
 const host=useRef<HTMLDivElement>(null), timer=useRef<ReturnType<typeof setTimeout>|null>(null);
 const [svg,setSvg]=useState(""); const [failed,setFailed]=useState(false); const [referenceVisible,setReferenceVisible]=useState(true); const [index,setIndex]=useState(0); const [designs,setDesigns]=useState<Record<string,Regions>>({}); const [color,setColor]=useState<string>(PR14_PALETTE[0]); const [eraser,setEraser]=useState(false); const [started,setStarted]=useState<number|null>(null); const [elapsed,setElapsed]=useState(0); const [now,setNow]=useState(Date.now());
 const mandala=content.protocol_id==="PR-14";
 const pr15=content.protocol_id==="PR-15";
 const palette=pr15?PR15_PALETTE:PR14_PALETTE;
 const ui=((content.content_spec??{}) as Record<string, any>).session_ui??{};
 const key=String(ui.storage?.key??("lumi.coloring."+content.protocol_id+".v1"));
 // PR-14: 도안 완성 + 최소 시간. PR-15에만 80% 완료 규칙을 적용합니다.
 const threshold=Number(ui.completion_rule?.minimum_completion_percent??80);
 const minimumElapsedSeconds=mandala?Math.round(Number(ui.timer?.planned_seconds??1200)*0.8):0;
 const assets=content.assets.filter(a=>a.slot==="COLORING_TEMPLATE"), asset=assets[index]??assets[0], url=asset?.url?assetUrl(asset.url):null, referenceUrl=url?.replace(/\.svg(?:\?.*)?$/i,".png")??null, id=String(asset?.metadata?.design_id??asset?.url??index), regions=designs[id]??{}, ids=Object.keys(regions), colored=ids.filter(k=>regions[k]!==WHITE).length, progress=ids.length?Math.round(colored/ids.length*100):0, done=progress>=threshold, anyDone=Object.values(designs).some(r=>{const values=Object.values(r);return values.length>0&&values.filter(v=>v!==WHITE).length/values.length*100>=threshold;}), ready=mandala?(anyDone&&elapsed>=minimumElapsedSeconds):(progress>=threshold);
 const fmt=(s:number)=>String(Math.floor(s/60)).padStart(2,"0")+":"+String(s%60).padStart(2,"0");
 useEffect(()=>{try{const raw=localStorage.getItem(key);if(raw){const s=JSON.parse(raw) as Saved;setDesigns(s.designs??{});setIndex(Math.min(Math.max(0,Number(s.current)||0),Math.max(0,assets.length-1)));setElapsed(Number(s.elapsed)||0);}else if(assets.length>1){setIndex(Math.floor(Math.random()*assets.length));}}catch{localStorage.removeItem(key);}},[key,assets.length]);
 useEffect(()=>{if(!url){setFailed(true);return;}let live=true;setReferenceVisible(true);fetch(url).then(r=>{if(!r.ok)throw new Error();return r.text();}).then(t=>live&&setSvg(t)).catch(()=>live&&setFailed(true));return()=>{live=false;};},[url]);
 useEffect(()=>{if(!started)return;const t=window.setInterval(()=>setNow(Date.now()),1000);return()=>window.clearInterval(t);},[started]); useEffect(()=>{if(started)setElapsed(Math.floor((now-started)/1000));},[now,started]);
 useEffect(()=>{if(!host.current||!svg)return;const root=host.current.querySelector("svg");if(!root){setFailed(true);return;}const init:Regions={};root.querySelectorAll<SVGElement>("[data-region-id]").forEach(e=>{const k=e.dataset.regionId;if(k){init[k]=regions[k]??WHITE;e.setAttribute("fill",init[k]);e.style.fill=init[k];e.style.pointerEvents="visiblePainted";e.style.cursor="pointer";}});if(!ids.length)setDesigns(old=>({...old,[id]:init}));},[svg,id,regions,ids.length]);
 useEffect(()=>{const c=host.current;if(!c)return;const h=(ev:Event)=>{const e=(ev.target as Element|null)?.closest<SVGElement>("[data-region-id]"), k=e?.dataset.regionId;if(!k)return;ev.preventDefault();if(!started){setStarted(Date.now()-elapsed*1000);setNow(Date.now());}setDesigns(old=>({...old,[id]:{...(old[id]??{}),[k]:eraser?WHITE:color}}));};c.addEventListener("pointerdown",h);return()=>c.removeEventListener("pointerdown",h);},[started,elapsed,color,eraser,id]);
 useEffect(()=>{if(!ids.length)return;const v:Saved={designs,current:index,elapsed};if(timer.current)clearTimeout(timer.current);timer.current=setTimeout(()=>localStorage.setItem(key,JSON.stringify(v)),500);return()=>{if(timer.current)clearTimeout(timer.current);};},[designs,index,elapsed,key,ids.length]);
 const reset=()=>{if(!window.confirm("현재 도안의 색칠이 모두 지워집니다. 초기화할까요?"))return;setDesigns(old=>({...old,[id]:Object.fromEntries(ids.map(k=>[k,WHITE]))}));}; const finish=()=>{if(!ready)return;localStorage.removeItem(key);onFinish({completed:true});};
 if(failed)return <Screen><Heading>而щ윭留??꾩븞??遺덈윭?ㅼ? 紐삵뻽?듬땲??</Heading></Screen>;
 const chooseNext=()=>{const completed=new Set(Object.entries(designs).filter(([,r])=>Object.keys(r).length>0&&Object.values(r).every(v=>v!==WHITE)).map(([design])=>design));const candidates=assets.map((a,i)=>({a,i})).filter(({a,i})=>i!==index&&!completed.has(String(a.metadata?.design_id??a.url??i)));if(candidates.length){setIndex(candidates[Math.floor(Math.random()*candidates.length)].i);}};
 return <Screen footer={<div><Button variant="quiet" onClick={()=>onFinish({completed:false,stoppedReason:"사용자가 컬러링을 중단함"})}>그만하기</Button><Button onClick={finish} disabled={!ready}>완료</Button></div>}><Heading>{content.name}</Heading><p>색칠할 수 있는 영역을 누르면 활동이 시작됩니다.</p>{mandala&&<div className="mt-4"><div className="flex justify-between text-sm font-semibold"><span>경과 시간 {fmt(elapsed)}</span><span>남은 권장 시간 {fmt(Math.max(0,1200-elapsed))}</span></div><div className="mt-2 h-3 overflow-hidden rounded-full bg-surface-muted" role="progressbar" aria-label="권장 시간 진행률" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.min(100,Math.round(elapsed/1200*100))}><div className="h-full rounded-full bg-primary transition-[width] duration-500" style={{width: Math.min(100,elapsed/1200*100)+"%"}}/></div><div className="mt-1 text-right text-xs text-ink-muted">도안 {index+1}/{assets.length}</div></div>}<div className="mt-3 text-sm font-semibold">색칠한 영역 {colored}/{ids.length}{!mandala&&" | "+progress+"%"}</div><div className="mt-4 flex flex-col gap-3"><div className="flex flex-wrap items-center gap-3">{palette.map((c)=><button key={c} type="button" aria-label={"색상 "+c} aria-pressed={!eraser&&color===c} className={"h-10 w-10 rounded-full border-2 transition "+(!eraser&&color===c?"border-ink ring-2 ring-ink/30":"border-transparent")} style={{backgroundColor:c}} onClick={()=>{setColor(c);setEraser(false);}}/>)}</div><div className="flex items-center justify-between gap-3"><button type="button" onClick={()=>setEraser(true)} className={"h-10 rounded-button border px-4 "+(eraser?"border-ink bg-surface-muted":"border-line")}>지우개</button>{mandala&&<button type="button" onClick={reset} className="h-10 rounded-button border border-line px-4">초기화</button>}</div>{mandala&&done&&<button type="button" onClick={chooseNext} className="h-10 w-full rounded-button bg-[#4F3B2B] px-4 font-semibold text-white shadow-sm">다음 도안</button>}</div><Card className="mt-5 overflow-auto p-2"><div className="relative mx-auto aspect-square w-full max-w-[680px] overflow-hidden"><img src={referenceUrl??undefined} alt="" aria-hidden="true" onLoad={()=>setReferenceVisible(true)} onError={()=>setReferenceVisible(false)} className={referenceVisible?"pointer-events-none absolute inset-0 z-0 block h-full w-full object-contain opacity-25":"hidden"}/><div ref={host} className="relative z-10 h-full w-full [&>svg]:block [&>svg]:h-full [&>svg]:w-full" dangerouslySetInnerHTML={{__html:svg}}/></div></Card></Screen>;
}














