import {useMemo,useState,ReactNode} from "react";
import {createPortal} from "react-dom";
import {collection,doc,query,orderBy,addDoc,updateDoc,deleteDoc,writeBatch} from "firebase/firestore";
import {db} from "./firebase";import {useLive} from "./hooks";
interface G{id:string;name:string;order:number}
interface P{id:string;name:string;groupId?:string|null}
const MAX=26;
const Ic=({d,s=24}:{d:string;s?:number})=><svg viewBox="0 0 24 24" width={s} height={s} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={d}/></svg>;
const SHARE="M18 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6M6 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6M18 22a3 3 0 1 0 0-6 3 3 0 0 0 0 6M8.6 13.5l6.8 4M15.4 6.5l-6.8 4";
const LAYERS="M12 3l9 5-9 5-9-5 9-5M3 13l9 5 9-5";
const SHUFFLE="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5";
const LINES="M4 7h16M4 12h10M4 17h6";
const Modal=({title,onClose,children}:{title:string;onClose:()=>void;children:ReactNode})=>createPortal(<div className="tm-wrap" onClick={onClose}><div className="tm" role="dialog" onClick={e=>e.stopPropagation()}><div className="tm-top"><button type="button" className="tm-x" aria-label="Close" onClick={onClose}>✕</button></div><h3 className="tm-h">{title}</h3>{children}</div></div>,document.body);
const errTxt=(t:Record<string,string>,e:unknown)=>t.err+" ("+(((e as {code?:string}).code)||(e as Error).message)+")";

function Assign({cid,t,players,groups,onClose}:{cid:string;t:Record<string,string>;players:P[];groups:G[];onClose:()=>void}){
const [m,setM]=useState<Record<string,string>>(()=>Object.fromEntries(players.map(p=>[p.id,p.groupId??""])));const [busy,setBusy]=useState(false);const [msg,setMsg]=useState("");
const done=async()=>{const ch=players.filter(p=>(p.groupId??"")!==(m[p.id]??""));setBusy(true);try{for(let i=0;i<ch.length;i+=400){const b=writeBatch(db);ch.slice(i,i+400).forEach(p=>b.update(doc(db,"competitions",cid,"players",p.id),{groupId:m[p.id]||null}));await b.commit()}onClose()}catch(x){setMsg(errTxt(t,x))}finally{setBusy(false)}};
return<Modal title={t.gSet} onClose={onClose}>{players.map(p=><div className="tm-li" key={p.id}><span className="g"><b>{p.name}</b></span><select className="gsel" value={m[p.id]??""} onChange={e=>setM({...m,[p.id]:e.target.value})}><option value="">—</option>{groups.map(g=><option key={g.id} value={g.id}>{g.name}</option>)}</select></div>)}
{msg&&<p className="toast" role="alert">{msg}</p>}<div className="tm-act"><span/><button type="button" className="btn tsave" disabled={busy} onClick={done}>{busy?t.saving:t.save}</button></div></Modal>}

function Rename({cid,t,groups,onClose}:{cid:string;t:Record<string,string>;groups:G[];onClose:()=>void}){
const [m,setM]=useState<Record<string,string>>(()=>Object.fromEntries(groups.map(g=>[g.id,g.name])));const [busy,setBusy]=useState(false);const [msg,setMsg]=useState("");
const done=async()=>{const names=groups.map(g=>(m[g.id]??g.name).trim());if(names.some(n=>!n))return setMsg(t.req);if(new Set(names.map(n=>n.toLowerCase())).size!==names.length)return setMsg(t.dupName);
setBusy(true);try{for(const g of groups){const n=(m[g.id]??g.name).trim();if(n!==g.name)await updateDoc(doc(db,"competitions",cid,"groups",g.id),{name:n})}onClose()}catch(x){setMsg(errTxt(t,x))}finally{setBusy(false)}};
return<Modal title={t.gName} onClose={onClose}>{groups.map(g=><label className="fld" key={g.id}><span>{g.name}</span><input value={m[g.id]??g.name} onChange={e=>setM({...m,[g.id]:e.target.value})}/></label>)}
{msg&&<p className="toast" role="alert">{msg}</p>}<div className="tm-act"><span/><button type="button" className="btn tsave" disabled={busy} onClick={done}>{busy?t.saving:t.save}</button></div></Modal>}

export default function Groups({cid,t}:{cid:string;t:Record<string,string>}){
const list=useLive<G>(useMemo(()=>query(collection(db,"competitions",cid,"groups"),orderBy("order")),[cid])).d;
const players=useLive<P>(useMemo(()=>query(collection(db,"competitions",cid,"players"),orderBy("name")),[cid])).d;
const [n,setN]=useState<number|null>(null);const [msg,setMsg]=useState("");const [busy,setBusy]=useState(false);const [panel,setPanel]=useState<"set"|"name"|null>(null);
const cur=n??list.length;const off=cur<1;
const apply=async():Promise<G[]>=>{let g=[...list];
if(cur<g.length){const drop=g.slice(cur);const ids=new Set(drop.map(x=>x.id));const aff=players.filter(p=>p.groupId&&ids.has(p.groupId));
if(aff.length&&!confirm(t.sure))throw new Error("cancel");
for(let i=0;i<aff.length;i+=400){const b=writeBatch(db);aff.slice(i,i+400).forEach(p=>b.update(doc(db,"competitions",cid,"players",p.id),{groupId:null}));await b.commit()}
for(const x of drop)await deleteDoc(doc(db,"competitions",cid,"groups",x.id));g=g.slice(0,cur)}
else if(cur>g.length){const used=new Set(g.map(x=>x.name.toLowerCase()));let ord=Math.max(0,...g.map(x=>x.order));
for(let i=g.length;i<cur;i++){let k=0,nm="";do{nm=`${t.gPfx} - ${k<MAX?String.fromCharCode(65+k):k+1}`;k++}while(used.has(nm.toLowerCase()));used.add(nm.toLowerCase());ord++;const r=await addDoc(collection(db,"competitions",cid,"groups"),{name:nm,order:ord});g.push({id:r.id,name:nm,order:ord})}}
return g};
const run=async(f:()=>Promise<void>)=>{setBusy(true);setMsg("");try{await f()}catch(x){if((x as Error).message!=="cancel")setMsg(errTxt(t,x))}finally{setBusy(false)}};
const save=()=>run(async()=>{await apply();setN(null);setMsg(t.gSaved)});
const random=()=>{if(off||!confirm(t.sure))return;run(async()=>{const g=await apply();setN(null);if(!g.length)return;const a=[...players];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}
for(let i=0;i<a.length;i+=400){const b=writeBatch(db);a.slice(i,i+400).forEach((p,k)=>b.update(doc(db,"competitions",cid,"players",p.id),{groupId:g[(i+k)%g.length].id}));await b.commit()}setMsg(t.gSaved)})};
const open=(k:"set"|"name")=>{if(off)return;run(async()=>{await apply();setN(null);setPanel(k)})};
const share=async()=>{const txt=list.map(g=>g.name+": "+players.filter(p=>p.groupId===g.id).map(p=>p.name).join(", ")).join("\n");try{if(typeof navigator.share==="function")await navigator.share({title:t.groups,text:txt});else{await navigator.clipboard.writeText(txt);setMsg(t.exCopied)}}catch{/* an soke */}};
return(<div className="gcard"><div className="g-head"><h2>{t.groups}</h2><button type="button" className="g-sh" aria-label={t.share} onClick={share}><Ic d={SHARE} s={22}/></button></div>
<h3 className="g-sub">{t.gNum}{cur>0?`: ${cur}`:""}</h3>
<div className="g-sl"><div className="g-dots"><input type="range" className="gslider" min={0} max={MAX} step={1} value={cur} aria-label={t.gNum} onChange={e=>setN(Number(e.target.value))}/></div><Ic d={LAYERS}/></div>
<button type="button" className="gact" disabled={off||busy} onClick={random}><Ic d={SHUFFLE}/><span>{t.gRand}</span></button>
<button type="button" className="gact" disabled={off||busy} onClick={()=>open("set")}><Ic d={LINES}/><span>{t.gSet}</span></button>
<button type="button" className="gact" disabled={off||busy} onClick={()=>open("name")}><b className="az">AZ</b><span>{t.gName}</span></button>
{msg&&<p className="toast" role="alert">{msg}</p>}
<div className="g-foot"><button type="button" className="btn tsave" disabled={busy} onClick={save}>{busy?t.saving:t.save}</button></div>
{panel==="set"&&<Assign cid={cid} t={t} players={players} groups={list} onClose={()=>setPanel(null)}/>}
{panel==="name"&&<Rename cid={cid} t={t} groups={list} onClose={()=>setPanel(null)}/>}</div>)}
