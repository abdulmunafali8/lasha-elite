import {useEffect,useRef,useState} from "react";

/* Export the standings TABLE (not the fixtures): image (download / share), print, Excel, text, HTML */

type Row={id:string;name:string;logoUrl?:string|null;pts:number;mp:number;w:number;d:number;l:number;gf:number;ga:number;gd:number};
type Props={name:string;sub:string;rows:Row[];color?:string;coverUrl?:string;t:Record<string,string>;onClose:()=>void;onMsg:(s:string)=>void};
const SIZES={STORIES:[1080,1920],SQUAD:[1080,1080],FEED:[1080,1350],DYNAMIC:[1080,0]} as const;
type WK=keyof typeof SIZES;
const FONT="Roboto,Arial,sans-serif";
const HEAD=["PTS","MP","W","D","L","GF","GA","GD"] as const;
const IC={print:"M6 9V3h12v6M6 18H4a1 1 0 0 1-1-1v-6a1 1 0 0 1 1-1h16a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1h-2M6 14h12v7H6z",image:"M4 4h16v16H4zM4 16l5-5 4 4 3-3 4 4M9 9h.01",excel:"M4 4h16v16H4zM4 12h16M12 4v16",text:"M6 3h9l4 4v14H6zM14 3v5h5M9 13h7M9 17h7",html:"M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1",back:"M19 12H5M12 5l-7 7 7 7",share:"M18 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM6 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM18 22a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM8.6 13.5l6.8 4M15.4 6.5l-6.8 4"};
const Ic=({d}:{d:string})=><svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={d}/></svg>;
const abbr=(n:string)=>n.replace(/[^\p{L}\p{N} ]/gu,"").trim().slice(0,3).toUpperCase()||"?";
const esc=(s:unknown)=>String(s??"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c] as string));
const save=(blob:Blob,fn:string)=>{const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=fn;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1500)};
const val=(r:Row,h:(typeof HEAD)[number])=>({PTS:r.pts,MP:r.mp,W:r.w,D:r.d,L:r.l,GF:r.gf,GA:r.ga,GD:r.gd}[h]);
const crest=(x:CanvasRenderingContext2D,cx:number,cy:number,r:number,nm:string,im:HTMLImageElement|null)=>{
if(im){const s=Math.min(2*r*1.1/im.width,2*r*1.1/im.height);const w=im.width*s,h=im.height*s;x.drawImage(im,cx-w/2,cy-h/2,w,h);return}
x.save();x.beginPath();x.arc(cx,cy,r,0,Math.PI*2);x.closePath();x.clip();x.fillStyle="#e1e8f7";x.fillRect(cx-r,cy-r,2*r,2*r);
x.fillStyle="#10224d";x.font=`800 ${Math.round(r*0.8)}px ${FONT}`;x.textAlign="center";x.textBaseline="middle";x.fillText(abbr(nm).slice(0,2),cx,cy);x.restore()};

export default function ExportTable({name,sub,rows,color,coverUrl,t,onClose,onMsg}:Props){
const [step,setStep]=useState<"menu"|"image">("menu");const [wk,setWk]=useState<WK>("DYNAMIC");
const [showT,setShowT]=useState(true);const [tt,setTt]=useState(name);const [showS,setShowS]=useState(true);const [st,setSt]=useState(sub?`${sub} · ${t.table}`:t.table);
const [bg,setBg]=useState("#ffffff");const [cov,setCov]=useState(false);const [ab,setAb]=useState(false);const [lg,setLg]=useState(true);const [sd,setSd]=useState(false);
const cv=useRef<HTMLCanvasElement>(null);const cache=useRef(new Map<string,HTMLImageElement|null>());
const fn=`${name}-${t.table}.png`;
const html=()=>`<meta charset="utf-8"><table border="1" cellpadding="6" style="border-collapse:collapse;font-family:sans-serif"><caption><b>${esc(name)}${sub?` - ${esc(sub)}`:""}</b></caption><tr><th>#</th><th>${esc(t.players)}</th>${HEAD.map(h=>`<th>${h}</th>`).join("")}</tr>${rows.map((r,i)=>`<tr><td>${i+1}</td><td>${esc(r.name)}</td>${HEAD.map(h=>`<td align="center">${val(r,h)}</td>`).join("")}</tr>`).join("")}</table>`;
const doPrint=()=>{const f=document.createElement("iframe");f.style.cssText="position:fixed;right:0;bottom:0;width:0;height:0;border:0";document.body.appendChild(f);const d=f.contentWindow?.document;if(!d)return;d.open();d.write(`<!doctype html><title>${esc(name)}</title>${html()}`);d.close();setTimeout(()=>{f.contentWindow?.focus();f.contentWindow?.print();setTimeout(()=>f.remove(),3000)},300);onClose()};
const doExcel=()=>{save(new Blob([html()],{type:"application/vnd.ms-excel"}),`${name}-${t.table}.xls`);onClose()};
const doText=()=>{const out=[name,sub,""];rows.forEach((r,i)=>out.push(`${i+1}. ${r.name}  ${HEAD.map(h=>`${h} ${val(r,h)}`).join("  ")}`));save(new Blob([out.join("\n")],{type:"text/plain;charset=utf-8"}),`${name}-${t.table}.txt`);onClose()};
const doHtml=async()=>{try{await navigator.clipboard.writeText(html());onMsg(t.exCopied)}catch{prompt("HTML",html())}onClose()};
const load=(u?:string|null)=>new Promise<HTMLImageElement|null>(res=>{if(!u)return res(null);const k=cache.current;if(k.has(u))return res(k.get(u)??null);const i=new Image();i.crossOrigin="anonymous";i.onload=()=>{k.set(u,i);res(i)};i.onerror=()=>{k.set(u,null);res(null)};i.src=u});
const draw=async(c:HTMLCanvasElement,off:()=>boolean)=>{
const [CW,CH]=SIZES[wk];const n=Math.max(rows.length,1);
const covImg=cov?await load(coverUrl):null;const imgs=await Promise.all(rows.map(r=>load(lg?r.logoUrl:null)));
if(off())return;
const bgc=/^#[0-9a-f]{6}$/i.test(bg)?bg:"#ffffff";const k=parseInt(bgc.slice(1),16);const light=(0.299*(k>>16)+0.587*((k>>8)&255)+0.114*(k&255))/255>0.55;
const fg=light?"#222222":"#ffffff",ln=light?"#e4e7ee":"rgba(255,255,255,.2)",zb=light?"rgba(16,34,77,.045)":"rgba(255,255,255,.07)";
const acc=light?"#10224d":"rgba(255,255,255,.16)";
const covH=covImg?280:0;const top=covH+30+(showT?60:0)+(showS?46:0)+18;
const M=36,TW=CW-2*M,hdrH=66;const rankW=Math.round(TW*0.07),ptsW=Math.round(TW*0.095),numW=Math.round(TW*0.072);const teamW=TW-rankW-ptsW-7*numW;
const rowH=CH?Math.max(40,Math.min(100,Math.floor((CH-top-hdrH-26)/n))):86;
const need=top+hdrH+n*rowH+26;const H=CH?Math.max(CH,need):need;c.width=CW;c.height=H;
const x=c.getContext("2d");if(!x)return;
x.fillStyle=bgc;x.fillRect(0,0,CW,H);
if(covImg){const s=Math.max(CW/covImg.width,covH/covImg.height);const w=covImg.width*s,h=covImg.height*s;x.save();x.beginPath();x.rect(0,0,CW,covH);x.clip();x.drawImage(covImg,(CW-w)/2,(covH-h)/2,w,h);x.restore()}
x.textAlign="center";x.textBaseline="alphabetic";x.fillStyle=fg;let y=covH+30;
if(showT){y+=46;x.font=`600 48px ${FONT}`;x.fillText(tt,CW/2,y,CW-60);y+=14}
if(showS){y+=32;x.font=`700 30px ${FONT}`;x.fillText(st.toUpperCase(),CW/2,y,CW-60);y+=14}
/* header band */
x.fillStyle=acc;x.fillRect(M,top,TW,hdrH);x.fillStyle="#ffffff";x.font=`800 ${Math.round(hdrH*0.38)}px ${FONT}`;x.textBaseline="middle";
x.textAlign="center";x.fillText("#",M+rankW/2,top+hdrH/2);x.textAlign="left";x.fillText(t.players,M+rankW+14,top+hdrH/2,teamW-20);
let cx=M+rankW+teamW;HEAD.forEach((h,i)=>{const w=i===0?ptsW:numW;x.textAlign="center";x.fillText(h,cx+w/2,top+hdrH/2);cx+=w});
/* rows */
const fs=Math.max(20,Math.min(32,Math.round(rowH*0.34))),r=Math.min(30,rowH*0.31);
rows.forEach((row,i)=>{const y0=top+hdrH+i*rowH,cy=y0+rowH/2;
if(i%2===1){x.fillStyle=zb;x.fillRect(M,y0,TW,rowH)}
x.strokeStyle=ln;x.lineWidth=2;x.beginPath();x.moveTo(M,y0+rowH);x.lineTo(M+TW,y0+rowH);x.stroke();
x.textBaseline="middle";x.textAlign="center";
if(i===0){x.fillStyle="#f2c14e";x.beginPath();x.arc(M+rankW/2,cy,Math.min(24,rowH*0.34),0,Math.PI*2);x.fill();x.fillStyle="#10224d"}else x.fillStyle=fg;
x.font=`800 ${fs}px ${FONT}`;x.fillText(String(i+1),M+rankW/2,cy);
let tx=M+rankW+14;if(lg){crest(x,tx+r,cy,r,row.name,imgs[i]);tx+=2*r+14}
x.fillStyle=fg;x.font=`600 ${fs}px ${FONT}`;x.textAlign="left";x.textBaseline="middle";x.fillText(ab?abbr(row.name):row.name,tx,cy,M+rankW+teamW-tx-8);
let nx=M+rankW+teamW;HEAD.forEach((h,j)=>{const w=j===0?ptsW:numW;x.textAlign="center";x.font=j===0?`800 ${fs+2}px ${FONT}`:`500 ${fs}px ${FONT}`;x.fillStyle=fg;x.fillText(String(val(row,h)),nx+w/2,cy);nx+=w});
x.textBaseline="alphabetic"})};
useEffect(()=>{if(step!=="image")return;let off=false;const c=cv.current;if(c)void draw(c,()=>off);return()=>{off=true}},[step,wk,showT,tt,showS,st,bg,cov,ab,lg,rows]);
const blob=()=>new Promise<Blob|null>(res=>{const c=cv.current;if(!c)return res(null);try{c.toBlob(b=>res(b),"image/png")}catch{res(null)}});
const doOpen=async()=>{const w=window.open("","_blank");const b=await blob();if(!b){w?.close();return onMsg(t.err)}if(w)w.location.href=URL.createObjectURL(b);else save(b,fn);setSd(false)};
const doShare=async()=>{const b=await blob();if(!b)return onMsg(t.err);const f=new File([b],fn,{type:"image/png"});try{if(typeof navigator.canShare==="function"&&navigator.canShare({files:[f]}))await navigator.share({files:[f],title:name});else save(b,f.name)}catch{/* an soke */}setSd(false)};
const download=async()=>{const b=await blob();if(!b)return onMsg(t.err);save(b,fn)};
if(step==="menu")return<div className="exscrim" onClick={onClose}><div className="exmenu" onClick={e=>e.stopPropagation()}>
<button onClick={doPrint}><Ic d={IC.print}/>{t.exPrint}</button><button onClick={()=>setStep("image")}><Ic d={IC.image}/>{t.exImage}</button><button onClick={doExcel}><Ic d={IC.excel}/>Excel</button><button onClick={doText}><Ic d={IC.text}/>{t.exText}</button><button onClick={doHtml}><Ic d={IC.html}/>{t.exHtml}</button></div></div>;
return<div className="exfull"><header className="ch"><div className="chr"><button className="ib" onClick={onClose} aria-label={t.cancel}><Ic d={IC.back}/></button><h1>{t.table}</h1><button className="ib" onClick={()=>setSd(true)} aria-label={t.share}><Ic d={IC.share}/></button></div></header>
<div className="expv"><canvas ref={cv}/></div>
<div className="sform">
<p className="sec dark">{t.exWidth}</p>
<div className="wseg">{(Object.keys(SIZES) as WK[]).map(k=><button key={k} type="button" className={wk===k?"on":""} onClick={()=>setWk(k)}>{wk===k?"✓ ":""}{k}</button>)}</div>
<div className="drow"><input type="checkbox" checked={showT} onChange={e=>setShowT(e.target.checked)}/><label className="fl"><span>{t.exTitle}</span><input value={tt} onChange={e=>setTt(e.target.value)}/></label></div>
<div className="drow"><input type="checkbox" checked={showS} onChange={e=>setShowS(e.target.checked)}/><label className="fl"><span>{t.exTitle}</span><input value={st} onChange={e=>setSt(e.target.value)}/></label></div>
<label className="srow"><span>{t.exBg}</span><input type="color" value={/^#[0-9a-f]{6}$/i.test(bg)?bg:"#172B59"} onChange={e=>setBg(e.target.value)}/></label>
<label className="srow"><span>{t.cover}</span><input type="checkbox" checked={cov} disabled={!coverUrl} onChange={e=>setCov(e.target.checked)}/></label>
<label className="srow"><span>{t.exAbbr}</span><input type="checkbox" checked={ab} onChange={e=>setAb(e.target.checked)}/></label>
<label className="srow"><span>Logo</span><input type="checkbox" checked={lg} onChange={e=>setLg(e.target.checked)}/></label>
<button className="btn" onClick={download}>{t.exDl}</button></div>
{sd&&<div className="exscrim" onClick={()=>setSd(false)}><div className="shd" role="dialog" onClick={e=>e.stopPropagation()}><button type="button" onClick={doOpen}>{t.exOpen}</button><button type="button" onClick={doShare}>{t.share}</button></div></div>}</div>}
