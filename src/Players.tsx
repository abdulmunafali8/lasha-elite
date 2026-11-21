import {useMemo,useState,FormEvent,ReactNode} from "react";
import {createPortal} from "react-dom";
import {collection,doc,query,orderBy,addDoc,updateDoc,deleteDoc} from "firebase/firestore";
import {db,uploadImg} from "./firebase";import {useLive} from "./hooks";import ImagePick from "./ImagePick";
interface P{id:string;name:string;gamertag?:string;phone?:string;logoUrl?:string;ownLogo?:string|null;teamId?:string|null;groupId?:string|null}
interface N{id:string;name:string;logoUrl?:string}
const hue=(s:string)=>[...s].reduce((a,c)=>a+c.charCodeAt(0),0)%360;
const Av=({name,url}:{name:string;url?:string|null})=>{const h=hue(name);return<span className="tav" style={url?undefined:{background:`hsl(${h} 45% 30%)`,color:`hsl(${h} 75% 72%)`,borderColor:`hsl(${h} 60% 42%)`}}>{url?<img src={url} alt=""/>:name.slice(0,3).toUpperCase()}</span>};
const Users=()=><svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M16 19v-1a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v1M10 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6M20 19v-1a4 4 0 0 0-3-3.9M15 5.1a3 3 0 0 1 0 5.8"/></svg>;
const Modal=({onClose,children}:{onClose:()=>void;children:ReactNode})=>createPortal(<div className="tm-wrap" onClick={onClose}><div className="tm" role="dialog" onClick={e=>e.stopPropagation()}><div className="tm-top"><button type="button" className="tm-x" aria-label="Close" onClick={onClose}>✕</button></div>{children}</div></div>,document.body);
const errTxt=(t:Record<string,string>,e:unknown)=>t.err+" ("+(((e as {code?:string}).code)||(e as Error).message)+")";

export default function Players({cid,uid,t}:{cid:string;uid:string;t:Record<string,string>}){
const list=useLive<P>(useMemo(()=>query(collection(db,"competitions",cid,"players"),orderBy("name")),[cid])).d;
const teams=useLive<N>(useMemo(()=>query(collection(db,"competitions",cid,"teams"),orderBy("name")),[cid])).d;const groups=useLive<N>(useMemo(()=>query(collection(db,"competitions",cid,"groups"),orderBy("order")),[cid])).d;
const [teamId,setTeamId]=useState("");const [groupId,setGroupId]=useState("");const [edit,setEdit]=useState<P|null>(null);const [open,setOpen]=useState(false);const [name,setName]=useState("");const [tag,setTag]=useState("");const [phone,setPhone]=useState("");const [logo,setLogo]=useState<File|null>(null);const [msg,setMsg]=useState("");const [busy,setBusy]=useState(false);const [quick,setQuick]=useState("");
const dup=(n:string,id?:string)=>list.some(p=>p.id!==id&&p.name.toLowerCase()===n.toLowerCase());
const start=(p:P)=>{setEdit(p);setName(p.name);setTag(p.gamertag??"");setPhone(p.phone??"");setTeamId(p.teamId??"");setGroupId(p.groupId??"");setLogo(null);setMsg("");setOpen(true)};
const quickAdd=async(e:FormEvent)=>{e.preventDefault();const n=quick.trim();if(n.length<2)return setMsg(t.req+": "+t.playerName);if(dup(n))return setMsg(t.playerName+"?");setMsg("");
try{await addDoc(collection(db,"competitions",cid,"players"),{name:n,gamertag:"",phone:"",teamId:null,teamName:null,groupId:null,logoUrl:null,ownLogo:null,createdAt:Date.now()});setQuick("")}catch(x){setMsg(errTxt(t,x))}};
const save=async(e:FormEvent)=>{e.preventDefault();if(!edit)return;const n=name.trim();if(n.length<2)return setMsg(t.req+": "+t.playerName);
if(phone&&!/^[+\d][\d\s-]{6,16}$/.test(phone))return setMsg(t.phone);if(dup(n,edit.id))return setMsg(t.playerName+"?");
setBusy(true);try{const team=teams.find(x=>x.id===teamId);const data:Record<string,unknown>={name:n,gamertag:tag.trim(),phone:phone.trim(),teamId:teamId||null,teamName:team?.name??null,groupId:groupId||null};
const ref=doc(db,"competitions",cid,"players",edit.id);let own=edit.ownLogo??(!edit.teamId?edit.logoUrl:undefined);if(logo)own=await uploadImg(`competitions/${uid}/${cid}/players/${edit.id}`,logo);data.ownLogo=own??null;data.logoUrl=team?.logoUrl??own??null;
await updateDoc(ref,data);setOpen(false)}catch(x){setMsg(errTxt(t,x))}finally{setBusy(false)}};
const remove=async()=>{if(!edit||!confirm(t.sure))return;try{await deleteDoc(doc(db,"competitions",cid,"players",edit.id));setOpen(false)}catch(x){setMsg(errTxt(t,x))}};
const sub=(p:P)=>[groups.find(g=>g.id===p.groupId)?.name,p.gamertag].filter(Boolean).join(" · ");
return(<div className="pad tl"><h2>{t.players}</h2>
<form className="tadd" onSubmit={quickAdd}><input value={quick} onChange={e=>setQuick(e.target.value)} placeholder={t.playerName} aria-label={t.playerName}/><button className="btn sm">{t.qAdd}</button></form>
<p className="ttot">{t.qTotal}: {list.length}</p>{msg&&!open&&<p className="toast" role="alert">{msg}</p>}
{list.map(p=><button type="button" key={p.id} className="trow" onClick={()=>start(p)}><Av name={p.name} url={p.logoUrl}/><span className="grow"><span className="tn">{p.name}</span>{sub(p)&&<small>{sub(p)}</small>}</span><span className="tgo" aria-hidden="true"><Users/></span></button>)}
{open&&edit&&<Modal onClose={()=>setOpen(false)}><form onSubmit={save} noValidate>
<div className="tm-id"><ImagePick round label={t.logo} hint="" file={logo} onFile={setLogo} onErr={k=>setMsg(t[k]??k)} current={edit.logoUrl}/><label className="fld"><span>{t.playerName}</span><input value={name} onChange={e=>setName(e.target.value)}/></label></div>
<label className="fld"><span>{t.gamertag}</span><input value={tag} onChange={e=>setTag(e.target.value)}/></label>
{teams.length>0&&<label className="fld"><span>{t.team}</span><select value={teamId} onChange={e=>setTeamId(e.target.value)}><option value=""/>{teams.map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</select></label>}
{groups.length>0&&<label className="fld"><span>{t.groups}</span><select value={groupId} onChange={e=>setGroupId(e.target.value)}><option value=""/>{groups.map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</select></label>}
<label className="fld"><span>{t.phone}</span><input type="tel" value={phone} onChange={e=>setPhone(e.target.value)}/></label>
{msg&&<p className="toast" role="alert">{msg}</p>}
<div className="tm-act"><button type="button" className="trem" onClick={remove}>{t.remove}</button><button className="btn tsave" disabled={busy}>{busy?t.saving:t.save}</button></div></form></Modal>}</div>)}
