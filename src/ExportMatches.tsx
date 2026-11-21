import {useEffect,useRef,useState} from "react";
import {Stage,Round,Match} from "./types";
type Props={name:string;stages:Stage[];rounds:Round[];matches:Match[];stageId:string;roundId:string;color?:string;coverUrl?:string;t:Record<string,string>;onClose:()=>void;onMsg:(s:string)=>void};
type Lg={homeLogo?:string|null;awayLogo?:string|null};
const SIZES={STORIES:[1080,1920],SQUAD:[1080,1080],FEED:[1080,1350],DYNAMIC:[1080,0]} as const;
type WK=keyof typeof SIZES;
const FONT="Roboto,Arial,sans-serif";
const IC={print:"M6 9V3h12v6M6 18H4a1 1 0 0 1-1-1v-6a1 1 0 0 1 1-1h16a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1h-2M6 14h12v7H6z",image:"M4 4h16v16H4zM4 16l5-5 4 4 3-3 4 4M9 9h.01",excel:"M4 4h16v16H4zM4 12h16M12 4v16",text:"M6 3h9l4 4v14H6zM14 3v5h5M9 13h7M9 17h7",html:"M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1",back:"M19 12H5M12 5l-7 7 7 7"};
const Ic=({d}:{d:string})=><svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={d}/></svg>;
const abbr=(n:string)=>n.replace(/[^\p{L}\p{N} ]/gu,"").trim().slice(0,3).toUpperCase()||"?";
const score=(m:Match)=>m.status==="done"?`${m.homeScore} - ${m.awayScore}`:"x";
const esc=(s:unknown)=>String(s??"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c] as string));
const save=(blob:Blob,fn:string)=>{const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=fn;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1500)};
const crest=(x:CanvasRenderingContext2D,cx:number,cy:number,r:number,nm:string,im:HTMLImageElement|null)=>{
if(im){const s=Math.min(2*r*1.1/im.width,2*r*1.1/im.height);const w=im.width*s,h=im.height*s;x.drawImage(im,cx-w/2,cy-h/2,w,h);return}
x.save();x.beginPath();x.arc(cx,cy,r,0,Math.PI*2);x.closePath();x.clip();x.fillStyle="#e1e8f7";x.fillRect(cx-r,cy-r,2*r,2*r);
x.fillStyle="#10224d";x.font=`800 ${Math.round(r*0.8)}px ${FONT}`;x.textAlign="center";x.textBaseline="middle";x.fillText(abbr(nm).slice(0,2),cx,cy);x.restore()};

export default function ExportMatches({name,stages,rounds,matches,stageId,roundId,color,coverUrl,t,onClose,onMsg}:Props){
const [step,setStep]=useState<"menu"|"scope"|"image">("menu");const [scope,setScope]=useState<"stage"|"round">(roundId?"round":"stage");
const [wk,setWk]=useState<WK>("DYNAMIC");const [showT,setShowT]=useState(true);const [tt,setTt]=useState(name);const [showR,setShowR]=useState(true);const [rt,setRt]=useState("");
const [bg,setBg]=useState(color||"#172B59");const [cov,setCov]=useState(!!coverUrl);const [ab,setAb]=useState(false);
const cv=useRef<HTMLCanvasElement>(null);const cache=useRef(new Map<string,HTMLImageElement|null>());
const stage=stages.find(s=>s.id===stageId);const round=rounds.find(r=>r.id===roundId);
const rn=(rid:string)=>rounds.find(r=>r.id===rid)?.name??"";const ri=(rid:string)=>rounds.findIndex(r=>r.id===rid);
const all=matches.filter(m=>m.stageId===stageId).sort((a,b)=>ri(a.roundId)-ri(b.roundId));
const list=scope==="round"?all.filter(m=>m.roundId===roundId):all;
const label=scope==="round"?round?.name??"":stage?.name??"";
useEffect(()=>{setRt(label)},[label]);
const table=()=>`<meta charset="utf-8"><table border="1" cellpadding="6" style="border-collapse:collapse;font-family:sans-serif"><caption><b>${esc(name)} - ${esc(stage?.name)}</b></caption><tr><th>${esc(t.round)}</th><th>${esc(t.homeP)}</th><th>Score</th><th>${esc(t.awayP)}</th></tr>${all.map(m=>`<tr><td>${esc(rn(m.roundId))}</td><td>${esc(m.homeName)}</td><td align="center">${esc(score(m))}</td><td>${esc(m.awayName)}</td></tr>`).join("")}</table>`;
const doPrint=()=>{const f=document.createElement("iframe");f.style.cssText="position:fixed;right:0;bottom:0;width:0;height:0;border:0";document.body.appendChild(f);const d=f.contentWindow?.document;if(!d)return;d.open();d.write(`<!doctype html><title>${esc(name)}</title>${table()}`);d.close();setTimeout(()=>{f.contentWindow?.focus();f.contentWindow?.print();setTimeout(()=>f.remove(),3000)},300);onClose()};
const doExcel=()=>{save(new Blob([table()],{type:"application/vnd.ms-excel"}),`${name}.xls`);onClose()};
const doText=()=>{let cur="";const out=[name,stage?.name??"",""];all.forEach(m=>{if(m.roundId!==cur){cur=m.roundId;out.push(`# ${rn(cur)}`)}out.push(`${m.homeName} ${score(m)} ${m.awayName}`)});save(new Blob([out.join("\n")],{type:"text/plain;charset=utf-8"}),`${name}.txt`);onClose()};
const doHtml=async()=>{try{await navigator.clipboard.writeText(table());onMsg(t.exCopied)}catch{prompt("HTML",table())}onClose()};
const load=(u?:string|null)=>new Promise<HTMLImageElement|null>(res=>{if(!u)return res(null);const k=cache.current;if(k.has(u))return res(k.get(u)??null);const i=new Image();i.crossOrigin="anonymous";i.onload=()=>{k.set(u,i);res(i)};i.onerror=()=>{k.set(u,null);res(null)};i.src=u});
const draw=async(c:HTMLCanvasElement,off:()=>boolean)=>{
const [CW,CH]=SIZES[wk];const n=list.length;const covImg=cov?await load(coverUrl):null;
const imgs=await Promise.all(list.map(async m=>[await load((m as Match&Lg).homeLogo),await load((m as Match&Lg).awayLogo)] as const));
if(off())return;
const covH=covImg?280:0;const top=covH+40+(showT?84:0)+(showR?64:0)+20;
const rowH=CH?Math.max(70,Math.min(200,Math.floor((CH-top-50)/Math.max(n,1)))):190;
const H=CH||top+Math.max(n,1)*rowH+50;c.width=CW;c.height=H;
const x=c.getContext("2d");if(!x)return;
const PX=40,PW=CW-PX*2;x.fillStyle=bg;x.fillRect(0,0,CW,H);x.fillStyle="#fff";x.fillRect(PX,0,PW,H);
if(covImg){const s=Math.max(PW/covImg.width,covH/covImg.height);const w=covImg.width*s,h=covImg.height*s;x.save();x.beginPath();x.rect(PX,0,PW,covH);x.clip();x.drawImage(covImg,PX+(PW-w)/2,(covH-h)/2,w,h);x.restore()}
x.textAlign="center";x.textBaseline="alphabetic";x.fillStyle="#10224d";let y=covH+40;
if(showT){x.font=`800 52px ${FONT}`;y+=52;x.fillText(tt,CW/2,y,PW-60);y+=32}
if(showR){x.font=`700 32px ${FONT}`;y+=32;x.fillText(rt.toUpperCase(),CW/2,y,PW-60)}
const r=Math.min(52,rowH*0.27),cx1=PX+PW*0.25,cx2=PX+PW*0.75,fs=Math.max(22,Math.min(34,Math.round(rowH*0.17)));
list.forEach((m,i)=>{const y0=top+i*rowH,cy=y0+rowH*0.4;x.strokeStyle="#e3e8f2";x.lineWidth=2;x.beginPath();x.moveTo(PX,y0);x.lineTo(PX+PW,y0);x.stroke();
const sides:[number,string,HTMLImageElement|null][]=[[cx1,String(m.homeName||t.tbd),imgs[i][0]],[cx2,String(m.awayName||t.tbd),imgs[i][1]]];
sides.forEach(([cx,nm,im])=>{crest(x,cx,cy,r,nm,im);x.fillStyle="#10224d";x.font=`700 ${fs}px ${FONT}`;x.textAlign="center";x.textBaseline="alphabetic";x.fillText(ab?abbr(nm):nm,cx,cy+r+fs+6,PW*0.42)});
x.fillStyle=m.status==="done"?"#10224d":"#9aa3b8";x.font=`800 ${m.status==="done"?56:36}px ${FONT}`;x.textAlign="center";x.textBaseline="middle";x.fillText(score(m),CW/2,cy);x.textBaseline="alphabetic"})};
useEffect(()=>{if(step!=="image")return;let off=false;const c=cv.current;if(c)void draw(c,()=>off);return()=>{off=true}},[step,wk,showT,tt,showR,rt,bg,cov,ab,scope,matches]);
const download=()=>{try{cv.current?.toBlob(b=>{if(b)save(b,`${name}-${label}.png`)},"image/png")}catch{onMsg(t.err)}};
if(step==="menu")return<div className="exscrim" onClick={onClose}><div className="exmenu" onClick={e=>e.stopPropagation()}>
<button onClick={doPrint}><Ic d={IC.print}/>{t.exPrint}</button><button onClick={()=>setStep("scope")}><Ic d={IC.image}/>{t.exImage}</button><button onClick={doExcel}><Ic d={IC.excel}/>Excel</button><button onClick={doText}><Ic d={IC.text}/>{t.exText}</button><button onClick={doHtml}><Ic d={IC.html}/>{t.exHtml}</button></div></div>;
if(step==="scope")return<div className="exscrim" onClick={onClose}><div className="exdlg" onClick={e=>e.stopPropagation()}><h3>{t.exImage}</h3>
<label className="chk"><input type="radio" checked={scope==="stage"} onChange={()=>setScope("stage")}/>{stage?.name}</label>
{roundId&&<label className="chk"><input type="radio" checked={scope==="round"} onChange={()=>setScope("round")}/>{round?.name}</label>}
<div className="exact"><button className="btn sm" onClick={()=>setStep("image")}>{t.exImage}</button></div></div></div>;
return<div className="exfull"><header className="ch"><div className="chr"><button className="ib" onClick={onClose} aria-label={t.cancel}><Ic d={IC.back}/></button><h1>{t.games}</h1></div></header>
<div className="expv"><canvas ref={cv}/></div>
<div className="sform">
<p className="sec dark">{t.exWidth}</p>
<div className="wseg">{(Object.keys(SIZES) as WK[]).map(k=><button key={k} type="button" className={wk===k?"on":""} onClick={()=>setWk(k)}>{wk===k?"✓ ":""}{k}</button>)}</div>
<div className="drow"><input type="checkbox" checked={showT} onChange={e=>setShowT(e.target.checked)}/><label className="fl"><span>{t.exTitle}</span><input value={tt} onChange={e=>setTt(e.target.value)}/></label></div>
<div className="drow"><input type="checkbox" checked={showR} onChange={e=>setShowR(e.target.checked)}/><label className="fl"><span>{t.exTitle}</span><input value={rt} onChange={e=>setRt(e.target.value)}/></label></div>
<label className="srow"><span>{t.exBg}</span><input type="color" value={/^#[0-9a-f]{6}$/i.test(bg)?bg:"#172B59"} onChange={e=>setBg(e.target.value)}/></label>
<label className="srow"><span>{t.cover}</span><input type="checkbox" checked={cov} disabled={!coverUrl} onChange={e=>setCov(e.target.checked)}/></label>
<label className="srow"><span>{t.exAbbr}</span><input type="checkbox" checked={ab} onChange={e=>setAb(e.target.checked)}/></label>
<button className="btn" onClick={download}>{t.exDl}</button></div></div>}
