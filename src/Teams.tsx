import {useMemo,useState,FormEvent,ReactNode} from "react";
import {createPortal} from "react-dom";
import {collection,doc,query,orderBy,addDoc,updateDoc,deleteDoc} from "firebase/firestore";
import {db,uploadImg} from "./firebase";import {useLive} from "./hooks";import ImagePick from "./ImagePick";
interface T{id:string;name:string;logoUrl?:string}
const hue=(s:string)=>[...s].reduce((a,c)=>a+c.charCodeAt(0),0)%360;
const Av=({name,url}:{name:string;url?:string|null})=>{const h=hue(name);return<span className="tav" style={url?undefined:{background:`hsl(${h} 45% 30%)`,color:`hsl(${h} 75% 72%)`,borderColor:`hsl(${h} 60% 42%)`}}>{url?<img src={url} alt=""/>:name.slice(0,3).toUpperCase()}</span>};
const Modal=({onClose,children}:{onClose:()=>void;children:ReactNode})=>createPortal(<div className="tm-wrap" onClick={onClose}><div className="tm" role="dialog" onClick={e=>e.stopPropagation()}><div className="tm-top"><button type="button" className="tm-x" aria-label="Close" onClick={onClose}>✕</button></div>{children}</div></div>,document.body);
const errTxt=(t:Record<string,string>,e:unknown)=>t.err+" ("+(((e as {code?:string}).code)||(e as Error).message)+")";

export default function Teams({cid,uid,t}:{cid:string;uid:string;t:Record<string,string>}){
const list=useLive<T>(useMemo(()=>query(collection(db,"competitions",cid,"teams"),orderBy("name")),[cid])).d;
const players=useLive<{id:string;teamId?:string|null}>(useMemo(()=>query(collection(db,"competitions",cid,"players"),orderBy("name")),[cid])).d;
const [edit,setEdit]=useState<T|null>(null);const [open,setOpen]=useState(false);const [name,setName]=useState("");const [quick,setQuick]=useState("");const [logo,setLogo]=useState<File|null>(null);const [msg,setMsg]=useState("");const [busy,setBusy]=useState(false);
const cnt=(id:string)=>players.filter(p=>p.teamId===id).length;
const dup=(n:string,id?:string)=>list.some(x=>x.id!==id&&x.name.toLowerCase()===n.toLowerCase());
const start=(x:T)=>{setEdit(x);setName(x.name);setLogo(null);setMsg("");setOpen(true)};
const quickAdd=async(e:FormEvent)=>{e.preventDefault();const n=quick.trim();if(n.length<2)return setMsg(t.req+": "+t.teamName);if(dup(n))return setMsg(t.dupName);setMsg("");
try{await addDoc(collection(db,"competitions",cid,"teams"),{name:n});setQuick("")}catch(x){setMsg(errTxt(t,x))}};
const save=async(e:FormEvent)=>{e.preventDefault();if(!edit)return;const n=name.trim();if(n.length<2)return setMsg(t.req+": "+t.teamName);if(dup(n,edit.id))return setMsg(t.dupName);
setBusy(true);try{const d:Record<string,unknown>={name:n};if(logo)d.logoUrl=await uploadImg(`competitions/${uid}/${cid}/teams/${edit.id}`,logo);await updateDoc(doc(db,"competitions",cid,"teams",edit.id),d);setOpen(false)}catch(x){setMsg(errTxt(t,x))}finally{setBusy(false)}};
const remove=async()=>{if(!edit)return;if(cnt(edit.id)>0)return setMsg(t.teamUsed);if(!confirm(t.sure))return;try{await deleteDoc(doc(db,"competitions",cid,"teams",edit.id));setOpen(false)}catch(x){setMsg(errTxt(t,x))}};
return(<div className="tl">
<form className="tadd" onSubmit={quickAdd}><input value={quick} onChange={e=>setQuick(e.target.value)} placeholder={t.teamName} aria-label={t.teamName}/><button className="btn sm">{t.qAdd}</button></form>
<p className="ttot">{t.qTotal}: {list.length}</p>{msg&&!open&&<p className="toast" role="alert">{msg}</p>}
{list.map(x=><button type="button" key={x.id} className="trow" onClick={()=>start(x)}><Av name={x.name} url={x.logoUrl}/><span className="grow"><span className="tn">{x.name}</span><small>{cnt(x.id)} {t.players}</small></span></button>)}
{open&&edit&&<Modal onClose={()=>setOpen(false)}><form onSubmit={save} noValidate>
<div className="tm-id"><ImagePick round label={t.logo} hint="" file={logo} onFile={setLogo} onErr={k=>setMsg(t[k]??k)} current={edit.logoUrl}/><label className="fld"><span>{t.teamName}</span><input value={name} onChange={e=>setName(e.target.value)}/></label></div>
{msg&&<p className="toast" role="alert">{msg}</p>}
<div className="tm-act"><button type="button" className="trem" onClick={remove}>{t.remove}</button><button className="btn tsave" disabled={busy}>{busy?t.saving:t.save}</button></div></form></Modal>}</div>)}
