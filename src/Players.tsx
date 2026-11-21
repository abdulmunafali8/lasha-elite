import {useMemo,useState,FormEvent,ReactNode} from "react";
import {createPortal} from "react-dom";
import {collection,doc,query,orderBy,addDoc,updateDoc,deleteDoc,getDocs,writeBatch} from "firebase/firestore";
import {db,uploadImg} from "./firebase";import {useLive} from "./hooks";import ImagePick from "./ImagePick";
interface M{name:string;role?:string}
interface P{id:string;name:string;coach?:string;gamertag?:string;phone?:string;logoUrl?:string;ownLogo?:string|null;teamId?:string|null;groupId?:string|null;squad?:M[];staff?:M[]}
interface N{id:string;name:string;logoUrl?:string}
const hue=(s:string)=>[...s].reduce((a,c)=>a+c.charCodeAt(0),0)%360;
const Av=({name,url}:{name:string;url?:string|null})=>{const h=hue(name);return<span className="tav" style={url?undefined:{background:`hsl(${h} 45% 30%)`,color:`hsl(${h} 75% 72%)`,borderColor:`hsl(${h} 60% 42%)`}}>{url?<img src={url} alt=""/>:name.slice(0,3).toUpperCase()}</span>};
const Ic=({d,s=24}:{d:string;s?:number})=><svg viewBox="0 0 24 24" width={s} height={s} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={d}/></svg>;
const USERS="M16 19v-1a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v1M10 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6M20 19v-1a4 4 0 0 0-3-3.9M15 5.1a3 3 0 0 1 0 5.8";
const TECH="M15 19v-1a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v1M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6M18 14a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5M18 12v2M18 19v2M21 16l-1.5.9M16.5 17.1L15 18M21 18l-1.5-.9M16.5 16.9L15 16";
const TRASH="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14M10 11v6M14 11v6";
const PRINT="M6 9V3h12v6M6 18H4v-7h16v7h-2M7 14h10v7H7z";
const EXPORT="M12 16V4M7 9l5-5 5 5M5 20h14";
const SHARE="M18 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6M6 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6M18 22a3 3 0 1 0 0-6 3 3 0 0 0 0 6M8.6 13.5l6.8 4M15.4 6.5l-6.8 4";
const MORE="M5 12h.01M12 12h.01M19 12h.01";
const Modal=({onClose,right,children}:{onClose:()=>void;right?:ReactNode;children:ReactNode})=>createPortal(<div className="tm-wrap" onClick={onClose}><div className="tm" role="dialog" onClick={e=>e.stopPropagation()}><div className="tm-top"><button type="button" className="tm-x" aria-label="Close" onClick={onClose}>✕</button>{right}</div>{children}</div></div>,document.body);
const errTxt=(t:Record<string,string>,e:unknown)=>t.err+" ("+(((e as {code?:string}).code)||(e as Error).message)+")";

function Panel({title,items,onChange,role,t,onClose}:{title:string;items:M[];onChange:(v:M[])=>void;role:boolean;t:Record<string,string>;onClose:()=>void}){
const [a,setA]=useState("");const [b,setB]=useState("");
const add=()=>{const n=a.trim();if(n.length<2)return;onChange([...items,{name:n,role:b.trim()}]);setA("");setB("")};
return<Modal onClose={onClose}><h3 className="tm-h">{title} ({items.length})</h3>
{items.map((x,i)=><div className="tm-li" key={i}><span className="g"><b>{x.name}</b>{x.role?<small>{x.role}</small>:null}</span><button type="button" className="tm-del" aria-label={t.remove} onClick={()=>onChange(items.filter((_,j)=>j!==i))}>✕</button></div>)}
<div className="tm-add"><input value={a} placeholder={t.tmName} onChange={e=>setA(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"){e.preventDefault();add()}}}/>{role&&<input value={b} placeholder={t.tmRole} onChange={e=>setB(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"){e.preventDefault();add()}}}/>}<button type="button" className="btn sm" onClick={add}>{t.qAdd}</button></div>
<div className="tm-act"><span/><button type="button" className="btn tsave" onClick={onClose}>{t.tmDone}</button></div></Modal>}

export default function Players({cid,uid,t}:{cid:string;uid:string;t:Record<string,string>}){
const list=useLive<P>(useMemo(()=>query(collection(db,"competitions",cid,"players"),orderBy("name")),[cid])).d;
const teams=useLive<N>(useMemo(()=>query(collection(db,"competitions",cid,"teams"),orderBy("name")),[cid])).d;const groups=useLive<N>(useMemo(()=>query(collection(db,"competitions",cid,"groups"),orderBy("order")),[cid])).d;
const [teamId,setTeamId]=useState("");const [groupId,setGroupId]=useState("");const [edit,setEdit]=useState<P|null>(null);const [open,setOpen]=useState(false);const [name,setName]=useState("");const [coach,setCoach]=useState("");const [tag,setTag]=useState("");const [phone,setPhone]=useState("");const [logo,setLogo]=useState<File|null>(null);const [msg,setMsg]=useState("");const [busy,setBusy]=useState(false);const [quick,setQuick]=useState("");
const [squad,setSquad]=useState<M[]>([]);const [staff,setStaff]=useState<M[]>([]);const [panel,setPanel]=useState<"squad"|"staff"|null>(null);const [more,setMore]=useState(false);
const dup=(n:string,id?:string)=>list.some(p=>p.id!==id&&p.name.toLowerCase()===n.toLowerCase());
const gname=(id?:string|null)=>groups.find(g=>g.id===id)?.name;
const start=(p:P,pn:"squad"|"staff"|null=null)=>{setEdit(p);setName(p.name);setCoach(p.coach??"");setTag(p.gamertag??"");setPhone(p.phone??"");setTeamId(p.teamId??"");setGroupId(p.groupId??"");setSquad(p.squad??[]);setStaff(p.staff??[]);setMore(false);setPanel(pn);setLogo(null);setMsg("");setOpen(true)};
const quickAdd=async(e:FormEvent)=>{e.preventDefault();const n=quick.trim();if(n.length<2)return setMsg(t.req+": "+t.playerName);if(dup(n))return setMsg(t.playerName+"?");setMsg("");
try{await addDoc(collection(db,"competitions",cid,"players"),{name:n,coach:"",gamertag:"",phone:"",teamId:null,teamName:null,groupId:null,logoUrl:null,ownLogo:null,squad:[],staff:[],createdAt:Date.now()});setQuick("")}catch(x){setMsg(errTxt(t,x))}};
const save=async(e:FormEvent)=>{e.preventDefault();if(!edit)return;const n=name.trim();if(n.length<2)return setMsg(t.req+": "+t.playerName);
if(phone&&!/^[+\d][\d\s-]{6,16}$/.test(phone)){setMore(true);return setMsg(t.phone)}if(dup(n,edit.id))return setMsg(t.playerName+"?");
setBusy(true);try{const team=teams.find(x=>x.id===teamId);const data:Record<string,unknown>={name:n,coach:coach.trim(),gamertag:tag.trim(),phone:phone.trim(),teamId:teamId||null,teamName:team?.name??null,groupId:groupId||null,squad:squad.map(x=>({name:x.name,role:x.role??""})),staff:staff.map(x=>({name:x.name,role:x.role??""}))};
const ref=doc(db,"competitions",cid,"players",edit.id);let own=edit.ownLogo??(!edit.teamId?edit.logoUrl:undefined);if(logo)own=await uploadImg(`competitions/${uid}/${cid}/players/${edit.id}`,logo);data.ownLogo=own??null;data.logoUrl=team?.logoUrl??own??null;
await updateDoc(ref,data);setOpen(false)}catch(x){setMsg(errTxt(t,x))}finally{setBusy(false)}};
const remove=async()=>{if(!edit||!confirm(t.sure))return;try{await deleteDoc(doc(db,"competitions",cid,"players",edit.id));setOpen(false)}catch(x){setMsg(errTxt(t,x))}};
const share=async()=>{const txt=[name.trim(),coach.trim()&&t.tmCoach+": "+coach.trim(),gname(groupId)].filter(Boolean).join(" · ");try{if(typeof navigator.share==="function")await navigator.share({title:name.trim(),text:txt});else{await navigator.clipboard.writeText(txt);setMsg(t.exCopied)}}catch{/* an soke */}};
const clearAll=async()=>{if(!list.length||!confirm(t.tmClear+" ("+list.length+")? "+t.sure))return;try{const snap=await getDocs(collection(db,"competitions",cid,"players"));for(let i=0;i<snap.docs.length;i+=400){const b=writeBatch(db);snap.docs.slice(i,i+400).forEach(d=>b.delete(d.ref));await b.commit()}}catch(x){setMsg(errTxt(t,x))}};
const csv=()=>{const q=(v:unknown)=>'"'+String(v??"").replace(/"/g,'""')+'"';const rows=[["name","coach","group","gamertag","phone","players","technical team"],...list.map(p=>[p.name,p.coach,gname(p.groupId),p.gamertag,p.phone,(p.squad??[]).map(x=>x.name).join("; "),(p.staff??[]).map(x=>x.name+(x.role?" ("+x.role+")":"")).join("; ")])];
const b=new Blob(["\ufeff"+rows.map(r=>r.map(q).join(",")).join("\n")],{type:"text/csv"});const a=document.createElement("a");a.href=URL.createObjectURL(b);a.download="teams.csv";a.click();setTimeout(()=>URL.revokeObjectURL(a.href),2000)};
return(<div className="pad tl"><div className="phead"><h2>{t.players}</h2><div className="pact"><button type="button" aria-label={t.tmClear} onClick={clearAll}><Ic d={TRASH}/></button><button type="button" aria-label={t.exPrint} onClick={()=>window.print()}><Ic d={PRINT}/></button><button type="button" aria-label={t.exportCsv} onClick={csv}><Ic d={EXPORT}/></button></div></div>
<form className="tadd" onSubmit={quickAdd}><input value={quick} onChange={e=>setQuick(e.target.value)} placeholder={t.playerName} aria-label={t.playerName}/><button className="btn sm">{t.qAdd}</button></form>
<p className="ttot">{t.qTotal}: {list.length}</p>{msg&&!open&&<p className="toast" role="alert">{msg}</p>}
{list.map(p=><button type="button" key={p.id} className="trow" onClick={()=>start(p)}><Av name={p.name} url={p.logoUrl}/><span className="grow"><span className="tn">{p.name}</span><small>{gname(p.groupId)?<b>{gname(p.groupId)}</b>:null}{gname(p.groupId)?"  ":""}{(p.squad??[]).length} {t.tmPlayer}</small></span><span className="tgo" role="button" aria-label={t.tmSquad} onClick={e=>{e.stopPropagation();start(p,"squad")}}><Ic d={USERS}/></span></button>)}
{open&&edit&&<Modal onClose={()=>setOpen(false)} right={<button type="button" className="tm-sh" aria-label={t.share} onClick={share}><Ic d={SHARE} s={20}/></button>}><form onSubmit={save} noValidate>
<div className="tm-id"><ImagePick label="+" hint="200x240" file={logo} onFile={setLogo} onErr={k=>setMsg(t[k]??k)} current={edit.logoUrl}/><label className="fld"><span>{t.playerName}</span><input value={name} onChange={e=>setName(e.target.value)}/></label></div>
<label className="fld"><span>{t.tmCoach}</span><input value={coach} onChange={e=>setCoach(e.target.value)}/></label>
{groups.length>0&&<div className="tm-grp"><select aria-label={t.groups} value={groupId} onChange={e=>setGroupId(e.target.value)}><option value="">{t.groups}</option>{groups.map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</select></div>}
<button type="button" className="tm-row" onClick={()=>setPanel("squad")}><Ic d={USERS}/><span className="g">{t.tmSquad}</span><small>{squad.length}</small></button>
<button type="button" className="tm-row" onClick={()=>setPanel("staff")}><Ic d={TECH}/><span className="g">{t.tmStaff}</span><small>{staff.length}</small></button>
<button type="button" className="tm-row" onClick={()=>setMore(!more)}><Ic d={MORE}/><span className="g">{t.tmMore}</span><small>{more?"−":"+"}</small></button>
{more&&<div className="tm-more">
<label className="fld"><span>{t.gamertag}</span><input value={tag} onChange={e=>setTag(e.target.value)}/></label>
{teams.length>0&&<label className="fld"><span>{t.team}</span><select value={teamId} onChange={e=>setTeamId(e.target.value)}><option value=""/>{teams.map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</select></label>}
<label className="fld"><span>{t.phone}</span><input type="tel" value={phone} onChange={e=>setPhone(e.target.value)}/></label></div>}
{msg&&<p className="toast" role="alert">{msg}</p>}
<div className="tm-act"><button type="button" className="trem" onClick={remove}>{t.remove}</button><button className="btn tsave" disabled={busy}>{busy?t.saving:t.save}</button></div></form>
{panel&&<Panel title={panel==="squad"?t.tmSquad:t.tmStaff} items={panel==="squad"?squad:staff} onChange={panel==="squad"?setSquad:setStaff} role={panel==="staff"} t={t} onClose={()=>setPanel(null)}/>}</Modal>}</div>)}
