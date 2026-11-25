import {useEffect,useMemo,useState} from "react";
import {qrMatrix} from "./qr";
const Ic=({d,s=24}:{d:string;s?:number})=><svg viewBox="0 0 24 24" width={s} height={s} fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={d}/></svg>;
const COPY="M9 9h11v11H9zM5 15H4V4h11v1";const SHARE="M18 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM6 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM18 22a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM8.6 13.5l6.8 4M15.4 6.5l-6.8 4";
export default function ShareSheet({name,url,onClose,t,gen}:{name:string;url:string;onClose:()=>void;t:Record<string,string>;gen?:()=>void}){
const [cp,setCp]=useState(false);
useEffect(()=>{gen?.()},[]);// eslint-disable-line
const m=useMemo(()=>qrMatrix(url),[url]);const n=m.length;
const d=useMemo(()=>{let s="";m.forEach((r,y)=>r.forEach((c,x)=>{if(c)s+=`M${x} ${y}h1v1h-1z`}));return s},[m]);
const copy=async()=>{try{await navigator.clipboard.writeText(url);setCp(true);setTimeout(()=>setCp(false),1500)}catch{/* babu izini */}};
const share=()=>{if(typeof navigator.share==="function")navigator.share({title:name,url}).catch(()=>{});else copy()};
return<div className="sh-wrap" onClick={onClose}><div className="sh-sheet" role="dialog" aria-label={t.share} onClick={e=>e.stopPropagation()}>
<span className="sh-grab"/><div className="sh-top"><h2>{t.share}</h2><button type="button" className="sh-x" aria-label={t.cancel} onClick={onClose}>✕</button></div>
<div className="sh-qr"><svg viewBox={`-2 -2 ${n+4} ${n+4}`} shapeRendering="crispEdges" role="img" aria-label="QR"><rect x="-2" y="-2" width={n+4} height={n+4} fill="#fff"/><path d={d} fill="#000"/></svg></div>
<div className="sh-link"><a href={url}>{url}</a><button type="button" aria-label={t.exCopied} onClick={copy}>{cp?"✓":<Ic d={COPY}/>}</button></div>
<button type="button" className="sh-btn" onClick={share}><Ic d={SHARE} s={20}/>{t.shareLink}</button>
</div></div>}
